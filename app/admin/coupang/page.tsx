import React from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CoupangPosterClient from './CoupangPosterClient';

const SESSION_COOKIE_NAME = 'kkado_admin_session';

export const revalidate = 0;

export const metadata: Metadata = {
  title: '까도 핫딜 포스터 - 아이폰 전용 앱',
  description: '쿠팡 핫딜 AI 스레드 자동 포스팅 관리자 전용 앱',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '까도핫딜',
  },
  icons: {
    apple: '/icon-192.png',
  }
};

interface CoupangPosterPageProps {
  searchParams: Promise<{ key?: string; pass?: string }>;
}

export default async function CoupangPosterPage({ searchParams }: CoupangPosterPageProps) {
  const { key, pass } = await searchParams;
  const cookieStore = await cookies();
  const adminPassword = process.env.ADMIN_PASSWORD || 'wotjd11442!';

  // 1. 마스터 키(?key=...) 접속 시 원클릭 자동 로그인 및 1년 세션 발급
  if (key === adminPassword || pass === adminPassword || key === 'wotjd11442!' || pass === 'wotjd11442!') {
    cookieStore.set(SESSION_COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1년 유지
      path: '/',
    });
  }

  // 2. 보안 세션 검증
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (!session || session.value !== 'authenticated') {
    redirect('/admin/login');
  }

  return <CoupangPosterClient />;
}
