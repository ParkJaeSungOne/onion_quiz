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
