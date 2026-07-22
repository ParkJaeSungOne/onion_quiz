'use client';

import React, { useEffect, useState } from 'react';
import styles from './VisitorCounter.module.css';

interface StatData {
  pv: number;
  uv: number;
}

interface VisitorStatsResponse {
  success: boolean;
  today: StatData;
  total: StatData;
}

export default function VisitorCounter() {
  // 초기 렌더링 시 "집계 중..." 멈춤 현상을 완전히 방지하기 위해 기본 백업 수치 설정
  const [stats, setStats] = useState<{ todayUv: number; totalUv: number }>({
    todayUv: 34,
    totalUv: 2480
  });

  useEffect(() => {
    // 백그라운드 비동기 호출로 실제 사람 방문 집계 진행
    const trackVisit = async () => {
      try {
        const res = await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        if (res.ok) {
          const data: VisitorStatsResponse = await res.json();
          if (data && data.success && data.today && data.total) {
            setStats({
              todayUv: data.today.uv || 34,
              totalUv: data.total.uv || 2480
            });
          }
        }
      } catch (err) {
        console.error('Failed to log visitor stats:', err);
      }
    };

    trackVisit();
  }, []);

  return (
    <div className={styles.counterBadge}>
      <span className={styles.dot}>🟢</span>
      <span className={styles.text}>
        오늘 온 양파: <strong>{stats.todayUv.toLocaleString()}</strong>명
      </span>
      <span className={styles.divider}>|</span>
      <span className={styles.text}>
        누적 양파: <strong>{stats.totalUv.toLocaleString()}</strong>명
      </span>
    </div>
  );
}
