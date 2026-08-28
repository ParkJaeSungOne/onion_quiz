import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function publishCustomPost() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'THREADS_ACCESS_TOKEN' }
    });
    const token = setting?.value || process.env.THREADS_ACCESS_TOKEN;
    if (!token) {
      throw new Error('Threads access token not found');
    }

    const postText = `가족이나 연인, 친구들이랑 가성비 힐링 여행 갈 때 소노벨 단양(구 대명리조트) 만한 곳이 없는데, 이번에 쿠팡 단독 특가 패키지 제대로 떴음 ㄷㄷ🔥

단양 남한강 뷰에 오션플레이 워터파크까지 딸려있어서 사계절 내내 인기 터지는 리조트인데, 이번 쿠팡 단독 패키지는 혜택 대비 가격이 미쳤음...

단양 패러글라이딩이나 만천하스카이워크, 마늘떡갈비 먹방 코스 짤 때 숙소는 무조건 여기가 국룰인 거 알지? ㅋㅋㅋ

주말이나 연휴 일정은 방 금방 마감되니까 여행 계획 있는 사람들은 일정 먼저 찜해두는 거 추천! 👍

👇 쿠팡 단독 특가 패키지 링크는 아래 첫 댓글에 달아둘게!`;

    const imageUrl = 'https://img1a.coupangcdn.com/image/travelSeller/resort/A00020814/0cd84f5c-2d7f-480c-b35f-4c637e360052.jpg';
    
    const replyText = `🏨 [소노벨 단양] 쿠팡 단독 특가 패키지 보러가기 👇\nhttps://link.coupang.com/a/gzAKLjJpyC\n\n(이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.)`;

    console.log('1. Creating Threads media container...');
    const postUrl = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(postText)}&auto_publish_text=true&access_token=${token}`;

    const res = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const data = await res.json();
    console.log('Post Container response:', data);

    if (!data.id) {
      throw new Error('Failed to create parent post: ' + JSON.stringify(data));
    }

    const parentPostId = data.id;

    console.log('2. Waiting 3 seconds for Meta publishing...');
    await new Promise((r) => setTimeout(r, 3000));

    console.log('3. Publishing affiliate reply link...');
    const replyUrl = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${encodeURIComponent(replyText)}&reply_to_id=${parentPostId}&auto_publish_text=true&access_token=${token}`;
    
    const replyRes = await fetch(replyUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const replyData = await replyRes.json();
    console.log('Reply Container response:', replyData);

    console.log('=== SUCCESS! Published to Threads ===');
    console.log('Parent Post ID:', parentPostId);
    console.log('Reply ID:', replyData.id);

  } catch (err) {
    console.error('Publish error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

publishCustomPost();
