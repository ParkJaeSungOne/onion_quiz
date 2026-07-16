import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

const SESSION_COOKIE_NAME = 'kkado_admin_session';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  // 1. 보안 인증 세션 검사 (쿠키 검증)
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session || session.value !== 'authenticated') {
    redirect('/admin/login');
  }

  // 2. 대시보드 지표(KPI) 연산
  const totalQuizzes = await prisma.quiz.count();
  const totalPlays = await prisma.quizLog.count({
    where: { totalScore: { gt: 0 } }
  });
  
  // 오늘 오전 00시 기준
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayPlays = await prisma.quizLog.count({
    where: {
      createdAt: { gte: todayStart },
      totalScore: { gt: 0 }
    }
  });

  // 3. 테스트 목록 및 테스트별 성향 통계 수집
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      results: true,
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
      playCount,
      resultsDistribution,
      refererStats
    };
  });

  return (
    <AdminDashboardClient
      stats={{
        totalQuizzes,
        totalPlays,
        todayPlays
      }}
      quizStats={quizStats}
    />
  );
}
