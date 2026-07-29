'use client';

import React, { useState } from 'react';
import AdSlot from '@/components/AdSlot';
import styles from './receipt.module.css';

export default function ReceiptClient() {
  const [salaryStr, setSalaryStr] = useState<string>('3000000');
  const [expenseStr, setExpenseStr] = useState<string>('24000');
  const [category, setCategory] = useState<string>('야식/배달');
  const [itemName, setItemName] = useState<string>('마라탕+꿔바로우 배달');
  const [copied, setCopied] = useState<boolean>(false);

  const categories = [
    { id: '야식/배달', icon: '🍗', defaultItem: '야식 배달 족발/마라탕' },
    { id: '홧김비용', icon: '🔥', defaultItem: '스트레스 홧김 쇼핑' },
    { id: '택시비', icon: '🚕', defaultItem: '늦잠 택시비' },
    { id: '술자리/인싸', icon: '🍺', defaultItem: '불금 술자리 골든벨' },
    { id: '카페/디저트', icon: '☕', defaultItem: '스타벅스 프라푸치노' },
    { id: '할부/지름신', icon: '📱', defaultItem: '최신 전자기기 할부' },
  ];

  const handleSelectCategory = (cat: { id: string; icon: string; defaultItem: string }) => {
    setCategory(cat.id);
    setItemName(cat.defaultItem);
  };

  const calcReceipt = () => {
    const salary = parseFloat(salaryStr) || 0;
    const expense = parseFloat(expenseStr) || 0;
    if (salary <= 0 || expense <= 0) return null;

    // 시급 계산 (월 209시간 기준)
    const hourlyWage = Math.round(salary / 209);
    
    // 노동 환산 시간 (시간 & 분)
    const totalLaborMinutes = Math.round((expense / hourlyWage) * 60);
    const laborHours = Math.floor(totalLaborMinutes / 60);
    const laborMins = totalLaborMinutes % 60;

    // 은퇴 지연 시간 (일 & 시간)
    // 하루 일당 = hourlyWage * 8
    const dailyWage = hourlyWage * 8;
    const delayDays = (expense / dailyWage).toFixed(1);

    // 월급 대비 탕진 비율 %
    const wastePercent = ((expense / salary) * 100).toFixed(2);

    // B급 팩폭 총평 생성
    let roast = `이 ${expense.toLocaleString()}원 지름으로 인해 꼰대 상사 앞에서 억지 미소 ${laborHours > 0 ? `${laborHours}시간 ` : ''}${laborMins}분 더 구르셔야 합니다 ㅋㅋㅋ`;
    if (totalLaborMinutes > 300) {
      roast = `와... 이 ${expense.toLocaleString()}원은 회사의 노예로 꼬박 하루(8시간 이상)를 헌납한 가격입니다! 은퇴일이 ${delayDays}일 뒤로 연기되었습니다 ㅋㅋㅋ`;
    } else if (totalLaborMinutes < 30) {
      roast = `소소한 탕진 같지만 이 푼돈들이 모여 당신의 통장을 텅장으로 만듭니다! 정체불명의 소액 지출 주의 ⚠️`;
    }

    return {
      hourlyWage,
      laborHours,
      laborMins,
      delayDays,
      wastePercent,
      roast,
    };
  };

  const res = calcReceipt();

  const handleCopyShareLink = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://kkado-kkado.com/receipt';
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <AdSlot type="main" />

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderIcon}>🧾</span>
          <div>
            <h2 className={styles.cardHeaderTitle}>탕진 영수증 발급기</h2>
            <p className={styles.cardHeaderDesc}>
              월급과 탕진 항목을 입력하면 1초 만에 꼰대 상사 억지 미소 노동 시간과 은퇴 지연 시간을 팩폭 판정합니다.
            </p>
          </div>
        </div>

        <div className={styles.formGrid}>
          {/* 1. 카테고리 선택 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>탕진 카테고리 선택</label>
            <div className={styles.presetGroup}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.presetBtn} ${category === cat.id ? styles.presetBtnActive : ''}`}
                  onClick={() => handleSelectCategory(cat)}
                >
                  {cat.icon} {cat.id}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 세부 지출 품목명 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>지출 품목명</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.input}
                placeholder="예: 마라탕+꿔바로우 배달"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
          </div>

          {/* 3. 월급 입력 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>내 실수령 월급 (또는 월 용돈)</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                placeholder="예: 3000000"
                value={salaryStr}
                onChange={(e) => setSalaryStr(e.target.value)}
              />
              <span className={styles.unit}>원</span>
            </div>
            <div className={styles.presetGroup} style={{ marginTop: '6px' }}>
              {['2000000', '2500000', '3000000', '3500000', '4000000', '5000000'].map((s) => (
                <button
                  key={s}
                  className={`${styles.presetBtn} ${salaryStr === s ? styles.presetBtnActive : ''}`}
                  onClick={() => setSalaryStr(s)}
                >
                  {(parseInt(s, 10) / 10000).toLocaleString()}만원
                </button>
              ))}
            </div>
          </div>

          {/* 4. 탕진 금액 입력 */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>이번 탕진 금액 (결제 금액)</label>
            <div className={styles.inputWrapper}>
              <input
                type="number"
                className={styles.input}
                placeholder="예: 24000"
                value={expenseStr}
                onChange={(e) => setExpenseStr(e.target.value)}
              />
              <span className={styles.unit}>원</span>
            </div>
            <div className={styles.presetGroup} style={{ marginTop: '6px' }}>
              {['12000', '24000', '45000', '80000', '150000', '350000'].map((eVal) => (
                <button
                  key={eVal}
                  className={`${styles.presetBtn} ${expenseStr === eVal ? styles.presetBtnActive : ''}`}
                  onClick={() => setExpenseStr(eVal)}
                >
                  {parseInt(eVal, 10).toLocaleString()}원
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🧾 B급 키치 영수증 짤 렌더링 카드 */}
        {res && (
          <div className={styles.receiptPaper}>
            <div className={styles.receiptHeader}>
              <div className={styles.receiptTitle}>KKADO RECEIPT</div>
              <div className={styles.receiptSub}>까도까도 팩폭 탕진 영수증 연구소</div>
            </div>

            <div className={styles.receiptMeta}>
              <span>발행일자: 2026.07.29</span>
              <span>NO. #{Math.floor(1000 + Math.random() * 9000)}</span>
            </div>

            <table className={styles.receiptTable}>
              <thead>
                <tr>
                  <th>항목</th>
                  <th style={{ textAlign: 'right' }}>금액 / 환산</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{itemName} ({category})</td>
                  <td style={{ textAlign: 'right' }}>{parseInt(expenseStr, 10).toLocaleString()}원</td>
                </tr>
                <tr>
                  <td>내 시급 (월 209h 기준)</td>
                  <td style={{ textAlign: 'right' }}>{res.hourlyWage.toLocaleString()}원/h</td>
                </tr>
                <tr>
                  <td>꼰대 상사 억지 미소 노동 가치</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>
                    {res.laborHours > 0 ? `${res.laborHours}시간 ` : ''}{res.laborMins}분 노동
                  </td>
                </tr>
                <tr>
                  <td>은퇴 일자 연기 지연 시간</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>+{res.delayDays}일 연기 💸</td>
                </tr>
                <tr>
                  <td>월급 대비 탕진 비율</td>
                  <td style={{ textAlign: 'right' }}>{res.wastePercent}%</td>
                </tr>
              </tbody>
            </table>

            <div className={styles.receiptTotalRow}>
              <span>총 탕진 손실</span>
              <span>{parseInt(expenseStr, 10).toLocaleString()} 원</span>
            </div>

            <div className={styles.roastBox}>
              💬 "{res.roast}"
            </div>

            <div className={styles.barcodeArea}>
              <div className={styles.barcodeLines}></div>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '3px' }}>
                KKADO-RECEIPT-2026-FACTBOMB
              </div>
            </div>

            <div className={styles.shareBtnGroup}>
              <button className={styles.shareBtn} onClick={handleCopyShareLink}>
                {copied ? '✅ 영수증 링크 복사 완료!' : '🔗 탕진 영수증 짤 링크 공유하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      <AdSlot type="main" />
    </div>
  );
}
