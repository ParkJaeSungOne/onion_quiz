'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAdmin, deleteQuiz, triggerAIGenerate, exchangeThreadsToken, triggerThreadsPostAction } from '@/app/actions/admin';
import styles from './admin.module.css';

interface RefererStat {
  source: string;
  count: number;
  percentage: number;
}

interface ResultStat {
  id: string;
  title: string;
  emoji: string;
  count: number;
  percentage: number;
}

interface QuizStat {
  id: number;
  title: string;
  category: string;
  questionsCount: number; // 문항수 속성 추가
  playCount: number;
  resultsDistribution: ResultStat[];
  refererStats: RefererStat[];
  createdAt: string; // 생성일자 추가
  shareKakaoCount: number;
  shareLinkCount: number;
  shareResultKakaoCount: number;
  shareResultLinkCount: number;
}

interface CommentItem {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
  quizTitle: string;
}

interface VisitorStatsData {
  todayUv: number;
  todayPv: number;
  totalUv: number;
  totalPv: number;
}

interface VisitorTrendItem {
  date: string;
  pv: number;
  uv: number;
}

interface VisitorLogItem {
  id: string;
  ip: string;
  device: string;
  os: string;
  browser: string;
  referrer: string;
  country: string;
  city: string;
  pagePath: string;
  pageTitle?: string;
  staySeconds: number;
  createdAt: string;
}

interface TopQuizItem {
  id: number;
  title: string;
  category: string;
  playCount: number;
  createdAt: string;
}

interface FunnelChannelItem {
  channel: string;
  label: string;
  visits: number;
  plays: number;
  conversionRate: number;
  avgStaySec: number;
}

interface FunnelData {
  stage1Visits: number;
  stage2Plays: number;
  stage3Shares: number;
  conversionRate: number;
  shareRate: number;
  channelFunnel: FunnelChannelItem[];
}

interface AdminDashboardClientProps {
  stats: {
    totalQuizzes: number;
    totalPlays: number;
    todayPlays: number;
  };
  quizStats: QuizStat[];
  visitorStats: VisitorStatsData;
  visitorTrend: VisitorTrendItem[];
  comments: CommentItem[];
  visitorLogs: VisitorLogItem[];
  currentPage: number;
  totalPages: number;
  topQuizzes: TopQuizItem[];
  funnelData?: FunnelData;
}

export default function AdminDashboardClient({ 
  stats, 
  quizStats, 
  visitorStats, 
  visitorTrend,
  comments,
  visitorLogs,
  currentPage,
  totalPages,
  topQuizzes,
  funnelData
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null); // 삭제 진행 상태 관리
  const [isGenerating, setIsGenerating] = useState(false); // AI 생성 상태 관리
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 에러 로그 출력용 상태
  const [customSubject, setCustomSubject] = useState(''); // 특정 AI 퀴즈 주제 상태
  const [commentList, setCommentList] = useState<CommentItem[]>(comments); // 댓글 상태
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null); // 댓글 삭제 진행 관리
  const [generationResult, setGenerationResult] = useState<{ title: string; threadsResult: string } | null>(null); // 생성 결과 보관 상태
  const [questionCount, setQuestionCount] = useState<number>(7); // AI 문항수 선택 상태 (기본값 7)

  // 🔑 60일 장기 토큰 교환 도구용 상태 추가
  const [shortToken, setShortToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeResult, setExchangeResult] = useState<string | null>(null);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [showTokenBox, setShowTokenBox] = useState(false);

  // 🚀 스레드 원클릭 수동 테스트 상태
  const [testPostLoading, setTestPostLoading] = useState(false);
  const [testPostResult, setTestPostResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);

  const handleTestPost = async () => {
    setTestPostLoading(true);
    setTestPostResult(null);
    try {
      const res = await triggerThreadsPostAction();
      if (res.success) {
        setTestPostResult({
          success: true,
          message: `${res.message}\n🖼️ 미디어 이미지: ${res.imageUrl}`
        });
      } else {
        setTestPostResult({
          success: false,
          message: '',
          error: res.error || '포스팅 도중 오류가 발생했습니다.'
        });
      }
    } catch (err: any) {
      setTestPostResult({
        success: false,
        message: '',
        error: err.message || '네트워크 오류가 발생했습니다.'
      });
    } finally {
      setTestPostLoading(false);
    }
  };

  const [isTokenToolOpen, setIsTokenToolOpen] = useState(false);

  // 👥 실시간 방문 유입 로그 검색 & 필터링 상태
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logChannelFilter, setLogChannelFilter] = useState('all');
  const [logDeviceFilter, setLogDeviceFilter] = useState('all');
  const [maskIpToggle, setMaskIpToggle] = useState(false); // false: 전체 IP 표기 (기본값)
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // IP 원클릭 복사
  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // 상대적 시각 계산
  const getRelativeTime = (isoString: string) => {
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return '방금 전';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
    return `${Math.floor(diffSec / 86400)}일 전`;
  };

  // 유입 채널 세부 분류 매퍼
  const getChannelInfo = (ref: string) => {
    const r = (ref || '').toLowerCase();
    if (r === 'direct' || !r) {
      return { key: 'direct', label: '직접 유입', emoji: '🚪', bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
    }
    if (r.includes('threads')) {
      return { key: 'threads', label: '스레드 (Threads)', emoji: '🌀', bg: '#fce7f3', color: '#be185d', border: '#f472b6' };
    }
    if (r.includes('instagram')) {
      return { key: 'instagram', label: '인스타그램', emoji: '📸', bg: '#fae8ff', color: '#86198f', border: '#e879f9' };
    }
    if (r.includes('kakaotalk') || r.includes('kakao')) {
      return { key: 'kakaotalk', label: '카카오톡', emoji: '💬', bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
    }
    if (r.includes('google') || r.includes('naver') || r.includes('daum') || r.includes('bing')) {
      const engine = r.includes('naver') ? '네이버' : r.includes('google') ? '구글' : '검색엔진';
      return { key: 'search', label: `${engine} 검색`, emoji: '🔍', bg: '#dcfce7', color: '#166534', border: '#86efac' };
    }
    if (r.includes('facebook')) {
      return { key: 'facebook', label: '페이스북', emoji: '👥', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
    }
    try {
      const url = new URL(ref);
      return { key: 'other', label: url.hostname, emoji: '🔗', bg: '#e2e8f0', color: '#334155', border: '#94a3b8' };
    } catch {
      return { key: 'other', label: ref, emoji: '🔗', bg: '#e2e8f0', color: '#334155', border: '#94a3b8' };
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/admin/login');
    router.refresh();
  };

  // 테스트 강제 삭제
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`“ ${title} ”\n\n이 테스트와 관련된 모든 참여 로그와 누적 답변 데이터가 영구적으로 파기됩니다. 정말 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(id);
    setErrorMsg(null);
    try {
      const res = await deleteQuiz(id);
      if (res.success) {
        alert('테스트가 성공적으로 삭제되었습니다.');
        router.refresh();
      } else {
        setErrorMsg(`삭제 실패: ${res.error}`);
      }
    } catch (err: any) {
      setErrorMsg(`삭제 오류: ${err.message || '서버 통신 중 장애가 발생했습니다.'}`);
    } finally {
      setLoading(null);
    }
  };

  // AI 성향 테스트 수동 생성 요청
  const handleTriggerGenerate = async () => {
    if (isGenerating) return;
    if (!confirm(`Gemini AI를 가동하여 새로운 ${questionCount}문항 트렌드 성향 테스트를 1개 강제 생성하시겠습니까?\n\n약 5초~15초 정도 소요됩니다.`)) {
      return;
    }
    
    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationResult(null);
    try {
      const res = await triggerAIGenerate(customSubject, questionCount);
      if (res.success) {
        setGenerationResult({
          title: res.title || '알 수 없음',
          threadsResult: (res as any).threadsResult || '응답 로그가 제공되지 않았습니다.'
        });
        setCustomSubject(''); // 성공 후 입력창 초기화
        router.refresh();
      } else {
        setErrorMsg(`성향 테스트 생성 실패 상세 정보:\n${res.error}`);
      }
    } catch (err: any) {
      setErrorMsg(`성향 테스트 생성 중 통신 오류 발생:\n${err.message || '알 수 없는 네트워크 오류'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 🔑 스레드 단기 토큰을 60일 장기 토큰으로 갱신 요청
  const handleExchangeToken = async () => {
    if (exchangeLoading) return;
    setExchangeError(null);
    setExchangeResult(null);
    setExchangeLoading(true);
    try {
      const res = await exchangeThreadsToken(shortToken, appSecret);
      if (res.success && res.longLivedToken) {
        setExchangeResult(res.longLivedToken);
        alert('축하합니다! 60일 장기 토큰 발급에 성공했습니다. 🎉 아래 결과 창에서 토큰을 복사하여 Vercel에 반영하세요!');
      } else {
        setExchangeError(res.error || '토큰 갱신 과정에 오류가 발생했습니다.');
      }
    } catch (err: any) {
      setExchangeError(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setExchangeLoading(false);
    }
  };

  // 어드민 전용 즉시 댓글 삭제 처리 (비밀번호 검증 우회)
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('어드민 직권으로 이 댓글을 즉시 영구 삭제하시겠습니까?')) {
      return;
    }
    setDeletingCommentId(commentId);
    try {
      const { deleteComment } = await import('@/app/actions/comment');
      const res = await deleteComment(commentId, undefined, true); // isAdmin = true 파라미터 전송
      if (res.success) {
        setCommentList(prev => prev.filter(c => c.id !== commentId));
        alert('댓글이 정상 삭제되었습니다.');
      } else {
        alert(res.error || '댓글 삭제 도중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      alert(`댓글 삭제 처리 에러: ${err.message}`);
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.adminBadge}>ADMIN PANEL</div>
          <h1 className={styles.title}>까도까도 관리자 센터</h1>
        </div>
        <div className={styles.headerActions}>
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="AI 키워드 지정 (예: 직장 상사, 밤샘 공부...)"
            className={styles.subjectInput}
            disabled={isGenerating}
          />
          <select
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className={styles.questionCountSelect}
            disabled={isGenerating}
            style={{
              padding: '10px 14px',
              fontSize: '14px',
              fontWeight: 800,
              border: '4px solid #000000',
              borderRadius: '10px',
              backgroundColor: '#ffffff',
              boxShadow: '2px 2px 0px #000000',
              cursor: 'pointer',
              color: '#000000',
              outline: 'none'
            }}
          >
            <option value={5}>5문항</option>
            <option value={6}>6문항</option>
            <option value={7}>7문항 (추천)</option>
            <option value={8}>8문항</option>
            <option value={9}>9문항</option>
            <option value={10}>10문항</option>
            <option value={12}>12문항</option>
          </select>
          <button 
            onClick={handleTriggerGenerate} 
            className={styles.seedButton}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ 생성 중...' : '✨ 커스텀 AI 생성'}
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            로그아웃 ↩
          </button>
        </div>
      </header>

      {/* 에러 메시지 팝아트 복사 카드 배너 */}
      {errorMsg && (
        <div className={styles.errorBanner}>
          <div className={styles.errorBannerHeader}>
            <span className={styles.errorTitle}>⚠️ 작동 오류 리포트 (텍스트 마우스 드래그 복사 가능)</span>
            <button onClick={() => setErrorMsg(null)} className={styles.closeErrorBtn}>✕</button>
          </div>
          <pre className={styles.errorText}>{errorMsg}</pre>
        </div>
      )}

      {/* AI 성향 테스트 생성 성공 리포트 (복사 가능 카드) */}
      {generationResult && (
        <div style={{ border: '3px solid #000000', borderRadius: '18px', padding: '20px', background: '#d9f99d', boxShadow: '5px 5px 0px #000000', marginBottom: '32px', color: '#000000', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#000000' }}>🎉 AI 성향 테스트 생성 및 스레드 발행 결과</span>
            <button onClick={() => setGenerationResult(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', fontWeight: 900, cursor: 'pointer', color: '#000000' }}>✕</button>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800 }}>
            새로 등록된 퀴즈 제목: <span style={{ textDecoration: 'underline', color: '#000000' }}>{generationResult.title}</span>
          </p>
          <div style={{ background: '#ffffff', border: '2px solid #000000', borderRadius: '10px', padding: '12px', fontSize: '12px', wordBreak: 'break-all' }}>
            <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#000000' }}>📢 스레드 API 통신 리포트 (드래그 복사 가능):</h4>
            <code style={{ fontFamily: 'monospace', fontWeight: 800, color: '#e11d48' }}>
              {generationResult.threadsResult}
            </code>
          </div>
        </div>
      )}

      {/* 🔑 스레드 60일 장기 토큰 갱신 도구 */}
      <div style={{ border: '3px solid #000000', borderRadius: '18px', padding: '20px', background: '#e0f2fe', boxShadow: '5px 5px 0px #000000', marginBottom: '32px', color: '#000000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsTokenToolOpen(!isTokenToolOpen)}>
          <span style={{ fontSize: '15px', fontWeight: 900 }}>🔑 스레드 60일 장기 토큰 갱신 도구 (만료 해결 가이드) {isTokenToolOpen ? '▲' : '▼'}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, background: '#fef08a', border: '2px solid #000000', padding: '2px 8px', borderRadius: '6px' }}>
            {isTokenToolOpen ? '설명 접기' : '도구 열기 🔄'}
          </span>
        </div>
        
        {isTokenToolOpen && (
          <div style={{ marginTop: '16px', borderTop: '2px dashed #000000', paddingTop: '16px' }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: 700, lineHeight: 1.6, color: '#334155' }}>
              💡 <strong>60일 연장 토큰 발급 방법:</strong><br />
              1. 먼저 <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: '#2563eb', fontWeight: 800 }}>Meta Graph API Explorer</a>에 접속하여 <strong>앱을 선택</strong>하고, 우측 User or Page dropdown에서 <strong>[Threads User Token]</strong> 혹은 <strong>[Get User Access Token]</strong>을 선택해 권한(<code style={{ background: '#cbd5e1', padding: '2px 4px', borderRadius: '4px' }}>threads_basic</code>, <code style={{ background: '#cbd5e1', padding: '2px 4px', borderRadius: '4px' }}>threads_content_publish</code>)을 체크한 뒤 단기 임시 토큰(1시간 유효)을 생성하여 아래에 붙여넣으세요.<br />
              2. Meta 개발자 센터 <strong>[앱 설정 &rarr; 기본 설정]</strong>에서 본인의 <strong>앱 시크릿 코드 (App Secret)</strong>를 확인해 아래에 입력하세요.<br />
              3. 갱신 버튼을 누르면 60일 동안 유효한 토큰이 즉시 발급됩니다!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, marginBottom: '4px' }}>1. 단기 임시 토큰 (1시간 유효):</label>
                <input
                  type="text"
                  value={shortToken}
                  onChange={(e) => setShortToken(e.target.value)}
                  placeholder="Meta Explorer에서 복사한 EAAW..."
                  style={{ width: '100%', padding: '10px', fontSize: '13px', border: '3px solid #000000', borderRadius: '10px', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 900, marginBottom: '4px' }}>2. 앱 시크릿 코드 (App Secret):</label>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="앱 기본 설정의 32자리 시크릿 코드"
                  style={{ width: '100%', padding: '10px', fontSize: '13px', border: '3px solid #000000', borderRadius: '10px', fontWeight: 700 }}
                />
              </div>
            </div>

            <button
              onClick={handleExchangeToken}
              disabled={exchangeLoading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 900,
                backgroundColor: '#f472b6',
                color: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '10px',
                boxShadow: '3px 3px 0px #000000',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              {exchangeLoading ? '⏳ 연장 토큰 발급 중...' : '🔄 60일 장기 토큰으로 연장하기'}
            </button>

            {exchangeError && (
              <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#991b1b', fontWeight: 700, wordBreak: 'break-all', marginBottom: '16px' }}>
                ❌ <strong>발급 실패 상세 오류:</strong> {exchangeError}
              </div>
            )}

            {exchangeResult && (
              <div style={{ background: '#ecfdf5', border: '3px solid #10b981', borderRadius: '10px', padding: '16px', color: '#065f46' }}>
                <h4 style={{ margin: '0 0 8px 0', fontWeight: 900 }}>🎉 60일 장기 토큰 발급 성공! (아래 텍스트를 터치해서 전부 복사하세요):</h4>
                <textarea
                  readOnly
                  value={exchangeResult}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  style={{ width: '100%', height: '80px', padding: '10px', fontSize: '12px', fontFamily: 'monospace', border: '2px solid #000000', borderRadius: '8px', fontWeight: 700, resize: 'none', backgroundColor: '#ffffff' }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                  💡 위 텍스트 상자를 터치하면 자동으로 전체 선택됩니다. 복사하신 뒤 Vercel의 <code>THREADS_ACCESS_TOKEN</code> 환경변수에 넣고 <strong>Redeploy(재배포)</strong> 하시면 즉동 완료!
                </p>
              </div>
            )}

            {/* 🚀 원클릭 즉시 수동 포스팅 테스트 버튼 */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px dashed #cbd5e1' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 900, color: '#000000' }}>
                🧪 스레드 바이럴 포스팅 원클릭 실시간 테스트:
              </h4>
              <button
                onClick={handleTestPost}
                disabled={testPostLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 900,
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: '3px solid #000000',
                  borderRadius: '10px',
                  boxShadow: '3px 3px 0px #000000',
                  cursor: 'pointer'
                }}
              >
                {testPostLoading ? '🚀 스레드 게시물 작성 중...' : '🚀 [원클릭 즉시 테스트] 스레드에 신상 이미지 퀴즈 올리기'}
              </button>

              {testPostResult?.success && (
                <div style={{ marginTop: '12px', background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#065f46', fontWeight: 800, whiteSpace: 'pre-line' }}>
                  {testPostResult.message}
                </div>
              )}

              {testPostResult?.error && (
                <div style={{ marginTop: '12px', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#991b1b', fontWeight: 800, whiteSpace: 'pre-line' }}>
                  ❌ <strong>포스팅 실패:</strong> {testPostResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* KPI 지표 보드 */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>총 등록 테스트</div>
          <div className={styles.kpiValue}>{stats.totalQuizzes}개</div>
        </div>
        <div className={styles.kpiCard} style={{ backgroundColor: 'var(--kitsch-cyan)' }}>
          <div className={styles.kpiLabel}>누적 완료자 수</div>
          <div className={styles.kpiValue}>{stats.totalPlays}명</div>
        </div>
        <div className={styles.kpiCard} style={{ backgroundColor: 'var(--kitsch-yellow)' }}>
          <div className={styles.kpiLabel}>오늘 신규 완료자</div>
          <div className={styles.kpiValue}>{stats.todayPlays}명</div>
        </div>
        <div className={styles.kpiCard} style={{ backgroundColor: 'var(--kitsch-lime)' }}>
          <div className={styles.kpiLabel}>오늘 방문자 (UV / PV)</div>
          <div className={styles.kpiValue}>{visitorStats.todayUv}명 / {visitorStats.todayPv}회</div>
        </div>
        <div className={styles.kpiCard} style={{ backgroundColor: '#ffffff', color: '#000000', border: '4px solid #000000' }}>
          <div className={styles.kpiLabel}>누적 방문자 (UV / PV)</div>
          <div className={styles.kpiValue}>{visitorStats.totalUv}명 / {visitorStats.totalPv}회</div>
        </div>
      </section>

      {/* 🏆 인기 테스트 Top 3 랭킹 보드 */}
      <section style={{ marginTop: '32px', marginBottom: '32px' }}>
        <div style={{
          border: '4px solid #000000',
          borderRadius: '20px',
          padding: '24px',
          background: '#fef08a', 
          boxShadow: '5px 5px 0px #000000',
          color: '#000000'
        }}>
          <h2 style={{ margin: '0 0 18px 0', fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 실시간 인기 테스트 TOP 3 랭킹
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {topQuizzes.map((quiz, idx) => {
              const rankMedal = idx === 0 ? '🥇 1위' : idx === 1 ? '🥈 2위' : '🥉 3위';
              const rankBg = idx === 0 ? '#ffedd5' : idx === 1 ? '#f1f5f9' : '#fef3c7';
              return (
                <div key={quiz.id} style={{
                  border: '3px solid #000000',
                  borderRadius: '14px',
                  padding: '20px 16px 16px 16px',
                  background: '#ffffff',
                  boxShadow: '4px 4px 0px #000000',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '12px',
                    background: rankBg,
                    border: '2.5px solid #000000',
                    borderRadius: '8px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 900,
                    boxShadow: '2px 2px 0px #000000'
                  }}>
                    {rankMedal}
                  </span>
                  <div style={{ marginTop: '8px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 900, lineHeight: 1.4 }}>
                      <a href={`/quiz/${quiz.id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#000000', textDecoration: 'underline' }}>
                        {quiz.title}
                      </a>
                    </h3>
                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#f3e8ff', color: '#6b21a8', border: '1.5px solid #000000', padding: '2px 6px', borderRadius: '4px' }}>
                      {quiz.category}
                    </span>
                  </div>
                  <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #e2e8f0', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900 }}>🔥 누적 참여: <span style={{ color: '#e11d48', fontSize: '14px' }}>{quiz.playCount}회</span></span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{quiz.createdAt.substring(0, 10)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 📈 바이럴 유입 펀널 & 채널별 전환율 분석 보드 */}
      {funnelData && (
        <section style={{ marginTop: '36px', marginBottom: '36px' }}>
          <div style={{
            background: '#ffffff',
            border: '4px solid #000000',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '6px 6px 0px #000000'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 950, color: '#000000' }}>
                  📈 바이럴 유입 펀널 & 채널별 전환율 분석 (Funnel Intelligence)
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                  방문자가 어느 단계에서 이탈하고, 어떤 유입 채널(스레드/인스타/카톡)이 플레이 전환율이 가장 높은지 실시간으로 판독합니다.
                </p>
              </div>
              <span style={{ background: '#dcfce7', color: '#166534', border: '2px solid #000000', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 900 }}>
                ⚡ 전체 전환율: {funnelData.conversionRate}%
              </span>
            </div>

            {/* 3단계 바이럴 펀널 바 시각화 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', border: '3px solid #000000', borderRadius: '14px', padding: '16px', boxShadow: '3px 3px 0px #000000' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>1단계: 방문 유입 (PV)</div>
                <div style={{ fontSize: '22px', fontWeight: 950, color: '#000000', marginTop: '4px' }}>{funnelData.stage1Visits.toLocaleString()}회</div>
                <div style={{ marginTop: '8px', background: '#e2e8f0', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', background: '#3b82f6', height: '100%' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>100% 유입 기준</div>
              </div>

              <div style={{ background: '#f8fafc', border: '3px solid #000000', borderRadius: '14px', padding: '16px', boxShadow: '3px 3px 0px #000000' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>2단계: 플레이 완료 (Completes)</div>
                <div style={{ fontSize: '22px', fontWeight: 950, color: '#16a34a', marginTop: '4px' }}>{funnelData.stage2Plays.toLocaleString()}명</div>
                <div style={{ marginTop: '8px', background: '#e2e8f0', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${funnelData.conversionRate}%`, background: '#22c55e', height: '100%' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>방문 대비 플레이 전환율 {funnelData.conversionRate}%</div>
              </div>

              <div style={{ background: '#f8fafc', border: '3px solid #000000', borderRadius: '14px', padding: '16px', boxShadow: '3px 3px 0px #000000' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b' }}>3단계: SNS 공유 & 바이럴 초청</div>
                <div style={{ fontSize: '22px', fontWeight: 950, color: '#e11d48', marginTop: '4px' }}>{funnelData.stage3Shares.toLocaleString()}회</div>
                <div style={{ marginTop: '8px', background: '#e2e8f0', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${funnelData.shareRate}%`, background: '#f43f5e', height: '100%' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#e11d48', marginTop: '4px' }}>플레이어 대비 공유율 {funnelData.shareRate}%</div>
              </div>
            </div>

            {/* 채널별 전환율 성능 비교 카치 그리드 */}
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 900, color: '#000000' }}>
              🌐 채널별 바이럴 유입 및 전환율 성능 비교 (Channel Matrix):
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {funnelData.channelFunnel.map((ch) => (
                <div key={ch.channel} style={{
                  background: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  boxShadow: '3px 3px 0px #000000'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#000000' }}>{ch.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 950, color: '#0284c7' }}>{ch.conversionRate}%</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>{ch.plays}회 완료</span>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                    방문: {ch.visits}회 · 평균체류: {ch.avgStaySec}초
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 📊 실시간 방문자 트렌드 차트 (7일 차트) */}
      <section className={styles.chartSection} style={{ marginTop: '40px', marginBottom: '40px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>📊 최근 7일 방문 트렌드 (UV / PV)</h2>
          <span className={styles.totalCount}>실시간 집계</span>
        </div>
        <div className={styles.chartBox}>
          {visitorTrend.length === 0 ? (
            <p className={styles.noDataText}>트렌드를 집계하기 위한 데이터가 아직 충분하지 않습니다. (내일 첫 데이터부터 적재됩니다)</p>
          ) : (
            <>
              {/* 차트 범례 */}
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: 'var(--kitsch-pink, #f472b6)' }}></span>
                  <span className={styles.legendText}>페이지뷰 (PV)</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: 'var(--kitsch-cyan, #22d3ee)' }}></span>
                  <span className={styles.legendText}>순 방문자 (UV)</span>
                </div>
              </div>

              {/* 차트 본체 (그리드형 바 차트) */}
              <div className={styles.chartContainer}>
                {(() => {
                  const maxVal = Math.max(...visitorTrend.map(d => Math.max(d.pv, d.uv, 1)));
                  
                  return visitorTrend.map((day) => {
                    const pvPercent = Math.max(6, Math.round((day.pv / maxVal) * 100));
                    const uvPercent = Math.max(6, Math.round((day.uv / maxVal) * 100));

                    return (
                      <div key={day.date} className={styles.chartColumn}>
                        <div className={styles.barWrapper}>
                          {/* PV 바 */}
                          <div 
                            className={`${styles.chartBar} ${styles.pvBar}`} 
                            style={{ height: `${pvPercent}%` }}
                            title={`페이지뷰: ${day.pv}회`}
                          >
                            <span className={styles.barValue}>{day.pv}</span>
                          </div>
                          {/* UV 바 */}
                          <div 
                            className={`${styles.chartBar} ${styles.uvBar}`} 
                            style={{ height: `${uvPercent}%` }}
                            title={`순방문자: ${day.uv}명`}
                          >
                            <span className={styles.barValue}>{day.uv}</span>
                          </div>
                        </div>
                        <span className={styles.chartDate}>{day.date}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 테스트 리스트 및 아코디언 통계 */}
      <section className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>📋 성향 테스트 및 통계 관리</h2>
          <span className={styles.totalCount}>총 {quizStats.length}개</span>
        </div>

        {quizStats.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>등록된 성향 테스트가 존재하지 않습니다.</p>
          </div>
        ) : (
          <div className={styles.quizList}>
            {quizStats.map((quiz) => {
              const isOpen = activeQuizId === quiz.id;
              const isDeleting = loading === quiz.id;

              return (
                <div key={quiz.id} className={`${styles.quizItem} ${isOpen ? styles.quizItemOpen : ''}`}>
                  {/* 아코디언 헤더 */}
                  <div className={styles.quizItemHeader}>
                    <div 
                      className={styles.quizMainInfo}
                      onClick={() => setActiveQuizId(isOpen ? null : quiz.id)}
                    >
                      <span className={styles.categoryBadge}>{quiz.category}</span>
                      <span style={{ fontSize: '10px', color: '#ffffff', fontWeight: 900, border: '2px solid #000000', padding: '2px 6px', borderRadius: '6px', background: '#ec4899', whiteSpace: 'nowrap', boxShadow: '1px 1px 0px #000000' }}>
                        📝 {quiz.questionsCount || 0}문항
                      </span>
                      <span className={styles.dateBadge} style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, border: '2px solid #000000', padding: '2px 6px', borderRadius: '6px', background: '#f8fafc', whiteSpace: 'nowrap' }}>
                        📅 {new Date(quiz.createdAt).toLocaleDateString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                      <h3 className={styles.quizTitleText}>{quiz.title}</h3>
                      <span className={styles.playCountBadge}>🔥 {quiz.playCount}명 참여</span>
                      <span className={styles.accordionArrow}>{isOpen ? '▲' : '▼'}</span>
                    </div>

                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '삭제중..' : '삭제 🗑️'}
                    </button>
                  </div>

                  {/* 아코디언 바디 (상세 통계 노출) */}
                  {isOpen && (
                    <div className={styles.quizDetails}>
                      {/* 성향 분포 차트 */}
                      <div className={styles.detailGrid}>
                        <div className={styles.detailBox}>
                          <h4 className={styles.boxTitle}>📊 성향별 득표율 분포</h4>
                          <div className={styles.statsList}>
                            {quiz.resultsDistribution.map((item) => (
                              <div key={item.id} className={styles.statRow}>
                                <div className={styles.statLabel}>
                                  <span className={styles.statEmoji}>{item.emoji}</span>
                                  <span className={styles.statTitle}>{item.title}</span>
                                </div>
                                <div className={styles.statProgressWrapper}>
                                  <div className={styles.trackBar}>
                                    <div 
                                      className={styles.fillBar} 
                                      style={{ width: `${item.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={styles.statPercent}>{item.percentage}% ({item.count}명)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 유입 경로 차트 */}
                        <div className={styles.detailBox} style={{ backgroundColor: 'var(--primary-bg)' }}>
                          <h4 className={styles.boxTitle}>🔗 사용자 유입 경로 (Referers)</h4>
                          {quiz.refererStats.length === 0 ? (
                            <p className={styles.noDataText}>유입 경로 데이터가 존재하지 않습니다.</p>
                          ) : (
                            <div className={styles.statsList}>
                              {quiz.refererStats.map((ref) => (
                                <div key={ref.source} className={styles.statRow}>
                                  <div className={styles.statLabel}>
                                    <span className={styles.statTitle} style={{ fontWeight: 800 }}>{ref.source}</span>
                                  </div>
                                  <div className={styles.statProgressWrapper}>
                                    <div className={styles.trackBar} style={{ backgroundColor: '#ffffff' }}>
                                      <div 
                                        className={styles.fillBar} 
                                        style={{ width: `${ref.percentage}%`, backgroundColor: 'var(--kitsch-cyan)' }}
                                      ></div>
                                    </div>
                                    <span className={styles.statPercent}>{ref.percentage}% ({ref.count}명)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 📈 공유 전환 및 클릭 분석 */}
                        <div className={styles.detailBox} style={{ backgroundColor: '#ffffff', gridColumn: '1 / -1', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
                          <h4 className={styles.boxTitle} style={{ margin: '0 0 14px 0', borderBottom: '2px solid #000000', paddingBottom: '6px', fontWeight: 900, fontSize: '14px', color: '#000000' }}>
                            📈 SNS 공유 채널 및 유입 전환 분석
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
                            {/* 퀴즈 대기실 공유 */}
                            <div style={{ border: '2px solid #000000', borderRadius: '12px', padding: '12px', background: '#fef08a', boxShadow: '3px 3px 0px #000000' }}>
                              <h5 style={{ fontWeight: 900, margin: '0 0 8px 0', fontSize: '13px', color: '#000000' }}>📣 퀴즈 시작 대기실 공유</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#000000' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>💬 카카오톡 공유:</span>
                                  <span style={{ color: '#d97706' }}>{quiz.shareKakaoCount}회</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>🔗 일반 링크 복사:</span>
                                  <span style={{ color: '#2563eb' }}>{quiz.shareLinkCount}회</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px', fontSize: '13px' }}>
                                  <span>대기실 합계:</span>
                                  <span>{quiz.shareKakaoCount + quiz.shareLinkCount}회</span>
                                </div>
                              </div>
                            </div>

                            {/* 결과 리포트 공유 */}
                            <div style={{ border: '2px solid #000000', borderRadius: '12px', padding: '12px', background: '#fbcfe8', boxShadow: '3px 3px 0px #000000' }}>
                              <h5 style={{ fontWeight: 900, margin: '0 0 8px 0', fontSize: '13px', color: '#000000' }}>🏆 결과 리포트 페이지 공유</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#000000' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>💬 카톡/궁합 공유:</span>
                                  <span style={{ color: '#db2777' }}>{quiz.shareResultKakaoCount}회</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>🔗 결과 링크 복사:</span>
                                  <span style={{ color: '#2563eb' }}>{quiz.shareResultLinkCount}회</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px', fontSize: '13px' }}>
                                  <span>결과 합계:</span>
                                  <span>{quiz.shareResultKakaoCount + quiz.shareResultLinkCount}회</span>
                                </div>
                              </div>
                            </div>

                            {/* 공유 전환율 분석 */}
                            <div style={{ border: '2px solid #000000', borderRadius: '12px', padding: '12px', background: '#cffafe', boxShadow: '3px 3px 0px #000000' }}>
                              <h5 style={{ fontWeight: 900, margin: '0 0 8px 0', fontSize: '13px', color: '#000000' }}>📊 공유 바이럴 전파 지수</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#000000' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>총 공유 횟수:</span>
                                  <span>{quiz.shareKakaoCount + quiz.shareLinkCount + quiz.shareResultKakaoCount + quiz.shareResultLinkCount}회</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>플레이 대비 지수:</span>
                                  <span style={{ color: '#059669', fontWeight: 900 }}>
                                    {quiz.playCount > 0 
                                      ? `${(((quiz.shareKakaoCount + quiz.shareLinkCount + quiz.shareResultKakaoCount + quiz.shareResultLinkCount) / quiz.playCount) * 100).toFixed(1)}%`
                                      : '0.0%'
                                    }
                                  </span>
                                </div>
                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', lineHeight: 1.3, fontWeight: 500 }}>
                                  * 전체 참여 유저 중 SNS 공유 버튼을 클릭해 소문을 퍼뜨린 적극적 유저 비율입니다.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 퀴즈 목록 페이징 UI */}
        {totalPages > 1 && (
          <div className={styles.pagination} style={{ marginTop: '28px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {currentPage > 1 ? (
              <button 
                onClick={() => router.push(`/admin?page=${currentPage - 1}`)} 
                className={styles.pageButton}
              >
                ◀ 이전
              </button>
            ) : (
              <span className={`${styles.pageButton} ${styles.disabled}`}>◀ 이전</span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => router.push(`/admin?page=${p}`)}
                  className={`${styles.pageButton} ${isCurrent ? styles.activePage : ''}`}
                >
                  {p}
                </button>
              );
            })}

            {currentPage < totalPages ? (
              <button 
                onClick={() => router.push(`/admin?page=${currentPage + 1}`)} 
                className={styles.pageButton}
              >
                다음 ▶
              </button>
            ) : (
              <span className={`${styles.pageButton} ${styles.disabled}`}>다음 ▶</span>
            )}
          </div>
        )}
      </section>

      {/* 💬 실시간 최근 댓글 & 방명록 모더레이션 */}
      <section className={styles.commentsSection} style={{ marginTop: '50px' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>💬 최근 등록된 실시간 댓글 / 방명록 관리</h2>
          <span className={styles.totalCount}>최근 10개 내역</span>
        </div>

        {commentList.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>아직 등록된 실시간 댓글이 존재하지 않습니다.</p>
          </div>
        ) : (
          <div className={styles.commentListGrid}>
            {commentList.map((comment) => (
              <div key={comment.id} className={styles.commentAdminCard}>
                <div className={styles.commentAdminHeader}>
                  <span className={styles.commentTargetBadge}>📍 {comment.quizTitle}</span>
                  <span className={styles.commentDateText}>
                    {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className={styles.commentAdminContent}>
                  <strong className={styles.commentNickname}>🧅 {comment.nickname}</strong>
                  <p className={styles.commentBodyText}>{comment.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className={styles.commentAdminDeleteBtn}
                  disabled={deletingCommentId === comment.id}
                >
                  {deletingCommentId === comment.id ? '삭제중..' : '즉시 삭제 🗑️'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 👥 실시간 상세 방문 유입 로그 (최근 50건) */}
      <section className={styles.visitorLogsSection} style={{ marginTop: '50px', marginBottom: '60px' }}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2 className={styles.sectionTitle}>👥 실시간 상세 방문 유입 로그</h2>
            <span className={styles.totalCount}>최근 {visitorLogs.length}건 분석 리포트</span>
            {copiedIp && (
              <span style={{ 
                background: '#dcfce7', 
                color: '#15803d', 
                border: '2px solid #000000', 
                padding: '4px 10px', 
                borderRadius: '8px', 
                fontSize: '12px', 
                fontWeight: '900',
                boxShadow: '2px 2px 0px #000000',
                animation: 'bounce 0.3s ease'
              }}>
                ✅ IP 복사완료: {copiedIp}
              </span>
            )}
          </div>
        </div>

        {/* 📊 유입 로그 요약 미니 메트릭 카드 4종 */}
        {visitorLogs.length > 0 && (() => {
          const totalLogs = visitorLogs.length;
          const mobileCount = visitorLogs.filter(l => l.device === 'Mobile' || l.device === 'Tablet').length;
          const mobilePct = Math.round((mobileCount / totalLogs) * 100);
          
          const snsCount = visitorLogs.filter(l => {
            const ref = (l.referrer || '').toLowerCase();
            return ref.includes('threads') || ref.includes('instagram') || ref.includes('kakaotalk') || ref.includes('facebook');
          }).length;
          const snsPct = Math.round((snsCount / totalLogs) * 100);

          const totalStaySec = visitorLogs.reduce((acc, l) => acc + (l.staySeconds || 0), 0);
          const avgStaySec = Math.round(totalStaySec / totalLogs);

          const bounceCount = visitorLogs.filter(l => (l.staySeconds || 0) < 15).length;
          const bouncePct = Math.round((bounceCount / totalLogs) * 100);

          return (
            <div className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>📱 모바일 유입 비율</div>
                <div className={styles.metricValue}>{mobilePct}% <span className={styles.metricSub} style={{ color: '#0284c7' }}>({mobileCount}회)</span></div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>🌀 SNS 트래픽 비율</div>
                <div className={styles.metricValue} style={{ color: '#be185d' }}>{snsPct}% <span className={styles.metricSub} style={{ color: '#be185d' }}>(스레드/인스타/카카오)</span></div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>⏱️ 평균 체류 시간</div>
                <div className={styles.metricValue} style={{ color: '#16a34a' }}>{avgStaySec}초 <span className={styles.metricSub} style={{ color: '#15803d' }}>/ 유저당</span></div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>🚪 즉시 이탈률 (15초 미만)</div>
                <div className={styles.metricValue} style={{ color: '#dc2626' }}>{bouncePct}% <span className={styles.metricSub} style={{ color: '#b91c1c' }}>({bounceCount}회)</span></div>
              </div>
            </div>
          );
        })()}

        {/* 🔍 실시간 필터 & 검색 툴바 */}
        <div className={styles.toolbarContainer}>
          {/* 채널 및 기기 필터 */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>유입 채널:</span>
            <select 
              value={logChannelFilter} 
              onChange={(e) => setLogChannelFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">🌐 전체 유입 채널</option>
              <option value="threads">🌀 스레드 (Threads)</option>
              <option value="instagram">📸 인스타그램</option>
              <option value="kakaotalk">💬 카카오톡</option>
              <option value="search">🔍 검색엔진 (구글/네이버)</option>
              <option value="direct">🚪 직접 유입</option>
              <option value="other">🔗 기타 외부 URL</option>
            </select>

            <span className={styles.filterLabel} style={{ marginLeft: '6px' }}>기기:</span>
            <select 
              value={logDeviceFilter} 
              onChange={(e) => setLogDeviceFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">📱/💻 전체 기기</option>
              <option value="Mobile">📱 모바일/태블릿</option>
              <option value="Desktop">💻 데스크톱</option>
            </select>
          </div>

          {/* 검색창 및 IP 토글 */}
          <div className={styles.searchGroup}>
            <input 
              type="text" 
              placeholder="🔍 IP, 도시, 퀴즈 제목, URL 검색..." 
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              onClick={() => setMaskIpToggle(!maskIpToggle)}
              className={styles.maskToggleBtn}
              style={{ background: maskIpToggle ? '#fef08a' : undefined }}
              title="IP 마스킹 여부 토글"
            >
              {maskIpToggle ? '🔒 IP 마스킹 중' : '🔓 IP 전체 표시'}
            </button>
          </div>
        </div>

        {/* 📋 로그 데이터 테이블 */}
        {visitorLogs.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>아직 수집된 방문 로그가 없습니다.</p>
          </div>
        ) : (() => {
          // 필터링된 방문 로그 목록 계산
          const filteredLogs = visitorLogs.filter(log => {
            if (logChannelFilter !== 'all') {
              const chKey = getChannelInfo(log.referrer).key;
              if (chKey !== logChannelFilter) return false;
            }
            if (logDeviceFilter !== 'all') {
              if (logDeviceFilter === 'Mobile' && log.device !== 'Mobile' && log.device !== 'Tablet') return false;
              if (logDeviceFilter === 'Desktop' && log.device !== 'Desktop') return false;
            }
            if (logSearchQuery.trim()) {
              const q = logSearchQuery.trim().toLowerCase();
              const matchIp = log.ip.toLowerCase().includes(q);
              const matchCity = log.city.toLowerCase().includes(q);
              const matchPath = log.pagePath.toLowerCase().includes(q);
              const matchTitle = (log.pageTitle || '').toLowerCase().includes(q);
              if (!matchIp && !matchCity && !matchPath && !matchTitle) return false;
            }
            return true;
          });

          if (filteredLogs.length === 0) {
            return (
              <div className={styles.emptyCard}>
                <p className={styles.emptyText}>선택한 조건에 매칭되는 방문 로그가 없습니다.</p>
              </div>
            );
          }

          return (
            <div className={styles.tableWrapper}>
              <table className={styles.logsTable}>
                <thead>
                  <tr>
                    <th>접속 시각</th>
                    <th>유입 채널</th>
                    <th>조회한 페이지 (제목 / 경로)</th>
                    <th>기기 및 접속 환경</th>
                    <th>체류 시간 & 행동</th>
                    <th>위치</th>
                    <th>접속 IP 주소</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    // IP 표시 (마스킹 옵션 준수)
                    const formatIp = (ipAddr: string) => {
                      if (!ipAddr) return 'unknown';
                      if (maskIpToggle) {
                        const parts = ipAddr.split('.');
                        if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
                      }
                      return ipAddr;
                    };

                    const channel = getChannelInfo(log.referrer);
                    const relativeTime = getRelativeTime(log.createdAt);
                    const logTimeExact = new Date(log.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false
                    });
                    const logDateExact = new Date(log.createdAt).toLocaleDateString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit'
                    });

                    // 체류 시간 배지
                    const sec = log.staySeconds || 0;
                    let stayBadgeBg = '#fee2e2';
                    let stayBadgeColor = '#991b1b';
                    let stayText = `🚪 ${sec}초 (이탈)`;

                    if (sec >= 60) {
                      stayBadgeBg = '#dcfce7';
                      stayBadgeColor = '#166534';
                      const min = Math.floor(sec / 60);
                      const remSec = sec % 60;
                      stayText = `⚡ ${min}분 ${remSec}초 (딥 플레이)`;
                    } else if (sec >= 15) {
                      stayBadgeBg = '#fef9c3';
                      stayBadgeColor = '#854d0e';
                      stayText = `⏱️ ${sec}초 (일반 뷰)`;
                    }

                    return (
                      <tr key={log.id}>
                        {/* 1. 접속 시각 */}
                        <td className={styles.timeTd}>
                          <div style={{ fontWeight: '900', fontSize: '13px' }}>{relativeTime}</div>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>{logDateExact} {logTimeExact}</div>
                        </td>

                        {/* 2. 유입 채널 */}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: channel.bg,
                            color: channel.color,
                            border: `2px solid ${channel.border}`,
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '900',
                            whiteSpace: 'nowrap'
                          }}>
                            <span>{channel.emoji}</span>
                            <span>{channel.label}</span>
                          </span>
                        </td>

                        {/* 3. 조회 페이지 (명확한 제목 & 경로) */}
                        <td className={styles.pathTd} style={{ maxWidth: '240px' }}>
                          <div className={styles.pageTitleText} title={log.pageTitle || log.pagePath}>
                            {log.pageTitle || log.pagePath}
                          </div>
                          <div className={styles.pageSubText} title={log.pagePath}>
                            {log.pagePath}
                          </div>
                        </td>

                        {/* 4. 기기 및 환경 */}
                        <td className={styles.clientTd}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px' }}>
                              {log.device === 'Mobile' ? '📱' : log.device === 'Tablet' ? '平板' : '💻'}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '800' }}>
                              {log.device}
                            </span>
                          </div>
                          <div className={styles.clientDetails}>
                            {log.os} / {log.browser}
                          </div>
                        </td>

                        {/* 5. 체류 시간 & 행동 */}
                        <td>
                          <span style={{
                            display: 'inline-block',
                            background: stayBadgeBg,
                            color: stayBadgeColor,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '900',
                            whiteSpace: 'nowrap'
                          }}>
                            {stayText}
                          </span>
                        </td>

                        {/* 6. 위치 */}
                        <td className={styles.locTd}>
                          <span style={{ fontSize: '14px', marginRight: '4px' }}>{log.country === 'KR' ? '🇰🇷' : '🌐'}</span>
                          <span className={styles.cityName}>{log.city}</span>
                        </td>

                        {/* 7. IP 주소 및 복사 버튼 */}
                        <td className={styles.ipTd}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code className={styles.ipCode}>
                              {formatIp(log.ip)}
                            </code>
                            <button
                              onClick={() => handleCopyIp(log.ip)}
                              className={styles.ipCopyBtn}
                              title="IP 주소 클립보드 복사"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </section>
    </div>
  );
}
