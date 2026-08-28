import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAndReply() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'THREADS_ACCESS_TOKEN' }
    });
    const token = setting?.value || process.env.THREADS_ACCESS_TOKEN;

    // Check status of container 18086052290355985
    const statusRes = await fetch(`https://graph.threads.net/v1.0/18086052290355985?fields=id,text,status&access_token=${token}`);
    const statusData = await statusRes.json();
    console.log('Status data:', statusData);

    // If needed to publish or post reply
    const replyText = `🏨 [소노벨 단양] 쿠팡 단독 특가 패키지 보러가기 👇\nhttps://link.coupang.com/a/gzAKLjJpyC\n\n(이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.)`;

    const replyUrl = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${encodeURIComponent(replyText)}&reply_to_id=18086052290355985&auto_publish_text=true&access_token=${token}`;
    
    const replyRes = await fetch(replyUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const replyData = await replyRes.json();
    console.log('Reply result:', replyData);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndReply();
