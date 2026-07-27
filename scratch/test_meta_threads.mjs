import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testThreads() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'THREADS_ACCESS_TOKEN' } });
  const token = setting ? setting.value.trim() : (process.env.THREADS_ACCESS_TOKEN || '').trim();
  console.log('Token snippet:', token ? token.substring(0, 15) + '...' : 'NONE');

  const text = encodeURIComponent('📢 [까도까도 성향테스트] 2026 신작 테스트 팩폭 라인업 오픈!');
  const url = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${text}&access_token=${token}`;

  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  console.log('=== META THREADS API CONTAINER CREATION ===');
  console.log('HTTP Status:', res.status);
  console.log('Data:', JSON.stringify(data, null, 2));

  if (data.id) {
    console.log('=== ATTEMPTING PUBLISH (THREADS PUBLISH API) ===');
    const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${data.id}&access_token=${token}`;
    const pubRes = await fetch(publishUrl, { method: 'POST' });
    const pubData = await pubRes.json();
    console.log('Publish HTTP Status:', pubRes.status);
    console.log('Publish Data:', JSON.stringify(pubData, null, 2));
  }
}

testThreads()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
