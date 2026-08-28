import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'THREADS_ACCESS_TOKEN' }
    });
    const token = setting?.value || process.env.THREADS_ACCESS_TOKEN;

    const res = await fetch(`https://graph.threads.net/v1.0/me/threads?fields=id,media_type,text,permalink&limit=3&access_token=${token}`);
    const data = await res.json();
    console.log('Recent Threads:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
