'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div style={{
      maxWidth: '600px',
      margin: '80px auto',
      padding: '32px 20px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: '3.5px solid #000000',
      boxShadow: '7px 7px 0px #000000',
      borderRadius: '24px',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🧅💥</div>
      <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#000000', marginBottom: '12px' }}>
        앗! 양파가 껍질을 까다가 살짝 미끄러졌어요!
      </h2>
      <p style={{ fontSize: '15px', fontWeight: 700, color: '#475569', marginBottom: '28px', lineHeight: 1.5 }}>
        일시적인 데이터 통신 연결 지연일 수 있습니다. 아래 버튼을 눌러 다시 시도해 주세요!
      </p>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 900,
            color: '#000000',
            backgroundColor: '#ffeb3b',
            border: '2.5px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: '14px',
            cursor: 'pointer'
          }}
        >
          🔄 다시 시도하기
        </button>

        <Link
          href="/"
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: 900,
            color: '#000000',
            backgroundColor: '#ffffff',
            border: '2.5px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: '14px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          🏠 메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
