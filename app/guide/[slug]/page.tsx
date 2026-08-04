import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdSlot from '@/components/AdSlot';
import { GUIDE_ARTICLES } from '../guidesData';
import styles from '../../wagonprice/wagonprice.module.css';

interface GuideSlugProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GUIDE_ARTICLES.map((a) => ({
    slug: a.slug
  }));
}

export async function generateMetadata({ params }: GuideSlugProps): Promise<Metadata> {
  const { slug } = await params;
  const article = GUIDE_ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};

  return {
    metadataBase: new URL('https://kkado-kkado.com'),
    title: `${article.title} | 까도까도 가이드`,
    description: article.excerpt,
    alternates: {
      canonical: `https://kkado-kkado.com/guide/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://kkado-kkado.com/guide/${article.slug}`,
      siteName: '까도까도',
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
    }
  };
}

export default async function GuideDetailPage({ params }: GuideSlugProps) {
  const { slug } = await params;
  const article = GUIDE_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    author: {
      '@type': 'Organization',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: '까도까도',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kkado-kkado.com/thumbnail.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://kkado-kkado.com/guide/${article.slug}`
    }
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
          <Link href="/guide" className={styles.backLink}>
            ← 가이드 메인으로
          </Link>
          <Link href="/" className={styles.backLink}>
            🏠 메인으로
          </Link>
        </div>

        <div className={styles.titleBadge}>
          <span>{article.category}</span>
        </div>

        <h1 className={styles.title} style={{ fontSize: '26px', lineHeight: 1.3 }}>
          {article.title}
        </h1>

        <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', marginTop: '10px' }}>
          <span>작성자: {article.author}</span> · <span>일자: {article.date}</span> · <span>소요시간: {article.readTime}</span>
        </div>
      </header>

      <AdSlot type="main" />

      <main className={styles.main}>
        <article
          style={{
            backgroundColor: '#ffffff',
            border: '3.5px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: '20px',
            padding: '28px 20px',
            fontSize: '15.5px',
            lineHeight: 1.7,
            color: '#1e293b',
            fontWeight: 500,
          }}
        >
          {article.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginTop: '24px', marginBottom: '12px', borderLeft: '4px solid #a3e635', paddingLeft: '10px' }}>
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('#### ')) {
              return (
                <h4 key={idx} style={{ fontSize: '17px', fontWeight: 900, color: '#000000', marginTop: '18px', marginBottom: '8px' }}>
                  {paragraph.replace('#### ', '')}
                </h4>
              );
            }
            if (paragraph.startsWith('---')) {
              return <hr key={idx} style={{ border: 'none', borderTop: '2px dashed #cbd5e1', margin: '20px 0' }} />;
            }
            return (
              <p key={idx} style={{ marginBottom: '14px', wordBreak: 'keep-all' }}>
                {paragraph}
              </p>
            );
          })}

          <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '2px solid #000000', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/wagonprice"
              style={{
                backgroundColor: '#a3e635',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                borderRadius: '12px',
                padding: '10px 18px',
                fontWeight: 900,
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              🛒 생필품 핫딜 단가 계산해보러 가기 →
            </Link>
            <Link
              href="/"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                borderRadius: '12px',
                padding: '10px 18px',
                fontWeight: 900,
                fontSize: '14px',
                textDecoration: 'none'
              }}
            >
              🧅 까도까도 팩폭 성향 테스트 풀러 가기 →
            </Link>
          </div>
        </article>
      </main>

      <AdSlot type="main" />

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - {article.title}</p>
      </footer>
    </div>
  );
}
