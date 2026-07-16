import Link from 'next/link';
import { Quiz } from '@prisma/client';
import prisma from '@/lib/prisma';
import AdSlot from '@/components/AdSlot';
import OnionLogo from '@/components/OnionLogo';
import styles from './page.module.css';

// 매번 요청 시 DB 최신 데이터를 반영하도록 설정
export const revalidate = 0; 

export default async function Home() {
  let quizzes: (Quiz & { questions: { id: string }[] })[] = [];
  let dbError = false;


  try {
    quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        questions: {
          select: { id: true }
        }
      }
    });
  } catch (error) {
    console.error('Database fetch error:', error);
    dbError = true;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <OnionLogo className={styles.logoIcon} />
          <h1 className={styles.title}>ONION LAB</h1>
        </div>
        <p className={styles.subtitle}>
          양파처럼 까도 까도 새로운 나를 발견하는 성향 테스트 연구소
        </p>
      </header>

      {/* 상단 광고 슬롯 */}
      <AdSlot type="main" />

      <main className={styles.main}>
        {dbError ? (
          <div className={styles.infoCard}>
            <p className={styles.infoText}>
              ⚠️ 데이터베이스 연결 상태를 확인해주세요. Supabase 환경변수(DATABASE_URL)가 정상 등록되었는지 검증이 필요합니다.
            </p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className={styles.infoCard}>
            <p className={styles.infoText}>
              등록된 성향 테스트가 아직 없습니다. 하루 한 번 AI 생성 파이프라인이 구동됩니다.
            </p>
            <p className={styles.infoSubText}>
              아래 버튼을 눌러 첫 테스트를 AI를 통해 즉시 생성할 수 있습니다:
            </p>
            <a href="/api/cron/generate" className={styles.seedButton}>
              ✨ 첫 AI 테스트 강제 생성하기 (수동 트리거)
            </a>
          </div>
        ) : (
          <div className={styles.grid}>
            {quizzes.map((quiz, index) => {
              // 퀴즈 카드 렌더링
              const card = (
                <Link key={quiz.id} href={`/quiz/${quiz.id}`} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.category}>{quiz.category}</span>
                    <span className={styles.qCount}>{quiz.questions.length}문항</span>
                  </div>
                  <h2 className={styles.cardTitle}>{quiz.title}</h2>
                  <p className={styles.cardDesc}>{quiz.description}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.playText}>테스트 시작하기 →</span>
                  </div>
                </Link>
              );

              // 퀴즈 3개마다 중간 광고 삽입
              if (index > 0 && index % 3 === 0) {
                return (
                  <div key={`ad-wrapper-${quiz.id}`} className={styles.gridAdWrapper}>
                    <AdSlot type="main" />
                    {card}
                  </div>
                );
              }

              return card;
            })}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2026 Onion Lab (어니언 랩). All rights reserved.</p>
        <p className={styles.footerInfo}>이 사이트는 매일 AI로 트렌디한 성향 테스트를 자동 수집 및 연구합니다.</p>
      </footer>
    </div>
  );
}
