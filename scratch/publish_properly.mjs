import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function publishProperly() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'THREADS_ACCESS_TOKEN' }
    });
    const token = setting?.value || process.env.THREADS_ACCESS_TOKEN;

    const postText = `가족이나 연인, 친구들이랑 가성비 힐링 여행 갈 때 소노벨 단양(구 대명리조트) 만한 곳이 없는데, 이번에 쿠팡 단독 특가 패키지 제대로 떴음 ㄷㄷ🔥

단양 남한강 뷰에 오션플레이 워터파크까지 딸려있어서 사계절 내내 인기 터지는 리조트인데, 이번 쿠팡 단독 패키지는 혜택 대비 가격이 미쳤음...

단양 패러글라이딩이나 만천하스카이워크, 마늘떡갈비 먹방 코스 짤 때 숙소는 무조건 여기가 국룰인 거 알지? ㅋㅋㅋ

주말이나 연휴 일정은 방 금방 마감되니까 여행 계획 있는 사람들은 일정 먼저 찜해두는 거 추천! 👍

👇 쿠팡 단독 특가 패키지 링크는 아래 첫 댓글에 달아둘게!`;

    const imageUrl = 'https://img1a.coupangcdn.com/image/travelSeller/resort/A00020814/0cd84f5c-2d7f-480c-b35f-4c637e360052.jpg';
    
    const replyText = `🏨 [소노벨 단양] 쿠팡 단독 특가 패키지 보러가기 👇\nhttps://link.coupang.com/a/gzAKLjJpyC\n\n(이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.)`;

    // 1. Create container
    console.log('Step 1: Creating Media Container...');
    const containerUrl = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(postText)}&access_token=${token}`;
    const containerRes = await fetch(containerUrl, { method: 'POST' });
    const containerData = await containerRes.json();
    console.log('Container created:', containerData);

    if (!containerData.id) {
      throw new Error('Container creation failed: ' + JSON.stringify(containerData));
    }

    // 2. Wait for container status to be FINISHED (up to 10s)
    console.log('Step 2: Checking container status...');
    let isReady = false;
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`https://graph.threads.net/v1.0/${containerData.id}?fields=status,error_message&access_token=${token}`);
      const statusData = await statusRes.json();
      console.log(`Check ${i+1}:`, statusData);
      if (statusData.status === 'FINISHED') {
        isReady = true;
        break;
      }
    }

    // 3. Publish container
    console.log('Step 3: Publishing media container...');
    const pubUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${containerData.id}&access_token=${token}`;
    const pubRes = await fetch(pubUrl, { method: 'POST' });
    const pubData = await pubRes.json();
    console.log('Publish result:', pubData);

    if (!pubData.id) {
      throw new Error('Publish failed: ' + JSON.stringify(pubData));
    }

    const publishedMediaId = pubData.id;

    // 4. Post first reply comment
    console.log('Step 4: Posting reply with affiliate link...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Create reply container
    const replyContainerUrl = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${encodeURIComponent(replyText)}&reply_to_id=${publishedMediaId}&access_token=${token}`;
    const replyContainerRes = await fetch(replyContainerUrl, { method: 'POST' });
    const replyContainerData = await replyContainerRes.json();
    console.log('Reply container:', replyContainerData);

    if (replyContainerData.id) {
      await new Promise(r => setTimeout(r, 2000));
      const replyPubUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${replyContainerData.id}&access_token=${token}`;
      const replyPubRes = await fetch(replyPubUrl, { method: 'POST' });
      const replyPubData = await replyPubRes.json();
      console.log('Reply published:', replyPubData);
    }

    console.log('🎉 ALL DONE! Successfully posted to Threads!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

publishProperly();
