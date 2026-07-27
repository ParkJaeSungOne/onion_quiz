import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const NON_HUMAN_REGEX = /bot|crawler|spider|crawling|yeti|daum|google|naver|yahoo|bing|lighthouse|facebookexternalhit|whatsapp|slack|telegram|vercel|headlesschrome|phantomjs|puppeteer|python|curl|wget|go-http-client|axios|postman|gemini|claude|chatgpt|meta-externalagent|threadsbot|cron|node-fetch|undici/i;

async function purgeAndRecalculate() {
  console.log('=== STARTING DATABASE TRAFFIC SANITIZATION ===');

  // 1. VisitorLog 테이블에서 봇, 크론, 스크랩, 어드민 방문 기록 완전 제거
  const allVisitorLogs = await prisma.visitorLog.findMany();
  console.log(`Total VisitorLogs in DB: ${allVisitorLogs.length}`);

  let deletedVisitorLogs = 0;
  for (const log of allVisitorLogs) {
    const isBot = NON_HUMAN_REGEX.test(log.userAgent || '');
    const isAdmin = (log.pagePath || '').startsWith('/admin') || (log.pagePath || '').startsWith('/api') || (log.referrer || '').includes('/admin');
    
    if (isBot || isAdmin) {
      await prisma.visitorLog.delete({ where: { id: log.id } });
      deletedVisitorLogs++;
    }
  }
  console.log(`Purged ${deletedVisitorLogs} non-human/admin VisitorLogs!`);

  // 2. QuizLog 테이블에서 봇, 크론, 어드민 테스트 기록 완전 제거
  const allQuizLogs = await prisma.quizLog.findMany();
  console.log(`Total QuizLogs in DB: ${allQuizLogs.length}`);

  let deletedQuizLogs = 0;
  for (const qLog of allQuizLogs) {
    const isBot = NON_HUMAN_REGEX.test(qLog.userAgent || '');
    const isAdmin = (qLog.referer || '').includes('/admin') || qLog.userAgent === 'unknown';

    if (isBot || isAdmin) {
      await prisma.quizLog.delete({ where: { id: qLog.id } });
      deletedQuizLogs++;
    }
  }
  console.log(`Purged ${deletedQuizLogs} non-human/admin QuizLogs!`);

  // 3. VisitorStats 테이블을 순수 사람 VisitorLog 기반으로 정밀 재계산 (Daily PV / UV)
  const remainingVisitorLogs = await prisma.visitorLog.findMany({
    orderBy: { createdAt: 'asc' }
  });

  // 날짜별 (KST YYYY-MM-DD) PV 및 고유 IP 집계
  const dailyStatsMap = new Map(); // dateStr -> { pv: number, ips: Set<string> }

  for (const log of remainingVisitorLogs) {
    const date = new Date(log.createdAt);
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kstDate.toISOString().split('T')[0];

    if (!dailyStatsMap.has(dateStr)) {
      dailyStatsMap.set(dateStr, { pv: 0, ips: new Set() });
    }

    const stat = dailyStatsMap.get(dateStr);
    stat.pv += 1;
    if (log.ip) {
      stat.ips.add(log.ip);
    }
  }

  // 4. VisitorStats 테이블 전면 갱신
  await prisma.visitorStats.deleteMany({});
  console.log('Cleared old VisitorStats table.');

  for (const [dateStr, stat] of dailyStatsMap.entries()) {
    const uvCount = Math.max(1, stat.ips.size);
    const pvCount = Math.max(uvCount, stat.pv);

    await prisma.visitorStats.create({
      data: {
        date: dateStr,
        pv: pvCount,
        uv: uvCount
      }
    });
    console.log(`[Clean VisitorStats Created] Date: ${dateStr} | Pure UV: ${uvCount} | Pure PV: ${pvCount}`);
  }

  console.log('=== SANITIZATION COMPLETE! ===');
}

purgeAndRecalculate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
