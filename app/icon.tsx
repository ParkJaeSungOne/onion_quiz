import { ImageResponse } from 'next/og';

// 파비콘 이미지 규격 정의
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 26,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
