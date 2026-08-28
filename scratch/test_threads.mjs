import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testImageAndToken() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'THREADS_ACCESS_TOKEN' }
    });
    const token = setting?.value || process.env.THREADS_ACCESS_TOKEN;
    console.log('Token found:', token ? token.substring(0, 15) + '...' : 'None');

    // Test token with me endpoint
    const meRes = await fetch(`https://graph.threads.net/v1.0/me?access_token=${token}`);
    const meData = await meRes.json();
    console.log('Me data:', meData);

    // Test image URL accessibility
    const testImg = 'https://img1a.coupangcdn.com/image/travelSeller/resort/A00020814/0cd84f5c-2d7f-480c-b35f-4c637e360052.jpg';
    const imgRes = await fetch(testImg);
    console.log('Image status:', imgRes.status, imgRes.headers.get('content-type'));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testImageAndToken();
