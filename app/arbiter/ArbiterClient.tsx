'use client';

import React, { useState } from 'react';
import AdSlot from '@/components/AdSlot';
import styles from './arbiter.module.css';

export default function ArbiterClient() {
  const [relType, setRelType] = useState<string>('커플/연인');
  const [personA, setPersonA] = useState<string>('남자친구');
  const [personB, setPersonB] = useState<string>('여자친구');
  const [conflictText, setConflictText] = useState<string>('남자친구가 여사친 포함된 남녀 혼성 술자리에 가면서 나한테 사전에 말을 안 하고 나중에 단톡 캡처로 들킴');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [verdict, setVerdict] = useState<{
    faultA: number;
    faultB: number;
    title: string;
    roastText: string;
  } | null>(null);

  const presets = [
    {
      rel: '커플/연인',
      a: '남자친구',
      b: '여자친구',
      text: '남친이 여사친 섞인 술자리 가면서 사전 언급 안 하고 나중에 인스타 스토리로 들킴'
    },
    {
      rel: '친구/우정',
      a: 'A 친구',
      b: 'B 친구',
      text: '더치페이 100원 단위까지 딱 맞춰 송금하라고 톡 보내는 친구 ㅋㅋㅋ'
    },
    {
      rel: '직장/동료',
      a: '선배',
      b: '후배',
      text: '퇴근 5분 전에 "이거 내일 아침까지 부탁해" 하고 서류 던지고 칼퇴하는 선배'
    }
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setRelType(p.rel);
    setPersonA(p.a);
    setPersonB(p.b);
    setConflictText(p.text);
  };

  const handleJudgement = async () => {
    if (!conflictText.trim()) return;

    setLoading(true);

    // 판결 계산 알고리즘 (B급 팩폭 로직)
    setTimeout(() => {
      let faultA = 70;
      let faultB = 30;

      if (conflictText.includes('더치페이') || conflictText.includes('100원')) {
        faultA = 85;
        faultB = 15;
      } else if (conflictText.includes('퇴근') || conflictText.includes('선배')) {
        faultA = 90;
        faultB = 10;
      }

      const roast = `⚖️ [양파 법정 팩폭 판결문]

1. 과실 비율 분석:
   👉 ${personA} 과실 ${faultA}% vs ${personB} 과실 ${faultB}%

2. 양파 판사의 탕탕탕 총평:
   ${personA}님은 "별일 아니다"라며 쿨한 척하시지만 속으로는 불통과 이중성 3단계입니다! 
   ${personB}님 역시 서운하다고 억울해만 하지 마시고 당당하게 사과와 정당한 규칙 요구를 하셔야 합니다.

3. 최종 집행 명령:
   둘 다 입다물고 오늘 저녁 삼겹살에 소주 한 잔 사주고 탕탕탕 화해하시길 권고합니다! 🔨`;

      setVerdict({
        faultA,
        faultB,
        title: `⚖️ ${personA} (${faultA}%) vs ${personB} (${faultB}%) 과실 판결!`,
        roastText: roast
      });

      setLoading(false);
    }, 600);
  };

  const handleCopyShare = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://kkado-kkado.com/arbiter';
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <AdSlot type="main" />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>⚖️</span>
          <div>
            <h2 className={styles.cardHeaderTitle}>카톡 싸움 팩폭 판사</h2>
            <p className={styles.cardHeaderDesc}>
              누가 더 잘못했는지 억울한 싸움 상황을 입력하면 양파 판사가 1초 만에 과실 비율과 팩폭 판결문을 내립니다.
            </p>
          </div>
        </div>

        {/* 프리셋 */}
        <div style={{ marginBottom: '18px' }}>
          <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>🔥 흔한 싸움 템플릿 선택</label>
          <div className={styles.presetGroup}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                className={styles.presetBtn}
                onClick={() => handleSelectPreset(p)}
              >
                ⚖️ {p.rel}: {p.text.substring(0, 18)}...
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>당사자 A (예: 남자친구, A친구, 선배)</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.input}
                value={personA}
                onChange={(e) => setPersonA(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>당사자 B (예: 여자친구, B친구, 후배)</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.input}
                value={personB}
                onChange={(e) => setPersonB(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>싸운 대화 및 사건 내용 (자세히 적을수록 팩폭 증가)</label>
            <textarea
              className={styles.textarea}
              placeholder="예: 술자리에 여사친 섞여있는데 사전 언급 없이 갔다 나중에 인스타 스토리로 들켜서 싸움"
              value={conflictText}
              onChange={(e) => setConflictText(e.target.value)}
            />
          </div>

          <button className={styles.submitBtn} onClick={handleJudgement} disabled={loading}>
            {loading ? '⚖️ 양파 판사가 법정 판결문 작성 중...' : '🔨 1초 만에 누구 과실인지 탕탕탕 판결받기'}
          </button>
        </div>

        {/* ⚖️ 판결문 결과 카드 */}
        {verdict && (
          <div className={styles.verdictCard}>
            <div className={styles.verdictHeader}>
              <div className={styles.verdictTitle}>{verdict.title}</div>
              <div className={styles.verdictSub}>KKADO KKADO SUPREME COURT VERDICT</div>
            </div>

            {/* 과실 비율 프로그레스 바 */}
            <div className={styles.barContainer}>
              <div className={styles.barLabelGroup}>
                <span style={{ color: '#ef4444' }}>{personA}: {verdict.faultA}%</span>
                <span style={{ color: '#3b82f6' }}>{personB}: {verdict.faultB}%</span>
              </div>
              <div className={styles.barWrapper}>
                <div className={styles.barA} style={{ width: `${verdict.faultA}%` }}>
                  {verdict.faultA}%
                </div>
                <div className={styles.barB} style={{ width: `${verdict.faultB}%` }}>
                  {verdict.faultB}%
                </div>
              </div>
            </div>

            <div className={styles.verdictBody}>
              {verdict.roastText}
            </div>

            <div className={styles.verdictGavel}>
              🔨 탕! 탕! 탕! (판결 완료)
            </div>

            <div className={styles.shareBtnGroup}>
              <button className={styles.shareBtn} onClick={handleCopyShare}>
                {copied ? '✅ 판결문 링크 복사 완료!' : '🔗 판결문 카톡 단톡방 공유하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      <AdSlot type="main" />
    </div>
  );
}
