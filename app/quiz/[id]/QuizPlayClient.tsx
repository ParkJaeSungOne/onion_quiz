'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createQuizLog, logAnswer } from '@/app/actions/log';
import QuizLoading from '@/components/QuizLoading';
import AdSlot from '@/components/AdSlot';
import styles from './QuizPlay.module.css';

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

    // 2. 점수 합산
    setTotalScore((prev) => prev + score);

    // 3. 마지막 문제인지 체크
    if (currentIdx >= quiz.questions.length - 1) {
      setStep('loading');
    } else {
      // 다음 문제로 넘어갈 때 부드러운 슬라이딩/페이딩 애니메이션 유도
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIdx((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300); // 0.3초 애니메이션 지연
    }
  };

  // 로딩(결과 분석) 완료 시 결과 페이지로 리다이렉트
  const handleLoadingComplete = () => {
    if (quizLogId) {
      // 쿼리 파라미터로 최종 점수와 세션 로그 ID를 넘겨 정확한 결과를 쿼리하게 합니다.
      router.push(`/quiz/${quiz.id}/result/${quizLogId}?score=${totalScore + (quiz.questions[currentIdx]?.options[0]?.score || 0) - (quiz.questions[currentIdx]?.options[0]?.score || 0)}`);
    } else {
      // 백업용 리다이렉트 (로그ID 유실 시 임시 처리)
      router.push(`/quiz/${quiz.id}/result/unknown?score=${totalScore}`);
    }
  };

  // 1. 커버(시작) 단계
  if (step === 'cover') {
    return (
      <div className={styles.container}>
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
        </div>
        <AdSlot type="quiz" />
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
