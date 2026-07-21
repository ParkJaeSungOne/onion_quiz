'use client';

import React, { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // 기본값은 시스템 다크모드 여부와 관계없이 무조건 오리지널 키치 테마('light')로 고정
      const defaultTheme = 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  if (!mounted) {
    return (
      <button style={{
        padding: '6px 12px',
        fontSize: '12.5px',
        fontWeight: 900,
        borderRadius: '8px',
        border: '2.5px solid #000000',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        visibility: 'hidden'
      }}>
        🕶️ 네온 모드
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '6px 12px',
        fontSize: '12.5px',
        fontWeight: 900,
        borderRadius: '8px',
        border: '2.5px solid #000000',
        backgroundColor: theme === 'dark' ? '#1e1b4b' : '#ffffff',
        color: theme === 'dark' ? '#22d3ee' : '#000000',
        boxShadow: theme === 'dark' 
          ? '2px 2px 8px rgba(34, 211, 238, 0.5), 2px 2px 0px #000000' 
          : '2px 2px 0px #000000',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.1s ease'
      }}
    >
      {theme === 'dark' ? '🌟 네온 온' : '🕶️ 네온 모드'}
    </button>
  );
}
