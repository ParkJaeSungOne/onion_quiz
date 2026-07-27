import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const newToken = "THAAOdOebMxxpBYll1YUtIZAXV6d25OdHpzOW1IOXk3UXU1M19QdEtiX29TOEx3UExkR2JubklBeW0yVUxoYUFJb1hpTW8yWmZAFZAnBDRE03dGNGQ3dXQ3hoSlIxeHdkSFVmeUJFMkpsd2hnNmxockxadXNPRU1obEY2YnJrNnlnVWtmZAwZDZD";

async function saveAndTest() {
  console.log('=== 1. SAVING NEW TOKEN TO DATABASE ===');
  await prisma.systemSetting.upsert({
    where: { key: 'THREADS_ACCESS_TOKEN' },
    update: { value: newToken.trim() },
    create: { key: 'THREADS_ACCESS_TOKEN', value: newToken.trim() }
  });
  console.log('Token successfully saved to SystemSetting DB table!');

  console.log('=== 2. TESTING META THREADS POST WITH NEW TOKEN ===');
  const text = encodeURIComponent('📢 [까도까도 팩폭 테스트 라이브 연동 성공! 🧅]\n\n새로운 60일 자동 연장 시스템이 정상적으로 기동되었습니다!\n\n👇 지금 바로 성향 테스트를 까보세요!\nhttps://kkado-kkado.com');
  const postUrl = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${text}&auto_publish_text=true&access_token=${newToken.trim()}`;

  const res = await fetch(postUrl, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  const data = await res.json();
  console.log('=== META THREADS POST RESPONSE ===');
  console.log('HTTP Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.id) {
    console.log('🎉 THREADS POST PUBLISHED SUCCESSFULLY! Post ID:', data.id);
  }
}

saveAndTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
