'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';

/**
 * 1. 신규 방명록/댓글 작성
 */
export async function createComment(
  quizId: number | null,
  nickname: string,
  content: string,
  password?: string
) {
  try {
    const cleanNickname = nickname.trim().substring(0, 20) || '익명의 양파';
    const cleanContent = content.trim().substring(0, 300);

    if (!cleanContent) {
      return { success: false, error: '댓글 내용을 입력해 주세요.' };
    }

    await prisma.comment.create({
      data: {
        quizId,
        nickname: cleanNickname,
        content: cleanContent,
        password: password ? password.trim() : null,
      },
    });

    // 경로 캐시 갱신
    if (quizId) {
      revalidatePath(`/quiz/${quizId}/result`);
      revalidatePath(`/quiz/${quizId}`);
    } else {
      revalidatePath('/guestbook');
    }
    revalidateTag('comments', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create comment:', error);
    return { success: false, error: '댓글 작성 도중 서버 장애가 발생했습니다.' };
  }
}

/**
 * 2. 방명록/댓글 삭제 (비밀번호 일치 확인 또는 어드민 권한)
 */
export async function deleteComment(
  commentId: string,
  password?: string,
  isAdmin: boolean = false
) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return { success: false, error: '존재하지 않는 댓글입니다.' };
    }

    // 어드민이 아니고, 비밀번호가 맞지 않으면 삭제 불허
    if (!isAdmin) {
      if (comment.password && comment.password !== password?.trim()) {
        return { success: false, error: '비밀번호가 일치하지 않습니다.' };
      }
      if (!comment.password) {
        return { success: false, error: '이 댓글은 삭제할 수 없는 형식입니다. (비밀번호 없음)' };
      }
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // 경로 캐시 갱신
    if (comment.quizId) {
      revalidatePath(`/quiz/${comment.quizId}/result`);
      revalidatePath(`/quiz/${comment.quizId}`);
    } else {
      revalidatePath('/guestbook');
    }
    revalidateTag('comments', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    return { success: false, error: '댓글 삭제 도중 오류가 발생했습니다.' };
  }
}

/**
 * 3. 이모지 리액션 증분 처리 (B코스 연동)
 */
export async function addCommentReaction(
  commentId: string,
  reactionType: 'onion' | 'fire' | 'heart' | 'laugh'
) {
  try {
    let field = '';
    if (reactionType === 'onion') field = 'reactionOnion';
    else if (reactionType === 'fire') field = 'reactionFire';
    else if (reactionType === 'heart') field = 'reactionHeart';
    else if (reactionType === 'laugh') field = 'reactionLaugh';
    else {
      return { success: false, error: '올바르지 않은 리액션 타입입니다.' };
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        [field]: { increment: 1 }
      },
      select: {
        quizId: true
      }
    });

    // 경로 캐시 갱신
    if (updated.quizId) {
      revalidatePath(`/quiz/${updated.quizId}/result`);
    } else {
      revalidatePath('/guestbook');
    }
    revalidateTag('comments', 'default');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to add comment reaction:', error);
    return { success: false, error: '리액션 반영 도중 오류가 발생했습니다.' };
  }
}
