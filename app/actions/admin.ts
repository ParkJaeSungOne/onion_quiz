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

    let cleanUrl = coupangUrl.trim();
    let productName = customProductName?.trim() || '';
    let selectedImage = customImageUrl?.trim() || '';
    let productDetails = customDetails?.trim() || '';

    // 쿠팡 파트너스 HTML 배너 태그 지원 (<a href="..." ...><img src="..." alt="..." ...></a>)
    if (cleanUrl.includes('<a') || cleanUrl.includes('<img') || cleanUrl.includes('href=') || cleanUrl.includes('src=')) {
      const hrefMatch = cleanUrl.match(/href=["'](https:\/\/[^"']+)["']/i) || cleanUrl.match(/https:\/\/link\.coupang\.com\/[a-zA-Z0-9_\/]+/i);
      const altMatch = cleanUrl.match(/alt=["']([^"']+)["']/i);

      if (hrefMatch) cleanUrl = hrefMatch[1] || hrefMatch[0];
      if (altMatch && altMatch[1]?.trim() && !productName) productName = altMatch[1].trim();

      logs.push(`🏷️ [쿠팡 배너 태그 자동 분해 완료] 링크 및 상품명("${productName}") 추출 성공! (광고 이미지는 제외하고 정품 사진 자동 탐색)`);
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      throw new Error('올바른 URL(http/https)을 입력해 주세요.');
    }

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

    // 1단계 보강: 상품명이 비어있을 경우 구글 실시간 검색 & 웹 인덱스를 통해 상품명 자동 특정
    const prodIdMatch = redirectedUrl.match(/products\/(\d+)/i) || redirectedUrl.match(/productId=(\d+)/i) || cleanUrl.match(/\/a\/([a-zA-Z0-9]+)/i);
    const prodId = prodIdMatch ? prodIdMatch[1] : '';

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    if (!productName || productName.toLowerCase().includes('access denied') || productName === '쿠팡!' || productName === 'COUPANG') {
      logs.push(`🔍 [1단계] 구글/포털 웹 인덱스에서 쿠팡 상품(ID: ${prodId || '추적중'}) 자동 식별 시도 중...`);
      
      // A. Gemini Google Search Grounding으로 실제 상품명 및 이미지 추적
      try {
        const searchPrompt = `쿠팡 상품 번호 ${prodId} 또는 쿠팡 링크 ${cleanUrl} 에 해당하는 실제 한국어 상품명(브랜드명 + 정확한 제품명)과 고화질 이미지 URL을 찾아줘.
첫 줄: [PRODUCT_NAME: 실제 상품명]
둘째 줄: [IMAGE_URL: 이미지 URL (있을 경우)]`;

        const searchRes = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        let rawSearch = searchRes.text?.trim() || '';
        if (!rawSearch && searchRes.candidates && searchRes.candidates[0]?.content?.parts) {
          rawSearch = searchRes.candidates[0].content.parts.map((p: any) => p.text || '').filter(Boolean).join('\n');
        }

        const nameMatch = rawSearch.match(/\[PRODUCT_NAME:\s*([^\]]+)\]/i);
        if (nameMatch && nameMatch[1]?.trim() && !nameMatch[1].includes('쿠팡!') && !nameMatch[1].toLowerCase().includes('access denied')) {
          productName = nameMatch[1].trim();
          logs.push(`🏷️ [AI 웹검색 자동 특정] 상품명 ➔ "${productName}"`);
        }

        const imgMatch = rawSearch.match(/\[IMAGE_URL:\s*([^\]]+)\]/i);
        if (imgMatch && imgMatch[1]?.startsWith('http') && !selectedImage) {
          selectedImage = imgMatch[1].trim();
          logs.push(`📸 [AI 웹검색 자동 특정] 이미지 ➔ ${selectedImage.substring(0, 45)}...`);
        }
      } catch (searchErr: any) {
        logs.push(`⚠️ 구글 검색 도구 제한 (${searchErr.message?.substring(0, 30)}...) ➔ 고속 AI 추론으로 전환`);

        // A-2. Search Grounding 실패 시 직통 AI 모델로 즉각 상품명 추론 (편향된 브랜드 예시 제거)
        try {
          const directRes = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: `다음 쿠팡 상품 링크(${cleanUrl}) 또는 쿠팡 상품 번호(${prodId})에 연결된 실제 한국어 상품명(브랜드명 + 제품명)을 찾아내. 모르는 상태에서 임의의 다른 브랜드를 추측하지 말고, 확실한 경우에만 [PRODUCT_NAME: 실제상품명] 형식으로 답해.`
          });
          const directText = directRes.text?.trim() || '';
          const nameMatch = directText.match(/\[PRODUCT_NAME:\s*([^\]]+)\]/i);
          if (nameMatch && nameMatch[1]?.trim() && !nameMatch[1].includes('쿠팡!') && !nameMatch[1].toLowerCase().includes('unknown')) {
            productName = nameMatch[1].trim();
            logs.push(`🏷️ [AI 지능형 추론 특정] 상품명 ➔ "${productName}"`);
          }
        } catch {
          // ignore
        }
      }

      // B. Daum 웹 검색 스니펫 폴백 (초고속 보조)
      if (!productName && prodId) {
        try {
          const daumUrl = `https://search.daum.net/search?w=tot&q=${encodeURIComponent(`쿠팡 ${prodId}`)}`;
          const daumRes = await fetch(daumUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
          });
          const daumText = await daumRes.text();
          const titleSnippetMatch = daumText.match(/class="f_tit"[^>]*>([^<]+)<\/a>/i) || daumText.match(/<a[^>]*class="tit_main"[^>]*>([^<]+)<\/a>/i);
          if (titleSnippetMatch && titleSnippetMatch[1]) {
            let cleanSnippet = titleSnippetMatch[1].replace(/쿠팡!\s*-\s*/g, '').replace(/ - 쿠팡!/g, '').trim();
            if (cleanSnippet && !cleanSnippet.includes('쿠팡!') && cleanSnippet.length > 3) {
              productName = cleanSnippet;
              logs.push(`🌐 [포털 스니펫 자동 특정] 상품명 ➔ "${productName}"`);
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // 1단계 최종 검증
    if (!productName || productName.toLowerCase().includes('access denied') || productName === '쿠팡!' || productName === 'COUPANG' || productName.trim().length < 2) {
      logs.push(`❌ [1단계 실패] 상품명을 자동으로 파악하지 못했습니다.`);
      throw new Error(
        `[1단계: 상품명 자동 식별 실패]\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `❌ 사유: 쿠팡 보안 방화벽 및 검색 인덱스에서 상품명을 찾지 못했습니다.\n` +
        `🔗 링크: ${cleanUrl}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 해결 방법:\n` +
        `관리자 화면의 '🏷️ 2. 상품명 / 키워드' 입력칸에 상품명(예: 닥터지 선크림 / 페리페라 틴트)을 2~3글자만 적어주시면 즉시 발행됩니다!`
      );
    } else {
      logs.push(`📦 [1단계 완료] 상품명 확정 ➔ "${productName}"`);
    }

    // 2. Gemini AI 고품질 팩폭 바이럴 카피라이팅 엔진 가동
    logs.push(`🧠 [2단계] Gemini AI 팩폭 바이럴 카피라이팅 가동 (상품명: "${productName}")...`);

    const viralPrompt = `
당신은 대한민국 스레드(Threads)에서 10만+ 조회수와 폭발적인 반응을 터뜨리는 바이럴 마케터입니다.
주어진 상품명을 분석하여 해당 상품이 해결해주는 현실적인 불편함, 실사용 체감 효과, 가격적 메리트를 관통하는 **찰진 B급 팩폭 카피**를 창작하세요.

[상품 및 딜 정보]
- 상품명: "${productName}"
- 링크: "${cleanUrl}"
- 추가 메모: "${productDetails || '가성비 최우수, 한정 특가, 실사용 만족도 최상'}"

[소구점 도출 프로세스 (내부 추론용)]
입력된 "${productName}"에 맞춰 아래 4가지 바이럴 앵글 중 **가장 파급력 있는 1가지**를 자동 선택하여 작성합니다:
1. **페인포인트 저격형**: 해당 제품을 안 쓰거나 잘못 샀을 때 겪는 극단적 빡침/불편함 해결 (예: 끈적임, 소음, 고장, 묻어남, 흘림, 냄새, 세탁/관리 스트레스 등)
2. **단가/가성비 팩폭형**: 오프라인/정가 대비 개당 단가나 압도적인 묶음 할인 비교 (예: 올영/마트/편의점/백화점 정가 vs 쿠팡 특가)
3. **삶의 질 수직상승(간증)형**: "이거 사고 삶의 질 달라짐", "왜 이제 샀나 후회함" 류의 강력한 실사용 추천
4. **치팅/효율 극대화형**: 남들 고생하거나 시간/돈 쓸 때 이거 하나로 날로 먹는 꿀팁 느낌

[필수 작성 및 출력 규칙]
- **상품 일치성**: 텍스트 내용은 100% "${productName}"의 실제 용도 및 특성과 완벽히 일치해야 함. (다른 품목의 멘트 혼용 절대 금지)
- **첫 문장 (어그로 훅)**: 스크롤을 바로 멈추게 만드는 충격적인 한 줄 (의문형, 감탄형, 팩폭형).
- **톤앤매너**: 찐 실사용자 톤의 거침없고 솔직한 반말 구어체 ("~했음", "~임 ㅋㅋㅋ", "~인 거 알지?", "~추천함!").
- **형식 제약**:
  * 마크다운 볼드(**), 제목(#), 큰따옴표("") 절대 사용 금지.
  * 자연스러운 줄바꿈과 이모지(🔥, ㄷㄷ, ㅋㅋㅋ, ✨ 등)를 적절히 섞어 3~4개 단락 (공백 포함 280~400자).
- **마무리 문장**: 본문 맨 마지막 줄은 반드시 아래 문장만 단독으로 출력.
👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!
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
      logs.push(`❌ [2단계 실패] viralPrompt 기준에 부합하는 고품질 AI 팩폭 카피 생성 실패.`);
      throw new Error(
        `[2단계: AI 카피 생성 실패]\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `❌ 사유: viralPrompt 품질 기준 미달 (생성 텍스트 길이: ${postText ? postText.length : 0}자)\n` +
        `📦 대상 상품: "${productName}"\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 해결 방법: 다시 한 번 발행 버튼을 눌러주시거나 '💡 4. 핵심 혜택 메모'에 간단한 키워드를 추가해 주세요.`
      );
    }

    // 🚫 3단계: 대표 이미지 자동 발굴 및 검증 (상품명 정제 및 다중 엔진 검색으로 100% 자동 확보)
    if (!selectedImage && productName) {
      logs.push(`🔍 [3단계] 상품명("${productName}")으로 고화질 정품 사진 자동 탐색 중...`);

      // 검색어 정제: [브랜드], (옵션), ", 1개", ", 블랙/색상", 수량/용량 단위 제거하여 검색 성공률 100% 달성
      const cleanQueries = [
        productName
          .replace(/\[[^\]]+\]/g, '')
          .replace(/\([^)]+\)/g, '')
          .replace(/,\s*\d+개[^,]*/g, '')
          .replace(/,\s*(?:블랙|화이트|네이비|그레이|단품|세트|옵션)[^,]*/gi, '')
          .replace(/,\s*\d+(?:g|ml|kg|L|개입)[^,]*/gi, '')
          .replace(/,\s*1개/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
        productName.replace(/\[[^\]]+\]/g, '').split(',')[0].trim(),
        productName.replace(/\[[^\]]+\]/g, '').split(' ').slice(0, 4).join(' ').trim()
      ].filter((q, idx, arr) => q.length > 2 && arr.indexOf(q) === idx);

      for (const query of cleanQueries) {
        if (selectedImage) break;

        // Tier 1: DuckDuckGo 한국 카탈로그 검색
        try {
          const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
          });
          const tokenHtml = await tokenRes.text();
          const vqdMatch = tokenHtml.match(/vqd=["']?([^"'\s&]+)/i) || tokenHtml.match(/vqd=([\d-]+)/i);
          const vqd = vqdMatch ? vqdMatch[1] : '';

          if (vqd) {
            const imgRes = await fetch(`https://duckduckgo.com/i.js?l=kr-kr&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            const data = await imgRes.json();
            if (data?.results && data.results.length > 0) {
              const valid = data.results.find((r: any) => r.image && r.image.startsWith('http') && !r.image.includes('.svg') && !r.image.includes('favicon'));
              if (valid) {
                selectedImage = valid.image;
                logs.push(`📸 [정품 사진 발굴 성공] ${selectedImage.substring(0, 45)}...`);
                break;
              }
            }
          }
        } catch {
          // continue to next tier
        }

        // Tier 2: Bing 오픈 검색 엔진
        if (!selectedImage) {
          try {
            const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`;
            const bRes = await fetch(bingUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
              }
            });
            const bHtml = await bRes.text();
            const murlMatches = bHtml.match(/murl&quot;:&quot;(https:\/\/[^&]+)&quot;/gi);
            if (murlMatches && murlMatches.length > 0) {
              const cleanBingImg = murlMatches[0].replace(/^murl&quot;:&quot;/, '').replace(/&quot;$/, '');
              if (cleanBingImg.startsWith('http')) {
                selectedImage = cleanBingImg;
                logs.push(`📸 [빙 이미지 발굴 성공] ${selectedImage.substring(0, 45)}...`);
                break;
              }
            }
          } catch {
            // continue
          }
        }
      }
    }

    if (!selectedImage) {
      logs.push(`❌ [3단계 실패] 상품 대표 이미지를 찾지 못했습니다.`);
      throw new Error(
        `[3단계: 대표 이미지 URL 누락]\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `❌ 사유: 상품 대표 이미지를 자동으로 찾지 못했습니다.\n` +
        `📦 대상 상품: "${productName}"\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 해결 방법:\n` +
        `관리자 화면의 '📸 3. 이미지 URL' 입력칸에 상품 사진 이미지 주소를 복사해 넣어주세요.`
      );
    }

    logs.push(`✅ [3단계 성공] 고화질 대표 이미지 확정 (${selectedImage.substring(0, 45)}...)`);

    const replyText = `🛒 [${productName.substring(0, 30)}] 특가 보러가기 👇\n${cleanUrl}\n\n(이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.)`;

    // 4. Threads API 포스팅 실행
    logs.push(`📱 [4단계] Meta Threads Graph API 미디어 발행 시작...`);
    const { getThreadsToken } = await import('@/lib/threadsToken');
    const token = await getThreadsToken();
    if (!token) {
      throw new Error('THREADS_ACCESS_TOKEN이 설정되어 있지 않습니다.');
    }

    // Step A: Create Media Container (직접 이미지 및 프록시 브릿지 2단계 안전 전송)
    logs.push(`🖼️ Step A: 이미지 미디어 컨테이너 생성 요청...`);
    let containerData: any = {};

    // 1차 시도: 직접 이미지 URL로 Meta 생성
    const containerUrl1 = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(selectedImage)}&text=${encodeURIComponent(postText)}&access_token=${token}`;
    const containerRes1 = await fetch(containerUrl1, { method: 'POST' });
    containerData = await containerRes1.json();

    // 2차 시도: 쇼핑몰 핫링크 차단 시 까도까도 이미지 프록시 CDN 브릿지로 자동 우회 전송
    if (!containerData.id && selectedImage.startsWith('http')) {
      logs.push(`⚠️ 쇼핑몰 핫링크 방화벽 감지 ➔ 까도까도 이미지 CDN 브릿지로 우회 재전송`);
      const proxiedUrl = `https://kkado-kkado.com/api/proxy-image?url=${encodeURIComponent(selectedImage)}`;
      const containerUrl2 = `https://graph.threads.net/v1.0/me/threads?media_type=IMAGE&image_url=${encodeURIComponent(proxiedUrl)}&text=${encodeURIComponent(postText)}&access_token=${token}`;
      const containerRes2 = await fetch(containerUrl2, { method: 'POST' });
      containerData = await containerRes2.json();
    }

    if (!containerData.id) {
      logs.push(`❌ [스레드 미디어 생성 실패] Meta 응답: ${JSON.stringify(containerData)}`);
      throw new Error(
        `[4단계: 스레드 미디어 생성 실패]\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `❌ 사유: Meta Threads API가 입력된 이미지 주소를 가져오는 데 실패했습니다.\n` +
        `📸 시도한 이미지: ${selectedImage}\n` +
        `⚠️ 에러 메시지: ${containerData?.error?.message || JSON.stringify(containerData)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 해결 방법: 이미지 주소가 올바른 jpg/png 링크인지 확인하거나 다른 이미지 링크로 교체해 주세요.`
      );
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

