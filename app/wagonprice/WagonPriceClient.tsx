'use client';

import React, { useState } from 'react';
import styles from './wagonprice.module.css';

interface ProductPreset {
  id: string;
  name: string;
  icon: string;
  unitName: string; // '개', '캔', '병', '판', '롤', '봉지'
  specLabel: string; // '210g', '355ml', '120g', '30구'
  defaultPrice: number;
  defaultQty: number;
  specSize: number; // 210 (g), 355 (ml), 120 (g), 1 (개)
  topDealPrice: number; // 개당 역대급 최저가 기준 단가
  goodDealPrice: number; // 개당 무난한 핫딜 기준 단가
  fairDealPrice: number; // 개당 아쉬운 일반 마트가 단가
  unitLabel: string; // '100g당', '100ml당', '1개당'
  searchQuery: string;
}

const PRESETS: ProductPreset[] = [
  {
    id: 'hetbahn',
    name: '즉석밥(햇반)',
    icon: '🍚',
    unitName: '개',
    specLabel: '210g 기본',
    defaultPrice: 26900,
    defaultQty: 36,
    specSize: 210,
    topDealPrice: 720,
    goodDealPrice: 850,
    fairDealPrice: 980,
    unitLabel: '100g당',
    searchQuery: '햇반 210g 36개 핫딜',
  },
  {
    id: 'ottogi_rice',
    name: '즉석밥(오뚜기)',
    icon: '🍚',
    unitName: '개',
    specLabel: '210g 기본',
    defaultPrice: 15400,
    defaultQty: 24,
    specSize: 210,
    topDealPrice: 650,
    goodDealPrice: 780,
    fairDealPrice: 900,
    unitLabel: '100g당',
    searchQuery: '오뚜기밥 210g 24개 핫딜',
  },
  {
    id: 'misik_rice',
    name: '즉석밥(더미식)',
    icon: '🍚',
    unitName: '개',
    specLabel: '210g 기본',
    defaultPrice: 21900,
    defaultQty: 24,
    specSize: 210,
    topDealPrice: 850,
    goodDealPrice: 990,
    fairDealPrice: 1150,
    unitLabel: '100g당',
    searchQuery: '더미식 백미밥 핫딜',
  },
  {
    id: 'coke_zero',
    name: '코카콜라(제로)',
    icon: '🥤',
    unitName: '캔',
    specLabel: '355ml 뚱캔',
    defaultPrice: 18900,
    defaultQty: 24,
    specSize: 355,
    topDealPrice: 680,
    goodDealPrice: 850,
    fairDealPrice: 1050,
    unitLabel: '100ml당',
    searchQuery: '코카콜라 제로 355ml 24캔 핫딜',
  },
  {
    id: 'coke_original',
    name: '코카콜라(일반)',
    icon: '🥤',
    unitName: '캔',
    specLabel: '355ml 뚱캔',
    defaultPrice: 20900,
    defaultQty: 24,
    specSize: 355,
    topDealPrice: 750,
    goodDealPrice: 920,
    fairDealPrice: 1100,
    unitLabel: '100ml당',
    searchQuery: '코카콜라 355ml 24캔 핫딜',
  },
  {
    id: 'pepsi_zero',
    name: '펩시(제로 라임)',
    icon: '🥤',
    unitName: '캔',
    specLabel: '355ml 뚱캔',
    defaultPrice: 15900,
    defaultQty: 24,
    specSize: 355,
    topDealPrice: 580,
    goodDealPrice: 720,
    fairDealPrice: 900,
    unitLabel: '100ml당',
    searchQuery: '펩시 제로 라임 355ml 24캔 핫딜',
  },
  {
    id: 'shin_ramen',
    name: '신라면(120g)',
    icon: '🍜',
    unitName: '봉지',
    specLabel: '120g 표준',
    defaultPrice: 15200,
    defaultQty: 20,
    specSize: 120,
    topDealPrice: 680,
    goodDealPrice: 820,
    fairDealPrice: 980,
    unitLabel: '100g당',
    searchQuery: '신라면 20봉지 핫딜',
  },
  {
    id: 'jin_ramen',
    name: '진라면(120g)',
    icon: '🍜',
    unitName: '봉지',
    specLabel: '120g 표준',
    defaultPrice: 11800,
    defaultQty: 20,
    specSize: 120,
    topDealPrice: 520,
    goodDealPrice: 650,
    fairDealPrice: 780,
    unitLabel: '100g당',
    searchQuery: '진라면 매운맛 20봉지 핫딜',
  },
  {
    id: 'eggs',
    name: '계란(30구 판란)',
    icon: '🥚',
    unitName: '구',
    specLabel: '특란 30구',
    defaultPrice: 6900,
    defaultQty: 30,
    specSize: 1,
    topDealPrice: 180,
    goodDealPrice: 230,
    fairDealPrice: 280,
    unitLabel: '1구당',
    searchQuery: '계란 30구 특란 핫딜',
  },
  {
    id: 'seoul_milk',
    name: '서울우유(1L)',
    icon: '🥛',
    unitName: '팩',
    specLabel: '1,000ml 팩',
    defaultPrice: 2890,
    defaultQty: 1,
    specSize: 1000,
    topDealPrice: 2400,
    goodDealPrice: 2700,
    fairDealPrice: 3000,
    unitLabel: '100ml당',
    searchQuery: '서울우유 1L 핫딜',
  },
  {
    id: 'tissue',
    name: '롤휴지(30롤)',
    icon: '🧻',
    unitName: '롤',
    specLabel: '3겹 30롤',
    defaultPrice: 14900,
    defaultQty: 30,
    specSize: 1,
    topDealPrice: 380,
    goodDealPrice: 500,
    fairDealPrice: 650,
    unitLabel: '1롤당',
    searchQuery: '3겹 롤휴지 30롤 핫딜',
  },
  {
    id: 'samdasoo',
    name: '삼다수 생수(2L)',
    icon: '💧',
    unitName: '병',
    specLabel: '2L 6병',
    defaultPrice: 5800,
    defaultQty: 6,
    specSize: 2000,
    topDealPrice: 600,
    goodDealPrice: 800,
    fairDealPrice: 1050,
    unitLabel: '100ml당',
    searchQuery: '삼다수 2L 6병 핫딜',
  },
];

export default function WagonPriceClient() {
  const [selectedId, setSelectedId] = useState<string>('hetbahn');
  const [priceStr, setPriceStr] = useState<string>('26900');
  const [qtyStr, setQtyStr] = useState<string>('36');

  const activePreset = PRESETS.find((p) => p.id === selectedId) || PRESETS[0];

  // 카테고리 전환 시 기본 가격 및 개수 자동 채움
  const handleSelectCategory = (preset: ProductPreset) => {
    setSelectedId(preset.id);
    setPriceStr(preset.defaultPrice.toString());
    setQtyStr(preset.defaultQty.toString());
  };

  // 핫딜 계산 및 B급 팩폭 판정
  const calcResult = () => {
    const price = parseFloat(priceStr) || 0;
    const qty = parseFloat(qtyStr) || 1;
    if (price <= 0 || qty <= 0) return null;

    const pricePerItem = Math.round(price / qty);

    let unitPrice = 0;
    if (activePreset.specSize > 1) {
      // 100g 또는 100ml 당 단가
      unitPrice = Math.round((pricePerItem / activePreset.specSize) * 100);
    } else {
      // 1개/1롤/1구 당 단가
      unitPrice = pricePerItem;
    }

    let tier: 'top' | 'good' | 'fair' | 'bad' = 'fair';
    let badge = '🟡 [평범한 핫딜 🛒]';
    let verdict = '구매 시 무난한 마트가/행사가 수준입니다!';

    if (pricePerItem <= activePreset.topDealPrice) {
      tier = 'top';
      badge = '🔥 [역대급 신의 딜 🚀]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원! 이건 망설임 없이 결제 버튼 눌러야 하는 역대급 최저가 신의 딜입니다! ㅋㅋㅋ`;
    } else if (pricePerItem <= activePreset.goodDealPrice) {
      tier = 'good';
      badge = '🟢 [혜자로운 핫딜 🛒]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원! 창고나 냉장고에 든든하게 쟁여두기 딱 좋은 갓성비 딜입니다.`;
    } else if (pricePerItem <= activePreset.fairDealPrice) {
      tier = 'fair';
      badge = '🟡 [약간 아쉬운 가격 ⚠️]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원... 아주 급한 거 아니면 알림 설정하고 다음 최저가 딜 존버를 권장합니다!`;
    } else {
      tier = 'bad';
      badge = '🔴 [호구 잡히는 바가지 💸]';
      verdict = `멈춰! 개당 ${pricePerItem.toLocaleString()}원에 사면 사장님 잇몸 미소 발출 ㅋㅋㅋ 행사나 묶음 할인 기다리세요!`;
    }

    return { pricePerItem, unitPrice, tier, badge, verdict };
  };

  const res = calcResult();

  return (
    <div>
      {/* 1. 12개 생필품 카테고리 선택 버튼 그리드 */}
      <div className={styles.categoryGrid}>
        {PRESETS.map((preset) => {
          const isActive = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              className={`${styles.catBtn} ${isActive ? styles.catBtnActive : ''}`}
              onClick={() => handleSelectCategory(preset)}
            >
              <span className={styles.catIcon}>{preset.icon}</span>
              <span className={styles.catName}>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. 메인 계산기 카드 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>{activePreset.icon}</span>
          <div>
            <h2 className={styles.cardHeaderTitle}>{activePreset.name} 핫딜 판독기</h2>
            <p className={styles.cardHeaderDesc}>
              {activePreset.specLabel} 기준 | 결제 금액과 수량을 입력하면 역대 최저가 단가를 팩폭 판정합니다.
            </p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>총 결제 가격</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                placeholder="예: 26900"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
              />
              <span className={styles.unit}>원</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>총 수량 ({activePreset.unitName}수)</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                placeholder="예: 36"
                value={qtyStr}
                onChange={(e) => setQtyStr(e.target.value)}
              />
              <span className={styles.unit}>{activePreset.unitName}</span>
            </div>
            <div className={styles.presetGroup} style={{ marginTop: '6px' }}>
              {['6', '12', '24', '30', '36', '48'].map((q) => (
                <button
                  key={q}
                  className={`${styles.presetBtn} ${qtyStr === q ? styles.presetBtnActive : ''}`}
                  onClick={() => setQtyStr(q)}
                >
                  {q}{activePreset.unitName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 결과 판정 박스 */}
        {res && (
          <div className={`${styles.resultBox} ${
            res.tier === 'top' ? styles.tierTop :
            res.tier === 'good' ? styles.tierGood :
            res.tier === 'fair' ? styles.tierFair : styles.tierBad
          }`}>
            <div className={`${styles.badge} ${
              res.tier === 'top' ? styles.badgeTop :
              res.tier === 'good' ? styles.badgeGood :
              res.tier === 'fair' ? styles.badgeFair : styles.badgeBad
            }`}>
              {res.badge}
            </div>

            <div className={styles.verdictText}>
              "{res.verdict}"
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>{activePreset.unitName}당 결제 단가</span>
                <span className={styles.metricVal}>{res.pricePerItem.toLocaleString()}원</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>{activePreset.unitLabel} 환산 단가</span>
                <span className={styles.metricVal}>{res.unitPrice.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        )}

        {/* 핫딜 검색 링크 */}
        <div className={styles.searchLinks}>
          <span className={styles.searchTitle}>🔎 실시간 {activePreset.name} 핫딜 검색하기</span>
          <div className={styles.linkGroup}>
            <a
              href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(activePreset.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shopLinkBtn}
            >
              🟩 네이버 쇼핑 핫딜 검색
            </a>
            <a
              href={`https://www.coupang.com/np/search?component=&q=${encodeURIComponent(activePreset.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shopLinkBtn}
            >
              🚀 쿠팡 로켓 핫딜 검색
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
