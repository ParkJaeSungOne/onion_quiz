import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const quizzes = await prisma.quiz.findMany({
    take: 10,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
    }
  });

  console.log('--- TOP VIRAL QUIZZES ---');
  console.log(JSON.stringify(quizzes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
