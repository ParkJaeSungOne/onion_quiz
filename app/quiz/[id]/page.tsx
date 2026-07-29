import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import QuizPlayClient from './QuizPlayClient';

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

// 1시간 단위 증분 정적 재생성 (ISR) 설정으로 플레이 페이지 로드 속도 향상
export const revalidate = 3600;

/**
 * ⚡ DB 조회 쿼리 캐싱 (Supabase 통신 대기 시간을 0ms로 대폭 최적화)
 */
const getCachedQuiz = unstable_cache(
  async (quizId: number) => {
    return prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
          include: {
            options: {
              orderBy: { score: 'asc' }
            }
          }
        },
        results: true
      }
    });
  },
  ['quiz-detail-cache-v3'],
  { revalidate: 3600, tags: ['quizzes'] }
);

/**
 * ⚡ 사전 정적 파라미터 생성 (최신 20개 인기 퀴즈 사전 렌더링으로 커넥션 풀 고갈 방지 및 초고속 빌드)
 */
export async function generateStaticParams() {
  try {
    const quizzes = await prisma.quiz.findMany({
      select: { id: true },
      orderBy: { id: 'desc' },
      take: 20
    });
    return quizzes.map((q) => ({
      id: q.id.toString()
    }));
  } catch {
    return [];
  }
}

/**
 * 1. 검색엔진 최적화 (SEO) 극대화를 위한 개별 테스트 동적 메타데이터 생성기
 */
export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { id } = await params;
  const quizId = parseInt(id, 10);
  
  if (isNaN(quizId)) {
    return {};
  }

  const quiz = await getCachedQuiz(quizId);

  if (!quiz) {
    return {};
  }

  return {
    metadataBase: new URL('https://kkado-kkado.com'),
    title: `${quiz.title} | 까도까도 팩폭 테스트`,
    description: `${quiz.description} - 요즘 인싸들 사이에서 유행하는 핫한 밈 ${quiz.category} 성향 테스트 까도까도.`,
    alternates: {
      canonical: `https://kkado-kkado.com/quiz/${quizId}`,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `${quiz.title} - 까도까도 (kkado-kkado.com)`,
      description: quiz.description,
      url: `https://kkado-kkado.com/quiz/${quizId}`,
      siteName: '까도까도',
      images: [
        {
          url: `https://kkado-kkado.com/api/og?title=${encodeURIComponent(quiz.title)}&category=${encodeURIComponent(quiz.category)}`,
          width: 1200,
          height: 630,
          alt: quiz.title,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: quiz.title,
      description: quiz.description,
      images: [`https://kkado-kkado.com/api/og?title=${encodeURIComponent(quiz.title)}&category=${encodeURIComponent(quiz.category)}`],
    }
  };
}

/**
 * 2. 테스트 시작 & 플레이 렌더러
 */
export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;
  const quizId = parseInt(id, 10);

  if (isNaN(quizId)) {
    notFound();
  }

  // ⚡ 캐시된 퀴즈 데이터 초고속 로드
  const quiz = await getCachedQuiz(quizId);

  if (!quiz) {
    notFound();
  }

  // 구글 검색에 리치 스니펫(질문/성향 테스트 구조화 스키마) 노출을 극대화하기 위한 JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    'name': quiz.title,
    'description': quiz.description,
    'educationalUse': 'personality test',
    'hasPart': quiz.questions.map((q) => ({
      '@type': 'Question',
      'name': q.text,
      'suggestedAnswer': q.options.map((opt) => ({
        '@type': 'Answer',
        'text': opt.text,
      })),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 🚀 검색엔진 크롤러(네이버 Yeti, 구글 Googlebot) 수집용 SSR 시맨틱 텍스트 구조 */}
      <article className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
        <h1>{quiz.title}</h1>
        <p>{quiz.description}</p>
        <section>
          <h2>{quiz.title} 테스트 문항 및 선택지 목록</h2>
          {quiz.questions.map((q) => (
            <div key={q.id}>
              <h3>Q{q.questionNumber}. {q.text}</h3>
              <ul>
                {q.options.map((opt) => (
                  <li key={opt.id}>{opt.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        {quiz.results && quiz.results.length > 0 && (
          <section>
            <h2>{quiz.title} 결과 유형 및 분석 리포트</h2>
            {quiz.results.map((res) => (
              <div key={res.id}>
                <h3>{res.emoji} {res.title}</h3>
                <p>{res.content}</p>
              </div>
            ))}
          </section>
        )}
      </article>
      <QuizPlayClient quiz={quiz} />
    </>
  );
}
