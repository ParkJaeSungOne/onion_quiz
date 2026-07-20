import Link from 'next/link';
import { Quiz } from '@prisma/client';
import prisma from '@/lib/prisma';
import AdSlot from '@/components/AdSlot';
import OnionLogo from '@/components/OnionLogo';
import SearchBar from '@/components/SearchBar';
import styles from './page.module.css';

// 메인 페이지 5분 캐싱 설정 (검색어가 없을 때 초고속 정적 서빙, 검색어 인입 시 동적 전환)
export const revalidate = 300; 

import { unstable_cache } from 'next/cache';

// Prisma 쿼리를 캐싱하여 Supabase 통신 대기 시간을 0에 수렴하게 최적화 (5분 캐시 및 'quizzes' 태그 지정)
const getCachedQuizzes = unstable_cache(
  async (searchStr: string | undefined, pageNum: number, pageSize: number) => {
    const whereClause = searchStr ? {
      OR: [
        { title: { contains: searchStr, mode: 'insensitive' as const } },
        { description: { contains: searchStr, mode: 'insensitive' as const } },
        { category: { contains: searchStr, mode: 'insensitive' as const } },
      ]
    } : {};

    const totalCount = await prisma.quiz.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const validatedPage = Math.min(Math.max(1, pageNum), totalPages);

    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (validatedPage - 1) * pageSize,
      take: pageSize,
      include: {
        questions: {
          select: { id: true }
        }
      }
    });

    return { quizzes, totalPages, pageNum: validatedPage };
  },
  ['quizzes-list-cache'],
  { revalidate: 300, tags: ['quizzes'] }
);

interface HomePageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const { page: pageStr, search: searchStr } = await searchParams;
  const currentPage = parseInt(pageStr || '1', 10);
  const pageSize = 6; // 한 페이지당 6개 테스트 노출 (속도 최적화)

  let quizzes: any[] = [];
  let dbError = false;
  let totalPages = 1;
  let pageNum = 1;

  try {
    const result = await getCachedQuizzes(searchStr, currentPage, pageSize);
    quizzes = result.quizzes;
    totalPages = result.totalPages;
    pageNum = result.pageNum;
  } catch (error) {
    console.error('Database fetch error:', error);
    dbError = true;
  }

  // 페이징 링크 빌더 (검색어 쿼리 보존용)
  const getPageLink = (pageNo: number) => {
    let link = `/?page=${pageNo}`;
    if (searchStr) {
      link += `&search=${encodeURIComponent(searchStr)}`;
    }
    return link;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <OnionLogo className={styles.logoIcon} />
          <h1 className={styles.title}>KKADO KKADO</h1>
        </div>
        <p className={styles.subtitle}>
          양파처럼 깔수록 재미있고 적나라한 진짜 나를 까보는 성향 테스트 연구소
        </p>
      </header>

      {/* 🔍 검색 바 컴포넌트 마운트 */}
      <SearchBar />

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
          // 검색 결과 혹은 등록 목록이 아예 비어있는 경우
          <div className={styles.infoCard}>
            {searchStr ? (
              <>
                <p className={styles.infoText}>
                  🔍 “ <strong>{searchStr}</strong> ” 에 대한 성향 테스트 검색 결과가 없습니다.
                </p>
                <p className={styles.infoSubText}>
                  다른 재미있는 검색어로 찾아보거나, 홈 화면으로 돌아가 보세요!
                </p>
                <Link href="/" className={styles.seedButton} style={{ display: 'inline-block', marginTop: '16px' }}>
                  ↩ 전체 리스트 보러가기
                </Link>
              </>
            ) : (
              <>
                <p className={styles.infoText}>
                  등록된 성향 테스트가 아직 없습니다. 하루 한 번 AI 생성 파이프라인이 구동됩니다.
                </p>
                <p className={styles.infoSubText}>
                  아래 버튼을 눌러 첫 테스트를 AI를 통해 즉시 생성할 수 있습니다:
                </p>
                <a href="/api/cron/generate" className={styles.seedButton}>
                  ✨ 첫 AI 테스트 강제 생성하기 (수동 트리거)
                </a>
              </>
            )}
          </div>
        ) : (
          <>
            {/* 검색어 활성화 시 안내 문구 */}
            {searchStr && (
              <div className={styles.searchResultBadge}>
                🎯 “ <strong>{searchStr}</strong> ” 관련 결과 총 {quizzes.length}건이 발견되었습니다.
              </div>
            )}

            <div className={styles.grid}>
              {quizzes.map((quiz, index) => {
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

            {/* 네오브루탈리즘 스타일 페이징 UI (검색 쿼리 유지형) */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                {pageNum > 1 ? (
                  <Link href={getPageLink(pageNum - 1)} className={styles.pageButton}>
                    ◀ 이전
                  </Link>
                ) : (
                  <span className={`${styles.pageButton} ${styles.disabled}`}>
                    ◀ 이전
                  </span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isCurrent = p === pageNum;
                  return isCurrent ? (
                    <span key={p} className={`${styles.pageButton} ${styles.active}`}>
                      {p}
                    </span>
                  ) : (
                    <Link key={p} href={getPageLink(p)} className={styles.pageButton}>
                      {p}
                    </Link>
                  );
                })}

                {pageNum < totalPages ? (
                  <Link href={getPageLink(pageNum + 1)} className={styles.pageButton}>
                    다음 ▶
                  </Link>
                ) : (
                  <span className={`${styles.pageButton} ${styles.disabled}`}>
                    다음 ▶
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2026 까도까도 (Kkado-Kkado). All rights reserved.</p>
        <p className={styles.footerInfo}>이 사이트는 매일 AI로 트렌디한 성향 테스트를 자동 수집 및 연구합니다.</p>
      </footer>
    </div>
  );
}
