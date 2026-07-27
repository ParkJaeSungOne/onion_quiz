import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getKstDateAndStart } from '@/lib/kst';
import { isPureHumanVisitor } from '@/lib/visitorFilter';

export async function POST(req: NextRequest) {
  try {
    const { todayKst } = getKstDateAndStart();

    // 🛡️ 1. 봇, 크론, 스크립트, 어드민 트래픽 전면 제외 (순수 사람만 집계)
    if (!isPureHumanVisitor(req)) {
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
