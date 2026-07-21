import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import QuizResultClient from './QuizResultClient';

interface ResultPageProps {
  params: Promise<{ id: string; logId: string }>;
  searchParams: Promise<{ score?: string }>;
}

// 1분 단위 캐싱 적용 (동시 F5 연타에 의한 DB 부하 분산 및 최적화)
export const revalidate = 60;

/**
 * 🔗 애드센스 승인 및 SNS 공유 최적화를 위한 결과 페이지 동적 메타데이터 생성기
 */
export async function generateMetadata({ params, searchParams }: ResultPageProps): Promise<Metadata> {
  const { id, logId } = await params;
  const { score: scoreParam } = await searchParams;
  const quizId = parseInt(id, 10);
  
  if (isNaN(quizId)) return {};

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { results: true }
    });

    if (!quiz) return {};

    let matchedTitle = '';
    let score = 0;

    if (logId !== 'guest') {
      const userLog = await prisma.quizLog.findUnique({
        where: { id: logId },
        select: { totalScore: true }
      });
      if (userLog && userLog.totalScore > 0) {
        score = userLog.totalScore;
      }
    } else if (scoreParam) {
      score = parseInt(scoreParam, 10);
    }

    if (score > 0) {
      const matched = quiz.results.find(res => score >= res.minScore && score <= res.maxScore);
      if (matched) matchedTitle = matched.title;
    }

    const pageTitle = matchedTitle 
      ? `나의 결과: [${matchedTitle}] | ${quiz.title}`
      : `${quiz.title} 결과 리포트`;

    const description = `나의 성향 분석표를 지금 까보세요! 양파처럼 까도까도 매력 넘치는 성향 테스트 연구소 까도까도.`;

    return {
      title: `${pageTitle} | 까도까도`,
      description,
      openGraph: {
        title: pageTitle,
        description,
        url: `https://kkado-kkado.com/quiz/${quizId}/result/${logId}`,
        siteName: '까도까도',
        images: [
          {
            url: 'https://kkado-kkado.com/thumbnail.png', // 고화질 512x512 캐릭터 썸네일 활용
            width: 512,
            height: 512,
            alt: pageTitle,
          }
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: pageTitle,
        description,
        images: ['https://kkado-kkado.com/thumbnail.png'],
      }
    };
  } catch (err) {
    console.error('Failed to generate result page metadata:', err);
    return {};
  }
}

export default async function QuizResultPage({ params, searchParams }: ResultPageProps) {
  const { id, logId } = await params;
  const { score: scoreParam } = await searchParams;
  
  const quizId = parseInt(id, 10);

  if (isNaN(quizId)) {
    notFound();
  }

  // 1. 직접 접근 보안 통제 (unknown 이거나 비정상 접근 시 첫 화면 리다이렉트)
  if (!logId || logId === 'unknown') {
    redirect(`/quiz/${quizId}`);
  }

  let score = 0;
  let userLog = null;

  // guest 세션이 아닐 때만 DB 조회 진행
  if (logId !== 'guest') {
    try {
      userLog = await prisma.quizLog.findUnique({
        where: { id: logId },
        select: {
          totalScore: true,
          quizId: true
        }
      });
    } catch (err) {
      console.error('Failed to query quiz log in result page:', err);
    }
  }

  // DB 로그가 존재하고 완료된 상태라면 해당 점수 활용
  if (userLog && userLog.quizId === quizId && userLog.totalScore > 0) {
    score = userLog.totalScore;
  } else if (scoreParam) {
    // DB 조회가 비정상이거나 게스트 세션인 경우 URL의 score 파라미터를 파싱하여 복구 (Failsafe)
    score = parseInt(scoreParam, 10);
  }

  // 여전히 점수가 0점(무효 점수)이라면 안전장치로 플레이 화면 리다이렉트
  if (score === 0) {
    redirect(`/quiz/${quizId}`);
  }

  // 3. 퀴즈 및 결과 유형 조회
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      results: true,
    },
  });

  if (!quiz) {
    notFound();
  }

  // 4. 사용자의 점수 구간에 맞는 결과 매칭
  let matchedResult = quiz.results.find(
    (res) => score >= res.minScore && score <= res.maxScore
  );

  if (!matchedResult && quiz.results.length > 0) {
    matchedResult = quiz.results[0]; // 예외 처리용 첫번째 결과
  }

  // 4.1 짝꿍 및 상극 결과 산출 (Growth Hacking 궁합 카드 매핑)
  let companionResult = null;
  let rivalResult = null;

  if (quiz.results.length >= 2) {
    const myIndex = quiz.results.findIndex((r) => r.id === matchedResult?.id);
    const totalCount = quiz.results.length;

    // 찰떡 짝꿍: 내 다음 인덱스
    const companionIdx = (myIndex + 1) % totalCount;
    companionResult = quiz.results[companionIdx];

    // 환장의 상극: 내 다다음 인덱스 (results가 2개일 때는 자기 자신으로 가드)
    const rivalIdx = totalCount > 2 ? (myIndex + 2) % totalCount : myIndex;
    rivalResult = quiz.results[rivalIdx];
  }

  // 5. 통계 계산 (해당 퀴즈의 전체 로그 기반 결과 분포 산출)
  let sortedStats: any[] = [];
  try {
    // totalScore가 기록 완료된(0점 초과) 실제 완료 로그만 통계에 합산
    const allLogs = await prisma.quizLog.findMany({
      where: { 
        quizId,
        totalScore: { gt: 0 }
      },
      select: { totalScore: true },
    });

    const totalCount = allLogs.length || 1;

    const stats = quiz.results.map((res) => {
      const count = allLogs.filter(
        (log) => log.totalScore !== null && log.totalScore >= res.minScore && log.totalScore <= res.maxScore
      ).length;
      const percentage = Math.round((count / totalCount) * 100);
      return {
        id: res.id,
        title: res.title,
        emoji: res.emoji,
        count,
        percentage,
      };
    });

    // 득표수 기준 내림차순 정렬 (인기순 랭킹)
    sortedStats = [...stats].sort((a, b) => b.count - a.count);
  } catch (err) {
    console.error('Failed to aggregate statistics:', err);
  }

  // 6. 다른 성향 테스트 추천 리스트 수집 (유입 극대화 및 체류 시간 향상)
  let recommendations: any[] = [];
  try {
    recommendations = await prisma.quiz.findMany({
      where: {
        id: { not: quizId },
      },
      take: 3,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
      },
    });
  } catch (err) {
    console.error('Failed to fetch recommendations:', err);
  }

  // 7. 특정 퀴즈에 등록된 실시간 댓글 목록 수집
  let comments: any[] = [];
  try {
    comments = await prisma.comment.findMany({
      where: { quizId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        content: true,
        createdAt: true,
        reactionOnion: true,
        reactionFire: true,
        reactionHeart: true,
        reactionLaugh: true,
      },
    });
  } catch (err) {
    console.error('Failed to fetch comments:', err);
  }

  // 데이터 구조를 정형화하여 클라이언트 컴포넌트로 전송
  const serializedQuiz = {
    id: quiz.id,
    title: quiz.title,
    category: quiz.category,
  };

  const serializedMatchedResult = matchedResult ? {
    id: matchedResult.id,
    minScore: matchedResult.minScore,
    maxScore: matchedResult.maxScore,
    title: matchedResult.title,
    content: matchedResult.content,
    emoji: matchedResult.emoji || '🧅',
    imageUrl: matchedResult.imageUrl,
  } : null;

  const serializeCompanion = companionResult ? {
    id: companionResult.id,
    title: companionResult.title,
    emoji: companionResult.emoji || '🧅',
  } : null;

  const serializeRival = rivalResult ? {
    id: rivalResult.id,
    title: rivalResult.title,
    emoji: rivalResult.emoji || '🧅',
  } : null;

  return (
    <QuizResultClient
      quiz={serializedQuiz}
      score={score}
      matchedResult={serializedMatchedResult}
      sortedStats={sortedStats}
      logId={logId}
      companion={serializeCompanion}
      rival={serializeRival}
      recommendations={recommendations}
      comments={comments}
    />
  );
}
