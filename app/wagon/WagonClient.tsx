'use client';

import React, { useState } from 'react';
import styles from './wagon.module.css';

type Mode = 'hetbahn' | 'coke';

export default function WagonClient() {
  const [mode, setMode] = useState<Mode>('hetbahn');

  // 🍚 햇반웨건 계산기 상태
  const [hetPrice, setHetPrice] = useState<string>('26900');
  const [hetQty, setHetQty] = useState<string>('36');
  const [hetGram, setHetGram] = useState<number>(210); // 210g (기존), 210g (큰밥 300g 등)

  // 🥤 코카콜라웨건 계산기 상태
  const [cokePrice, setCokePrice] = useState<string>('18900');
  const [cokeQty, setCokeQty] = useState<string>('24');
  const [cokeType, setCokeType] = useState<number>(355); // 355ml 캔, 500ml 페트, 1.5L 페트, 250ml 캔

  // 🍚 햇반 핫딜 계산 및 B급 팩폭 판정
  const calcHetbahn = () => {
    const price = parseFloat(hetPrice) || 0;
    const qty = parseFloat(hetQty) || 1;
    if (price <= 0 || qty <= 0) return null;

    const pricePerPack = Math.round(price / qty);
    // 210g 기준 환산 단가
    const normalizedPrice210g = Math.round((pricePerPack / hetGram) * 210);
    const pricePer100g = Math.round((pricePerPack / hetGram) * 100);

    let tier: 'top' | 'good' | 'fair' | 'bad' = 'fair';
    let badge = '🟡 [평타 무난한 핫딜 🛒]';
    let verdict = '지금 밥통 비었으면 쟁여둘 만한 무난한 타협 가격대입니다!';

    if (normalizedPrice210g <= 720) {
      tier = 'top';
      badge = '🔥 [역대급 신의 딜 🚀]';
      verdict = `개당 ${pricePerPack.toLocaleString()}원(210g 환산 ${normalizedPrice210g.toLocaleString()}원)은 무조건 무지성 결제 버튼 눌러야 하는 자취생 영혼의 양식 역대급 최저가 딜입니다! ㅋㅋㅋ`;
    } else if (normalizedPrice210g <= 850) {
      tier = 'good';
      badge = '🟢 [혜자로운 핫딜 🛒]';
      verdict = `개당 ${pricePerPack.toLocaleString()}원! 쌀통 비었으면 망설임 없이 창고에 적재해도 될 든든한 갓성비 딜입니다.`;
    } else if (normalizedPrice210g <= 980) {
      tier = 'fair';
      badge = '🟡 [약간 아쉬운 가격대 ⚠️]';
      verdict = `개당 ${pricePerPack.toLocaleString()}원... 아주 급한 거 아니면 알림 설정해두고 다음 700원대 핫딜 기다리는 게 약간 이득!`;
    } else {
      tier = 'bad';
      badge = '🔴 [호구 잡히는 바가지 💸]';
      verdict = `멈춰! 개당 ${pricePerPack.toLocaleString()}원에 사면 자취방 월세 날아갑니다 ㅋㅋㅋ 이 가격이면 마트 세일 기다리세요!`;
    }

    return { pricePerPack, normalizedPrice210g, pricePer100g, tier, badge, verdict };
  };

  // 🥤 코카콜라 핫딜 계산 및 B급 팩폭 판정
  const calcCoke = () => {
    const price = parseFloat(cokePrice) || 0;
    const qty = parseFloat(cokeQty) || 1;
    if (price <= 0 || qty <= 0) return null;

    const pricePerItem = Math.round(price / qty);
    const pricePer100ml = Math.round((pricePerItem / cokeType) * 100);

    // 355ml 캔 기준 환산 단가
    const normalized355ml = Math.round((pricePerItem / cokeType) * 355);

    let tier: 'top' | 'good' | 'fair' | 'bad' = 'fair';
    let badge = '🟡 [평범한 핫딜 🛒]';
    let verdict = '냉장고 채우기 무난한 가격대입니다!';

    if (normalized355ml <= 680) {
      tier = 'top';
      badge = '🔥 [탄산 도파민 폭발 🚀]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원(355ml 환산 ${normalized355ml.toLocaleString()}원)! 역대급 딜 터졌습니다! 이 가격이면 대용량 박스 채 적재하는 게 지능 승리! ㅋㅋㅋ`;
    } else if (normalized355ml <= 850) {
      tier = 'good';
      badge = '🟢 [시원한 갓성비 🛒]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원! 시원한 제로 코크 든든하게 박스로 쟁여두기 딱 좋은 혜자 가격대입니다.`;
    } else if (normalized355ml <= 1050) {
      tier = 'fair';
      badge = '🟡 [편의점 행사가 ⚠️]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원... 편의점 2+1 행사랑 큰 차이 없는 평범한 가격! 당장 목마른 거 아니면 다음 딜 존버 권장!`;
    } else {
      tier = 'bad';
      badge = '🔴 [바가지 편의점 원가 💸]';
      verdict = `멈춰! 개당 ${pricePerItem.toLocaleString()}원에 사면 사장님 잇몸 미소 발출 ㅋㅋㅋ 행사 기다리거나 묶음 할인 탐색하세요!`;
    }

    return { pricePerItem, normalized355ml, pricePer100ml, tier, badge, verdict };
  };

  const hetRes = calcHetbahn();
  const cokeRes = calcCoke();

  return (
    <div>
      {/* 1. 웨건 모드 선택 탭 */}
      <div className={styles.tabGroup}>
        <button
          className={`${styles.tabBtn} ${mode === 'hetbahn' ? styles.tabBtnActiveHetbahn : ''}`}
          onClick={() => setMode('hetbahn')}
        >
          🍚 햇반웨건 (햇반 단가)
        </button>
        <button
          className={`${styles.tabBtn} ${mode === 'coke' ? styles.tabBtnActiveCoke : ''}`}
          onClick={() => setMode('coke')}
        >
          🥤 코카콜라웨건 (코크 단가)
        </button>
      </div>

      {/* 2. 햇반웨건 계산기 */}
      {mode === 'hetbahn' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🍚</span>
            <div>
              <h2 className={styles.cardTitle}>햇반 핫딜 가성비 판독기</h2>
              <p className={styles.cardDesc}>햇반 총 가격과 개수를 입력하면 개당 단가와 핫딜 등급을 판정합니다.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>용량 선택</label>
              <div className={styles.presetGroup}>
                {[
                  { label: '햇반 210g (기본)', val: 210 },
                  { label: '햇반 210g (큰밥 300g)', val: 300 },
                  { label: '작은밥 130g', val: 130 },
                ].map((item) => (
                  <button
                    key={item.val}
                    className={`${styles.presetBtn} ${hetGram === item.val ? styles.presetBtnActive : ''}`}
                    onClick={() => setHetGram(item.val)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>총 구매 가격</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="예: 26900"
                  value={hetPrice}
                  onChange={(e) => setHetPrice(e.target.value)}
                />
                <span className={styles.unit}>원</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>총 개수 (팩수)</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="예: 36"
                  value={hetQty}
                  onChange={(e) => setHetQty(e.target.value)}
                />
                <span className={styles.unit}>개</span>
              </div>
              <div className={styles.presetGroup} style={{ marginTop: '4px' }}>
                {['12', '24', '36', '48'].map((q) => (
                  <button
                    key={q}
                    className={`${styles.presetBtn} ${hetQty === q ? styles.presetBtnActive : ''}`}
                    onClick={() => setHetQty(q)}
                  >
                    {q}개 묶음
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 결과 박스 */}
          {hetRes && (
            <div className={`${styles.resultBox} ${
              hetRes.tier === 'top' ? styles.tierTop :
              hetRes.tier === 'good' ? styles.tierGood :
              hetRes.tier === 'fair' ? styles.tierFair : styles.tierBad
            }`}>
              <div className={`${styles.badge} ${
                hetRes.tier === 'top' ? styles.badgeTop :
                hetRes.tier === 'good' ? styles.badgeGood :
                hetRes.tier === 'fair' ? styles.badgeFair : styles.badgeBad
              }`}>
                {hetRes.badge}
              </div>

              <div className={styles.verdictText}>
                "{hetRes.verdict}"
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>개당 결제 단가</span>
                  <span className={styles.metricVal}>{hetRes.pricePerPack.toLocaleString()}원</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>100g당 환산 가격</span>
                  <span className={styles.metricVal}>{hetRes.pricePer100g.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          )}

          {/* 핫딜 검색 링크 */}
          <div className={styles.searchLinks}>
            <span className={styles.searchTitle}>🔎 실시간 햇반 핫딜 탐색하기</span>
            <div className={styles.linkGroup}>
              <a
                href="https://search.shopping.naver.com/search/all?query=%ED%96%87%EB%B0%98%20210g%2036%EA%B0%9C"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shopLinkBtn}
              >
                🟩 네이버 쇼핑 핫딜 검색
              </a>
              <a
                href="https://www.coupang.com/np/search?component=&q=%ED%96%87%EB%B0%98"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shopLinkBtn}
              >
                🚀 쿠팡 로켓 햇반 검색
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. 코카콜라웨건 계산기 */}
      {mode === 'coke' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🥤</span>
            <div>
              <h2 className={styles.cardTitle}>코카콜라 핫딜 가성비 판독기</h2>
              <p className={styles.cardDesc}>코카콜라 / 제로 코크 총 가격과 개수를 입력하면 캔당 단가를 판정합니다.</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>용량 규격 선택</label>
              <div className={styles.presetGroup}>
                {[
                  { label: '355ml 뚱캔 (인기)', val: 355 },
                  { label: '500ml 페트', val: 500 },
                  { label: '1.5L 페트', val: 1500 },
                  { label: '250ml 씬캔', val: 250 },
                ].map((item) => (
                  <button
                    key={item.val}
                    className={`${styles.presetBtn} ${cokeType === item.val ? styles.presetBtnActive : ''}`}
                    onClick={() => setCokeType(item.val)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>총 구매 가격</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="예: 18900"
                  value={cokePrice}
                  onChange={(e) => setCokePrice(e.target.value)}
                />
                <span className={styles.unit}>원</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>총 수량 (캔/병 수)</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="예: 24"
                  value={cokeQty}
                  onChange={(e) => setCokeQty(e.target.value)}
                />
                <span className={styles.unit}>개</span>
              </div>
              <div className={styles.presetGroup} style={{ marginTop: '4px' }}>
                {['12', '24', '36', '48'].map((q) => (
                  <button
                    key={q}
                    className={`${styles.presetBtn} ${cokeQty === q ? styles.presetBtnActive : ''}`}
                    onClick={() => setCokeQty(q)}
                  >
                    {q}개 박스
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 결과 박스 */}
          {cokeRes && (
            <div className={`${styles.resultBox} ${
              cokeRes.tier === 'top' ? styles.tierTop :
              cokeRes.tier === 'good' ? styles.tierGood :
              cokeRes.tier === 'fair' ? styles.tierFair : styles.tierBad
            }`}>
              <div className={`${styles.badge} ${
                cokeRes.tier === 'top' ? styles.badgeTop :
                cokeRes.tier === 'good' ? styles.badgeGood :
                cokeRes.tier === 'fair' ? styles.badgeFair : styles.badgeBad
              }`}>
                {cokeRes.badge}
              </div>

              <div className={styles.verdictText}>
                "{cokeRes.verdict}"
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>개당 결제 단가</span>
                  <span className={styles.metricVal}>{cokeRes.pricePerItem.toLocaleString()}원</span>
                </div>
                <div className={styles.metricItem}>
                  <span className={styles.metricLabel}>100ml당 환산 가격</span>
                  <span className={styles.metricVal}>{cokeRes.pricePer100ml.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          )}

          {/* 핫딜 검색 링크 */}
          <div className={styles.searchLinks}>
            <span className={styles.searchTitle}>🔎 실시간 코카콜라 제로 핫딜 탐색하기</span>
            <div className={styles.linkGroup}>
              <a
                href="https://search.shopping.naver.com/search/all?query=%EC%BD%94%EC%B9%B4%EC%BD%9C%EB%9D%BC%20%EC%A0%9C%EB%A1%9C%20355ml%2024%EC%BA%94"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shopLinkBtn}
              >
                🟩 네이버 쇼핑 코크 핫딜
              </a>
              <a
                href="https://www.coupang.com/np/search?component=&q=%EC%BD%94%EC%B9%B4%EC%BD%9C%EB%9D%BC+%EC%A0%9C%EB%A1%9C"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shopLinkBtn}
              >
                🚀 쿠팡 로켓 코크 핫딜
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
