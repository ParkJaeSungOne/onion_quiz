'use client';

import React, { useState } from 'react';
import AdSlot from '@/components/AdSlot';
import styles from './secondhand.module.css';

export default function SecondhandClient() {
  const [itemName, setItemName] = useState<string>('아이폰 15 프로 128GB');
  const [originalPriceStr, setOriginalPriceStr] = useState<string>('1200000');
  const [offerPriceStr, setOfferPriceStr] = useState<string>('600000');
  const [buyerMsg, setBuyerMsg] = useState<string>('학생이라 돈이 부족한데 60만원에 가능할까요? 직거래 금방 갑니다');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const presets = [
    { name: '아이폰 15 프로 128G', orig: '1200000', offer: '600000', msg: '학생이라 60만원에 가능할까요? 네고 해주시면 바로 사러 갑니다!' },
    { name: '에어팟 프로 2세대', orig: '250000', offer: '100000', msg: '10만원에 되나요? 직거래 택배 둘 다 가능합니다' },
    { name: '닌텐도 스위치 OLED', orig: '350000', offer: '180000', msg: '아이 선물 주려는데 18만원에 부탁드려요 ㅠㅠ' },
    { name: '맥북 에어 M2 16G', orig: '1400000', offer: '800000', msg: '80만원에 주시면 오늘 당장 직거래 갈게요' },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setItemName(p.name);
    setOriginalPriceStr(p.orig);
    setOfferPriceStr(p.offer);
    setBuyerMsg(p.msg);
  };

  const calcDeal = () => {
    const orig = parseFloat(originalPriceStr) || 0;
    const offer = parseFloat(offerPriceStr) || 0;
    if (orig <= 0 || offer <= 0) return null;

    const discountRate = Math.round(((orig - offer) / orig) * 100);

    let tier = '🟢 혜자 중고 딜 (적정 시세)';
    let tierColor = '#15803d';
    let summary = `적정 시세 대비 약 ${discountRate}% 할인된 제안입니다. 합리적인 중고 거래입니다.`;

    if (discountRate >= 50) {
      tier = '🔴 네고 거지 바가지 (50%+ 터무니없는 깎기)';
      tierColor = '#dc2626';
      summary = `원래 시세 대비 무려 ${discountRate}%나 후려치는 도둑놈 심보 네고입니다! 단호하게 퇴치해야 합니다.`;
    } else if (discountRate >= 30) {
      tier = '🟡 밀당 네고 딜 (30% 할인 요구)';
      tierColor = '#b45309';
      summary = `조금 짠 편이지만 네고 협상의 여지가 있는 제안입니다.`;
    }

    // 퇴치 멘트 3종 세트
    const gentleMsg = `안녕하세요! 문의 감사합니다. 말씀하신 ${offer.toLocaleString()}원은 시세 대비 차이가 너무 커서 죄송하지만 판매가 어렵습니다. ${orig.toLocaleString()}원 정가에 구매 원하시면 연락 주세요! 좋은 하루 보내세요 ^^`;
    
    const bgradeMsg = `안녕하세요~ 네고 문의는 감사한데 ${discountRate}%나 깎아달라고 하시는 건 조금 과하시네요 ㅋㅋㅋ 그 가격이면 제가 그쪽 물건 ${offer.toLocaleString()}원에 사겠습니다! 정가 거래만 합니다~`;
    
    const dopamineMsg = `🚨 [당근 법정 주의보] ${discountRate}% 후려치기 네고 거지를 포착했습니다 ㅋㅋㅋ 학생이시면 공부를 더 하셔서 새 제품 사시는 걸 강력 추천드립니다! 메롱 👅`;

    return {
      discountRate,
      tier,
      tierColor,
      summary,
      refusals: [
        { type: 'gentle', tag: '😇 젠틀한 비즈니스 사절', style: styles.tagGentle, text: gentleMsg },
        { type: 'bgrade', tag: '⚡ B급 팩폭 단호박 사절', style: styles.tagBgrade, text: bgradeMsg },
        { type: 'dopamine', tag: '💥 도파민 킹받는 짤 반격', style: styles.tagDopamine, text: dopamineMsg },
      ]
    };
  };

  const dealRes = calcDeal();

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div>
      <AdSlot type="main" />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>🥕</span>
          <div>
            <h2 className={styles.cardHeaderTitle}>당근/중고 딜 & 네고 퇴치기</h2>
            <p className={styles.cardHeaderDesc}>
              중고물품 제시가를 팩폭 판정하고, 50% 후려치는 네고 거지용 퇴치 멘트 3종을 1초 만에 자동 생성합니다.
            </p>
          </div>
        </div>

        {/* 템플릿 프리셋 */}
        <div style={{ marginBottom: '18px' }}>
          <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>🔥 흔한 네고 거지 사례 템플릿</label>
          <div className={styles.presetGroup}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                className={styles.presetBtn}
                onClick={() => handleSelectPreset(p)}
              >
                🥕 {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>중고 물품명</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.input}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>내 희망 정가 / 시세</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                value={originalPriceStr}
                onChange={(e) => setOriginalPriceStr(e.target.value)}
              />
              <span className={styles.unit}>원</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>구매자가 제시한 후려치기 네고가</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                value={offerPriceStr}
                onChange={(e) => setOfferPriceStr(e.target.value)}
              />
              <span className={styles.unit}>원</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>구매자 킹받는 핑계/문자 내용</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.input}
                value={buyerMsg}
                onChange={(e) => setBuyerMsg(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 판정 결과 및 퇴치 멘트 카드 */}
        {dealRes && (
          <div className={styles.resultBox}>
            <div className={styles.resultTitle} style={{ color: dealRes.tierColor }}>
              {dealRes.tier}
            </div>

            <div className={styles.roastBox}>
              💬 {dealRes.summary} (할인 요구율: {dealRes.discountRate}%)
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 900, marginBottom: '12px' }}>
              🛡️ 네고 거지 킹받는 퇴치 멘트 3종 (클릭 시 자동 복사):
            </h3>

            {dealRes.refusals.map((ref, idx) => (
              <div key={idx} className={styles.refusalCard}>
                <div className={styles.refusalHeader}>
                  <span className={`${styles.refusalTag} ${ref.style}`}>{ref.tag}</span>
                  <button className={styles.copyBtn} onClick={() => handleCopyText(ref.text, idx)}>
                    {copiedIndex === idx ? '✅ 복사 완료!' : '📋 멘트 복사'}
                  </button>
                </div>
                <div className={styles.refusalText}>{ref.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdSlot type="main" />
    </div>
  );
}
