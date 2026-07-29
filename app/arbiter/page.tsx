import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import ArbiterClient from './ArbiterClient';
import styles from './arbiter.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: '누가 더 잘못했냐? 카톡 싸움 팩폭 판사 - 까도까도',
  description: '커플, 썸남썸녀, 친구, 동료 간 싸운 대화 내용이나 상황을 입력하면 1초 만에 과실 비율(A vs B %)과 판사 양파의 탕탕탕 팩폭 판결문 카드를 발급해 드립니다!',
  alternates: {
    canonical: 'https://kkado-kkado.com/arbiter',
  },
  openGraph: {
    title: '누가 더 잘못했냐? 카톡 싸움 팩폭 판사 - 까도까도',
    description: '커플/친구 대판 싸움 1초 만에 과실 비율 팩폭 가려주는 온라인 양파 판사!',
    url: 'https://kkado-kkado.com/arbiter',
    siteName: '까도까도',
    images: [
      {
        url: 'https://kkado-kkado.com/api/og?title=카톡 싸움 팩폭 판사&category=싸움판결',
        width: 1200,
        height: 630,
        alt: '카톡 싸움 팩폭 판사 까도까도',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '누가 더 잘못했냐? 카톡 싸움 팩폭 판사',
    description: '과실 비율 팩폭 판정 & 판결문 카드 발급기!',
    images: ['https://kkado-kkado.com/api/og?title=카톡 싸움 팩폭 판사&category=싸움판결'],
  }
};

export default function ArbiterPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '카톡 싸움 팩폭 판사',
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'All',
    url: 'https://kkado-kkado.com/arbiter',
    description: '인간관계 갈등 대화 상황 입력 시 과실 비율 및 팩폭 판결문을 생성하는 AI 웹 응용 프로그램',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
          <Link href="/" className={styles.backLink}>
            ← 까도까도 홈으로
          </Link>
        </div>
        <div className={styles.titleBadge}>
          <span>⚖️ 누가 더 잘못했는지 탕탕탕 판결 </span>
        </div>
        <h1 className={styles.title}>카톡 싸움 팩폭 판사</h1>
        <p className={styles.subtitle}>
          커플, 썸남썸녀, 친구 간 싸운 억울한 상황을 입력해보세요! 1초 만에 과실 비율과 양파 판사의 팩폭 판결문 카드를 내어드립니다!
        </p>
      </header>

      <main className={styles.main}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px 0', fontWeight: 900 }}>⚖️ 양파 법정 개정 중...</div>}>
          <ArbiterClient />
        </Suspense>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - 카톡 싸움 팩폭 판사</p>
      </footer>
    </div>
  );
}
