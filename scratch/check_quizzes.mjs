import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    select: { id: true, title: true, category: true, createdAt: true }
  });
  console.log('=== RECENT QUIZZES ===');
  for (const q of quizzes) {
    console.log(`[ID ${q.id}] ${q.createdAt.toISOString()} | ${q.title}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
