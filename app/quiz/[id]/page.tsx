import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import QuizPlayClient from './QuizPlayClient';

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

// 1시간 단위 증분 정적 재생성 (ISR) 설정으로 플레이 페이지 로드 속도 향상
export const revalidate = 3600; 

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

  return <QuizPlayClient quiz={quiz} />;
}
