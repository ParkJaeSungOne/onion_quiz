import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kkado-kkado.com'),
  title: "까도까도 (Kkado-Kkado) - 양파처럼 까보는 나의 팩폭 성향 테스트",
  description: "양파처럼 깔수록 재미있고 적나라한 나의 본모습을 까보세요! 트렌디한 팩폭 성향 테스트 연구소 까도까도.",
  alternates: {
    canonical: 'https://kkado-kkado.com',
  },
  openGraph: {
    title: "까도까도 (Kkado-Kkado)",
    description: "양파처럼 깔수록 재미있고 적나라한 나의 본모습을 까보세요! 트렌디한 팩폭 성향 테스트 연구소 까도까도.",
    url: "https://kkado-kkado.com",
    siteName: "까도까도",
    images: [
      {
        url: "https://kkado-kkado.com/thumbnail.png",
        width: 512,
        height: 512,
        alt: "까도까도 양파 캐릭터 썸네일",
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "까도까도 (Kkado-Kkado)",
    description: "양파처럼 깔수록 재미있고 적나라한 나의 본모습을 까보세요! 트렌디한 팩폭 성향 테스트 연구소 까도까도.",
    images: ["https://kkado-kkado.com/thumbnail.png"],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '까도까도',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_VERIFICATION || '',
    }
  }
};

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 💰 Google AdSense 자동 광고 및 소유권 인증 스크립트 연동 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6272041920940171"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* 🔍 네이버/구글 검색엔진 노출 극대화용 JSON-LD 구조화 데이터 스니펫 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "까도까도 (Kkado-Kkado)",
              "alternateName": ["까도까도 성향테스트", "Onion Quiz", "까도까도 테스트"],
              "url": "https://kkado-kkado.com",
              "description": "양파처럼 깔수록 재미있고 적나라한 B급 팩폭 성향 테스트 연구소 까도까도.",
              "publisher": {
                "@type": "Organization",
                "name": "까도까도",
                "logo": "https://kkado-kkado.com/thumbnail.png"
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://kkado-kkado.com/?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* 🕶️ 테마 플리커 차단 스크립트 (hydration 이전 html 테마 강제 동기화) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme) {
                  document.documentElement.setAttribute('data-theme', theme);
                } else {
                  // 기본 테마값은 오리지널 키치 테마('light')로 강제 고정
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* 🕶️ 전역 플로팅 테마 스위치 (Home, Play, Result 등 모든 페이지에서 상시 노출) */}
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 99999 }}>
          <ThemeToggle />
        </div>
        <AnalyticsTracker />
        <Analytics />
        <SpeedInsights />
        {children}
      </body>
    </html>
  );
}
