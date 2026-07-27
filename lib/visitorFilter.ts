import { NextRequest } from 'next/server';

// 🤖 봇, 크론, 스크래퍼, AI 에이전트, 개발/자동화 도구 및 어드민 전면 배제 정규식
const NON_HUMAN_UA_REGEX = /bot|crawler|spider|crawling|yeti|daum|google|naver|yahoo|bing|lighthouse|facebookexternalhit|whatsapp|slack|telegram|vercel|headlesschrome|phantomjs|puppeteer|python|curl|wget|go-http-client|axios|postman|gemini|claude|chatgpt|meta-externalagent|threadsbot|cron|node-fetch|undici/i;

/**
 * 접속 요청이 순수 사람(Real Human User) 유저인지 엄격히 검증합니다.
 */
export function isPureHumanVisitor(req: NextRequest, pagePath?: string, userAgentOverride?: string): boolean {
  const ua = userAgentOverride || req.headers.get('user-agent') || '';
  const path = pagePath || req.nextUrl?.pathname || '';
  const referer = req.headers.get('referer') || '';

  // 1. 어드민 페이지 및 API 내부 경로 접속 전면 제외
  if (path.startsWith('/admin') || path.startsWith('/api')) {
    return false;
  }

  // 2. 어드민에서 유입된 경로 제외
  if (referer.includes('/admin')) {
    return false;
  }

  // 3. 어드민 세션 쿠키 소지자(어드민 본인 테스트 접속) 전면 제외
  const adminCookie = req.cookies.get('kkado_admin_session');
  if (adminCookie && adminCookie.value === 'authenticated') {
    return false;
  }

  // 4. Vercel Cron 및 GitHub Actions 자동 배치 헤더 제외
  if (req.headers.get('x-vercel-cron') === '1' || req.headers.get('x-github-actions') === '1') {
    return false;
  }

  // 5. User-Agent 봇/크론/스크립트 정규식 필터링
  if (NON_HUMAN_UA_REGEX.test(ua)) {
    return false;
  }

  return true;
}
