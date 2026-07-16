import React from 'react';

interface OnionLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function OnionLogo({ width = 48, height = 48, className }: OnionLogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      width={width} 
      height={height} 
      className={className}
    >
      <defs>
        {/* 양파 특유의 붉은 보라/자색을 고급스럽게 살린 그라데이션 */}
        <linearGradient id="onionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d946ef" /> {/* Fuchsia */}
          <stop offset="50%" stopColor="#8b5cf6" />  {/* Violet */}
          <stop offset="100%" stopColor="#ec4899" /> {/* Pink */}
        </linearGradient>
      </defs>
      
      {/* 양파 몸통 */}
      <path 
        d="M50 12 C44 32 20 42 20 64 C20 81 32 91 50 91 C68 91 80 81 80 64 C80 42 56 32 50 12 Z" 
        fill="url(#onionGrad)" 
      />
      
      {/* 겉껍질 레이어 세로줄 패턴 (양파 껍질 질감) */}
      <path 
        d="M50 12 C47 36 32 48 32 64 C32 77 40 85 50 85" 
        fill="none" 
        stroke="rgba(255, 255, 255, 0.35)" 
        strokeWidth="2.5" 
      />
      <path 
        d="M50 12 C53 36 68 48 68 64 C68 77 60 85 50 85" 
        fill="none" 
        stroke="rgba(255, 255, 255, 0.35)" 
        strokeWidth="2.5" 
      />
      <path 
        d="M50 12 C49 38 42 52 42 64 C42 77 46 83 50 85" 
        fill="none" 
        stroke="rgba(255, 255, 255, 0.25)" 
        strokeWidth="1.5" 
      />
      <path 
        d="M50 12 C51 38 58 52 58 64 C58 77 54 83 50 85" 
        fill="none" 
        stroke="rgba(255, 255, 255, 0.25)" 
        strokeWidth="1.5" 
      />
      
      {/* 하단 뿌리 */}
      <path 
        d="M40 91 L37 96 M45 92 L44 98 M50 92 L50 99 M55 92 L56 98 M60 91 L63 96" 
        stroke="rgba(255, 255, 255, 0.5)" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
