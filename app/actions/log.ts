'use server';

import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

/**
 * 클라이언트의 실제 IP 주소를 헤더에서 추출합니다.
 */
function getClientIp(headersList: Headers): string {
  const xForwardedFor = headersList.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for는 'client, proxy1, proxy2' 형태일 수 있으므로 첫 번째 IP를 선택합니다.
    const ips = xForwardedFor.split(',');
    return ips[0].trim();
  }
  
  const xRealIp = headersList.get('x-real-ip');
  if (xRealIp) return xRealIp;

  return 'unknown';
}

/**
 * 사용자가 퀴즈를 시작할 때 호출되어 접속 로그(IP, 유입경로 등)를 기록합니다.
 */
export async function createQuizLog(quizId: number) {
  try {
    const headersList = await headers();
    const ipAddress = getClientIp(headersList);
    const referer = headersList.get('referer') || 'Direct';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const log = await prisma.quizLog.create({
      data: {
        quizId,
        ipAddress,
        referer,
        userAgent,
      },
      select: {
        id: true,
      },
    });

    return { success: true, logId: log.id };
  } catch (error: any) {
    console.error('Failed to create quiz log:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 사용자가 특정 문제의 답변을 선택할 때 호출되어 실시간 답안 선택 로그를 기록합니다.
 */
export async function logAnswer(
  quizLogId: string,
  questionNumber: number,
  selectedOption: string
) {
  try {
    await prisma.answerLog.create({
      data: {
        quizLogId,
        questionNumber,
        selectedOption,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to log answer:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 퀴즈 완료 시 호출되어 QuizLog에 최종 누적 점수(totalScore)를 기록합니다.
 */
export async function completeQuizLog(logId: string, score: number) {
  try {
    if (!logId || logId === 'unknown') {
      return { success: false, error: 'Invalid logId' };
    }
    await prisma.quizLog.update({
      where: { id: logId },
      data: { totalScore: score },
    });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to complete quiz log:', error);
    return { success: false, error: error.message };
  }
}
