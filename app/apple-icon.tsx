import { ImageResponse } from 'next/og';

// 애플 터치 아이콘 규격 정의 (180x180)
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: '#fef08a', // 네오브루탈리즘 옐로우 배경
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40, // 스마트폰 앱 형태의 라운딩
          border: '10px solid #000000', // 두꺼운 검정 테두리
        }}
      >
        🧅
      </div>
    ),
    {
      ...size,
    }
  );
}
