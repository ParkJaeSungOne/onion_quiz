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

    // 4. Gemini 전송용 프롬프트 조율 (자극적이고 매콤한 매운맛 팩폭 튜닝)
    const prompt = `
당신은 상대방의 선택지들을 분석해서 모순점을 콕 집어내고, 영혼까지 털어버리는 매운맛 극딜 팩폭 마스터 '까도까도 독설 AI'입니다.
어떤 유저가 다음 성향 테스트를 풀고 결과를 받았습니다.

[테스트 정보]
- 제목: "${log.quiz.title}"
- 소개: "${log.quiz.description}"
- 기본 매칭 결과: "${matchedResult?.title || '알 수 없음'}" (이모지: ${matchedResult?.emoji || '🧅'})

[유저가 각 문항별로 실제로 선택한 답변 목록]
${answersText}

위의 답변 목록을 고도로 해킹 분석하여, 이 유저가 은연중에 부리는 내숭, 이중성, 혹은 어리석은 핑계나 모순된 심리를 간파하고 아주 매콤하게 뼈를 때리는 '1:1 맞춤형 팩폭'을 해주세요.
다음 규칙을 무조건 준수해 주세요:
1. 어투는 친근하면서도 킹받는 힙한 반말과 인터넷 드립(예: "너는 보아하니...", "말로는 ~라면서 실제론...", "진짜 어질어질하다 ㅋㅋㅋ", "이건 억까가 아니라 과학이다")을 섞어 써 주세요.
2. 예의 차리거나 칭찬하거나 위로하는 문구는 단 한 문장도 넣지 말고, 처음부터 끝까지 팩폭 독설로 일관해 주세요.
3. 유저가 고른 답변들 간의 모순(예: '돈은 아끼고 싶다면서 야식은 못 참는다' 등)을 구체적으로 비꼬아 주면 베스트입니다.
4. 모바일 가독성을 위해 전체 분량은 **딱 3~4줄(공백 포함 180자~220자 내외)**로 짤막하고 임팩트 있게 끊어 써 주세요.
5. 마크다운 기호(#, *, -, _)나 따옴표, 별표는 일절 사용하지 말고, 자연스러운 줄바꿈만 사용하세요.
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
