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
    logs.push(`🌐 [1단계] 쿠팡 링크 정밀 분석 및 리다이렉트 추적 중...`);
    console.log('[CoupangToThreads] Fetching URL:', cleanUrl);

    try {
      // 302 리다이렉트 위치 헤더 확인
      const redirectRes = await fetch(cleanUrl, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      });
      const loc = redirectRes.headers.get('location');
      if (loc) {
        redirectedUrl = loc;
        logs.push(`🔍 [리다이렉트 감지] 상세 주소 확보: ${redirectedUrl.substring(0, 50)}...`);
      }

      // 상품 페이지 직접 스크랩 시도
      const crawlRes = await fetch(redirectedUrl, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      const html = await crawlRes.text();

      // 상품명 자동 추출 (미입력 시)
      if (!productName) {
        const prodNameMatch = html.match(/"productName"\s*:\s*"([^"]+)"/i) 
          || html.match(/"title"\s*:\s*"([^"]+)"/i) 
          || html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
          || html.match(/<title>([^<]+)<\/title>/i);

        let extracted = prodNameMatch ? prodNameMatch[1] : '';
        extracted = extracted.replace(/쿠팡!\s*-\s*/g, '').replace(/ - 쿠팡!/g, '').trim();

        if (extracted && !extracted.toLowerCase().includes('access denied') && !extracted.toLowerCase().includes('coupang') && extracted !== '쿠팡!') {
          productName = extracted;
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
        }
      }
    } catch (crawlErr: any) {
      logs.push(`⚠️ 크롤링 기본 통신 예외 (${crawlErr.message}) ➔ AI 실시간 웹검색 엔진으로 전환`);
    }

    // 2. Gemini 2.5 Flash 실시간 Google Search Grounding 가동 (실제 상품 정보 & 팩트 정밀 수집)
    logs.push(`🧠 [2단계] Gemini 실시간 구글 검색 엔진 가동 (상품 스펙/혜택/가격 실시간 탐색)...`);
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    const searchPrompt = `
당신은 대한민국 최고의 '핫딜 & 트렌드 전문 바이럴 마케터'입니다.
다음 쿠팡 핫딜 링크 및 상세 URL을 실시간 웹 검색하여 어떤 상품인지 구체적인 정보(정확한 상품명, 패키지 구성, 핵심 혜택, 숙소/상품 특징, 가격 메리트, 실제 고화질 이미지 URL 등)를 찾아낸 뒤, 스레드(Threads)에서 수만 조회수가 터지는 논리적인 B급 팩폭 카피를 작성하세요.

[링크 정보]
- 쿠팡 단축 링크: ${cleanUrl}
- 상세 리다이렉트 URL: ${redirectedUrl}
- 기존 상품명 힌트: "${productName || '미확인'}"
- 추가 메모: "${productDetails || '없음'}"

[요구사항 및 작성 규칙 - 반드시 준수]
1. 웹 검색을 통해 해당 쿠팡 링크의 실제 정확한 상품명(예: 소노벨 단양 올인원 패키지 특가 등)과 구체적인 혜택(조식 뷔페 포함 여부, 워터파크 오션플레이, 객실 리모델링 등)을 정확히 파악하세요.
2. 만약 쿠팡 CDN이나 해당 상품의 공개 이미지 URL을 찾을 수 있다면 첫 줄에 "[IMAGE_URL: 이미지주소]" 형태로 표기하세요.
3. 첫 줄에 "[PRODUCT_NAME: 정확한상품명]" 형태로 상품명을 표기하세요.
4. **본문 작성 규칙**:
   - **첫 문장 (현실 비교 훅)**: 소비자가 일상에서 겪는 비효율/돈 낭비를 콕 짚으며 시작 (예: "주말에 1박 20만원 넘게 주고 숙소 가느니, 워터파크+조식까지 다 묶어서 이 가격이면 왜 무조건 이득인지 팩트만 까봄 ㄷㄷ")
   - **논리적인 3단 팩트 분해**:
     - ① [가격 및 구성 팩폭]: 따로 구매할 때 비용(예: 조식 1인 39,000원, 워터파크 입장료 등)과 비교해 왜 이 패키지가 압도적인 혜택인지 수치로 논리적 설명
     - ② [실사용 핵심 포인트]: 100% 뽕 뽑는 실전 활용/여행 팁
     - ③ [선점 타이밍]: 왜 지금 이 링크로 사둬야 하는지 명확한 이유
   - **톤앤매너**: 찐 사용자 구어체 반말 (~했음, ~임 ㅋㅋㅋ, ~추천함!)
   - **마무리**: 반드시 **"👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!"** 로 마무리 (본문에 링크 삽입 금지)
   - **분량**: 마크다운 볼드(**) 없이 깔끔한 줄바꿈과 이모지(🔥, ㄷㄷ, ㅋㅋㅋ, 👍 등)를 섞어 3~4개 문단 (300~450자)
`;

    let postText = '';
    let aiSuccess = false;

    try {
      logs.push(`🔍 [실시간 검색] 구글 웹 인덱스에서 상품 상세 혜택 탐색 중...`);
      const searchRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const rawText = searchRes.text?.trim() || '';
      if (rawText) {
        // [IMAGE_URL: ...] 추출
        const imgMatch = rawText.match(/\[IMAGE_URL:\s*([^\]]+)\]/i);
        if (imgMatch && imgMatch[1]?.startsWith('http') && !selectedImage) {
          selectedImage = imgMatch[1].trim();
          logs.push(`📸 [이미지 자동 발견] 구글 인덱스에서 상품 고화질 이미지 추출 성공!`);
        }

        // [PRODUCT_NAME: ...] 추출
        const nameMatch = rawText.match(/\[PRODUCT_NAME:\s*([^\]]+)\]/i);
        if (nameMatch && nameMatch[1]?.trim() && (!productName || productName.includes('핫딜'))) {
          productName = nameMatch[1].trim();
          logs.push(`🏷️ [상품명 확정] 구글 검색을 통해 상품명 특정 ➔ "${productName}"`);
        }

        // 본문 정제 (특수 태그 제거 및 마크다운 볼드 정리)
        postText = rawText
          .replace(/\[IMAGE_URL:[^\]]+\]/gi, '')
          .replace(/\[PRODUCT_NAME:[^\]]+\]/gi, '')
          .replace(/\*\*/g, '')
          .trim();

        if (postText.length > 50) {
          aiSuccess = true;
          logs.push(`✅ [AI 팩폭 카피 완료] 논리적 상품 분석 완료 (${postText.length}자)`);
        }
      }
    } catch (searchErr: any) {
      logs.push(`⚠️ 실시간 검색 엔진 일시 한도 (${searchErr.message?.substring(0, 40)}...) ➔ 고효율 모델로 전환`);
    }

    // 폴백 모델
    if (!aiSuccess || !postText) {
      const fallbackModels = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const modelName of fallbackModels) {
        try {
          logs.push(`⚙️ [폴백 AI 엔진] ${modelName} 호출 중...`);
          const fallbackRes = await ai.models.generateContent({
            model: modelName,
            contents: `다음 쿠팡 핫딜 상품(${productName || cleanUrl})에 대해 가격 대비 구성 혜택과 실사용 꿀팁을 논리적으로 짚어주는 찰진 B급 스레드 반말 후기글을 3단락으로 작성해. 마지막은 "👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!"로 끝나야 함.`
          });
          if (fallbackRes.text?.trim()) {
            postText = fallbackRes.text.replace(/\*\*/g, '').trim();
            aiSuccess = true;
            logs.push(`✅ [폴백 완료] ${modelName} 카피 작성 완료`);
            break;
          }
        } catch {
          // continue
        }
      }
    }

    if (!productName || productName.toLowerCase().includes('access denied')) {
      productName = '쿠팡 역대급 초특가 핫딜 상품';
    }

    if (!selectedImage) {
      selectedImage = 'https://kkado-kkado.com/thumbnail.png';
      logs.push(`📸 [이미지] 까도까도 공식 대표 썸네일 이미지 배정`);
    } else {
      logs.push(`✅ [이미지] 고화질 대표 이미지 확정 (${selectedImage.substring(0, 50)}...)`);
    }

    if (!postText) {
      postText = `가족이나 지인들한테 추천해 주고 칭찬만 들었던 역대급 핫딜인데 이번에 쿠팡 단독 특가 제대로 떴음 ㄷㄷ🔥\n\n[${productName}]\n\n다른 곳에서 일반가로 구매하면 무조건 손해인 구성이고, 혜택 대비 가격이 너무 좋아서 재고 마감 전에 미리 챙겨두는 거 추천함 ㅋㅋㅋ 👍\n\n👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!`;
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

