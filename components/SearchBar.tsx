'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState('');

  // 주소창의 search 파라미터가 바뀌면 검색창 텍스트도 동기화
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    setQuery(currentSearch);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/');
    }
  };

  const handleClear = () => {
    setQuery('');
    router.push('/');
  };

  return (
    <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="어떤 성향이 궁금해? 검색해봐! (예: 밤티, MZ, F, 연애)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" onClick={handleClear} className={styles.clearButton}>
            ✕
          </button>
        )}
      </div>
      <button type="submit" className={styles.searchButton}>
        검색
      </button>
    </form>
  );
}
