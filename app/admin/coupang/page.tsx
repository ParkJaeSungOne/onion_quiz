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

export default async function CoupangPosterPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session || session.value !== 'authenticated') {
    redirect('/admin/login');
  }

  return <CoupangPosterClient />;
}
