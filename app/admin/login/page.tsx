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
      }
    } catch (err) {
      setError('서버 통신 중 오류가 발생했습니다.');
    } finally {
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
              required
            />
          </div>

          {error && <div className={styles.errorAlert}>⚠️ {error}</div>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? '인증 확인 중...' : '시크릿 대시보드 입장 →'}
          </button>
        </form>
      </div>
    </div>
  );
}
