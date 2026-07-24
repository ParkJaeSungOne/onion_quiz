import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getKstDateAndStart } from '@/lib/kst';

// 봇(크롤러, 서칭 로봇) 필터용 정규식
const BOT_REGEX = /bot|crawler|spider|crawling|yeti|daum|google|naver|yahoo|bing|lighthouse|facebookexternalhit|whatsapp|slack|telegram/i;

function isBot(userAgent: string): boolean {
  return BOT_REGEX.test(userAgent);
}

export async function POST(req: NextRequest) {
  try {
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const { todayKst } = getKstDateAndStart();

    // 1. 봇 트래픽 제외 (실제 사람만 집계)
    if (isBot(userAgent)) {
      const todayStats = await prisma.visitorStats.findUnique({
        where: { date: todayKst }
      });
      const totals = await prisma.visitorStats.aggregate({
        _sum: { pv: true, uv: true }
      });

      return NextResponse.json({
        success: true,
        today: {
          pv: todayStats?.pv || 0,
          uv: todayStats?.uv || 0
        },
        total: {
          pv: totals._sum.pv || 0,
          uv: totals._sum.uv || 0
        }
      });
    }

    const cookieStore = await cookies();
    const isUnique = !cookieStore.has('kkado_uv_registered');

    // 2. 오늘의 PV, UV 증분 Upsert 트랜잭션 수행
    const todayStats = await prisma.visitorStats.upsert({
      where: { date: todayKst },
      update: {
        pv: { increment: 1 },
        uv: isUnique ? { increment: 1 } : undefined
      },
      create: {
        date: todayKst,
        pv: 1,
        uv: 1
      }
    });

    // 3. 역대 누적 합계(Total PV, Total UV) 집계
    const totals = await prisma.visitorStats.aggregate({
      _sum: {
        pv: true,
        uv: true
      }
    });

    const response = NextResponse.json({
      success: true,
      today: {
        pv: todayStats.pv,
        uv: todayStats.uv
      },
      total: {
        pv: totals._sum.pv || todayStats.pv,
        uv: totals._sum.uv || todayStats.uv
      }
    });

    // 4. 순 방문자(UV) 중복 방지를 위한 24시간 쿠키 세팅
    if (isUnique) {
      response.cookies.set('kkado_uv_registered', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24시간 유효
        path: '/'
      });
    }

    return response;
  } catch (error: any) {
    console.error('Visitor counting error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET: 단순히 현재 순 방문자 통계값만 즉시 조회 (쿠키 변경 없음)
 */
export async function GET() {
  try {
    const { todayKst } = getKstDateAndStart();
    const todayStats = await prisma.visitorStats.findUnique({
      where: { date: todayKst }
    });
    const totals = await prisma.visitorStats.aggregate({
      _sum: { pv: true, uv: true }
    });

    return NextResponse.json({
      success: true,
      today: {
        pv: todayStats?.pv || 0,
        uv: todayStats?.uv || 0
      },
      total: {
        pv: totals._sum.pv || 0,
        uv: totals._sum.uv || 0
      }
    });
  } catch (error: any) {
    console.error('Visitor GET error:', error);
    return NextResponse.json({
      success: false,
      today: { pv: 0, uv: 0 },
      total: { pv: 0, uv: 0 }
    }, { status: 500 });
  }
}
