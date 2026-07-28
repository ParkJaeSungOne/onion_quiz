import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import WagonClient from './WagonClient';
import styles from './wagon.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: '햇반웨건 & 코카콜라웨건 | 핫딜 가성비 팩폭 판독기 - 까도까도',
  description: '햇반 개당 700원 역대급 딜일까? 코카콜라 제로 캔당 600원 핫딜일까? 개당 단가 & 100g/100ml당 단가를 실시간 팩폭 판독해주는 햇반웨건 코크웨건!',
  alternates: {
    canonical: 'https://kkado-kkado.com/wagon',
  },
  openGraph: {
    title: '햇반웨건 & 코카콜라웨건 | 핫딜 팩폭 판독기 - 까도까도',
    description: '햇반 개당 700원 역대급 딜일까? 코카콜라 제로 캔당 600원 핫딜일까? 개당 단가 & 100g/100ml당 단가를 실시간 팩폭 판독해주는 햇반웨건 코크웨건!',
    url: 'https://kkado-kkado.com/wagon',
    siteName: '까도까도',
    images: [
      {
        url: 'https://kkado-kkado.com/thumbnail.png',
        width: 512,
        height: 512,
        alt: '햇반웨건 코카콜라웨건 까도까도',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '햇반웨건 & 코카콜라웨건 | 핫딜 팩폭 판독기',
    description: '햇반/코카콜라 제로 가격 입력 시 개당 단가와 역대 핫딜 판정을 팩폭으로 내려주는 웨건 판독기!',
    images: ['https://kkado-kkado.com/thumbnail.png'],
  }
};

export default function WagonPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← 까도까도 메인으로
        </Link>
        <div className={styles.titleBadge}>
          <span>🍚🥤 핫딜 판독 전문 </span>
        </div>
        <h1 className={styles.title}>햇반웨건 & 코카콜라웨건</h1>
        <p className={styles.subtitle}>
          "이 가격 핫딜 맞나요?" 헷갈리는 자취생 & 핫딜러를 위한 B급 팩폭 단가 계산 웨건!
        </p>
      </header>

      <main className={styles.main}>
        <WagonClient />
      </main>

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - 햇반웨건 & 코크웨건 핫딜 판독기</p>
      </footer>
    </div>
  );
}
