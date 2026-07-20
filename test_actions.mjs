
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  console.log('Testing createQuizLog equivalent...');
  const log = await prisma.quizLog.create({
    data: {
      quizId: 1,
      ipAddress: '127.0.0.1',
      referer: 'Direct',
      userAgent: 'Mozilla',
    },
  });
  console.log('QuizLog created successfully! ID:', log.id);

  console.log('Testing completeQuizLog equivalent...');
  await prisma.quizLog.update({
    where: { id: log.id },
    data: { totalScore: 25 },
  });
  console.log('QuizLog completed successfully!');
} catch (error) {
  console.error('Test failed:', error);
} finally {
  await prisma.$disconnect();
}
