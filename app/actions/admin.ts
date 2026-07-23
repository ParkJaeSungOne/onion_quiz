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

    if (!shortToken.trim() || !appSecret.trim()) {
      throw new Error('단기 토큰과 앱 시크릿 코드를 모두 입력해 주세요.');
    }

    const url = `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret.trim()}&access_token=${shortToken.trim()}`;
    console.log('Exchanging Threads short token for long token...');
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`메타 서버 응답 해석 실패 (HTTP ${res.status}): ${text}`);
    }

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
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
