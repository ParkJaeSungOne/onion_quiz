import React from 'react';
import OnionLogo from '@/components/OnionLogo';
import styles from './loading.module.css';

export default function QuizLoadingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loadingCard}>
        <div className={styles.logoWrapper}>
          <OnionLogo className={styles.logoIcon} />
          <div className={styles.pulseRing}></div>
        </div>
        <h2 className={styles.title}>
          🧅 껍질 까는 중...
        </h2>
        <p className={styles.desc}>
          까도까도 연구소가 회원님만을 위한 성향 테스트 질문지를 배달하고 있습니다. 잠시만 기다려 주세요!
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill}></div>
        </div>
      </div>
    </div>
  );
}
