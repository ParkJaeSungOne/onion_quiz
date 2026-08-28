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
    // 1년 동안 유효한 세션 쿠키 설정 (로그인 상태 영구 유지)
    cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
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
export async function publishCoupangDealToThreads(
  coupangUrl: string, 
  customProductName?: string,
  customImageUrl?: string,
  customDetails?: string
) {
  const logs: string[] = [];
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

    let productName = customProductName?.trim() || '';
    let selectedImage = customImageUrl?.trim() || '';
    let productDetails = customDetails?.trim() || '';
    let redirectedUrl = cleanUrl;

    // 1. 쿠팡 리다이렉트 및 메타데이터 추적
    logs.push(`🌐 [1단계] 쿠팡 링크 정밀 크롤링 및 리다이렉트 추적 중...`);
    console.log('[CoupangToThreads] Fetching URL:', cleanUrl);

    try {
      // 302 리다이렉트 위치 헤더 확인
      const redirectRes = await fetch(cleanUrl, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const loc = redirectRes.headers.get('location');
      if (loc) {
        redirectedUrl = loc;
        logs.push(`🔍 [리다이렉트 감지] 대상 주소: ${redirectedUrl.substring(0, 55)}...`);
      }

      // 모바일 여행 주소(/m/tp/products/)일 경우 데스크톱(/tp/products/)으로 정규화하여 100% 풀 HTML 크롤링
      let targetFetchUrl = redirectedUrl;
      if (targetFetchUrl.includes('/m/tp/products/')) {
        targetFetchUrl = targetFetchUrl.replace('/m/tp/products/', '/tp/products/');
      }

      // 상품 페이지 직접 스크랩 (Chrome 헤더로 WAF 통과)
      const crawlRes = await fetch(targetFetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
        }
      });

      const html = await crawlRes.text();

      // 상품명 자동 추출 (미입력 시)
      if (!productName) {
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
        const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        const prodNameMatch = html.match(/"productName"\s*:\s*"([^"]+)"/i) 
          || html.match(/"title"\s*:\s*"([^"]+)"/i)
          || html.match(/"itemTitle"\s*:\s*"([^"]+)"/i);

        let extracted = '';
        if (ogTitleMatch && !ogTitleMatch[1].includes('COUPANG') && !ogTitleMatch[1].toLowerCase().includes('access denied')) {
          extracted = ogTitleMatch[1];
        } else if (ogDescMatch && !ogDescMatch[1].toLowerCase().includes('access denied')) {
          extracted = ogDescMatch[1];
        } else if (prodNameMatch) {
          extracted = prodNameMatch[1];
        }

        extracted = extracted
          .replace(/^쿠팡!\s*\|\s*/g, '')
          .replace(/^쿠팡!\s*-\s*/g, '')
          .replace(/\s*-\s*쿠팡!$/g, '')
          .replace(/\s*\|\s*쿠팡!$/g, '')
          .trim();

        if (extracted && !extracted.toLowerCase().includes('access denied') && extracted !== '쿠팡!' && extracted !== 'COUPANG') {
          productName = extracted;
          logs.push(`📦 [HTML 크롤링 성공] 상품명 ➔ "${productName}"`);
        }
      }

      // 대표 이미지 자동 추출 (미입력 시)
      if (!selectedImage) {
        const imgMatches = html.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
        const validImg = imgMatches.find(url => 
          (url.includes('travelSeller') || url.includes('thumbnail.coupangcdn.com') || url.includes('image.coupangcdn.com') || url.includes('img1a.coupangcdn.com')) 
          && !url.includes('img_fb') 
          && !url.includes('icons') 
          && !url.includes('static/media')
        );
        if (validImg) {
          selectedImage = validImg;
          logs.push(`📸 [이미지 크롤링 성공] ${selectedImage.substring(0, 50)}...`);
        }
      }
    } catch (crawlErr: any) {
      logs.push(`⚠️ 크롤링 기본 통신 예외 (${crawlErr.message}) ➔ AI 정밀 분석으로 전환`);
    }

    // 상품명이 비어있을 경우 안전한 기본값 배정
    if (!productName || productName.toLowerCase().includes('access denied') || productName === '쿠팡!' || productName === 'COUPANG' || productName.trim().length < 2) {
      if (productDetails) {
        productName = productDetails.split(',')[0].trim();
      } else if (redirectedUrl.includes('trip.coupang.com')) {
        productName = '쿠팡 트래블 단독 특가 여행/숙박 패키지';
      } else {
        productName = '쿠팡 역대급 초특가 핫딜 상품';
      }
      logs.push(`⚠️ 상품명 자동 크롤링 제한 ➔ 기본 상품명("${productName}")으로 보정`);
    } else {
      logs.push(`📦 [상품명 확정] "${productName}"`);
    }

    // 2. Gemini AI 고품질 팩폭 바이럴 카피라이팅 엔진 가동
    logs.push(`🧠 [2단계] Gemini AI 팩폭 바이럴 카피라이팅 가동 (상품명: "${productName}")...`);
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    const viralPrompt = `
당신은 대한민국 최고의 '핫딜 & 트렌드 전문 바이럴 마케터'입니다.
다음 쿠팡 핫딜 상품에 대해 스레드(Threads)에서 수만 조회수와 폭발적인 공유/저장을 이끌어내는 최고의 B급 팩폭 카피를 작성하세요.

[상품 및 딜 정보]
- 상품명: "${productName}"
- 링크: "${cleanUrl}"
- 추가 혜택 메모: "${productDetails || '가성비 최우수, 한정 특가, 실사용 만족도 최상'}"

[작성 규칙 - 반드시 준수]
1. **첫 문장 (현실 비교 훅)**: 소비자가 일상에서 겪는 비효율/돈 낭비/고생을 콕 짚으며 시작하세요.
   (예: "남들 땡볕에서 2시간 줄 서서 어트랙션 하나 탈 때, 7시 반에 들어가서 인기 슬라이드 3개 연속 조지는 법 알려줌 ㄷㄷ", "호텔 1박 20만원 넘게 주고 숙소 가느니, 워터파크+조식까지 다 묶어서 이 가격이면 왜 무조건 이득인지 팩트만 까봄 ㄷㄷ")
2. **본문 (논리적인 3단 팩트 분해)**:
   - ① [핵심 혜택/구성 팩폭]: 이 상품("${productName}")의 핵심 혜택과 구성이 왜 사기적인지 구체적으로 명시.
   - ② [실사용/가성비 포인트]: 다른 사람들 고생할 때 체력과 시간을 아끼며 100% 뽕 뽑는 실전 꿀팁.
   - ③ [선점 타이밍]: 왜 지금 이 링크로 사두거나 일정을 잡아야 하는지 명확한 이유 제시.
3. **톤앤매너**:
   - 솔직하고 쿨한 찐사용자 반말체 ("~했음", "~임 ㅋㅋㅋ", "~인 거 알지?", "~추천함!").
   - 과장된 광고 티 내지 말고, 아는 사람만 챙겨 먹는 '알짜배기 꿀팁 공유' 느낌.
4. **마무리**:
   - 본문에는 링크를 넣지 말고, 반드시 **"👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!"** 로 마무리.
5. **분량 & 포맷**:
   - 마크다운 볼드(**), 제목(#), 따옴표 없이 자연스러운 줄바꿈과 이모지(🔥, ㄷㄷ, ㅋㅋㅋ, 👍, ✈️ 등)를 적절히 섞어 딱 3~4문단(공백 포함 280~400자).
`;

    let postText = '';
    let aiSuccess = false;
    const modelsToTry = [
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-latest'
    ];

    for (const modelName of modelsToTry) {
      try {
        logs.push(`⚙️ [AI 엔진] ${modelName} 모델로 팩폭 분석 중...`);
        const aiRes = await ai.models.generateContent({
          model: modelName,
          contents: viralPrompt
        });

        let candidateText = aiRes.text?.trim() || '';
        if (!candidateText && aiRes.candidates && aiRes.candidates[0]?.content?.parts) {
          candidateText = aiRes.candidates[0].content.parts
            .map((p: any) => p.text || '')
            .filter(Boolean)
            .join('\n')
            .trim();
        }

        if (candidateText && candidateText.length > 50) {
          postText = candidateText.replace(/\*\*/g, '').trim();
          aiSuccess = true;
          logs.push(`✅ [AI 완료] ${modelName} 모델로 고품질 팩폭 카피 작성 완료 (${postText.length}자)`);
          break;
        }
      } catch (aiErr: any) {
        logs.push(`⚠️ [${modelName}] ${aiErr?.status || '예외'} (${aiErr.message?.substring(0, 30)}...) ➔ 다음 모델로 전환`);
      }
    }

    // 🚫 품질 검증 게이트: viralPrompt 기준에 맞는 고품질 카피가 완성되지 않았으면 스레드 발행 즉시 중단!
    if (!aiSuccess || !postText || postText.length < 120) {
      logs.push(`❌ [발행 중단] viralPrompt 기준에 부합하는 고품질 AI 팩폭 카피가 생성되지 않아 스레드 발행을 즉시 중지했습니다.`);
      throw new Error(
        `[스레드 자동 발행 중단 리포트]\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `❌ 사유: viralPrompt 품질 기준 미달 (구체적 상품 분석 카피 생성 실패)\n` +
        `🔗 입력 URL: ${cleanUrl}\n` +
        `🔍 리다이렉트 URL: ${redirectedUrl}\n` +
        `📦 추출된 상품명: "${productName || '미확인'}"\n` +
        `📝 생성 시도 텍스트 길이: ${postText ? postText.length : 0}자 (최소 120자 이상 필수)\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 원인 분석:\n` +
        `쿠팡 WAF 방화벽으로 인해 상품명이 정상 추출되지 않았거나 AI 카피 생성이 누락되었습니다.\n\n` +
        `👉 해결 방법:\n` +
        `관리자 화면의 '🏷️ 상품명 / 키워드' 입력칸에 정확한 상품명(예: 오션월드 얼리파크인 종일권 / 소노벨 단양 패키지)을 입력하신 후 다시 발행 버튼을 눌러주세요.`
      );
    }

    if (!selectedImage) {
      selectedImage = 'https://kkado-kkado.com/thumbnail.png';
      logs.push(`📸 [이미지] 까도까도 공식 대표 썸네일 이미지 배정`);
    } else {
      logs.push(`✅ [이미지] 고화질 대표 이미지 확정 (${selectedImage.substring(0, 50)}...)`);
    }

    const replyText = `🛒 [${productName.substring(0, 30)}] 특가 보러가기 👇\n${cleanUrl}\n\n(이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.)`;

    // 3. Threads API 포스팅 실행
    logs.push(`📱 [4단계] Meta Threads Graph API 미디어 발행 시작...`);
    const { getThreadsToken } = await import('@/lib/threadsToken');
    const token = await getThreadsToken();
    if (!token) {
      throw new Error('THREADS_ACCESS_TOKEN이 설정되어 있지 않습니다.');
    }

    // Step A: Create Media Container (3단계 안전 폴백 탑재)
    logs.push(`🖼️ Step A: 이미지 미디어 컨테이너 생성 요청...`);
    let containerData: any = {};
    let finalImageUrl = selectedImage;

    // 1차 시도: 사용자가 입력/추출된 이미지 URL
    if (finalImageUrl) {
      const containerUrl = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(finalImageUrl)}&text=${encodeURIComponent(postText)}&access_token=${token}`;
      const containerRes = await fetch(containerUrl, { method: 'POST' });
      containerData = await containerRes.json();
    }

    // 2차 시도: 이미지 실패 시 (Meta OAuthException 1 등) -> 안정적인 정적 썸네일 PNG로 재시도
    if (!containerData.id && finalImageUrl !== 'https://kkado-kkado.com/thumbnail.png') {
      logs.push(`⚠️ 외부 이미지 Meta 크롤링 실패 ➔ 안정적인 대표 썸네일로 자동 전환 재시도`);
      finalImageUrl = 'https://kkado-kkado.com/thumbnail.png';
      const containerUrl = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(finalImageUrl)}&text=${encodeURIComponent(postText)}&access_token=${token}`;
      const containerRes = await fetch(containerUrl, { method: 'POST' });
      containerData = await containerRes.json();
    }

    // 3차 시도: 이미지 컨테이너가 계속 실패할 경우 -> 텍스트 전용 포스트로 안전 발행
    if (!containerData.id) {
      logs.push(`⚠️ 이미지 포스팅 실패 ➔ 텍스트 전용 포스트 모드로 안전 전환`);
      const containerUrl = `https://graph.threads.net/v1.0/me/threads?media_type=TEXT&text=${encodeURIComponent(postText)}&access_token=${token}`;
      const containerRes = await fetch(containerUrl, { method: 'POST' });
      containerData = await containerRes.json();
    }

    if (!containerData.id) {
      throw new Error('스레드 미디어 생성 실패: ' + JSON.stringify(containerData));
    }
    logs.push(`✅ Step A 완료 (Container ID: ${containerData.id})`);

    // Step B: Wait for container to be FINISHED
    logs.push(`⏳ Step B: Meta 서버 미디어 인코딩 대기 중...`);
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(`https://graph.threads.net/v1.0/${containerData.id}?fields=status&access_token=${token}`);
      const statusData = await statusRes.json();
      if (statusData.status === 'FINISHED') {
        logs.push(`✅ Step B 완료 (미디어 인코딩 FINISHED)`);
        break;
      }
    }

    // Step C: Publish Media Container
    logs.push(`🚀 Step C: 스레드 피드 본문 공식 발행 중...`);
    const pubUrl = `https://graph.threads.net/v1.0/me/threads_publish?creation_id=${containerData.id}&access_token=${token}`;
    const pubRes = await fetch(pubUrl, { method: 'POST' });
    const pubData = await pubRes.json();

    if (!pubData.id) {
      throw new Error('스레드 본문 발행 실패: ' + JSON.stringify(pubData));
    }

    const parentPostId = pubData.id;
    logs.push(`✅ Step C 완료! 본문 게시물 ID: ${parentPostId}`);

    // Step D: Publish First Reply Comment
    logs.push(`💬 Step D: 첫 댓글(쿠팡 파트너스 링크 & 공정위 문구) 등록 중...`);
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
      logs.push(`✅ Step D 완료! 댓글 게시물 ID: ${replyPostId}`);
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
    logs.push(`🎉 5단계 완료: 스레드 실시간 게시물 링크 생성됨 ➔ ${permalink}`);

    return {
      success: true,
      productName,
      imageUrl: selectedImage,
      postText,
      replyText,
      postId: parentPostId,
      replyId: replyPostId,
      permalink,
      logs,
      message: `🎉 쿠팡 핫딜 스레드 포스팅이 성공적으로 발행되었습니다!`
    };

  } catch (error: any) {
    logs.push(`❌ 에러 발생: ${error.message}`);
    console.error('Failed to publish Coupang deal to Threads:', error);
    return { success: false, error: error.message, logs };
  }
}

