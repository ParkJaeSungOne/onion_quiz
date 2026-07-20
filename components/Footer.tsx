import React from 'react';
import Link from 'next/link';
import VisitorCounter from './VisitorCounter';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerLinks}>
        <Link href="/" className={styles.link}>🏠 홈으로</Link>
        <span className={styles.divider}>|</span>
        <Link href="/privacy" className={styles.link}>🔒 개인정보처리방침</Link>
        <span className={styles.divider}>|</span>
        <Link href="/terms" className={styles.link}>📄 이용약관</Link>
      </div>
      <p className={styles.copyright}>© 2026 까도까도 (Kkado-Kkado). All rights reserved.</p>
      <p className={styles.footerInfo}>
        본 사이트는 대중의 트렌드 분석을 위해 생성형 AI 기술을 활용해 실시간 성향 테스트 콘텐츠를 생성 및 보존합니다.
      </p>
      <VisitorCounter />
    </footer>
  );
}
