import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import styles from './Privacy.module.css';

export const metadata = {
  title: '개인정보처리방침 | 까도까도',
  description: '까도까도 성향테스트 연구소의 개인정보처리방침 안내입니다.',
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🔒 개인정보처리방침</h1>
        <p className={styles.date}>시행일자: 2026년 7월 20일</p>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2>1. 개인정보의 처리 목적</h2>
          <p>
            '까도까도'는 이용자의 별도 회원가입 없이 서비스를 제공합니다. 단, 성향 테스트의 신뢰성 높은 결과 통계 산출 및 악성 도배 행위 방지를 위해 최소한의 식별 정보(IP 주소, 브라우저 User-Agent)를 자동으로 수집하여 보존할 수 있습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. 개인정보의 수집 및 보존 기간</h2>
          <p>
            수집된 식별 정보는 통계 산출 목적 달성 즉시 또는 관계 법령에 규정된 보존 의무 기간(로그 기록의 경우 통상 3개월)이 경과한 후 안전하게 파기됩니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. 제3자 제공 및 위탁</h2>
          <p>
            '까도까도'는 이용자의 동의 없이 개인정보를 제3자에게 제공하거나 외부에 위탁하지 않습니다. 단, 구글 애드센스(Google AdSense) 등 광고 서비스 제공 시 브라우저 쿠키(Cookie)를 활용해 맞춤형 광고가 노출될 수 있으며, 이는 브라우저 설정에서 거부할 수 있습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. 쿠키(Cookie)의 운용 및 거부</h2>
          <p>
            이용자는 웹 브라우저의 옵션을 선택함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. 개인정보 보호책임자</h2>
          <p>
            서비스 관련 문의 및 건의사항은 관리자 이메일(kkado.support@gmail.com)로 보내주시면 친절하게 응대해 드리겠습니다.
          </p>
        </section>

        <div className={styles.backBox}>
          <Link href="/" className={styles.backBtn}>
            ↩ 홈으로 가기
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
