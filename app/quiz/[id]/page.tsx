import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import QuizPlayClient from './QuizPlayClient';

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; 

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
