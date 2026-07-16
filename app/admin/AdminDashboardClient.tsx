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
}

interface AdminDashboardClientProps {
  stats: {
    totalQuizzes: number;
    totalPlays: number;
    todayPlays: number;
  };
  quizStats: QuizStat[];
}

export default function AdminDashboardClient({ stats, quizStats }: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null); // 삭제 진행 상태 관리
  const [isGenerating, setIsGenerating] = useState(false); // AI 생성 상태 관리
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 에러 로그 출력용 상태

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
      const res = await triggerAIGenerate();
      if (res.success) {
        alert(`성공적으로 생성 완료되었습니다! 🎉\n\n새 테스트: “ ${res.title} ”`);
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.adminBadge}>ADMIN PANEL</div>
          <h1 className={styles.title}>까도까도 관리자 센터</h1>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={handleTriggerGenerate} 
            className={styles.seedButton}
            disabled={isGenerating}
          >
            {isGenerating ? '⏳ 생성 중...' : '✨ 새 AI 테스트 즉시 수동생성'}
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
      </section>
    </div>
  );
}
