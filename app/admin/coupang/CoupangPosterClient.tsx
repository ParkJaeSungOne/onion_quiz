'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { publishCoupangDealToThreads } from '@/app/actions/admin';

export default function CoupangPosterClient() {
  const [coupangUrl, setCoupangUrl] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customDetails, setCustomDetails] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<{
    productName: string;
    imageUrl: string;
    postText: string;
    replyText: string;
    postId: string;
    permalink: string;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 클립보드/인풋 스마트 파서 (쿠팡 파트너스 HTML 배너 태그, 텍스트+링크, 일반 URL 모두 100% 자동 분해)
  const processSharedText = (rawText: string) => {
    const trimmed = rawText.trim();

    // 1. 쿠팡 파트너스 HTML 배너 태그 형태인 경우 (<a href="..." ...><img src="..." alt="..." ...></a>)
    if (trimmed.includes('<a') || trimmed.includes('<img') || trimmed.includes('href=') || trimmed.includes('src=')) {
      const hrefMatch = trimmed.match(/href=["'](https:\/\/[^"']+)["']/i) || trimmed.match(/https:\/\/link\.coupang\.com\/[a-zA-Z0-9_\/]+/i);
      const altMatch = trimmed.match(/alt=["']([^"']+)["']/i);

      if (hrefMatch) {
        setCoupangUrl(hrefMatch[1] || hrefMatch[0]);
      }
      if (altMatch && altMatch[1]?.trim()) {
        setCustomProductName(altMatch[1].trim());
      }
      // 배너 광고 이미지는 무시하고 상품명 기반으로 깨끗한 고화질 상품 사진 자동 탐색
      setCustomImageUrl('');
      return;
    }

    // 2. 일반 텍스트 + 링크 형태인 경우
    const urlMatch = trimmed.match(/https:\/\/[^\s]+/i);
    if (urlMatch) {
      const extractedUrl = urlMatch[0];
      setCoupangUrl(extractedUrl);

      // URL 앞뒤의 텍스트가 있다면 상품명으로 자동 입력
      const remainingText = trimmed.replace(extractedUrl, '').trim().replace(/^\[|\]$/g, '').trim();
      if (remainingText && remainingText.length > 1 && !customProductName) {
        setCustomProductName(remainingText);
      }
    } else {
      setCoupangUrl(trimmed);
    }
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        processSharedText(text);
      }
    } catch {
      alert('클립보드 접근 권한을 허용해 주시거나 직접 붙여넣어 주세요.');
    }
  };

  const handlePublish = async () => {
    if (!coupangUrl.trim() || isPublishing) return;

    setIsPublishing(true);
    setErrorMsg(null);
    setResult(null);
    setLogs([
      '🚀 [시작] 쿠팡 핫딜 AI 분석 & 스레드 포스팅 파이프라인 가동...',
      `🔗 대상 URL: ${coupangUrl.trim()}`,
      customProductName.trim() ? `🏷️ 지정 상품명: "${customProductName.trim()}"` : '🔍 상품명 자동 크롤링 모드',
      customImageUrl.trim() ? `📸 지정 이미지: ${customImageUrl.trim().substring(0, 35)}...` : '🔍 이미지 자동 추출 모드',
      customDetails.trim() ? `💡 핵심 혜택 메모: "${customDetails.trim()}"` : '✨ AI 자동 혜택 분석 모드'
    ]);

    // 실시간 진행 텍스트 시뮬레이션 인터벌 (서버 응답 대기 동안 시각적 피드백)
    const timer1 = setTimeout(() => {
      setLogs(prev => [...prev, '🌐 1단계: 쿠팡 서버 접속 및 상품명/고화질 이미지 크롤링 중...']);
    }, 1200);
    const timer2 = setTimeout(() => {
      setLogs(prev => [...prev, '🧠 2단계: Gemini AI 논리적 팩폭 카피라이팅 엔진 호출 중...']);
    }, 3500);
    const timer3 = setTimeout(() => {
      setLogs(prev => [...prev, '📱 3단계: Meta Threads Graph API 미디어 컨테이너 생성 및 인코딩 검증 중...']);
    }, 6500);
    const timer4 = setTimeout(() => {
      setLogs(prev => [...prev, '🚀 4단계: 스레드 피드 본문 및 첫 댓글(파트너스 링크) 동시 발행 중...']);
    }, 9500);

    try {
      const res = await publishCoupangDealToThreads(
        coupangUrl,
        customProductName,
        customImageUrl,
        customDetails
      );
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);

      if ((res as any).logs && (res as any).logs.length > 0) {
        setLogs((res as any).logs);
      }

      if (res.success && (res as any).postId) {
        setResult(res as any);
        setCoupangUrl('');
        setCustomProductName('');
        setCustomImageUrl('');
        setCustomDetails('');
      } else {
        setErrorMsg(res.error || '스레드 발행 실패');
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setErrorMsg(err.message || '네트워크 통신 오류가 발생했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fef08a',
      padding: '16px 12px 60px 12px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#000000',
      maxWidth: '560px',
      margin: '0 auto'
    }}>
      {/* 📱 모바일 헤더 */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        borderBottom: '3px solid #000000',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '28px' }}>🧅</span>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 900, background: '#000000', color: '#fde047', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }}>
              KKADO DEAL APP
            </div>
            <h1 style={{ margin: 0, fontSize: '19px', fontWeight: 950, letterSpacing: '-0.5px' }}>
              까도 핫딜 스레드 포스터
            </h1>
          </div>
        </div>

        <Link
          href="/admin"
          style={{
            fontSize: '12px',
            fontWeight: 800,
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: '8px',
            padding: '6px 10px',
            boxShadow: '2px 2px 0px #000000',
            textDecoration: 'none',
            color: '#000000'
          }}
        >
          📊 전체 관리자
        </Link>
      </header>

      {/* 💡 아이폰 홈 화면 바로가기 팁 */}
      <div style={{
        background: '#ffffff',
        border: '2.5px solid #000000',
        borderRadius: '12px',
        padding: '10px 12px',
        marginBottom: '16px',
        boxShadow: '3px 3px 0px #000000',
        fontSize: '12px',
        lineHeight: 1.5,
        fontWeight: 700
      }}>
        📲 <strong>아이폰 홈 화면 추가 방법:</strong><br />
        사파리(Safari) 하단 <strong>[공유(⬆️)]</strong> 버튼 ➔ <strong>[홈 화면에 추가]</strong>를 누르시면 앱처럼 아이폰 바탕화면에서 터치 한 번으로 열립니다!
      </div>

      {/* 🛒 포스팅 작성 폼 */}
      <div style={{
        background: '#ffffff',
        border: '3.5px solid #000000',
        borderRadius: '18px',
        padding: '18px 14px',
        boxShadow: '5px 5px 0px #000000',
        marginBottom: '20px'
      }}>
        {/* 1. 쿠팡 링크 입력 (필수) */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 900, color: '#e11d48' }}>
              🔗 1. 쿠팡 파트너스 링크 (필수) *
            </label>
            <button
              onClick={handlePasteUrl}
              style={{
                fontSize: '11px',
                fontWeight: 900,
                background: '#ffedd5',
                border: '1.5px solid #000000',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer'
              }}
            >
              📋 링크 붙여넣기
            </button>
          </div>
          <input
            type="text"
            value={coupangUrl}
            onChange={(e) => processSharedText(e.target.value)}
            placeholder="https://link.coupang.com/a/..."
            disabled={isPublishing}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 800,
              border: '3px solid #000000',
              borderRadius: '10px',
              backgroundColor: '#fffbeb',
              boxShadow: '2px 2px 0px #000000',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 2. 상품명/키워드 */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 900, marginBottom: '6px', color: '#1d4ed8' }}>
            🏷️ 2. 상품명 / 키워드 (입력 권장) 🔥
          </label>
          <input
            type="text"
            value={customProductName}
            onChange={(e) => setCustomProductName(e.target.value)}
            placeholder="예: 오션월드 얼리파크인 종일권 / 소노벨 단양 / 코카콜라 제로"
            disabled={isPublishing}
            style={{
              width: '100%',
              padding: '11px 12px',
              fontSize: '14px',
              fontWeight: 800,
              border: '3px solid #000000',
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              boxShadow: '2px 2px 0px #000000',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 3. 대표 이미지 URL (선택) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 900, marginBottom: '6px' }}>
            📸 3. 고화질 이미지 URL (선택)
          </label>
          <input
            type="text"
            value={customImageUrl}
            onChange={(e) => setCustomImageUrl(e.target.value)}
            placeholder="이미지 링크 붙여넣기 (미입력 시 썸네일 사용)"
            disabled={isPublishing}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: '2.5px solid #000000',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              boxShadow: '2px 2px 0px #000000',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 4. 핵심 혜택 메모 (선택) */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 900, marginBottom: '6px' }}>
            💡 4. 핵심 혜택 / 특장점 메모 (선택)
          </label>
          <textarea
            value={customDetails}
            onChange={(e) => setCustomDetails(e.target.value)}
            placeholder="예: 오션플레이 무료입장 포함, 4인 조식 뷔페, 남한강 파노라마 뷰"
            rows={2}
            disabled={isPublishing}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: '2.5px solid #000000',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              boxShadow: '2px 2px 0px #000000',
              outline: 'none',
              resize: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* 🚀 원클릭 발행 액션 버튼 */}
        <button
          onClick={handlePublish}
          disabled={isPublishing || !coupangUrl.trim()}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 950,
            backgroundColor: isPublishing ? '#94a3b8' : '#e11d48',
            color: '#ffffff',
            border: '3.5px solid #000000',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #000000',
            cursor: isPublishing ? 'not-allowed' : 'pointer',
            transition: 'transform 0.1s ease',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isPublishing ? '⏳ AI 팩폭 분석 & 스레드 발행 중...' : '🚀 [원클릭] 스레드 실시간 포스팅'}
        </button>
      </div>

      {/* 💻 실시간 터미널 진행 로그 창 */}
      {logs.length > 0 && (
        <div style={{
          background: '#0f172a',
          border: '3px solid #000000',
          borderRadius: '14px',
          padding: '14px',
          boxShadow: '4px 4px 0px #000000',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: isPublishing ? '#38bdf8' : '#4ade80' }}></span>
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#f8fafc', fontFamily: 'monospace' }}>
                {isPublishing ? 'PIPELINE RUNNING...' : 'EXECUTION COMPLETE'}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {logs.length} events
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11.5px' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{
                color: log.startsWith('❌') ? '#f87171' : log.startsWith('✅') || log.startsWith('🎉') ? '#4ade80' : log.startsWith('⚠️') ? '#facc15' : '#e2e8f0',
                lineHeight: 1.4
              }}>
                <span style={{ color: '#64748b', marginRight: '6px' }}>[{idx + 1}]</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ❌ 에러 피드백 */}
      {errorMsg && (
        <div style={{
          background: '#fee2e2',
          border: '3px solid #ef4444',
          borderRadius: '12px',
          padding: '14px',
          fontSize: '13px',
          color: '#991b1b',
          fontWeight: 800,
          marginBottom: '20px',
          boxShadow: '3px 3px 0px #000000'
        }}>
          ❌ <strong>발행 실패:</strong> {errorMsg}
        </div>
      )}

      {/* 🎉 성공 리포트 카드 */}
      {result && (
        <div style={{
          background: '#ffffff',
          border: '3.5px solid #000000',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '5px 5px 0px #000000'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#15803d' }}>
              🎉 포스팅 발행 성공!
            </span>
            {result.permalink && (
              <a
                href={result.permalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: '#000000',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 900,
                  textDecoration: 'none'
                }}
              >
                🔗 스레드 글 확인하기 →
              </a>
            )}
          </div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b' }}>상품명</div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb' }}>{result.productName}</div>
          </div>

          {result.imageUrl && (
            <div style={{ marginBottom: '12px' }}>
              <img
                src={result.imageUrl}
                alt="Product"
                style={{ width: '100%', maxHeight: '130px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #000' }}
              />
            </div>
          )}

          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}>작성된 AI 팩폭 본문</div>
            <pre style={{
              background: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '11.5px',
              fontWeight: 700,
              whiteSpace: 'pre-wrap',
              margin: 0,
              lineHeight: 1.4,
              color: '#1e293b'
            }}>
              {result.postText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
