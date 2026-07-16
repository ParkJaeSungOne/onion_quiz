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
      
      {/* 
        [실제 광고 삽입 가이드]
        1. Google AdSense를 사용하는 경우:
            아래 주석을 풀고 client와 slot 번호를 기입하십시오.
           <ins className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot={slotId || "XXXXXXXXXX"}
                data-ad-format="auto"
                data-full-width-responsive="true"></ins>

        2. 쿠팡 파트너스 배너를 사용하는 경우:
           아래와 같이 iframe 혹은 script 형태의 파트너스 코드를 삽입하십시오.
           <iframe src="https://coupa.ng/..." width="100%" height="90" frameborder="0" scrolling="no"></iframe>
      */}

      <div className={styles.adPlaceholderContent}>
        <p className={styles.adPlaceholderTitle}>공감되는 퀴즈였다면?</p>
        <p className={styles.adPlaceholderDesc}>여기에 구글 애드센스 또는 쿠팡 파트너스 광고가 노출됩니다.</p>
      </div>
    </div>
  );
}
