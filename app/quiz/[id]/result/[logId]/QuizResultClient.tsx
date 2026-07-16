'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import AdSlot from '@/components/AdSlot';
import styles from './QuizResult.module.css';

// Kakao SDK 타입 확장 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

interface ResultData {
  id: string;
  minScore: number;
  maxScore: number;
  title: string;
  content: string;
  emoji: string;
}

interface StatItem {
  id: string;
  title: string;
  emoji: string;
  count: number;
  percentage: number;
}

interface QuizData {
  id: number;
  title: string;
  category: string;
}

interface QuizResultClientProps {
  quiz: QuizData;
  score: number;
  matchedResult: ResultData | null;
  sortedStats: StatItem[];
  logId: string;
}

export default function QuizResultClient({
  quiz,
  score,
  matchedResult,
  sortedStats,
  logId,
}: QuizResultClientProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [kakaoInitialized, setKakaoInitialized] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 로컬/도메인 공유용 URL 산출
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz/${quiz.id}/result/${logId}` : '';
  const quizUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz/${quiz.id}` : '';

  // 카카오 SDK 로드 완료 시 초기화
  const handleKakaoLoad = () => {
    // 사용자의 Kakao JS App Key (환경변수가 지정되어 있으면 사용, 디폴트는 임시 개발자 데모용 키 등록)
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_CLIENT_KEY || 'e3ff81b671a9fbdf619e0bde2ceec43d';

    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        window.Kakao.init(kakaoKey);
        setKakaoInitialized(true);
        console.log('Kakao SDK Initialized successfully.');
      } catch (err) {
        console.error('Failed to init Kakao SDK:', err);
      }
    } else if (window.Kakao && window.Kakao.isInitialized()) {
      setKakaoInitialized(true);
    }
  };

  // 카카오톡 공유 기능 기동
  const handleKakaoShare = () => {
    if (!kakaoInitialized || !window.Kakao) {
      alert('카카오톡 공유 기능을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (!matchedResult) return;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `[까도까도] ${quiz.title} 결과!`,
        description: `나의 매칭 유형: “ ${matchedResult.emoji} ${matchedResult.title} ”\n양파처럼 깔수록 재미있고 매콤한 진짜 성향 테스트`,
        imageUrl: 'https://kkado-kkado.com/icon', // 파비콘 양파 URL 또는 대표 사이트 썸네일
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '결과 확인하기 🔍',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        {
          title: '나도 테스트 하기 🧅',
          link: {
            mobileWebUrl: quizUrl,
            webUrl: quizUrl,
          },
        },
      ],
    });
  };

  // 결과 카드 이미지 다운로드 기능 (html2canvas)
  const handleDownloadImage = async () => {
    if (!cardRef.current || downloading) return;

    setDownloading(true);
    try {
      // dynamic import로 SSR 에러 원천 방지
      const html2canvas = (await import('html2canvas')).default;

      // 캡처 영역 스냅샷 생성
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fce7f3', // 까도까도 시그니처 핑크색 배경 강제 적용
        scale: 2, // 2배 선명하게 캡처
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `kkado-kkado-${quiz.category}-${quiz.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Image download failed:', err);
      alert('이미지 저장 도중 장애가 발생했습니다. 브라우저 설정을 확인해주세요.');
    } finally {
      setDownloading(false);
    }
  };

  // 링크 클립보드 복사
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // fallback
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.container}>
      {/* Kakao SDK 스크립트 비동기 로드 */}
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        onLoad={handleKakaoLoad}
        strategy="afterInteractive"
      />

      <header className={styles.header}>
        <span className={styles.categoryBadge}>{quiz.category} 테스트 결과</span>
        <h1 className={styles.quizTitle}>“ {quiz.title} ”</h1>
      </header>

      {/* 결과 화면 상단 광고 */}
      <AdSlot type="result" />

      <main className={styles.main}>
        {matchedResult ? (
          // 이미지 캡처 대상 엘리먼트 (cardRef 바인딩)
          <div ref={cardRef} className={styles.resultCard} id="result-card-area">
            {/* 대표 캐릭터 이모지 박스 */}
            <div className={styles.characterWrapper}>
              <div className={styles.characterCircle}>
                <span className={styles.characterEmoji}>{matchedResult.emoji}</span>
              </div>
            </div>

            <div className={styles.scoreText}>
              나의 결과 점수: <strong className={styles.scoreNumber}>{score}</strong>점
            </div>
            <h2 className={styles.resultTitle}>{matchedResult.title}</h2>
            <div className={styles.divider}></div>
            <p className={styles.resultContent}>
              {matchedResult.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </p>

            {/* 통계 랭킹 섹션 (자기 결과 카드 하단에 나열) */}
            {sortedStats.length > 0 && (
              <div className={styles.statsSection}>
                <h3 className={styles.statsHeading}>📊 전체 참여자 성향 분석 순위</h3>
                <p className={styles.statsSubheading}>다른 사람들은 어떤 유형이 가장 많이 나왔을까요?</p>
                
                <div className={styles.rankList}>
                  {sortedStats.map((item, idx) => {
                    const isMyResult = matchedResult && item.id === matchedResult.id;
                    return (
                      <div 
                        key={item.id} 
                        className={`${styles.rankItem} ${isMyResult ? styles.myRankItem : ''}`}
                      >
                        <div className={styles.rankItemHeader}>
                          <div className={styles.rankItemInfo}>
                            <span className={styles.rankNumber}>{idx + 1}위</span>
                            <span className={styles.rankEmoji}>{item.emoji}</span>
                            <span className={styles.rankTitle}>{item.title}</span>
                          </div>
                          <div className={styles.rankItemValue}>
                            {isMyResult && <span className={styles.myBadge}>나의 결과</span>}
                            <span className={styles.rankPercent}>{item.percentage}%</span>
                          </div>
                        </div>
                        <div className={styles.trackBar}>
                          <div 
                            className={`${styles.fillBar} ${isMyResult ? styles.myFillBar : ''}`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.resultCard}>
            <p className={styles.noResultText}>결과 유형 데이터를 찾을 수 없습니다.</p>
          </div>
        )}
      </main>

      {/* 🚀 소셜 공유 & 이미지 저장 네오브루탈리즘 버튼 그룹 */}
      <section className={styles.shareSection}>
        <h3 className={styles.shareTitle}>📢 이 팩폭 결과 널리 까보기</h3>
        <div className={styles.shareButtonsGrid}>
          {/* 이미지 저장 */}
          <button 
            onClick={handleDownloadImage} 
            className={styles.imageSaveBtn}
            disabled={downloading}
          >
            {downloading ? '📷 이미지 스냅샷 생성 중...' : '📥 결과 이미지로 저장 (인스타 스토리용)'}
          </button>
          
          <div className={styles.socialButtonsGroup}>
            {/* 카톡 공유 */}
            <button onClick={handleKakaoShare} className={styles.kakaoBtn}>
              <span className={styles.kakaoIcon}>💬</span> 카카오톡 공유
            </button>
            {/* 링크 복사 */}
            <button onClick={handleCopyLink} className={styles.linkCopyBtn}>
              🔗 {copied ? '복사 완료!' : '결과 링크 복사'}
            </button>
          </div>
        </div>
      </section>

      {/* 결과 화면 하단 광고 */}
      <AdSlot type="result" />

      {/* 다른 테스트 하러가기 버튼 */}
      <div className={styles.actionArea}>
        <Link href="/" className={styles.backButton}>
          다른 테스트 하러 가기
          <span className={styles.arrow}>↩</span>
        </Link>
      </div>
    </div>
  );
}
