'use server';

import prisma from '@/lib/prisma';

export async function incrementShareCount(
  quizId: number,
  type: 'kakao' | 'link' | 'result_kakao' | 'result_link'
) {
  try {
    const updateData: any = {};
    
    if (type === 'kakao') {
      updateData.shareKakaoCount = { increment: 1 };
    } else if (type === 'link') {
      updateData.shareLinkCount = { increment: 1 };
    } else if (type === 'result_kakao') {
      updateData.shareResultKakaoCount = { increment: 1 };
    } else if (type === 'result_link') {
      updateData.shareResultLinkCount = { increment: 1 };
    }

    await prisma.quiz.update({
      where: { id: quizId },
      data: updateData
    });

    return { success: true };
  } catch (error: any) {
    console.error('[incrementShareCount Error]:', error);
    return { success: false, error: error.message };
  }
}
