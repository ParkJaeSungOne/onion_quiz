'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateAdmin } from '@/app/actions/admin';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authenticateAdmin(password);
      if (res.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(res.error || '인증에 실패했습니다.');
        setLoading(false);
      }
    } catch (err) {
      setError('서버 통신 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.badge}>SECRET ZONE</div>
        <h1 className={styles.title}>관리자 로그인</h1>
        <p className={styles.subtitle}>오직 까도까도 관리자만 접근할 수 있는 성향 테스트 대시보드 구역입니다.</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>패스코드를 입력하세요</label>
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

          {loading && (
            <div className={styles.progressContainer}>
              <div className={styles.progressText}>🔐 보안 세션을 인증하는 중...</div>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill}></div>
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? (
              <span className={styles.spinnerBtn}>
                <span className={styles.spinnerIcon}></span>
                보안 채널 로그인 중...
              </span>
            ) : (
              '시크릿 대시보드 입장 →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
