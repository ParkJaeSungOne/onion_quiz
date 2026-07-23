import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('--- Triggering Threads Post Route Handler Directly ---');
  
  const tokenRaw = process.env.THREADS_ACCESS_TOKEN || '';
  const token = tokenRaw.replace(/["']/g, '').trim();

  if (!token) {
    console.error('Error: THREADS_ACCESS_TOKEN is missing!');
    process.exit(1);
  }

  // 템플릿 정보
  const target = {
    title: "도파민 좀비 측정기 (쇼츠/릴스 중독)",
    text: "쇼츠나 릴스 5분만 봐야지 하다가 2시간 뚝딱 지나가는 사람 무조건 해보셈 ㅋㅋㅋ\n내 뇌가 도파민 알고리즘에 얼마나 절여졌는지 등급으로 말해줌;\n나 '도파민 좀비 3단계' 떴다... 너네는 몇 단계 나옴?\n\n👇 링크는 아래 첫 댓글에!",
    reply: "📱 나의 도파민 중독 수준 판독하기 👇\nhttps://kkado-kkado.com/quiz/21",
    imageUrl: "https://kkado-kkado.com/images/char-zombie.jpg"
  };

  console.log(`[Testing] Attempting to publish Image Post to Threads...`);
  console.log(`Image URL: ${target.imageUrl}`);
  console.log(`Text: ${target.text.substring(0, 50)}...`);

  // 1. 이미지 컨테이너 포스팅
  const postUrl = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(target.imageUrl)}&text=${encodeURIComponent(target.text)}&auto_publish_text=true&access_token=${token}`;

  try {
    const res = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const wwwAuth = res.headers.get('www-authenticate') || '';
    const text = await res.text();
    console.log('HTTP Status:', res.status);
    console.log('www-authenticate header:', wwwAuth);
    console.log('Raw Response:', text);

    if (wwwAuth.includes('invalid_token') || wwwAuth.includes('expired') || res.status === 401 || res.status === 500) {
      console.log('\n❌ [결과 분석]: Meta Threads API 서버에서 토큰 세션 만료(Session Expired) 응답이 반환되었습니다.');
      console.log('새로 갱신받은 60일 장기 토큰을 어드민(/admin) 및 Vercel 환경변수에 저장해야 실제로 스레드 피드에 작성됩니다!');
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

main();
