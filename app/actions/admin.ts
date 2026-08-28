'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'kkado_admin_session';

/**
 * 어드민 패스코드 대조 및 암호화 쿠키 세팅
 */
export async function authenticateAdmin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'wotjd11442!'; // 기본값은 사용자 Supabase 비번으로 세팅해둠

  if (password === adminPassword) {
    const cookieStore = await cookies();
    // 24시간 동안 유효한 세션 쿠키 설정
    cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return { success: true };
  }

  return { success: false, error: '잘못된 패스코드입니다.' };
}

/**
 * 어드민 세션 쿠키 삭제 (로그아웃)
 */
export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

/**
 * 퀴즈 강제 삭제 Action
 */
export async function deleteQuiz(quizId: number) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (!session || session.value !== 'authenticated') {
      throw new Error('Unauthorized');
    }

    // Cascade 옵션이 Prisma Schema에 설정되어 있으므로 연관 질문, 선택지, 로그 등이 일괄 삭제됨
    await prisma.quiz.delete({
      where: { id: quizId }
    });

    revalidatePath('/');
    revalidatePath('/admin');
    revalidateTag('quizzes', 'default');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete quiz:', error);
    return { success: false, error: error.message };
  }
}

/**
 * AI 성향 테스트 생성 API 강제 트리거 Action (보안 강화)
 */
export async function triggerAIGenerate(subject?: string, questionCount?: number) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (!session || session.value !== 'authenticated') {
      throw new Error('Unauthorized');
    }

    // 현재 접속 헤더에서 호스트(도메인) 정보를 안전하게 취득
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';

    const cronSecret = process.env.CRON_SECRET || '';
    let url = `${protocol}://${host}/api/cron/generate?secret=${cronSecret}`;
    if (subject?.trim()) {
      url += `&subject=${encodeURIComponent(subject.trim())}`;
    }
    if (questionCount) {
      url += `&questionCount=${questionCount}`;
    }

    console.log(`Triggering AI Generator via action: ${url}`);
    
    const response = await fetch(url, { cache: 'no-store' });
    
    // 응답 Content-Type 확인 및 HTML/텍스트 에러 처리 가드
    const contentType = response.headers.get('content-type') || '';
    let data: any = {};
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // Vercel 504 Gateway Timeout 검출 및 직관적 번역 (Vercel Pro 60초 제한 적용)
      if (response.status === 504 || text.includes('504') || text.includes('An error occurred')) {
        throw new Error(`Vercel Pro 실행 시간 제한(60초)을 초과했습니다 (504 Gateway Timeout). Gemini AI 서버 응답이 지연되고 있으니 10초 후 다시 한번 트리거를 시도해 주세요.`);
      }
      throw new Error(`서버가 JSON이 아닌 텍스트를 반환했습니다 (상태 코드: ${response.status}). 상세내용: ${text.substring(0, 150)}...`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'AI 테스트 생성 도중 오류가 발생했습니다.');
    }

    revalidatePath('/');
    revalidatePath('/admin');
    if (data.quizId) {
      revalidatePath(`/quiz/${data.quizId}`);
    }
    revalidateTag('quizzes', 'default');
    return { success: true, title: data.title, threadsResult: data.threadsResult };
  } catch (error: any) {
    console.error('Failed to trigger AI generate:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 스레드 단기 토큰(1시간)을 60일 장기 토큰으로 안전하게 교환
 */
export async function exchangeThreadsToken(shortToken: string, appSecret: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (!session || session.value !== 'authenticated') {
      throw new Error('Unauthorized');
    }

    const cleanToken = shortToken.replace(/[\r\n"']/g, '').trim();
    const cleanSecret = appSecret.replace(/[\r\n"']/g, '').trim();

    if (!cleanToken || !cleanSecret) {
      throw new Error('단기 토큰과 앱 시크릿 코드를 모두 입력해 주세요.');
    }

    // 1차 시도: Threads 전용 Graph API 엔드포인트
    const urlThreads = `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${cleanSecret}&access_token=${cleanToken}`;
    console.log('Exchanging Threads short token via graph.threads.net...');
    
    let res = await fetch(urlThreads, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = {};
    }

    // 2차 시도: Facebook Graph API 엔드포인트 폴백 (EAA 계열 토큰 교체용)
    if (data.error && (data.error.message?.includes('Session key invalid') || data.error.message?.includes('OAuth'))) {
      console.log('Threads endpoint failed, trying Facebook Graph API fallback...');
      const urlFb = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_secret=${cleanSecret}&fb_exchange_token=${cleanToken}`;
      const resFb = await fetch(urlFb, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const textFb = await resFb.text();
      try {
        const dataFb = JSON.parse(textFb);
        if (dataFb.access_token) {
          return {
            success: true,
            longLivedToken: dataFb.access_token,
            expiresIn: dataFb.expires_in
          };
        }
      } catch (e) {}
    }

    if (data.error) {
      const errMsg = data.error.message || JSON.stringify(data.error);
      if (errMsg.includes('Session key invalid') || errMsg.includes('revoked')) {
        throw new Error(`[세션 키 만료] 메타 단기 토큰은 발급 후 1시간 이내에 교환해야 합니다.\n기존 단기 토큰 세션이 만료되었거나 취소되었으니, Meta Graph API Explorer에서 새로 [Generate Token]을 클릭한 갓 발급받은 'TH...' 토큰으로 다시 시도해 주세요.`);
      }
      throw new Error(errMsg);
    }

    if (!data.access_token) {
      throw new Error(`토큰 발급 실패 (응답: ${text.substring(0, 150)})`);
    }

    return { 
      success: true, 
      longLivedToken: data.access_token, 
      expiresIn: data.expires_in 
    };
  } catch (error: any) {
    console.error('Failed to exchange Threads token:', error);
    return { success: false, error: error.message };
  }
}

// 🚀 어드민 원클릭 스레드 수동 테스트 트리거
export async function triggerThreadsPostAction() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (!session || session.value !== 'authenticated') {
      throw new Error('Unauthorized');
    }

    const tokenRaw = process.env.THREADS_ACCESS_TOKEN || '';
    const token = tokenRaw.replace(/["']/g, '').trim();

    if (!token) {
      throw new Error('THREADS_ACCESS_TOKEN 환경변수가 설정되지 않았습니다.');
    }

    // 템플릿 선택 및 이미지 배정
    const charImages = [
      'https://kkado-kkado.com/images/char-zombie.jpg',
      'https://kkado-kkado.com/images/char-lazy.jpg',
      'https://kkado-kkado.com/images/char-broke.jpg',
      'https://kkado-kkado.com/images/char-angry.jpg',
      'https://kkado-kkado.com/images/char-food.jpg',
      'https://kkado-kkado.com/thumbnail.png'
    ];
    const selectedImage = charImages[Math.floor(Math.random() * charImages.length)];

    const testText = "📱 [실시간 테스트] 도파민 중독 성향 테스트 떴다 ㅋㅋㅋ\n쇼츠/릴스 5분만 봐야지 하다가 2시간 뚝딱 지나가는 사람 필수 검사 ㅋㅋㅋ\n\n👇 1분 팩폭 테스트 링크는 첫 댓글 확인!";
    const replyText = "📱 나의 도파민 중독 수준 진단하기 👇\nhttps://kkado-kkado.com/quiz/21";

    // 1. 본문 포스트 발행 (IMAGE 미디어 타입)
    const postUrl = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(selectedImage)}&text=${encodeURIComponent(testText)}&auto_publish_text=true&access_token=${token}`;

    const containerRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const wwwAuth = containerRes.headers.get('www-authenticate') || '';
    if (wwwAuth.includes('invalid_token') || wwwAuth.includes('expired')) {
      throw new Error(`스레드 Access Token이 만료되었습니다. Vercel 환경변수(THREADS_ACCESS_TOKEN)를 최신 60일 장기 토큰으로 업데이트했는지 확인해 주세요.`);
    }

    const textResStr = await containerRes.text();
    let containerData: any = {};
    try {
      containerData = JSON.parse(textResStr);
    } catch {
      throw new Error(`Meta 응답 오류 (HTTP ${containerRes.status}): ${textResStr || wwwAuth}`);
    }

    if (!containerRes.ok || containerData.error) {
      throw new Error(containerData.error?.message || JSON.stringify(containerData.error || containerData));
    }

    const parentPostId = containerData.id;

    // 2. 2초 딜레이 후 댓글 링크 발행
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const replyRes = await fetch(`https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${encodeURIComponent(replyText)}&reply_to_id=${parentPostId}&auto_publish_text=true&access_token=${token}`, {
      method: 'POST'
    });
    const replyData = await replyRes.json();

    return {
      success: true,
      postId: parentPostId,
      replyId: replyData.id || null,
      imageUrl: selectedImage,
      message: `🎉 스레드 포스팅 성공! (게시물 ID: ${parentPostId})`
    };
  } catch (error: any) {
    console.error('Failed to trigger Threads post action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 🛒 쿠팡 링크 분석 -> Gemini 어그로 바이럴 카피 생성 -> 스레드 이미지+본문+댓글 자동 발행
 */
export async function publishCoupangDealToThreads(coupangUrl: string) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (!session || session.value !== 'authenticated') {
      throw new Error('Unauthorized');
    }

    const cleanUrl = coupangUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('올바른 URL(http/https)을 입력해 주세요.');
    }

    // 1. 쿠팡 페이지 크롤링 및 상품 정보 추출
    console.log('[CoupangToThreads] Fetching URL:', cleanUrl);
    const crawlRes = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    const html = await crawlRes.text();
    const finalUrl = crawlRes.url || cleanUrl;

    // 상품명 추출
    const prodNameMatch = html.match(/"productName"\s*:\s*"([^"]+)"/i) 
      || html.match(/"title"\s*:\s*"([^"]+)"/i) 
      || html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      || html.match(/<title>([^<]+)<\/title>/i);

    let productName = prodNameMatch ? prodNameMatch[1] : '쿠팡 핫딜 추천 상품';
    productName = productName.replace(/쿠팡!\s*-\s*/g, '').replace(/ - 쿠팡!/g, '').trim();

    // 대표 이미지 추출
    const imgMatches = html.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
    let selectedImage = imgMatches.find(url => 
      (url.includes('travelSeller') || url.includes('thumbnail.coupangcdn.com') || url.includes('image.coupangcdn.com')) 
      && !url.includes('img_fb') 
      && !url.includes('icons') 
      && !url.includes('static/media')
    );

    if (!selectedImage) {
      selectedImage = 'https://kkado-kkado.com/thumbnail.png';
    }

    console.log('[CoupangToThreads] Extracted Product:', productName, 'Image:', selectedImage);

    // 2. Gemini 2.5 Flash를 사용해 바이럴 어그로 카피 생성
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    const prompt = `
당신은 스레드(Threads)에서 수만 조회수와 폭발적인 댓글/공유를 이끌어내는 최고의 '트렌드 & 핫딜 바이럴 마케터'입니다.
다음 쿠팡 핫딜 상품에 대한 매력적이고 솔직하며 킹받는 B급 어그로 감성의 스레드 본문 글을 작성해 주세요.

[상품 정보]
- 상품명: "${productName}"
- 링크: "${finalUrl}"

[작성 규칙]
1. 첫 문장은 무조건 유저들의 스크롤을 멈추게 만드는 강력한 훅(공감/호기심/어그로)으로 시작하세요.
   (예: "와 이거 진짜 아는 사람만 쟁여두는 꿀템인데...", "주변에 이거 추천해 주고 욕먹은 적 한 번도 없음 ㄷㄷ", "가성비 미쳤다는 말밖에 안 나오는 이유...")
2. 친근한 반말 구어체("~했음", "~임 ㅋㅋㅋ", "~인 거 알지?", "~추천함!")를 사용하세요.
3. 상품의 실제 매력과 장점, 꼭 사야 하는 이유 2~3가지를 자연스럽게 어필하세요.
4. 글 마지막은 무조건 **"👇 구매/예약 링크는 아래 첫 댓글에 달아둘게!"** 로 끝나야 합니다. (본문에 링크 삽입 금지!)
5. 마크다운 볼드(**), 제목(#), 따옴표 없이 자연스러운 줄바꿈과 이모지(🔥, ㄷㄷ, ㅋㅋㅋ, 👍, ✈️ 등)를 적절히 섞어 딱 3~4문단(공백 포함 200~350자)으로 작성하세요.
`;

    const aiRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const postText = aiRes.text?.trim() || `와 이번에 쿠팡에서 뜬 특가 상품 실화냐 ㄷㄷ🔥\n\n${productName}\n\n가성비나 혜택 대비 가격이 너무 좋아서 품절 전에 미리 쟁여두는 거 추천! 👍\n\n👇 구매 링크는 아래 첫 댓글에 달아둘게!`;

    const replyText = `🛒 [${productName.substring(0, 30)}] 특가 보러가기 👇\n${cleanUrl}\n\n(이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.)`;

    // 3. Threads API 포스팅 실행
    const { getThreadsToken } = await import('@/lib/threadsToken');
    const token = await getThreadsToken();
    if (!token) {
      throw new Error('THREADS_ACCESS_TOKEN이 설정되어 있지 않습니다.');
    }

    // Step A: Create Media Container
    const containerUrl = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(selectedImage)}&text=${encodeURIComponent(postText)}&access_token=${token}`;
    const containerRes = await fetch(containerUrl, { method: 'POST' });
    const containerData = await containerRes.json();

    if (!containerData.id) {
      throw new Error('스레드 미디어 생성 실패: ' + JSON.stringify(containerData));
    }

    // Step B: Wait for container to be FINISHED
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`https://graph.threads.net/v1.0/${containerData.id}?fields=status&access_token=${token}`);
      const statusData = await statusRes.json();
      if (statusData.status === 'FINISHED') break;
    }

    // Step C: Publish Media Container
    const pubUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${containerData.id}&access_token=${token}`;
    const pubRes = await fetch(pubUrl, { method: 'POST' });
    const pubData = await pubRes.json();

    if (!pubData.id) {
      throw new Error('스레드 본문 발행 실패: ' + JSON.stringify(pubData));
    }

    const parentPostId = pubData.id;

    // Step D: Publish First Reply Comment
    await new Promise(r => setTimeout(r, 2000));
    const replyContainerUrl = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${encodeURIComponent(replyText)}&reply_to_id=${parentPostId}&access_token=${token}`;
    const replyContainerRes = await fetch(replyContainerUrl, { method: 'POST' });
    const replyContainerData = await replyContainerRes.json();

    let replyPostId = null;
    if (replyContainerData.id) {
      await new Promise(r => setTimeout(r, 2000));
      const replyPubUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${replyContainerData.id}&access_token=${token}`;
      const replyPubRes = await fetch(replyPubUrl, { method: 'POST' });
      const replyPubData = await replyPubRes.json();
      replyPostId = replyPubData.id || replyContainerData.id;
    }

    // Step E: Fetch permalink
    let permalink = `https://www.threads.net`;
    try {
      const permalinkRes = await fetch(`https://graph.threads.net/v1.0/${parentPostId}?fields=permalink&access_token=${token}`);
      const permalinkData = await permalinkRes.json();
      if (permalinkData.permalink) {
        permalink = permalinkData.permalink;
      }
    } catch (e) {}

    return {
      success: true,
      productName,
      imageUrl: selectedImage,
      postText,
      replyText,
      postId: parentPostId,
      replyId: replyPostId,
      permalink,
      message: `🎉 쿠팡 핫딜 스레드 포스팅이 성공적으로 발행되었습니다!`
    };

  } catch (error: any) {
    console.error('Failed to publish Coupang deal to Threads:', error);
    return { success: false, error: error.message };
  }
}

