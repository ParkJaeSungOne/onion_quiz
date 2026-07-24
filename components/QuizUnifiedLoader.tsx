import React from 'react';

interface QuizUnifiedLoaderProps {
  title?: string;
  subtitle?: string;
}

export default function QuizUnifiedLoader({
  title = "🔮 까도까도 팩폭 테스트 로딩 중...",
  subtitle = "양파 껍질을 적나라하게 까는 중입니다! 잠시만 기다려 주세요 ⚡"
}: QuizUnifiedLoaderProps) {
  return (
    <div style={{ 
      minHeight: '75vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div style={{
        background: '#ffffff',
        border: '3.5px solid #000000',
        boxShadow: '6px 6px 0px #000000',
        borderRadius: '24px',
        padding: '48px 24px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          fontSize: '56px', 
          display: 'inline-block', 
          animation: 'spin 1.2s infinite linear' 
        }}>
          🧅
        </div>
        
        <h2 style={{ 
          fontSize: '22px', 
          fontWeight: 950, 
          marginTop: '20px', 
          color: '#000000',
          letterSpacing: '-0.5px'
        }}>
          {title}
        </h2>
        
        <p style={{ 
          fontSize: '13.5px', 
          fontWeight: 700, 
          color: '#475569', 
          marginTop: '10px', 
          lineHeight: 1.6 
        }}>
          {subtitle}
        </p>
        
        {/* 네오브루탈리즘 애니메이티드 프로그레스 바 */}
        <div style={{ 
          marginTop: '28px', 
          background: '#f1f5f9', 
          borderRadius: '10px', 
          height: '12px', 
          overflow: 'hidden', 
          border: '2.5px solid #000000',
          position: 'relative'
        }}>
          <div style={{ 
            width: '100%', 
            background: 'var(--kitsch-lime, #a3e635)', 
            height: '100%', 
            animation: 'pulseBar 1.5s ease-in-out infinite' 
          }} />
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulseBar {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  );
}
