'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAdmin, deleteQuiz, triggerAIGenerate } from '@/app/actions/admin';
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
  playCount: number;
  resultsDistribution: ResultStat[];
  refererStats: RefererStat[];
  createdAt: string; // 생성일자 추가
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
}

export default function AdminDashboardClient({ 
  stats, 
  quizStats, 
  visitorStats, 
  visitorTrend,
  comments,
  visitorLogs,
  currentPage,
  totalPages
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null); // 삭제 진행 상태 관리
  const [isGenerating, setIsGenerating] = useState(false); // AI 생성 상태 관리
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 에러 로그 출력용 상태
  const [customSubject, setCustomSubject] = useState(''); // 특정 AI 퀴즈 주제 상태
  const [commentList, setCommentList] = useState<CommentItem[]>(comments); // 댓글 상태
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null); // 댓글 삭제 진행 관리

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
    if (!confirm('Gemini AI를 가동하여 새로운 6~10문항 트렌드 성향 테스트를 1개 강제 생성하시겠습니까?\n\n약 5초~10초 정도 소요됩니다.')) {
      return;
    }
    
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await triggerAIGenerate(customSubject);
      if (res.success) {
        alert(`성공적으로 생성 완료되었습니다! 🎉\n\n새 테스트: “ ${res.title} ”`);
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
