import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import QuizResultClient from './QuizResultClient';

interface ResultPageProps {
  params: Promise<{ id: string; logId: string }>;
}

// 1분 단위 캐싱 적용 (동시 F5 연타에 의한 DB 부하 분산 및 최적화)
export const revalidate = 60;

export default async function QuizResultPage({ params }: ResultPageProps) {
  const { id, logId } = await params;
  
  const quizId = parseInt(id, 10);

  if (isNaN(quizId)) {
    notFound();
  }

  // 1. 직접 접근 보안 통제 (unknown 이거나 비정상 접근 시 첫 화면 리다이렉트)
  if (!logId || logId === 'unknown') {
    redirect(`/quiz/${quizId}`);
  }

  // 2. DB에서 실제 퀴즈 제출 세션 로그 조회
  const userLog = await prisma.quizLog.findUnique({
    where: { id: logId },
    select: {
      totalScore: true,
      quizId: true
    }
  });

  // 아직 퀴즈를 완료하지 않았거나(totalScore가 0), 비정상 세션 로그일 경우 리다이렉트 처리
  if (!userLog || userLog.quizId !== quizId || userLog.totalScore === 0) {
    redirect(`/quiz/${quizId}`);
  }

  const score = userLog.totalScore;

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
    />
  );
}
