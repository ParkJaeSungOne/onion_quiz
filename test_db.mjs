import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  console.log('Querying database...');
  const count = await prisma.quiz.count();
  console.log('Successfully queried DB. Quiz count:', count);
} catch (error) {
  console.error('Database connection failed:', error);
} finally {
  await prisma.$disconnect();
}
