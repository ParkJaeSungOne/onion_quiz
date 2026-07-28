import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import WagonPriceClient from './WagonPriceClient';
import styles from './wagonprice.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: '웨건계산기 | 생필품 & 핫딜 팩폭 단가 판독 웨건 - 까도까도',
  description: '햇반, 오뚜기밥, 코카콜라 제로, 펩시 제로, 신라면, 계란, 롤휴지 등 생필품 가격 입력 시 개당 단가와 역대 최저가 핫딜 판정을 내려주는 웨건계산기!',
  alternates: {
    canonical: 'https://kkado-kkado.com/wagonprice',
  },
  openGraph: {
    title: '웨건계산기 | 핫딜 팩폭 단가 판독기 - 까도까도',
    description: '햇반, 오뚜기밥, 코카콜라 제로, 신라면 등 생필품 가격 입력 시 개당 단가와 역대 최저가 핫딜 판정을 내려주는 웨건계산기!',
    url: 'https://kkado-kkado.com/wagonprice',
    siteName: '까도까도',
    images: [
      {
        url: 'https://kkado-kkado.com/thumbnail.png',
        width: 512,
        height: 512,
        alt: '웨건계산기 까도까도',
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '웨건계산기 | 핫딜 팩폭 단가 판독기',
    description: '생필품 핫딜 단가를 1초 만에 판독해주는 웨건계산기!',
    images: ['https://kkado-kkado.com/thumbnail.png'],
  }
};

export default function WagonPricePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← 까도까도 메인으로
        </Link>
        <div className={styles.titleBadge}>
          <span>🛒 핫딜 단가 팩폭 판독 </span>
        </div>
        <h1 className={styles.title}>웨건계산기</h1>
        <p className={styles.subtitle}>
          햇반, 오뚜기밥, 코카콜라, 신라면, 계란 핫딜! 사기 전에 웨건으로 개당 단가 팩폭 판정해보세요!
        </p>
      </header>

      <main className={styles.main}>
        <WagonPriceClient />
      </main>

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - 웨건계산기 (WagonPrice)</p>
      </footer>
    </div>
  );
}
