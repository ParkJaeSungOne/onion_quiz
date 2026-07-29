'use client';

import React from 'react';
import Link from 'next/link';
import AdSlot from '@/components/AdSlot';
import { PRESETS } from './presets';
import styles from './wagonprice.module.css';

export default function WagonPriceClient() {
  return (
    <div>
      {/* 1. 12개 생필품 웨건 개별 전용 페이지 이동 버튼 그리드 */}
      <div style={{ marginTop: '12px', marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 900,
          color: '#000000',
          marginBottom: '14px',
          textAlign: 'center',
        }}>
          👇 계산하고 싶은 핫딜 생필품을 선택하세요!
        </h2>

        <div className={styles.categoryGrid}>
          {PRESETS.map((preset) => (
            <Link
              key={preset.id}
              href={`/wagonprice/${preset.id}`}
              className={styles.catBtn}
              style={{ textDecoration: 'none' }}
            >
              <span className={styles.catIcon}>{preset.icon}</span>
              <span className={styles.catName}>{preset.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. 하단 광고 슬롯 */}
      <AdSlot type="main" />
    </div>
  );
}
