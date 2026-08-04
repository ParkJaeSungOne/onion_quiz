import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import { GUIDE_ARTICLES } from './guidesData';
import styles from '../wagonprice/wagonprice.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: '까도까도 인사이트 & 핫딜 가이드 - 스마트 소비 & 심리 연구소',
  description: '생필품 핫딜 단가 계산 노하우, 자취생 대량 구매 절약법, 현대 직장인 심리 분석 및 소비 트렌드를 다루는 까도까도 공식 가이드 센터입니다.',
  alternates: {
    canonical: 'https://kkado-kkado.com/guide',
  },
  openGraph: {
    title: '까도까도 인사이트 & 핫딜 가이드',
    description: '생필품 핫딜 단가 계산법 및 심리 분석 칼럼을 읽어보세요!',
    url: 'https://kkado-kkado.com/guide',
    siteName: '까도까도',
    images: [{ url: 'https://kkado-kkado.com/thumbnail.png', width: 512, height: 512, alt: '까도까도 가이드' }],
  }
};

export default function GuideIndexPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
          <Link href="/" className={styles.backLink}>
            ← 까도까도 메인으로
          </Link>
        </div>
        <div className={styles.titleBadge}>
          <span>📚 까도까도 인사이트 & 핫딜 가이드</span>
        </div>
        <h1 className={styles.title}>스마트 소비 & 심리 칼럼 센터</h1>
        <p className={styles.subtitle}>
          생필품 최저가 단가 계산 법칙부터 현대인의 심리와 합리적인 소비 노하우를 제공하는 까도까도 공식 칼럼 모음입니다.
        </p>
      </header>

      <AdSlot type="main" />

      <main className={styles.main}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          {GUIDE_ARTICLES.map((article) => (
            <article
              key={article.slug}
              style={{
                backgroundColor: '#ffffff',
                border: '3.5px solid #000000',
                boxShadow: '6px 6px 0px #000000',
                borderRadius: '20px',
                padding: '24px 20px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                  backgroundColor: '#a3e635',
                  color: '#000000',
                  border: '1.5px solid #000000',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  fontSize: '12px',
                  fontWeight: 900
                }}>
                  {article.category}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>
                  {article.date} · {article.readTime}
                </span>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginBottom: '10px', lineHeight: 1.4 }}>
                <Link href={`/guide/${article.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {article.title}
                </Link>
              </h2>

              <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', lineHeight: 1.6, marginBottom: '16px' }}>
                {article.excerpt}
              </p>

              <Link
                href={`/guide/${article.slug}`}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#ffeb3b',
                  color: '#000000',
                  border: '2px solid #000000',
                  boxShadow: '3px 3px 0px #000000',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 900,
                  textDecoration: 'none'
                }}
              >
                📖 칼럼 전문 읽어보기 →
              </Link>
            </article>
          ))}
        </div>
      </main>

      <AdSlot type="main" />

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - 스마트 소비 & 심리 칼럼 센터</p>
      </footer>
    </div>
  );
}
