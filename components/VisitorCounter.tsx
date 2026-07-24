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
  const [stats, setStats] = useState<{ todayUv: number; totalUv: number }>({
    todayUv: 0,
    totalUv: 0
  });
  const [loaded, setLoaded] = useState(false);

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
              todayUv: data.today.uv || 0,
              totalUv: data.total.uv || 0
            });
            setLoaded(true);
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
        오늘 온 순 양파(UV): <strong>{loaded ? stats.todayUv.toLocaleString() : '...'}</strong>명
      </span>
      <span className={styles.divider}>|</span>
      <span className={styles.text}>
        누적 순 양파(UV): <strong>{loaded ? stats.totalUv.toLocaleString() : '...'}</strong>명
      </span>
    </div>
  );
}
