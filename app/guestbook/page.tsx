import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import CommentSection from '@/components/CommentSection';
import OnionLogo from '@/components/OnionLogo';
import Footer from '@/components/Footer';
import styles from './Guestbook.module.css';

export const metadata = {
  title: '🧅 자유 방명록 | 까도까도',
  description: '까도까도 성향테스트 연구소의 자유 소통 방명록입니다. 재미있는 소감을 자유롭게 남겨보세요!',
};

// 동적으로 최신 글 목록을 반영하도록 1분 단위 캐싱 설정
export const revalidate = 60;

export default async function GuestbookPage() {
  let comments: any[] = [];
  let errorMsg = '';

  try {
    comments = await prisma.comment.findMany({
      where: { quizId: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        content: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch guestbook comments:', error);
    errorMsg = '데이터베이스 로드 중 장애가 발생했습니다.';
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <OnionLogo className={styles.logoIcon} />
          <Link href="/" className={styles.logoTextLink}>
            <span className={styles.title}>KKADO KKADO</span>
          </Link>
        </div>
        <p className={styles.subtitle}>자유 소통 방명록 연구소</p>
      </header>

      <main className={styles.main}>
        <div className={styles.callout}>
          <span className={styles.emoji}>📢</span>
          <p className={styles.calloutText}>
            이곳은 까도까도 유저들의 소통 공간입니다! 새로 기획하고 싶은 성향 테스트 주제, 사이트에 대한 응원글, 혹은 뜬금없는 아무 말 대잔치까지 자유롭게 까보세요!
          </p>
        </div>

        {errorMsg ? (
          <p className={styles.error}>{errorMsg}</p>
        ) : (
          <CommentSection 
            quizId={null} 
            initialComments={comments} 
            title="🧅 까도까도 라이브 자유 방명록" 
          />
        )}

        <div className={styles.backBox}>
          <Link href="/" className={styles.backBtn}>
            ↩ 다른 성향 테스트 보러 가기
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
