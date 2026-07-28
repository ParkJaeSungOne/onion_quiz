import { NextRequest } from 'next/server';

// 🤖 봇, 크론, 스크래퍼, AI 에이전트, 개발/자동화 도구 및 어드민 전면 배제 정규식
const NON_HUMAN_UA_REGEX = /bot|crawler|spider|crawling|yeti|daum|google|naver|yahoo|bing|lighthouse|facebookexternalhit|whatsapp|slack|telegram|vercel|headlesschrome|phantomjs|puppeteer|python|curl|wget|go-http-client|axios|postman|gemini|claude|chatgpt|meta-externalagent|threadsbot|cron|node-fetch|undici/i;

/**
 * 접속 요청이 순수 사람(Real Human User) 유저인지 엄격히 검증합니다.
 */
export function isPureHumanVisitor(req: NextRequest, pagePath?: string, userAgentOverride?: string): boolean {
  const ua = userAgentOverride || req.headers.get('user-agent') || '';
  const path = pagePath || req.headers.get('referer') || '';

  // 1. 어드민 페이지 경로 및 어드민 Referer 접속 전면 제외
  if (path.includes('/admin')) {
    return false;
  }

  // 2. 어드민 세션 쿠키 소지자(어드민 본인 테스트 접속) 전면 제외
  const adminCookie = req.cookies.get('kkado_admin_session');
  if (adminCookie && adminCookie.value === 'authenticated') {
    return false;
  }

  // 3. Vercel Cron 및 GitHub Actions 자동 배치 헤더 제외
  if (req.headers.get('x-vercel-cron') === '1' || req.headers.get('x-github-actions') === '1') {
    return false;
  }

  // 4. User-Agent 봇/크론/스크립트 정규식 필터링
  if (NON_HUMAN_UA_REGEX.test(ua)) {
    return false;
  }

  return true;
}

// 가볍고 고속인 User-Agent 파서 (소셜 인앱 브라우저 정밀 탐지)
export function parseUserAgent(ua: string) {
  let device = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  const uaLower = ua.toLowerCase();

  // 1. 기기 분류
  if (/mobi|android|iphone|ipad|ipod/i.test(ua)) {
    device = 'Mobile';
    if (/ipad/i.test(ua)) device = 'Tablet';
  }

  // 2. OS 분류
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // 3. 브라우저 및 인앱 브라우저 분류
  if (uaLower.includes('kakaotalk')) browser = 'KakaoTalk';
  else if (uaLower.includes('instagram')) browser = 'Instagram';
  else if (uaLower.includes('threads')) browser = 'Threads';
  else if (uaLower.includes('fbav') || uaLower.includes('fb_iab')) browser = 'Facebook';
  else if (uaLower.includes('chrome') && !uaLower.includes('edge') && !uaLower.includes('edg')) browser = 'Chrome';
  else if (uaLower.includes('safari') && !uaLower.includes('chrome')) browser = 'Safari';
  else if (uaLower.includes('firefox')) browser = 'Firefox';
  else if (uaLower.includes('edge') || uaLower.includes('edg')) browser = 'Edge';

  return { device, os, browser };
}
