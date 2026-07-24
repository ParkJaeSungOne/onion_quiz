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
  const [stats, setStats] = useState<{ todayPv: number; todayUv: number; totalPv: number; totalUv: number }>({
    todayPv: 0,
    todayUv: 0,
    totalPv: 0,
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
              todayPv: data.today.pv || 1,
              todayUv: data.today.uv || 1,
              totalPv: data.total.pv || 1,
              totalUv: data.total.uv || 1
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

  // 집계 데이터가 도착하기 전까지는 깔끔한 로딩 배지 표시
  const displayToday = loaded ? Math.max(stats.todayPv, stats.todayUv) : 0;
  const displayTotal = loaded ? Math.max(stats.totalPv, stats.totalUv) : 0;

  return (
    <div className={styles.counterBadge}>
      <span className={styles.dot}>🟢</span>
      <span className={styles.text}>
        오늘 탐색된 양파: <strong>{displayToday.toLocaleString()}</strong>회
      </span>
      <span className={styles.divider}>|</span>
      <span className={styles.text}>
        누적 깐 양파: <strong>{displayTotal.toLocaleString()}</strong>회
      </span>
    </div>
  );
}
