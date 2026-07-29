import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/CommentSection';
import { PRESETS } from '../presets';
import ItemWagonClient from './ItemWagonClient';
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
          url: `https://kkado-kkado.com/api/og?title=${encodeURIComponent(preset.name + ' 핫딜 계산기')}&category=${encodeURIComponent('웨건계산기')}`,
          width: 1200,
          height: 630,
          alt: `${preset.name} 웨건계산기`,
        }
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${preset.name} 핫딜 팩폭 계산기`,
      description: `${preset.name} 역대 최저가 단가를 1초 만에 판독해주는 웨건계산기!`,
      images: [`https://kkado-kkado.com/api/og?title=${encodeURIComponent(preset.name + ' 핫딜 계산기')}&category=${encodeURIComponent('웨건계산기')}`],
    }
  };
}

export default async function ItemWagonPage({ params }: ItemPageProps) {
  const { item } = await params;
  const preset = PRESETS.find((p) => p.id === item);

  if (!preset) {
    notFound();
  }

  let comments: any[] = [];
  try {
    comments = await prisma.comment.findMany({
      where: { wagonItemId: preset.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        content: true,
        createdAt: true,
        password: true,
        reactionOnion: true,
        reactionFire: true,
        reactionHeart: true,
        reactionLaugh: true,
      }
    });
  } catch (e) {
    console.error('Failed to fetch wagon comments:', e);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `${preset.name} 웨건 - 핫딜 단가 계산기`,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    url: `https://kkado-kkado.com/wagonprice/${preset.id}`,
    description: `${preset.name} (${preset.specLabel}) 구매 전 1초 만에 개당 단가와 역대 최저가 핫딜 판정을 내려주는 전용 웨건계산기!`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
  };

  return (
    <div className={styles.container}>
      {/* 🔍 Google & Naver Search Indexing JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 🔍 검색엔진 크롤러(네이버 Yeti, 구글 Googlebot) 전용 SSR 텍스트 색인 블록 */}
      <article className="sr-only" style={{ display: 'none' }}>
        <h2>{preset.name} 웨건 & {preset.name} 가격 계산기 핫딜 팩폭 판정</h2>
        <p>
          본 웹페이지는 {preset.name} ({preset.specLabel}) 생필품 구매 시 총 결제 금액과 수량을 입력하여 1초 만에 개당 단가 및 {preset.unitLabel} 환산 단가를 계산하고, 역대 최저가 핫딜 등급(역대급 신의 딜, 혜자로운 핫딜, 평범한 행사가, 호구 바가지)을 팩폭 분석해주는 {preset.name} 웨건 전용 가격 계산기입니다.
        </p>
        <ul>
          <li>검색 키워드: {preset.name} 웨건, {preset.name} 가격 계산기, {preset.name} 핫딜, {preset.name} 개당 단가, {preset.name} 최저가</li>
          <li>기본 규격: {preset.specLabel} ({preset.specSize > 1 ? `${preset.specSize}${preset.unitLabel.includes('g') ? 'g' : 'ml'}` : '1개'})</li>
          <li>역대급 신의 딜 단가 기준: 개당 {preset.topDealPrice.toLocaleString()}원 이하</li>
          <li>혜자로운 핫딜 단가 기준: 개당 {preset.goodDealPrice.toLocaleString()}원 이하</li>
        </ul>
      </article>

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

        {/* 💬 생필품 웨건 개별 실시간 핫딜 정보 및 제보 토크방 */}
        <div style={{ marginTop: '36px' }}>
          <CommentSection
            quizId={null}
            wagonItemId={preset.id}
            initialComments={comments}
            title={`💬 ${preset.name} 실시간 핫딜 정보 & 제보 토크방`}
          />
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - {preset.name} 웨건계산기</p>
      </footer>
    </div>
  );
}
