'use server';

import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';

// Gemini API 클라이언트 초기화
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * 유저의 퀴즈 답변 로그를 분석하여 1:1 맞춤형 AI 팩폭 분석글을 실시간 생성합니다.
 * @param logId 퀴즈 로그 고유 ID (UUID)
 */
export async function generateLiveRoast(logId: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY가 서버 환경변수에 설정되어 있지 않습니다.');
    }

    if (!logId) {
      throw new Error('로그 ID가 유효하지 않습니다.');
    }

    // 1. 유저의 답변 로그 및 질문/선택지 원본 데이터 조회
    const log = await prisma.quizLog.findUnique({
      where: { id: logId },
      include: {
        quiz: {
          select: {
            title: true,
            description: true,
            results: true
          }
        },
        answers: {
          orderBy: { questionNumber: 'asc' }
        }
      }
    });

    if (!log) {
      throw new Error('해당 답변 기록을 데이터베이스에서 찾을 수 없습니다.');
    }

    // 2. 유저의 답변 점수를 기반으로 퀴즈 매칭 결과 유형 찾기
    const totalScore = log.totalScore;
    const matchedResult = log.quiz.results.find(
      (res) => totalScore >= res.minScore && totalScore <= res.maxScore
    ) || log.quiz.results[0];

    // 3. AI 프롬프트 생성용 질문-답변 텍스트 목록 빌드
    const answersText = log.answers.map((ans) => {
      return `Q${ans.questionNumber}. 선택한 답변: "${ans.selectedOption}"`;
    }).join('\n');

    // 4. Gemini 전송용 프롬프트 조율 (힙한 반말 팩폭 로스팅 유도)
    const prompt = `
당신은 상대방의 선택을 보고 뼈를 사정없이 때리는 독설가이자 팩폭 성향 분석 전문가인 '까도까도 AI'입니다.
어떤 유저가 다음 성향 테스트를 풀고 결과를 받았습니다.

[테스트 정보]
- 제목: "${log.quiz.title}"
- 소개: "${log.quiz.description}"
- 정산된 기본 결과: "${matchedResult?.title || '알 수 없음'}" (이모지: ${matchedResult?.emoji || '🧅'})

[유저가 문항별로 선택한 답변 목록]
${answersText}

위의 실제 답변 목록을 주의 깊게 분석하여, 이 유저가 왜 이런 선택을 했는지 심리를 간파하고, 아주 예리하고 킹받는 말투로 '1:1 맞춤 팩폭 꼬집기(로스팅)'를 해 주세요.
다음 규칙을 엄격히 준수해 주세요:
1. 어투는 친근하면서도 킹받는 힙한 반말(예: "너는 보아하니...", "~하는 타입이네 ㅋㅋㅋ", "진짜 골때린다")을 사용해 주세요.
2. 상투적인 칭찬은 절대 금지하고, 팩폭과 웃긴 독설 위주로 작성해 주세요.
3. 10초 타임아웃 방지 및 스마트폰 가로화면 가독성을 위해 전체 분량은 **딱 3~4줄(공백 포함 200자 내외)**로 짤막하고 굵게 완성해 주세요.
4. 마크다운 기호(##, **, *)나 별표, 따옴표는 사용하지 말고 순수 텍스트 줄바꿈만 사용해 주세요.
`;

    // 5. Gemini API 실시간 생성
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const roastText = response.text?.trim() || '답변을 분석했으나 결과가 공백으로 반환되었습니다. 다시 시도해 주세요!';

    return {
      success: true,
      roast: roastText,
      matchedResultTitle: matchedResult?.title || '알 수 없음',
      matchedResultEmoji: matchedResult?.emoji || '🧅'
    };
  } catch (error: any) {
    console.error('[generateLiveRoast Error]:', error);
    return {
      success: false,
      error: error.message || '실시간 AI 팩폭 분석 생성 도중 서버 내부 오류가 발생했습니다.'
    };
  }
}
