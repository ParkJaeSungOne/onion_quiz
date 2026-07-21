'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const logIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedSecondsRef = useRef<number>(0);

  // 페이지 진입 시 로그 생성 및 타이머 리셋
  useEffect(() => {
    const logVisit = async () => {
      try {
        const pagePath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
        startTimeRef.current = Date.now();
        elapsedSecondsRef.current = 0;

        const res = await fetch('/api/visit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagePath,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
          }),
        });
        const data = await res.json();
        if (data.success && data.logId) {
          logIdRef.current = data.logId;
        }
      } catch (err) {
        console.error('Failed to log analytics visit:', err);
      }
    };

    logVisit();

    // 10초 간격으로 체류 시간 백그라운드 갱신 (Heartbeat)
    const interval = setInterval(async () => {
      if (!logIdRef.current) return;
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      elapsedSecondsRef.current = elapsed;

      try {
        await fetch('/api/visit/log', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logId: logIdRef.current,
            staySeconds: elapsed,
          }),
        });
      } catch (err) {
        // 핑 갱신 오류 발생 시 무시
      }
    }, 10000);

    // 컴포넌트 언마운트 (페이지 변경) 시 최종 체류 시간 전송 (keepalive 지원)
    return () => {
      clearInterval(interval);
      const finalLogId = logIdRef.current;
      if (finalLogId) {
        const finalElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        
        try {
          fetch('/api/visit/log', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logId: finalLogId,
              staySeconds: finalElapsed,
            }),
            keepalive: true,
          });
        } catch (e) {
          // 전송 오류 무시
        }
      }
      logIdRef.current = null;
    };
  }, [pathname, searchParams]);

  // 브라우저 탭 종료 / 새로고침 대비 이탈 처리 이벤트 리스너 추가
  useEffect(() => {
    const handleUnload = () => {
      const finalLogId = logIdRef.current;
      if (finalLogId) {
        const finalElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
          fetch('/api/visit/log', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logId: finalLogId,
              staySeconds: finalElapsed,
            }),
            keepalive: true,
          });
        } catch (e) {}
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
