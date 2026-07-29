import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || '까도까도 B급 팩폭 성향 테스트';
    const category = searchParams.get('category') || '성향테스트';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffeb3b',
            backgroundImage: 'radial-gradient(circle, #ffffff 15%, transparent 16%)',
            backgroundSize: '30px 30px',
            padding: '40px 60px',
            border: '12px solid #000000',
            fontFamily: 'sans-serif',
          }}
        >
          {/* 상단 까도까도 로고 뱃지 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#000000',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '24px',
              fontSize: '24px',
              fontWeight: 900,
              marginBottom: '28px',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
            }}
          >
            <span>🧅 KKADO KKADO</span>
            <span style={{ color: '#a3e635' }}>#{category}</span>
          </div>

          {/* 퀴즈 메인 카드 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              border: '6px solid #000000',
              boxShadow: '10px 10px 0px #000000',
              borderRadius: '28px',
              padding: '40px 32px',
              maxWidth: '900px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '40px',
                fontWeight: 900,
                color: '#000000',
                lineHeight: 1.3,
                wordBreak: 'keep-all',
              }}
            >
              "{title}"
            </div>

            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '22px',
                fontWeight: 800,
                color: '#475569',
                backgroundColor: '#f1f5f9',
                padding: '8px 20px',
                borderRadius: '16px',
                border: '2px solid #000000',
              }}
            >
              <span>양파처럼 깔수록 재미있는 팩폭 테스트 시작하기 →</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the OG image: ${e.message}`, {
      status: 500,
    });
  }
}
