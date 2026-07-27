import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isPureHumanVisitor, parseUserAgent } from '@/lib/visitorFilter';

/**
 * POST: 순수 사람 방문 유입 로그 생성 (어드민 & 봇/크론 전면 배제)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pagePath = '/', referrer = 'direct', userAgent } = body;

    const ua = userAgent || req.headers.get('user-agent') || 'unknown';

    // 🛡️ 봇, 크론, 스크립트, 어드민 트래픽 전면 제외 (순수 사람만 집계)
    if (!isPureHumanVisitor(req, pagePath, ua)) {
      return NextResponse.json({ success: true, ignored: true, reason: 'Non-human or Admin traffic excluded' });
    }

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
