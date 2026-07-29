import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import SecondhandClient from './SecondhandClient';
import styles from './secondhand.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: '당근/중고거래 시세 판독기 & 네고 거지 퇴치기 - 까도까도',
  description: '중고거래 구매/판매 시 혜자 시세 판정부터 50% 무리한 네고 거지를 킹받게 퇴치하는 B급 사절 멘트 3종(젠틀/단호박/도파민)을 1초 만에 자동 생성해 드립니다!',
  alternates: {
    canonical: 'https://kkado-kkado.com/secondhand',
  },
  openGraph: {
    title: '당근/중고거래 시세 판독기 & 네고 거지 퇴치기 - 까도까도',
    description: '중고 딜 등급 판정 & 말도 안 되는 네고 문자에 맞서는 킹받는 팩폭 퇴치 멘트 자동 생성기!',
    url: 'https://kkado-kkado.com/secondhand',
    siteName: '까도까도',
    images: [
      {
        url: 'https://kkado-kkado.com/api/og?title=중고거래 시세 판독 및 네고 퇴치기&category=당근네고퇴치',
        width: 1200,
        height: 630,
        alt: '중고거래 네고 거지 퇴치기 까도까도',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '당근/중고거래 시세 판독 & 네고 퇴치기',
    description: '중고 딜 등급 판정 및 킹받는 네고 사절 멘트 생성기!',
    images: ['https://kkado-kkado.com/api/og?title=중고거래 시세 판독 및 네고 퇴치기&category=당근네고퇴치'],
  }
};

export default function SecondhandPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '당근/중고거래 시세 판독기 & 네고 거지 퇴치기',
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'All',
    url: 'https://kkado-kkado.com/secondhand',
    description: '중고 거래 시세 딜 등급 판정 및 무리한 네고 요청 사절 멘트 생성기 웹 앱',
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
          <span>🥕 당근/번개 중고 딜 & 네고 퇴치 </span>
        </div>
        <h1 className={styles.title}>중고거래 시세 & 네고 퇴치기</h1>
        <p className={styles.subtitle}>
          중고물품 제시가를 팩폭 검증하고, 말도 안 되는 50% 할인 네고 거지를 킹받게 만루홈런으로 퇴치하는 멘트 3종을 생성해보세요!
        </p>
      </header>

      <main className={styles.main}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px 0', fontWeight: 900 }}>🥕 네고 퇴치기 로딩 중...</div>}>
          <SecondhandClient />
        </Suspense>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - 중고거래 시세 & 네고 퇴치기</p>
      </footer>
    </div>
  );
}
