'use client';

import React, { useEffect } from 'react';
import styles from './AdSlot.module.css';

interface AdSlotProps {
  type: 'main' | 'quiz' | 'result';
  slotId?: string; // 애드센스 slot id 등
}

export default function AdSlot({ type, slotId }: AdSlotProps) {
  useEffect(() => {
    // 애드센스 스크립트가 로드되었을 경우 광고를 푸시하는 로직
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
        }
      }
    } catch (e) {
      console.error('AdSense push error:', e);
    }
  }, []);

  // 디자인 규격 정의
  const getLayoutClass = () => {
    switch (type) {
      case 'main':
        return styles.mainAd;
      case 'quiz':
        return styles.quizAd;
      case 'result':
        return styles.resultAd;
      default:
        return styles.defaultAd;
    }
  };

  // 실서비스 시 사용자가 여기에 애드센스 코드(<ins> 태그)를 직접 넣거나 
  // 쿠팡 파트너스 iframe 코드를 넣을 수 있도록 가이드 제공.
  // 기본적으로는 세련된 프리미엄 플레이스홀더를 보여주어 사이트 디자인을 깨지 않게 합니다.
  return (
    <div className={`${styles.adContainer} ${getLayoutClass()}`}>
      <div className={styles.adBadge}>SPONSORED</div>
      
      {/* 1. 💰 Google AdSense 광고 유닛 (도메인 승인 완료 시 자동 노출) */}
      <div className={styles.adsenseWrapper}>
        <ins className="adsbygoogle"
             style={{ display: 'block', overflow: 'hidden', minHeight: '90px' }}
             data-ad-client="ca-pub-6272041920940171"
             data-ad-slot={slotId || "2973849182"}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>

      {/* 2. 🚀 쿠팡 파트너스 배너 & 최저가 검색 (AdSense 승인 대기 기간 및 수익 다각화용 백업) */}
      <div className={styles.coupangBanner}>
        <a 
          href={process.env.NEXT_PUBLIC_COUPANG_URL || "https://link.coupang.com/a/bS8E1p"} 
          target="_blank" 
          rel="nofollow noopener noreferrer" 
          className={styles.coupangLink}
        >
          <div className={styles.coupangFlex}>
            <span className={styles.coupangTag}>쿠팡 최저가 🚀</span>
            <span className={styles.coupangTitle}>🧅 양파 까다가 입 심심할 때? 로켓배송 간식 득템하러 가기 →</span>
          </div>
        </a>
        <div className={styles.coupangDisclaimer}>
          * 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </div>
      </div>
    </div>
  );
}
