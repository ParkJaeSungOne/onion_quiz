'use client';

import React, { useEffect, useState } from 'react';
import styles from './QuizLoading.module.css';

interface QuizLoadingProps {
  text?: string;
  onComplete: () => void;
}

export default function QuizLoading({ text = '결과를 정밀 분석하고 있습니다...', onComplete }: QuizLoadingProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // 점 세 개 애니메이션 (...)
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    // 3.5초 후 분석 완료 처리
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loaderWrapper}>
        <div className={styles.pulseRing}></div>
        <div className={styles.spinner}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <h2 className={styles.loadingText}>
        {text}
        <span className={styles.dotSpan}>{dots}</span>
      </h2>
      <p className={styles.loadingSubText}>잠시만 기다려주시면 맞춤형 결과를 불러옵니다.</p>
    </div>
  );
}
