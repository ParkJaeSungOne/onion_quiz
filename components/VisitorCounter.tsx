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
  const [stats, setStats] = useState<{ todayUv: number; totalUv: number } | null>(null);

  useEffect(() => {
    // 백그라운드 비동기 호출로 봇을 필터링해 실제 방문 카운팅을 진행하고 통계값 수령
    const trackVisit = async () => {
      try {
        const res = await fetch('/api/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        if (res.ok) {
          const data: VisitorStatsResponse = await res.json();
          if (data.success) {
            setStats({
              todayUv: data.today.uv,
              totalUv: data.total.uv
            });
          }
        }
      } catch (err) {
        console.error('Failed to log visitor stats:', err);
      }
    };

    trackVisit();
  }, []);

  if (!stats) {
    return <div className={styles.loaderPlaceholder}>📊 방문자 집계 중...</div>;
  }

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
