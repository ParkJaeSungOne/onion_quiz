import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AnalyticsTracker from "@/components/AnalyticsTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "까도까도 (Kkado-Kkado) - 양파처럼 까보는 나의 팩폭 성향 테스트",
  description: "양파처럼 깔수록 재미있고 적나라한 나의 본모습을 까보세요! 트렌디한 팩폭 성향 테스트 연구소 까도까도.",
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
        {/* 🕶️ 테마 플리커 차단 스크립트 (hydration 이전 body 테마 강제 동기화) */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme) {
                  document.documentElement.setAttribute('data-theme', theme);
                  document.body.setAttribute('data-theme', theme);
                } else {
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var defaultTheme = prefersDark ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', defaultTheme);
                  document.body.setAttribute('data-theme', defaultTheme);
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
