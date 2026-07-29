import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import ReceiptClient from './ReceiptClient';
import styles from './receipt.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: '영수증 탕진 팩폭 판독기 | 노동 시간 & 은퇴 지연 계산 - 까도까도',
  description: '월급과 최근 지른 금액(배달음식, 홧김 비용, 택시비)을 입력하면 1초 만에 상사 재롱 노동 시간과 은퇴 지연 시간을 계산하고 B급 탕진 영수증 짤을 발행해 드립니다!',
  alternates: {
    canonical: 'https://kkado-kkado.com/receipt',
  },
  openGraph: {
    title: '영수증 탕진 팩폭 판독기 - 까도까도',
    description: '내 홧김 비용이 꼰대 상사 재롱 몇 시간 짜리인지 1초 만에 팩폭 판정받고 탕진 영수증 짤을 받아보세요!',
    url: 'https://kkado-kkado.com/receipt',
    siteName: '까도까도',
    images: [
      {
        url: 'https://kkado-kkado.com/api/og?title=영수증 탕진 팩폭 판독기&category=탕진영수증',
        width: 1200,
        height: 630,
        alt: '영수증 탕진 팩폭 판독기 까도까도',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '영수증 탕진 팩폭 판독기',
    description: '월급 대비 탕진 금액 노동 시간 환산 & B급 영수증 짤 발행!',
    images: ['https://kkado-kkado.com/api/og?title=영수증 탕진 팩폭 판독기&category=탕진영수증'],
  }
};

export default function ReceiptPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '영수증 탕진 팩폭 판독기',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    url: 'https://kkado-kkado.com/receipt',
    description: '월급과 탕진 금액 입력 시 노동 시간 및 은퇴 연기 시간을 팩폭 계산하고 탕진 영수증 짤을 생성해 주는 웹 앱 서비스',
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
          <span>💸 탕진 팩폭 영수증 짤 발급 </span>
        </div>
        <h1 className={styles.title}>영수증 탕진 팩폭 판독기</h1>
        <p className={styles.subtitle}>
          월급과 홧김 비용을 입력해보세요! 꼰대 상사 재롱 몇 시간 노동 가치인지 팩폭 판정하고 영수증 짤을 뽑아드립니다!
        </p>
      </header>

      <main className={styles.main}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px 0', fontWeight: 900 }}>🧾 탕진 영수증 발행기 로딩 중...</div>}>
          <ReceiptClient />
        </Suspense>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - 영수증 탕진 팩폭 판독기</p>
      </footer>
    </div>
  );
}
