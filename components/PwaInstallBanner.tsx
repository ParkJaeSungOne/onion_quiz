'use client';

import React, { useEffect, useState } from 'react';

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. 이미 홈 화면 앱(standalone) 모드로 가동 중이면 배너 표시 안 함
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // 2. 이미 사용자가 닫기 버튼을 눌러 비활성화한 상태인지 확인 (LocalStorage 지속성 체크)
    const savedDismissed = localStorage.getItem('pwa_dismissed');
    if (savedDismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // 3. 기기 환경 체크 (iOS 여부 판별)
    const userAgent = window.navigator.userAgent;
    const isApple = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    if (isApple) {
      setIsIOS(true);
      setShowBanner(true); // iOS는 beforeinstallprompt가 없으므로 즉시 가이드 배너 표시
    }

    // 4. Android/Chrome 계열의 PWA 설치 이벤트 바인딩
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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
    if (typeof window !== 'undefined') {
      // 닫기 선택 시 7일간 다시 띄우지 않도록 기록 저장
      localStorage.setItem('pwa_dismissed', 'true');
    }
  };

  if (!showBanner || isDismissed) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '440px',
      border: '3px solid #000000',
      borderRadius: '16px',
      padding: '14px 18px',
      background: '#a3e635', // kitsch-lime
      boxShadow: '4px 4px 0px #000000',
      zIndex: 99999,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <span style={{ fontSize: '22px' }}>📲</span>
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 900 }}>홈 화면에 앱 추가하기</h4>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#1f2937', lineHeight: 1.3 }}>
            {isIOS ? (
              <span>아이폰 Safari 하단의 <strong>[공유] 📤</strong> 버튼을 누른 후 <strong>'홈 화면에 추가'</strong>를 선택해 주세요!</span>
            ) : (
              <span>매일 자정 새로운 팩폭 테스트를 바로 만나요!</span>
            )}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!isIOS && (
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
        )}
        <button
          onClick={handleCloseClick}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '16px',
            fontWeight: 900,
            cursor: 'pointer',
            color: '#4b5563',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
