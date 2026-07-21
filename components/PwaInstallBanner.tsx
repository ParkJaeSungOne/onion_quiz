'use client';

import React, { useEffect, useState } from 'react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 이미 앱(standalone) 모드로 가동 중이면 배너 생략
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleCloseClick = () => {
    setIsDismissed(true);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '440px',
      border: '3px solid #000000',
      borderRadius: '16px',
      padding: '12px 16px',
      background: 'var(--kitsch-lime, #a3e635)',
      boxShadow: '4px 4px 0px #000000',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      color: '#000000',
      animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>📲</span>
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 1px 0', fontSize: '13px', fontWeight: 900 }}>홈 화면에 앱 추가하기</h4>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#1f2937' }}>
            매일 자정 새로운 팩폭 테스트를 바로 만나요!
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            padding: '6px 12px',
            fontSize: '11.5px',
            fontWeight: 900,
            backgroundColor: '#000000',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          설치
        </button>
        <button
          onClick={handleCloseClick}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '15px',
            fontWeight: 900,
            cursor: 'pointer',
            color: '#4b5563',
            padding: '2px 4px'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
