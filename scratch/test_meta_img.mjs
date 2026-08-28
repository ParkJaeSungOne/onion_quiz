import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testMetaImage() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'THREADS_ACCESS_TOKEN' }
    });
    const token = setting?.value || process.env.THREADS_ACCESS_TOKEN;

    const dynamicOg = `https://kkado-kkado.com/api/og?title=${encodeURIComponent('소노벨 단양')}&category=${encodeURIComponent('핫딜')}`;
    console.log('Testing image URL:', dynamicOg);

    // Test 1: with dynamic OG url
    const containerUrl1 = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(dynamicOg)}&text=${encodeURIComponent('테스트')}&access_token=${token}`;
    const res1 = await fetch(containerUrl1, { method: 'POST' });
    const data1 = await res1.json();
    console.log('Test 1 (Dynamic OG) result:', data1);

    // Test 2: with clean static thumbnail.png
    const staticImg = 'https://kkado-kkado.com/thumbnail.png';
    const containerUrl2 = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(staticImg)}&text=${encodeURIComponent('테스트')}&access_token=${token}`;
    const res2 = await fetch(containerUrl2, { method: 'POST' });
    const data2 = await res2.json();
    console.log('Test 2 (Static PNG) result:', data2);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testMetaImage();
