import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function auditData() {
  console.log('=== 1. VISITOR STATS TABLE ===');
  const stats = await prisma.visitorStats.findMany({ orderBy: { date: 'desc' } });
  console.log(JSON.stringify(stats, null, 2));

  console.log('=== 2. VISITOR LOGS USER AGENTS (TOP 20) ===');
  const logs = await prisma.visitorLog.findMany({
    select: { userAgent: true, pagePath: true, device: true, browser: true, ip: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  console.log(JSON.stringify(logs, null, 2));

  console.log('=== 3. QUIZ LOGS USER AGENTS (TOP 20) ===');
  const qLogs = await prisma.quizLog.findMany({
    select: { userAgent: true, referer: true, ipAddress: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 30
  });
  console.log(JSON.stringify(qLogs, null, 2));
}

auditData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
