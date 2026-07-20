import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import styles from './Terms.module.css';

export const metadata = {
  title: '이용약관 | 까도까도',
  description: '까도까도 성향테스트 연구소의 서비스 이용약관 안내입니다.',
};

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>📄 서비스 이용약관</h1>
        <p className={styles.date}>시행일자: 2026년 7월 20일</p>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2>1. 목적</h2>
          <p>
            본 약관은 '까도까도' (이하 '서비스')가 제공하는 성향 및 심리 테스트 서비스의 이용 조건 및 절차에 관한 기본적인 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. 서비스의 제공 및 변경</h2>
          <p>
            1) 서비스는 이용자에게 재미와 트렌드 공유를 목적으로 다양한 성향 테스트 및 결과 요약 콘텐츠를 상시 제공합니다.<br />
            2) 서비스는 콘텐츠 개선 및 고도화를 위해 사전 공지 없이 테스트의 내용을 수정, 보완, 삭제할 수 있습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. 이용자의 의무</h2>
          <p>
            1) 이용자는 본 서비스가 제공하는 콘텐츠를 상업적 목적으로 무단 재배포 및 복제할 수 없습니다.<br />
            2) 서비스 시스템의 원활한 운영을 위해 비정상적인 매크로, 데이터 자동 수집 봇, 스크랩 웹 스파이더 등을 활용해 무단 트래픽을 유발하는 행위를 금지합니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. 책임 제한</h2>
          <p>
            본 서비스가 제공하는 성향 테스트 결과물은 단순 엔터테인먼트 및 오락 목적용 스낵 콘텐츠입니다. 결과의 정확성이나 과학적 신뢰성에 대해 법적인 책임을 지지 않습니다.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. 분쟁 해결 및 관할</h2>
          <p>
            서비스 이용과 관련하여 분쟁이 발생할 경우 대한민국 법령에 따르며, 서비스 운영 주체와 이용자 간의 합의하에 원만히 해결하려 노력합니다.
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
