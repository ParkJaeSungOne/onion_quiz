import React from 'react';
import styles from './QuizPlay.module.css';

export default function QuizLoading() {
  return (
    <div className={styles.container} style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={styles.coverCard} style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: '54px', animation: 'spin 1.2s infinite linear' }}>
          🧅
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 950, marginTop: '20px', color: '#000000' }}>
          까도까도 팩폭 테스트 로딩 중...
        </h2>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginTop: '8px' }}>
          매콤하고 적나라한 테스트 질문을 불러오고 있습니다 ⚡
        </p>
      </div>
    </div>
  );
}
