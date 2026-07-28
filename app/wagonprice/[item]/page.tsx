import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ItemWagonClient, { PRESETS } from './ItemWagonClient';
import styles from '../wagonprice.module.css';

interface ItemPageProps {
  params: Promise<{ item: string }>;
}

export async function generateStaticParams() {
  return PRESETS.map((p) => ({
    item: p.id
  }));
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { item } = await params;
  const preset = PRESETS.find((p) => p.id === item);

  if (!preset) return {};

  return {
    metadataBase: new URL('https://kkado-kkado.com'),
    title: `${preset.name} 핫딜 팩폭 단가 계산기 | 웨건계산기 - 까도까도`,
    description: `${preset.name} (${preset.specLabel}) 구매 전 1초 만에 개당 단가와 역대 최저가 핫딜 판정을 내려주는 전용 웨건계산기!`,
    alternates: {
      canonical: `https://kkado-kkado.com/wagonprice/${preset.id}`,
    },
    openGraph: {
      title: `${preset.name} 핫딜 단가 계산기 - 웨건계산기`,
      description: `${preset.name} 구매 전 개당 단가와 역대 최저가 핫딜 판정을 내려주는 웨건계산기!`,
      url: `https://kkado-kkado.com/wagonprice/${preset.id}`,
      siteName: '까도까도',
      images: [
        {
          url: 'https://kkado-kkado.com/thumbnail.png',
          width: 512,
          height: 512,
          alt: `${preset.name} 웨건계산기`,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${preset.name} 핫딜 팩폭 계산기`,
      description: `${preset.name} 역대 최저가 단가를 1초 만에 판독해주는 웨건계산기!`,
      images: ['https://kkado-kkado.com/thumbnail.png'],
    }
  };
}

export default async function ItemWagonPage({ params }: ItemPageProps) {
  const { item } = await params;
  const preset = PRESETS.find((p) => p.id === item);

  if (!preset) {
    notFound();
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
          <Link href="/wagonprice" className={styles.backLink}>
            ← 웨건계산기 홈으로
          </Link>
          <Link href="/" className={styles.backLink}>
            🏠 메인으로
          </Link>
        </div>
        <div className={styles.titleBadge}>
          <span>{preset.icon} {preset.name} 전용 팩폭 판독</span>
        </div>
        <h1 className={styles.title}>{preset.name} 핫딜 계산기</h1>
        <p className={styles.subtitle}>
          {preset.specLabel} 규격 기준 | 총 결제금액과 수량을 입력하고 핫딜 등급을 판정받아보세요!
        </p>
      </header>

      <main className={styles.main}>
        <ItemWagonClient preset={preset} />
      </main>

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - {preset.name} 웨건계산기</p>
      </footer>
    </div>
  );
}
