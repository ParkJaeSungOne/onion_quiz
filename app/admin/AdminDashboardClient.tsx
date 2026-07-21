'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAdmin, deleteQuiz, triggerAIGenerate, exchangeThreadsToken } from '@/app/actions/admin';
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
  topQuizzes
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
  const [isTokenToolOpen, setIsTokenToolOpen] = useState(true);

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
          <h2 className={styles.sectionTitle}>👥 실시간 상세 방문 유입 로그</h2>
          <span className={styles.totalCount}>최근 50건 내역</span>
        </div>

        {visitorLogs.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>아직 수집된 방문 로그가 없습니다.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.logsTable}>
              <thead>
                <tr>
                  <th>시간</th>
                  <th>위치</th>
                  <th>기기/OS/브라우저</th>
                  <th>유입 경로 (Referrer)</th>
                  <th>조회 페이지</th>
                  <th>체류 시간</th>
                  <th>IP 주소</th>
                </tr>
              </thead>
              <tbody>
                {visitorLogs.map((log) => {
                  // IP 마스킹 (개인정보 보호 및 보안 준수형)
                  const maskIp = (ipAddr: string) => {
                    if (!ipAddr) return 'unknown';
                    if (ipAddr.includes(':')) return 'IPv6 Access';
                    const parts = ipAddr.split('.');
                    if (parts.length === 4) {
                      return `${parts[0]}.${parts[1]}.***.***`;
                    }
                    return ipAddr;
                  };

                  // 유입처 가독성 개선 매핑
                  const getPrettyReferrer = (ref: string) => {
                    const refLower = ref.toLowerCase();
                    if (refLower === 'direct') return '🚪 직접 유입 (Direct)';
                    if (refLower.includes('kakaotalk')) return '💬 카카오톡';
                    if (refLower.includes('instagram')) return '📸 인스타그램';
                    if (refLower.includes('threads')) return '🌀 스레드';
                    if (refLower.includes('facebook')) return '👥 페이스북';
                    if (refLower.includes('google')) return '🔍 구글 검색';
                    if (refLower.includes('naver')) return '🔍 네이버';
                    try {
                      const url = new URL(ref);
                      return `🔗 ${url.hostname}`;
                    } catch {
                      return ref;
                    }
                  };

                  // 기기별 이모지
                  const getDeviceEmoji = (dev: string) => {
                    if (dev === 'Mobile') return '📱';
                    if (dev === 'Tablet') return '平板';
                    if (dev === 'Bot') return '🤖';
                    return '💻';
                  };

                  // 체류 시간 단위 변환
                  const formatStayTime = (sec: number) => {
                    if (!sec || sec === 0) return '0초 (즉시 이탈)';
                    if (sec < 60) return `${sec}초`;
                    const min = Math.floor(sec / 60);
                    const remainSec = sec % 60;
                    return `${min}분 ${remainSec}초`;
                  };

                  const logTime = new Date(log.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  });

                  const logDate = new Date(log.createdAt).toLocaleDateString('ko-KR', {
                    month: 'numeric',
                    day: 'numeric'
                  });

                  return (
                    <tr key={log.id}>
                      <td className={styles.timeTd}>
                        <span className={styles.logDate}>{logDate}</span>
                        <span className={styles.logTime}>{logTime}</span>
                      </td>
                      <td className={styles.locTd}>
                        <span>{log.country === 'KR' ? '🇰🇷' : '🌐'}</span>
                        <span className={styles.cityName}>{log.city}</span>
                      </td>
                      <td className={styles.clientTd}>
                        <span className={styles.deviceSpan} title={log.device}>
                          {getDeviceEmoji(log.device)}
                        </span>
                        <span className={styles.clientDetails}>
                          {log.os} / {log.browser}
                        </span>
                      </td>
                      <td className={styles.refTd} title={log.referrer}>
                        {getPrettyReferrer(log.referrer)}
                      </td>
                      <td className={styles.pathTd} title={log.pagePath}>
                        <code>{log.pagePath}</code>
                      </td>
                      <td className={styles.stayTd}>
                        <span className={log.staySeconds > 15 ? styles.activeStay : styles.shortStay}>
                          {formatStayTime(log.staySeconds)}
                        </span>
                      </td>
                      <td className={styles.ipTd}>
                        <code>{maskIp(log.ip)}</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
