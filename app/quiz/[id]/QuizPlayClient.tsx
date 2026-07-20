'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { createQuizLog, logAnswer, completeQuizLog } from '@/app/actions/log';
import QuizLoading from '@/components/QuizLoading';
import AdSlot from '@/components/AdSlot';
import Footer from '@/components/Footer';
import styles from './QuizPlay.module.css';

// Kakao SDK 타입 확장 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

interface Option {
  id: string;
  text: string;
  score: number;
}

interface Question {
  id: string;
  questionNumber: number;
  text: string;
  options: Option[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  category: string;
  questions: Question[];
}

interface QuizPlayClientProps {
  quiz: Quiz;
}

export default function QuizPlayClient({ quiz }: QuizPlayClientProps) {
  const router = useRouter();
  
  // 상태 관리
  const [step, setStep] = useState<'cover' | 'questions' | 'loading'>('cover');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [quizLogId, setQuizLogId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [kakaoInitialized, setKakaoInitialized] = useState(false);
  const [copied, setCopied] = useState(false);

  // 로컬/도메인 공유용 URL 산출
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz/${quiz.id}` : '';

  // 카카오 SDK 로드 완료 시 초기화
  const handleKakaoLoad = () => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_CLIENT_KEY;
    if (!kakaoKey) {
      console.warn('Kakao App Key is missing on QuizPlay. Fallback copy link will be active.');
      return;
    }
    if (window.Kakao && !window.Kakao.isInitialized()) {
      try {
        window.Kakao.init(kakaoKey);
        setKakaoInitialized(true);
      } catch (err) {
        console.error('Failed to init Kakao SDK inside QuizPlay:', err);
      }
    } else if (window.Kakao && window.Kakao.isInitialized()) {
      setKakaoInitialized(true);
    }
  };

  // 카카오톡 공유 기능 기동
  const handleKakaoShare = () => {
    if (!kakaoInitialized || !window.Kakao) {
      alert('아직 카카오 공유 키가 활성화되지 않아 테스트 주소 링크 복사로 대체합니다!\n\n(카카오 개발자 콘솔에서 키를 받아 Vercel에 NEXT_PUBLIC_KAKAO_CLIENT_KEY로 등록하면 카톡 공유가 자동 활성화됩니다.)');
      handleCopyLink();
      return;
    }

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `[까도까도] ${quiz.title}`,
        description: `${quiz.description}\n양파처럼 깔수록 재미있고 매콤한 진짜 성향 테스트`,
        imageUrl: 'https://kkado-kkado.com/thumbnail.png',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '테스트 시작하기 🧅',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });
  };

  // 링크 클립보드 복사
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
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

  // 퀴즈 시작하기
  const handleStart = async () => {
    setStep('questions');
    // 비동기로 유저 유입 정보 로그 적재 및 logId 확보
    const result = await createQuizLog(quiz.id);
    if (result.success && result.logId) {
      setQuizLogId(result.logId);
    }
  };

  // 답변 선택
  const handleAnswerSelect = async (score: number, optionText: string) => {
    if (isTransitioning) return;

    // 1. 답변 로그를 비동기로 전송 (사용자가 logId를 성공적으로 받았을 때만)
    if (quizLogId) {
      logAnswer(quizLogId, quiz.questions[currentIdx].questionNumber, optionText);
    }

    // 2. 점수 합산 및 마지막 문제 처리
    const finalScore = totalScore + score;
    setTotalScore(finalScore);

    // 3. 마지막 문제인지 체크
    if (currentIdx >= quiz.questions.length - 1) {
      // 즉시 로딩 화면으로 전환하여 딜레이 제거
      setStep('loading');
      
      if (quizLogId) {
        // 백그라운드에서 비동기로 최종 점수를 DB 로그에 기록
        completeQuizLog(quizLogId, finalScore).catch((err) => {
          console.error('Failed to complete quiz log in background:', err);
        });
      }
    } else {
      // 다음 문제로 넘어갈 때 부드러운 슬라이딩/페이딩 애니메이션 유도
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300); // 0.3초 애니메이션 지연
    }
  };

  // 로딩(결과 분석) 완료 시 결과 페이지로 리다이렉트 (점수가 감춰진 깔끔한 URL)
  const handleLoadingComplete = () => {
    if (quizLogId) {
      router.push(`/quiz/${quiz.id}/result/${quizLogId}`);
    } else {
      // 백업용 리다이렉트 (로그ID 유실 시 퀴즈 첫 화면으로)
      router.push(`/quiz/${quiz.id}`);
    }
  };

  // 1. 커버(시작) 단계
  if (step === 'cover') {
    return (
      <div className={styles.container}>
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          onLoad={handleKakaoLoad}
          strategy="afterInteractive"
        />

        <div className={styles.coverCard}>
          <div className={styles.badge}>{quiz.category} 테스트</div>
          <h1 className={styles.title}>{quiz.title}</h1>
          <p className={styles.desc}>{quiz.description}</p>
          <div className={styles.infoBox}>
            <span>총 {quiz.questions.length}문항</span>
            <span className={styles.infoDivider}>|</span>
            <span>소요 시간 약 2분</span>
          </div>
          <button className={styles.startButton} onClick={handleStart}>
            테스트 시작하기
            <span className={styles.buttonArrow}>→</span>
          </button>

          {/* 친구에게 성향 테스트 소문내기 공유 기능 */}
          <div className={styles.shareContainer}>
            <span className={styles.shareLabel}>📢 이 테스트 친구한테 공유하기</span>
            <div className={styles.shareButtons}>
              <button onClick={handleKakaoShare} className={styles.kakaoBtn}>
                💬 카톡 공유
              </button>
              <button onClick={handleCopyLink} className={styles.linkCopyBtn}>
                🔗 {copied ? '복사 완료!' : '링크 복사'}
              </button>
            </div>
          </div>
        </div>
        <AdSlot type="quiz" />
        <Footer />
      </div>
    );
  }

  // 2. 결과 정산(로딩) 단계
  if (step === 'loading') {
    return (
      <div className={styles.container}>
        <QuizLoading onComplete={handleLoadingComplete} />
      </div>
    );
  }

  // 3. 질문 진행 단계
  const currentQuestion = quiz.questions[currentIdx];
  const progressPercent = Math.round(((currentIdx) / quiz.questions.length) * 100);

  return (
    <div className={styles.container}>
      {/* 프로그레스바 */}
      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBarHeader}>
          <span className={styles.progressText}>
            질문 {currentIdx + 1} / {quiz.questions.length}
          </span>
          <span className={styles.progressPercent}>{progressPercent}%</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* 질문 카드 */}
      <div className={`${styles.questionCard} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
        <h2 className={styles.questionText}>
          <span className={styles.qNum}>Q.</span> {currentQuestion.text}
        </h2>

        <div className={styles.optionsList}>
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              className={styles.optionButton}
              onClick={() => handleAnswerSelect(option.score, option.text)}
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>

      {/* 테스트 중간 광고 슬롯 */}
      <AdSlot type="quiz" />
    </div>
  );
}
