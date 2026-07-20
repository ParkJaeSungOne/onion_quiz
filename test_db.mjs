import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  const quiz = await prisma.quiz.findFirst({ select: { id: true } });
  console.log('First quiz ID:', quiz?.id);
} catch (error) {
  console.error('Database connection failed:', error);
} finally {
  await prisma.$disconnect();
}
