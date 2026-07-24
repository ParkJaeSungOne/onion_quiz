'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { createQuizLog, logAnswer, completeQuizLog } from '@/app/actions/log';
import { incrementShareCount } from '@/app/actions/share';
import AdSlot from '@/components/AdSlot';
import Footer from '@/components/Footer';
import styles from './QuizPlay.module.css';
import QuizUnifiedLoader from '@/components/QuizUnifiedLoader';

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
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
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

    incrementShareCount(quiz.id, 'kakao');

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
    incrementShareCount(quiz.id, 'link');

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

  // 답변 선택 (모바일 active 포커스 고정 해제 & 즉시 반응 로딩 피드백)
  const handleAnswerSelect = async (e: React.MouseEvent<HTMLButtonElement>, optionId: string, score: number, optionText: string) => {
    if (isTransitioning) return;

    // 📱 모바일 터치 및 포커스 잔상 해제
    e.currentTarget.blur();
    setSelectedOptionId(optionId);

    // 1. 답변 로그를 비동기로 전송
    if (quizLogId) {
      logAnswer(quizLogId, quiz.questions[currentIdx].questionNumber, optionText);
    }

    // 2. 점수 합산
    const finalScore = totalScore + score;
    setTotalScore(finalScore);

    // 3. 마지막 문제인지 체크
    if (currentIdx >= quiz.questions.length - 1) {
      // 🚀 즉시 로딩 화면으로전환하여 유저에게 강력한 피드백 제공!
      setStep('loading');

      const finalLogId = quizLogId || 'guest';
      if (quizLogId) {
        completeQuizLog(quizLogId, finalScore).catch((err) => {
          console.error('Failed to complete quiz log in background:', err);
        });
      }
      
      // 결과 페이지로 라우팅 전환
      router.push(`/quiz/${quiz.id}/result/${finalLogId}?score=${finalScore}`);
    } else {
      // 다음 문제로 넘어갈 때 부드러운 전환 & 선택된 옵션 포커스 초기화
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setSelectedOptionId(null);
        setIsTransitioning(false);
      }, 250); // 0.25초 부드러운 넘김
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

  // 2. 최종 결과 라우팅 대기용 통일된 B급 팩폭 로딩 화면
  if (step === 'loading') {
    return (
      <QuizUnifiedLoader 
        title="🔮 당신의 팩폭 결과 분석 중..." 
        subtitle="양파 껍질을 적나라하게 까고 있습니다! 잠시 후 소름 돋는 결과 리포트가 공개됩니다 ⚡" 
      />
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
              className={`${styles.optionButton} ${selectedOptionId === option.id ? styles.selectedOption : ''}`}
              onClick={(e) => handleAnswerSelect(e, option.id, option.score, option.text)}
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
