import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdSlot from '@/components/AdSlot';
import styles from './QuizResult.module.css';

interface ResultPageProps {
  params: Promise<{ id: string; logId: string }>;
  searchParams: Promise<{ score?: string }>;
}

export const revalidate = 0;

export default async function QuizResultPage({ params, searchParams }: ResultPageProps) {
  const { id, logId } = await params;
  const { score: scoreStr } = await searchParams;
  
  const score = parseInt(scoreStr || '0', 10);
  const quizId = parseInt(id, 10);

  if (isNaN(quizId)) {
    notFound();
  }

  // 1. 사용자 점수를 QuizLog에 캐싱 기록 (통계용)
  if (logId && logId !== 'unknown') {
    try {
      await prisma.quizLog.update({
        where: { id: logId },
        data: { totalScore: score },
      });
    } catch (e) {
      console.error('Failed to update totalScore in QuizLog:', e);
    }
  }

  // 2. 퀴즈 및 결과 유형 조회
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      results: true,
    },
  });

  if (!quiz) {
    notFound();
  }

  // 3. 사용자의 점수 구간에 맞는 결과 매칭
  let matchedResult = quiz.results.find(
    (res) => score >= res.minScore && score <= res.maxScore
  );

  if (!matchedResult && quiz.results.length > 0) {
    matchedResult = quiz.results[0]; // 예외 처리용 첫번째 결과
  }

  // 4. 통계 계산 (해당 퀴즈의 전체 로그 기반 결과 분포 산출)
  let sortedStats: any[] = [];
  try {
    const allLogs = await prisma.quizLog.findMany({
      where: { quizId },
      select: { totalScore: true },
    });

    const totalCount = allLogs.length || 1;

    const stats = quiz.results.map((res) => {
      const count = allLogs.filter(
        (log) => log.totalScore >= res.minScore && log.totalScore <= res.maxScore
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.categoryBadge}>{quiz.category} 테스트 결과</span>
        <h1 className={styles.quizTitle}>“ {quiz.title} ”</h1>
      </header>

      {/* 결과 화면 상단 광고 */}
      <AdSlot type="result" />

      <main className={styles.main}>
        {matchedResult ? (
          <div className={styles.resultCard}>
            {/* 대표 캐릭터 이모지 박스 (3D Glassmorphism 카드) */}
            <div className={styles.characterWrapper}>
              <div className={styles.characterCircle}>
                <span className={styles.characterEmoji}>{matchedResult.emoji}</span>
              </div>
            </div>

            <div className={styles.scoreText}>
              나의 결과 점수: <strong className={styles.scoreNumber}>{score}</strong>점
            </div>
            <h2 className={styles.resultTitle}>{matchedResult.title}</h2>
            <div className={styles.divider}></div>
            <p className={styles.resultContent}>
              {matchedResult.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </p>

            {/* 통계 랭킹 섹션 (자기 결과 카드 하단에 나열) */}
            {sortedStats.length > 0 && (
              <div className={styles.statsSection}>
                <h3 className={styles.statsHeading}>📊 전체 참여자 성향 분석 순위</h3>
                <p className={styles.statsSubheading}>다른 사람들은 어떤 유형이 가장 많이 나왔을까요?</p>
                
                <div className={styles.rankList}>
                  {sortedStats.map((item, idx) => {
                    const isMyResult = matchedResult && item.id === matchedResult.id;
                    return (
                      <div 
                        key={item.id} 
                        className={`${styles.rankItem} ${isMyResult ? styles.myRankItem : ''}`}
                      >
                        <div className={styles.rankItemHeader}>
                          <div className={styles.rankItemInfo}>
                            <span className={styles.rankNumber}>{idx + 1}위</span>
                            <span className={styles.rankEmoji}>{item.emoji}</span>
                            <span className={styles.rankTitle}>{item.title}</span>
                          </div>
                          <div className={styles.rankItemValue}>
                            {isMyResult && <span className={styles.myBadge}>나의 결과</span>}
                            <span className={styles.rankPercent}>{item.percentage}%</span>
                          </div>
                        </div>
                        {/* 백분율 궤적 바 */}
                        <div className={styles.trackBar}>
                          <div 
                            className={`${styles.fillBar} ${isMyResult ? styles.myFillBar : ''}`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.resultCard}>
            <p className={styles.noResultText}>결과 유형 데이터를 찾을 수 없습니다.</p>
          </div>
        )}
      </main>

      {/* 결과 화면 하단 광고 */}
      <AdSlot type="result" />

      {/* 다른 테스트 하러가기 버튼 */}
      <div className={styles.actionArea}>
        <Link href="/" className={styles.backButton}>
          다른 테스트 하러 가기
          <span className={styles.arrow}>↩</span>
        </Link>
      </div>
    </div>
  );
}
