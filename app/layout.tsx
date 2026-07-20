import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
