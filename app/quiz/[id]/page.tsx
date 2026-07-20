import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import QuizPlayClient from './QuizPlayClient';

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

// 1시간 단위 증분 정적 재생성 (ISR) 설정으로 플레이 페이지 로드 속도 향상
export const revalidate = 3600; 


/**
 * 1. 검색엔진 최적화 (SEO) 극대화를 위한 개별 테스트 동적 메타데이터 생성기
 */
export async function generateMetadata({ params }: QuizPageProps): Promise<Metadata> {
  const { id } = await params;
  const quizId = parseInt(id, 10);
  
  if (isNaN(quizId)) {
    return {};
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      title: true,
      description: true,
      category: true
    }
  });

  if (!quiz) {
    return {};
  }

  return {
    title: `${quiz.title} | 까도까도 팩폭 테스트`,
    description: `${quiz.description} - 요즘 인싸들 사이에서 유행하는 핫한 밈 ${quiz.category} 성향 테스트 까도까도.`,
    openGraph: {
      title: `${quiz.title} - 까도까도 (kkado-kkado.com)`,
      description: quiz.description,
      url: `https://kkado-kkado.com/quiz/${quizId}`,
      siteName: '까도까도',
      images: [
        {
          url: 'https://kkado-kkado.com/thumbnail.png', // 고화질 512x512 양파 캐릭터 썸네일 활용
          width: 512,
          height: 512,
          alt: quiz.title,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: quiz.title,
      description: quiz.description,
      images: ['https://kkado-kkado.com/thumbnail.png'],
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

  // DB에서 퀴즈와 하위 질문, 선택지를 한 번에 긁어옴
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { questionNumber: 'asc' },
        include: {
          options: {
            orderBy: { score: 'asc' }
          }
        }
      }
    }
  });

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
      <QuizPlayClient quiz={quiz} />
    </>
  );
}
