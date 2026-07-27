import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testMe() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'THREADS_ACCESS_TOKEN' } });
  const token = setting ? setting.value.trim() : (process.env.THREADS_ACCESS_TOKEN || '').trim();

  const meUrl = `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url&access_token=${token}`;
  const res = await fetch(meUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });
  const text = await res.text();
  console.log('=== META THREADS ME API RAW RESPONSE ===');
  console.log('HTTP Status:', res.status);
  console.log('Headers:', res.headers.get('www-authenticate'));
  console.log('Body:', text);
}

testMe()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
