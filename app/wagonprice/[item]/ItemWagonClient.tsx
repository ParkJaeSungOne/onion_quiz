'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import { PRESETS, ProductPreset } from '../presets';
import styles from '../wagonprice.module.css';

interface ItemWagonClientProps {
  preset: ProductPreset;
}

export default function ItemWagonClient({ preset }: ItemWagonClientProps) {
  const [priceStr, setPriceStr] = useState<string>(preset.defaultPrice.toString());
  const [qtyStr, setQtyStr] = useState<string>(preset.defaultQty.toString());
  const [specStr, setSpecStr] = useState<string>(preset.specSize.toString());

  // 핫딜 계산 및 B급 팩폭 판정 (규격 직접 입력 반영 및 표준 규격 환산 적용)
  const calcResult = () => {
    const price = parseFloat(priceStr) || 0;
    const qty = parseFloat(qtyStr) || 1;
    const spec = parseFloat(specStr) || preset.specSize || 1;
    if (price <= 0 || qty <= 0 || spec <= 0) return null;

    const pricePerItem = Math.round(price / qty);

    // 입력받은 용량/규격(spec) 기반 환산 단가 계산
    let unitPrice = 0;
    if (preset.specSize > 1) {
      unitPrice = Math.round((pricePerItem / spec) * 100);
    } else {
      unitPrice = pricePerItem;
    }

    // 표준 규격(예: 210g, 355ml)으로 환산하여 핫딜 등급 공정 비교
    const normalizedPrice = preset.specSize > 1
      ? Math.round((pricePerItem / spec) * preset.specSize)
      : pricePerItem;

    let tier: 'top' | 'good' | 'fair' | 'bad' = 'fair';
    let badge = '🟡 [평범한 핫딜 🛒]';
    let verdict = '구매 시 무난한 마트가/행사가 수준입니다!';

    if (normalizedPrice <= preset.topDealPrice) {
      tier = 'top';
      badge = '🔥 [역대급 신의 딜 🚀]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원(${preset.specSize > 1 ? `${preset.specLabel} 환산 ${normalizedPrice.toLocaleString()}원` : '최저가 기준'})! 무조건 망설임 없이 결제 버튼 눌러야 하는 역대급 최저가 신의 딜입니다! ㅋㅋㅋ`;
    } else if (normalizedPrice <= preset.goodDealPrice) {
      tier = 'good';
      badge = '🟢 [혜자로운 핫딜 🛒]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원! 창고나 냉장고에 든든하게 쟁여두기 딱 좋은 갓성비 딜입니다.`;
    } else if (normalizedPrice <= preset.fairDealPrice) {
      tier = 'fair';
      badge = '🟡 [약간 아쉬운 가격 ⚠️]';
      verdict = `개당 ${pricePerItem.toLocaleString()}원... 아주 급한 거 아니면 알림 설정하고 다음 최저가 딜 존버를 권장합니다!`;
    } else {
      tier = 'bad';
      badge = '🔴 [호구 잡히는 바가지 💸]';
      verdict = `멈춰! 개당 ${pricePerItem.toLocaleString()}원에 사면 사장님 잇몸 미소 발출 ㅋㅋㅋ 행사나 묶음 할인 기다리세요!`;
    }

    return { pricePerItem, unitPrice, tier, badge, verdict, currentSpec: spec };
  };

  const res = calcResult();

  const getSpecUnitText = () => {
    if (preset.unitLabel.includes('g')) return 'g (그램)';
    if (preset.unitLabel.includes('ml')) return 'ml (밀리리터)';
    return '단위 수량';
  };

  return (
    <div>
      {/* 1. 메인 계산기 카드 */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>{preset.icon}</span>
          <div>
            <h2 className={styles.cardHeaderTitle}>{preset.name} 핫딜 판독기</h2>
            <p className={styles.cardHeaderDesc}>
              {preset.specLabel} 기준 | 용량, 금액, 수량을 직접 입력하고 역대 최저가 단가를 팩폭 판정받아보세요.
            </p>
          </div>
        </div>

        <div className={styles.formGrid}>
          {/* ✏️ 개별 용량/규격 직접 입력 필드 (preset.specSize > 1 인 경우) */}
          {preset.specSize > 1 && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>개당 용량/규격 직접 입력 ({getSpecUnitText()})</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder={`예: ${preset.specSize}`}
                  value={specStr}
                  onChange={(e) => setSpecStr(e.target.value)}
                />
                <span className={styles.unit}>{preset.unitLabel.includes('g') ? 'g' : 'ml'}</span>
              </div>
              <div className={styles.presetGroup} style={{ marginTop: '6px' }}>
                {preset.unitLabel.includes('g') ? (
                  <>
                    <button
                      className={`${styles.presetBtn} ${specStr === '210' ? styles.presetBtnActive : ''}`}
                      onClick={() => setSpecStr('210')}
                    >
                      210g (기본)
                    </button>
                    <button
                      className={`${styles.presetBtn} ${specStr === '300' ? styles.presetBtnActive : ''}`}
                      onClick={() => setSpecStr('300')}
                    >
                      300g (큰밥)
                    </button>
                    <button
                      className={`${styles.presetBtn} ${specStr === '130' ? styles.presetBtnActive : ''}`}
                      onClick={() => setSpecStr('130')}
                    >
                      130g (작은밥/120g)
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`${styles.presetBtn} ${specStr === '355' ? styles.presetBtnActive : ''}`}
                      onClick={() => setSpecStr('355')}
                    >
                      355ml (뚱캔)
                    </button>
                    <button
                      className={`${styles.presetBtn} ${specStr === '250' ? styles.presetBtnActive : ''}`}
                      onClick={() => setSpecStr('250')}
                    >
                      250ml (씬캔)
                    </button>
                    <button
                      className={`${styles.presetBtn} ${specStr === '500' ? styles.presetBtnActive : ''}`}
                      onClick={() => setSpecStr('500')}
                    >
                      500ml (페트)
                    </button>
                    <button
                      className={`${styles.presetBtn} ${specStr === '1500' ? styles.presetBtnActive : ''}`}
                      onClick={() => setSpecStr('1500')}
                    >
                      1.5L (대용량)
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>총 결제 가격</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                placeholder={`예: ${preset.defaultPrice}`}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
              />
              <span className={styles.unit}>원</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>총 수량 ({preset.unitName}수)</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                placeholder={`예: ${preset.defaultQty}`}
                value={qtyStr}
                onChange={(e) => setQtyStr(e.target.value)}
              />
              <span className={styles.unit}>{preset.unitName}</span>
            </div>
            <div className={styles.presetGroup} style={{ marginTop: '6px' }}>
              {['6', '12', '24', '30', '36', '48'].map((q) => (
                <button
                  key={q}
                  className={`${styles.presetBtn} ${qtyStr === q ? styles.presetBtnActive : ''}`}
                  onClick={() => setQtyStr(q)}
                >
                  {q}{preset.unitName}
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
                <span className={styles.metricLabel}>{preset.unitName}당 결제 단가</span>
                <span className={styles.metricVal}>{res.pricePerItem.toLocaleString()}원</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>{preset.unitLabel} 환산 단가</span>
                <span className={styles.metricVal}>{res.unitPrice.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        )}

        {/* 📊 현재 선택 품목의 딜 구간별 팩폭 가이드표 */}
        <div className={styles.tierTableSection}>
          <h3 className={styles.tierTableTitle}>📊 {preset.name} 딜 구간별 가격 가이드표</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.tierTable}>
              <thead>
                <tr>
                  <th>구간 등급</th>
                  <th>개당 단가 기준</th>
                  <th>환산 단가</th>
                  <th>웨건 팩폭 판정</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.trTop}>
                  <td><span className={styles.tagTop}>🔥 역대급 신의 딜</span></td>
                  <td><strong>{preset.topDealPrice.toLocaleString()}원 이하</strong></td>
                  <td>{preset.specSize > 1 ? `${Math.round((preset.topDealPrice / preset.specSize) * 100).toLocaleString()}원 / 100${preset.unitLabel.includes('g') ? 'g' : 'ml'}` : `${preset.topDealPrice.toLocaleString()}원 / 1개`}</td>
                  <td>무지성 영혼의 즉시 결제 딜! 🚀</td>
                </tr>
                <tr className={styles.trGood}>
                  <td><span className={styles.tagGood}>🟢 혜자로운 핫딜</span></td>
                  <td><strong>{(preset.topDealPrice + 1).toLocaleString()}원 ~ {preset.goodDealPrice.toLocaleString()}원</strong></td>
                  <td>{preset.specSize > 1 ? `${Math.round((preset.goodDealPrice / preset.specSize) * 100).toLocaleString()}원 / 100${preset.unitLabel.includes('g') ? 'g' : 'ml'}` : `${preset.goodDealPrice.toLocaleString()}원 / 1개`}</td>
                  <td>창고/냉장고 든든한 갓성비 딜! 🛒</td>
                </tr>
                <tr className={styles.trFair}>
                  <td><span className={styles.tagFair}>🟡 평범한 행사가</span></td>
                  <td><strong>{(preset.goodDealPrice + 1).toLocaleString()}원 ~ {preset.fairDealPrice.toLocaleString()}원</strong></td>
                  <td>{preset.specSize > 1 ? `${Math.round((preset.fairDealPrice / preset.specSize) * 100).toLocaleString()}원 / 100${preset.unitLabel.includes('g') ? 'g' : 'ml'}` : `${preset.fairDealPrice.toLocaleString()}원 / 1개`}</td>
                  <td>급하면 사되 존버 권장! ⚠️</td>
                </tr>
                <tr className={styles.trBad}>
                  <td><span className={styles.tagBad}>🔴 바가지 구간</span></td>
                  <td><strong>{(preset.fairDealPrice + 1).toLocaleString()}원 이상</strong></td>
                  <td>-</td>
                  <td>멈춰! 사장님 잇몸 미소 구간 💸</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 핫딜 검색 링크 */}
        <div className={styles.searchLinks}>
          <span className={styles.searchTitle}>🔎 실시간 {preset.name} 핫딜 검색하기</span>
          <div className={styles.linkGroup}>
            <a
              href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(preset.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shopLinkBtn}
            >
              🟩 네이버 쇼핑 핫딜 검색
            </a>
            <a
              href={`https://www.coupang.com/np/search?component=&q=${encodeURIComponent(preset.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.shopLinkBtn}
            >
              🚀 쿠팡 로켓 핫딜 검색
            </a>
          </div>
        </div>
      </div>

      {/* 3. 다른 생필품 웨건 스위처 (하단 다른 품목 바로가기) */}
      <div style={{ marginTop: '36px' }}>
        <h3 className={styles.searchTitle} style={{ fontSize: '15px', marginBottom: '12px' }}>
          🛒 다른 생필품 핫딜 계산기로 이동하기
        </h3>
        <div className={styles.categoryGrid}>
          {PRESETS.map((p) => {
            const isCurrent = p.id === preset.id;
            return (
              <Link
                key={p.id}
                href={`/wagonprice/${p.id}`}
                className={`${styles.catBtn} ${isCurrent ? styles.catBtnActive : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <span className={styles.catIcon}>{p.icon}</span>
                <span className={styles.catName}>{p.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 하단 광고 슬롯 */}
      <AdSlot type="main" />
    </div>
  );
}
