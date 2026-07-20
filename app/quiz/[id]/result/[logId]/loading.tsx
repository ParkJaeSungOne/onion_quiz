import React from 'react';
import OnionLogo from '@/components/OnionLogo';
import styles from './loading.module.css';

export default function ResultLoadingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        <div className={styles.logoWrapper}>
          <OnionLogo className={styles.logoIcon} />
          <div className={styles.pulseRing}></div>
        </div>
        <h2 className={styles.title}>
          🧅 팩폭 보고서 분석 중...
        </h2>
        <p className={styles.desc}>
          까도까도 연구소가 귀하의 답변에 대한 뼈 때리는 결과와 찰떡 짝꿍 리포트를 불러오고 있습니다. 잠시만 기다려 주세요!
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
    </div>
  );
}
