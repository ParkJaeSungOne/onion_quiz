'use client';

import React, { useState } from 'react';
import { createComment, deleteComment } from '@/app/actions/comment';
import styles from './CommentSection.module.css';

interface CommentType {
  id: string;
  nickname: string;
  content: string;
  createdAt: Date | string;
  password?: string | null;
}

interface CommentSectionProps {
  quizId: number | null; // null 이면 방명록, 번호가 있으면 특정 퀴즈 댓글
  initialComments: CommentType[];
  title?: string;
}

// 닉네임 랜덤 플레이스홀더 추천
const placeholderNicknames = [
  '행복한 양파', '격분한 웰시코기', '도파민 좀비', '마이웨이 아싸', 
  '침대 귀신', '알콜 요정', '지름신 강림러', '뼈 맞은 방랑자'
];

export default function CommentSection({ quizId, initialComments, title }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 삭제 모달 상태 관리
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePass, setDeletePass] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // 랜덤 닉네임 생성
  const getRandomNickname = () => {
    const idx = Math.floor(Math.random() * placeholderNicknames.length);
    setNickname(placeholderNicknames[idx]);
  };

  // 댓글 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setErrorMsg('');

    const finalNickname = nickname.trim() || '익명의 양파';
    const result = await createComment(quizId, finalNickname, content, password);

    if (result.success) {
      // 등록 성공 시 로컬 상태 업데이트
      const newComment: CommentType = {
        id: Math.random().toString(), // 임시 ID
        nickname: finalNickname,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        password: password ? 'has-password' : null // 패스워드가 있음을 표기
      };
      
      // 최신 댓글이 가장 위에 오도록 정렬
      setComments([newComment, ...comments]);
      setContent('');
      setPassword('');
      setNickname('');
    } else {
      setErrorMsg(result.error || '댓글 등록에 실패했습니다.');
    }
    setLoading(false);
  };

  // 댓글 삭제 처리
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingId) return;

    setDeleteError('');
    const result = await deleteComment(deletingId, deletePass);

    if (result.success) {
      setComments(comments.filter(c => c.id !== deletingId));
      setDeletingId(null);
      setDeletePass('');
    } else {
      setDeleteError(result.error || '삭제 도중 오류가 발생했습니다.');
    }
  };

  // 날짜 가독성 변환
  const formatDate = (dateStr: Date | string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.sectionTitle}>
        {title || (quizId ? '💬 실시간 팩폭 토크방' : '🧅 까도까도 자유 방명록')}
        <span className={styles.commentCount}>({comments.length})</span>
      </h3>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>닉네임</label>
            <div className={styles.nicknameWrapper}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="익명의 양파"
                maxLength={20}
                className={styles.input}
              />
              <button 
                type="button" 
                onClick={getRandomNickname} 
                className={styles.randomBtn}
                title="랜덤 닉네임 생성"
              >
                🎲 랜덤
              </button>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>비번 (4자리)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="삭제용 비번"
              maxLength={4}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.textareaGroup}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글과 방명록은 까도까도 발전을 돕습니다. 따뜻한 팩폭 또는 응원을 남겨주세요! (최대 300자)"
            maxLength={300}
            required
            className={styles.textarea}
          />
        </div>

        {errorMsg && <p className={styles.errorMsg}>⚠️ {errorMsg}</p>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? '📝 등록 중...' : '🔥 댓글 까기 등록'}
        </button>
      </form>

      {/* 댓글 목록 */}
      <div className={styles.list}>
        {comments.length === 0 ? (
          <div className={styles.empty}>
            <p>아직 남겨진 팩폭 글이 없습니다.</p>
            <p className={styles.emptySub}>제일 먼저 첫 댓글의 첫 껍질을 까보세요! 👇</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.nickname}>🧅 {comment.nickname}</span>
                <div className={styles.headerRight}>
                  <span className={styles.date}>{formatDate(comment.createdAt)}</span>
                  <button 
                    onClick={() => setDeletingId(comment.id)} 
                    className={styles.deleteBtn}
                    title="댓글 삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className={styles.content}>{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 삭제 비밀번호 확인 팝업 모달 */}
      {deletingId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h4 className={styles.modalTitle}>🗑️ 댓글 삭제 확인</h4>
            <p className={styles.modalDesc}>작성할 때 입력했던 4자리 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handleDeleteSubmit}>
              <input
                type="password"
                value={deletePass}
                onChange={(e) => setDeletePass(e.target.value)}
                placeholder="비밀번호 4자리"
                maxLength={4}
                required
                autoFocus
                className={styles.modalInput}
              />
              {deleteError && <p className={styles.modalError}>⚠️ {deleteError}</p>}
              <div className={styles.modalButtons}>
                <button type="submit" className={styles.modalConfirmBtn}>삭제하기</button>
                <button 
                  type="button" 
                  onClick={() => { setDeletingId(null); setDeletePass(''); setDeleteError(''); }}
                  className={styles.modalCancelBtn}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
