import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import styles from '../wagonprice/wagonprice.module.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: '까도까도 소개 & 문의하기 (About Us & Contact) - 까도까도',
  description: 'B급 팩폭 성향 테스트 및 생필품 핫딜 웨건계산기 연구소 까도까도의 운영 미션, 콘텐츠 저작권 정책, 개인정보보호 및 문의처 안내 페이지입니다.',
  alternates: {
    canonical: 'https://kkado-kkado.com/about',
  },
  openGraph: {
    title: '까도까도 사이트 소개 & 문의하기',
    description: '까도까도 연구소의 미션 및 운영자 연락처 안내',
    url: 'https://kkado-kkado.com/about',
    siteName: '까도까도',
    images: [{ url: 'https://kkado-kkado.com/thumbnail.png', width: 512, height: 512, alt: '까도까도' }],
  }
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
          <Link href="/" className={styles.backLink}>
            ← 까도까도 메인으로
          </Link>
        </div>
        <div className={styles.titleBadge}>
          <span>🧅 까도까도 연구소 브랜드 소개</span>
        </div>
        <h1 className={styles.title}>About KKADO KKADO</h1>
        <p className={styles.subtitle}>
          양파처럼 깔수록 재미있는 B급 팩폭 성향 테스트와 1초 최저가 웨건계산기 연구소 까도까도를 소개합니다.
        </p>
      </header>

      <AdSlot type="main" />

      <main className={styles.main}>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '3.5px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: '20px',
            padding: '28px 20px',
            fontSize: '15px',
            lineHeight: 1.7,
            color: '#1e293b',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginBottom: '12px' }}>
            🎯 서비스 비전 및 미션 (Our Mission)
          </h2>
          <p style={{ marginBottom: '16px' }}>
            <strong>까도까도 (KKADO KKADO)</strong>는 현대인들이 일상 속에서 마주하는 스트레스, 소비 고민, 인간관계의 모순점을 <strong>'B급 팩폭 유머'</strong>와 <strong>'실용적 핫딜 계산 유틸리티'</strong>를 통해 위트 있게 해결하는 차세대 웹 플랫폼입니다.
          </p>

          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginTop: '24px', marginBottom: '12px' }}>
            🧅 핵심 제공 서비스
          </h2>
          <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>
              <strong>B급 팩폭 성향 테스트 (180여 종)</strong>: 일상의 솔직한 모순점을 콕 짚어내는 1분 심리 테스트.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>생필품 웨건계산기 (WagonPrice)</strong>: 햇반, 코카콜라, 신라면 등 생필품 핫딜의 100g/100ml당 단가를 1초 만에 판독.
            </li>
            <li style={{ marginBottom: '8px' }}>
              <strong>스마트 소비 인사이트 칼럼</strong>: 1인 가구 절약 팁, 심리 분석 및 최저가 쇼핑 가이드 제공.
            </li>
          </ul>

          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginTop: '24px', marginBottom: '12px' }}>
            📬 제휴 및 문의처 (Contact Us)
          </h2>
          <p style={{ marginBottom: '12px' }}>
            서비스 이용 문의, 오류 제보, 컨텐츠 제휴 문의는 아래 연락처로 보내주시면 24시간 이내에 친절히 답변해 드립니다.
          </p>
          <div style={{ backgroundColor: '#f8fafc', border: '2px solid #000000', borderRadius: '12px', padding: '14px', fontWeight: 800 }}>
            📧 대표 이메일: <strong>contact@kkado-kkado.com</strong> (또는 관리자 1:1 이메일)<br />
            🌐 공식 도메인: <strong>https://kkado-kkado.com</strong>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginTop: '24px', marginBottom: '12px' }}>
            🔒 저작권 및 이용자 보호 방침
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            본 사이트의 모든 퀴즈 로직, 가이드 칼럼, 캐릭터 디자인은 까도까도 연구소에 저작권이 있으며, 이용자의 개인정보보호를 위해 관련 법률 및 개인정보처리방침을 철저히 준수합니다.
          </p>

          <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
            <Link href="/privacy" style={{ fontSize: '13px', fontWeight: 800, color: '#000000' }}>[개인정보처리방침]</Link>
            <Link href="/terms" style={{ fontSize: '13px', fontWeight: 800, color: '#000000' }}>[이용약관]</Link>
          </div>
        </div>
      </main>

      <AdSlot type="main" />

      <footer className={styles.footer}>
        <p>© 2026 KKADO KKADO - 사이트 소개 & 문의하기</p>
      </footer>
    </div>
  );
}
