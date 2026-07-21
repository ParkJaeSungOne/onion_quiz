import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 가볍고 고속인 User-Agent 파서 (소셜 인앱 브라우저 정밀 탐지)
function parseUserAgent(ua: string) {
  let device = 'Desktop';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  const uaLower = ua.toLowerCase();

  // 1. 기기 분류
  if (/mobi|android|iphone|ipad|ipod/i.test(ua)) {
    device = 'Mobile';
    if (/ipad/i.test(ua)) device = 'Tablet';
  } else if (/bot|crawler|spider|lighthouse|slack|discord/i.test(ua)) {
    device = 'Bot';
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

/**
 * POST: 방문 유입 로그 생성
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pagePath, referrer, userAgent } = body;

    const ua = userAgent || req.headers.get('user-agent') || 'unknown';
    const { device, os, browser } = parseUserAgent(ua);

    // Vercel Geolocation 및 IP 헤더 파싱
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';
    
    const country = req.headers.get('x-vercel-ip-country') || 'KR';
    
    // Vercel City 한글/인코딩 깨짐 대응 (Vercel은 헤더값을 URL-encoded 형태로 줄 수도 있습니다)
    const rawCity = req.headers.get('x-vercel-ip-city') || '';
    let city = rawCity;
    try {
      if (rawCity) city = decodeURIComponent(rawCity);
    } catch {
      // 디코딩 에러 무시
    }

    const log = await prisma.visitorLog.create({
      data: {
        ip,
        userAgent: ua.substring(0, 300), // 너무 긴 UA 문자열 방지
        device,
        os,
        browser,
        referrer: referrer ? referrer.substring(0, 200) : 'direct',
        country,
        city: city || 'Unknown City',
        pagePath: pagePath || '/',
        staySeconds: 0,
      },
      select: {
        id: true
      }
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error: any) {
    console.error('Failed to create visitor log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH: 특정 로그의 체류 시간 갱신 (하트비트 및 Beacon 통신 대응)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { logId, staySeconds } = body;

    if (!logId) {
      return NextResponse.json({ success: false, error: 'logId is required' }, { status: 400 });
    }

    await prisma.visitorLog.update({
      where: { id: logId },
      data: {
        staySeconds: parseInt(staySeconds, 10) || 0
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update stay duration:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
