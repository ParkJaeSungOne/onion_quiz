import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function auditToday() {
  console.log('=== 1. VISITOR STATS TABLE (ALL RECENT) ===');
  const stats = await prisma.visitorStats.findMany({ orderBy: { date: 'desc' }, take: 10 });
  console.log(JSON.stringify(stats, null, 2));

  console.log('=== 2. VISITOR LOGS CREATED TODAY (UTC/KST) ===');
  const logs = await prisma.visitorLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  console.log(`Total VisitorLogs count in DB: ${await prisma.visitorLog.count()}`);
  console.log(JSON.stringify(logs, null, 2));
}

auditToday()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
