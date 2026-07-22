import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

const SESSION_COOKIE_NAME = 'kkado_admin_session';

export const revalidate = 0;

interface AdminDashboardPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const { page: pageStr } = await searchParams;
  const currentPage = parseInt(pageStr || '1', 10);
  const pageSize = 10; // 한 페이지에 퀴즈 10개씩 페이징

  // 1. 보안 인증 세션 검사 (쿠키 검증)
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session || session.value !== 'authenticated') {
    redirect('/admin/login');
  }

  // 2. 대시보드 지표(KPI) 연산
  const totalQuizzes = await prisma.quiz.count();
  const totalPages = Math.ceil(totalQuizzes / pageSize) || 1;
  const validatedPage = Math.min(Math.max(1, currentPage), totalPages);
  const totalPlays = await prisma.quizLog.count({
    where: { totalScore: { gt: 0 } }
  });
  
  // 오늘 오전 00시 기준 (KST)
  const todayKst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayPlays = await prisma.quizLog.count({
    where: {
      createdAt: { gte: todayStart },
      totalScore: { gt: 0 }
    }
  });

  // 2.1 실시간 방문자 통계 데이터 조회 (UV / PV)
  const todayVisitor = await prisma.visitorStats.findUnique({
    where: { date: todayKst }
  });
  const visitorTotals = await prisma.visitorStats.aggregate({
    _sum: { pv: true, uv: true }
  });

  const visitorStats = {
    todayUv: todayVisitor?.uv || 0,
    todayPv: todayVisitor?.pv || 0,
    totalUv: visitorTotals._sum.uv || 0,
    totalPv: visitorTotals._sum.pv || 0
  };

  // 최근 7일간의 방문 트렌드 조회 (차트 렌더링용)
  const visitorTrendRaw = await prisma.visitorStats.findMany({
    orderBy: { date: 'desc' },
    take: 7
  });
  const visitorTrend = visitorTrendRaw.reverse().map(stat => ({
    date: stat.date.substring(5), // 'MM-DD' 형태로 변환
    pv: stat.pv,
    uv: stat.uv
  }));

  // 2.2 실시간 최근 댓글 10개 조회 (어드민 즉시 관리용)
  const recentComments = await prisma.comment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      quiz: {
        select: { title: true }
      }
    }
  });

  // 3. 테스트 목록 및 테스트별 성향 통계 수집 (페이징 세팅 추가)
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (validatedPage - 1) * pageSize,
    take: pageSize,
    include: {
      results: true,
      _count: {
        select: { questions: true }
      },
      logs: {
        where: { totalScore: { gt: 0 } },
        select: { totalScore: true, referer: true }
      }
    }
  });

  // 통계 가공
  const quizStats = quizzes.map((quiz) => {
    const playCount = quiz.logs.length;
    const totalCount = playCount || 1; // 분모 가드

    // 각 결과 유형별 분포 집계
    const resultsDistribution = quiz.results.map((res) => {
      const count = quiz.logs.filter(
        (log) => log.totalScore >= res.minScore && log.totalScore <= res.maxScore
      ).length;
      const percentage = Math.round((count / totalCount) * 100);
      return {
        id: res.id,
        title: res.title,
        emoji: res.emoji,
        count,
        percentage
      };
    });

    // 퀴즈별 유입 경로 집계
    const referers: Record<string, number> = {};
    quiz.logs.forEach((log) => {
      let source = log.referer || 'Direct';
      // 복잡한 URL 간소화
      if (source.includes('kakaotalk') || source.includes('kakao')) {
        source = 'KakaoTalk';
      } else if (source.includes('naver')) {
        source = 'Naver';
      } else if (source.includes('google')) {
        source = 'Google';
      } else if (source.includes('facebook') || source.includes('fb')) {
        source = 'Facebook';
      } else if (source.includes('twitter') || source.includes('t.co') || source.includes('x.com')) {
        source = 'X (Twitter)';
      } else if (source !== 'Direct' && source.length > 20) {
        source = 'Other URL';
      }
      referers[source] = (referers[source] || 0) + 1;
    });

    const refererStats = Object.entries(referers).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalCount) * 100)
    })).sort((a, b) => b.count - a.count);

    return {
      id: quiz.id,
      title: quiz.title,
      category: quiz.category,
      questionsCount: quiz._count.questions,
      playCount,
      resultsDistribution,
      refererStats,
      createdAt: quiz.createdAt.toISOString(),
      shareKakaoCount: quiz.shareKakaoCount,
      shareLinkCount: quiz.shareLinkCount,
      shareResultKakaoCount: quiz.shareResultKakaoCount,
      shareResultLinkCount: quiz.shareResultLinkCount
    };
  });

  // 데이터를 직렬화하여 클라이언트에 맞게 변환
  const serializedComments = recentComments.map((comment) => ({
    id: comment.id,
    nickname: comment.nickname,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    quizTitle: comment.quiz?.title || '자유 방명록'
  }));

  // 2.3 최근 상세 실시간 방문자 로그 50개 조회
  const visitorLogsRaw = await prisma.visitorLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  // 퀴즈 ID별 제목 매핑 사전 생성
  const allQuizzesForMap = await prisma.quiz.findMany({
    select: { id: true, title: true }
  });
  const quizTitleMap: Record<number, string> = {};
  allQuizzesForMap.forEach(q => {
    quizTitleMap[q.id] = q.title;
  });

  const parsePageTitle = (path: string) => {
    if (path === '/' || path === '') return '🏠 메인 홈';
    if (path === '/guestbook') return '💬 실시간 방명록';
    if (path.startsWith('/admin')) return '🛡️ 관리자 대시보드';
    
    const quizMatch = path.match(/\/quiz\/(\d+)(?:\/result\/(.+))?/);
    if (quizMatch) {
      const quizIdNum = parseInt(quizMatch[1], 10);
      const quizTitle = quizTitleMap[quizIdNum] || `테스트 #${quizIdNum}`;
      const isResult = !!quizMatch[2];
      
      if (isResult) {
        return `🏆 [결과] ${quizTitle}`;
      }
      return `🧩 [퀴즈] ${quizTitle}`;
    }
    
    return path;
  };

  const serializedVisitorLogs = visitorLogsRaw.map((log) => ({
    id: log.id,
    ip: log.ip,
    device: log.device,
    os: log.os,
    browser: log.browser,
    referrer: log.referrer,
    country: log.country || 'KR',
    city: log.city || 'Unknown',
    pagePath: log.pagePath,
    pageTitle: parsePageTitle(log.pagePath),
    staySeconds: log.staySeconds || 0,
    createdAt: log.createdAt.toISOString()
  }));

  // 3.1 가장 플레이 수가 많은 인기 테스트 Top 3 집계
  const allQuizzesForTop = await prisma.quiz.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      createdAt: true,
      logs: {
        where: { totalScore: { gt: 0 } },
        select: { id: true }
      }
    }
  });

  const topQuizzes = allQuizzesForTop
    .map(q => ({
      id: q.id,
      title: q.title,
      category: q.category,
      playCount: q.logs.length,
      createdAt: q.createdAt.toISOString()
    }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 3);

  return (
    <AdminDashboardClient
      stats={{
        totalQuizzes,
        totalPlays,
        todayPlays
      }}
      quizStats={quizStats}
      visitorStats={visitorStats}
      visitorTrend={visitorTrend}
      comments={serializedComments}
      visitorLogs={serializedVisitorLogs}
      currentPage={validatedPage}
      totalPages={totalPages}
      topQuizzes={topQuizzes}
    />
  );
}
