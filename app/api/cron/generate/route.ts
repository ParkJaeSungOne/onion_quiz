import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';

// API 실행 제한시간을 넉넉히 설정 (Gemini API 호출 및 처리에 시간이 걸릴 수 있음)
export const maxDuration = 60; 

export async function GET(request: Request) {
  // 인증 키 체크 (로컬 ?secret=... 파라미터 또는 Vercel Cron Bearer 토큰 대응)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret) {
    if (secret !== cronSecret && bearerToken !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY environment variable is not defined.' }, { status: 500 });
  }

  try {
    // 1. 기존 퀴즈 목록 가져오기 (중복 주제 방지용)
    const existingQuizzes = await prisma.quiz.findMany({
      select: { title: true }
    });
    const existingTitles = existingQuizzes.map(q => q.title).join(', ');

    // 2. Gemini API 세팅
    const ai = new GoogleGenAI({ apiKey });
    
    // 프롬프트 작성 - 문제수는 8~10개 사이로 유도 (최대 10개 미만/이하 제한)
    const prompt = `
당신은 대한민국에서 가장 인스타그램, 트위터(X), 틱톡 등 SNS에서 핫하게 바이럴을 일으킬 수 있는 트렌디한 심리/성향 테스트 제작자입니다. 
양파(Onion)처럼 까도 까도 매력이 나오는 재미있고 드립력 넘치며 뼈를 때리는 퀴즈를 기획해주세요.

[제작 규칙]
1. 주제 및 감성:
   - 다음 기존에 만들어진 퀴즈들과 전혀 겹치지 않는 완전 새로운 주제여야 합니다.
   - 기존 퀴즈들: [ ${existingTitles || '없음'} ]
   - **GenZ(20-30대)가 격하게 공감할 수 있는 최신 인터넷 밈(Meme)과 힙한 감성의 신선한 키워드**를 적극 활용해주세요 (예: '나의 밤티(BAM-T) 텐션 관상 테스트', 'MZ 오피스 빌런 판독기', '카카오톡 안읽씹 빌런 테스트', '도파민 좀비 측정기', '자발적 마이웨이 아싸 지수' 등).
   - 선택지(options)와 결과 피드백은 딱딱한 설명 조가 아닌, 친근하면서 위트 있는 스낵 콘텐츠 말투로 웃음을 유발할 수 있도록 작성해 주세요.
2. 구조 제약:
   - 질문(questions) 개수는 **반드시 6개 이상 10개 이하**여야 합니다. (이 범위 외에는 절대 허용하지 않습니다).
   - 각 질문마다 선택지(options)는 정확히 4개씩 제공되어야 합니다.
   - 각 선택지는 1점, 2점, 3점, 4점의 점수(score)를 가집니다. 4개 선택지 각각 점수가 중복되지 않고 1, 2, 3, 4가 고르게 배분되어야 합니다.
   - 결과 유형(results)은 정확히 4가지 구간이어야 합니다.
   - 질문 수가 N개일 때, 사용자가 얻을 수 있는 총점은 최소 N점 ~ 최대 4*N점입니다.
     생성한 질문 수(N)에 맞춰 결과 구간(minScore, maxScore)을 정확히 분할해 주세요:
     - N이 6개일 때: 6~10점 / 11~15점 / 16~20점 / 21~24점
     - N이 7개일 때: 7~12점 / 13~17점 / 18~22점 / 23~28점
     - N이 8개일 때: 8~14점 / 15~20점 / 21~26점 / 27~32점
     - N이 9개일 때: 9~15점 / 16~22점 / 23~29점 / 30~36점
     - N이 10개일 때: 10~17점 / 18~25점 / 26~33점 / 34~40점
3. 언어: 모든 텍스트(제목, 설명, 질문, 선택지, 결과 타이틀 및 내용)는 한국어(Korean)로 자연스럽고 위트 있게 작성해주세요.

반드시 아래 JSON 스키마 구조의 유효한 JSON 포맷으로만 응답해야 합니다. 
마크다운(\`\`\`json) 기호를 넣지 말고 오직 순수 JSON 데이터만 출력해주세요.

[JSON Schema]
{
  "title": "퀴즈 제목 (예: '나의 숨겨진 탕진 잼 성향 테스트')",
  "description": "퀴즈에 대한 흥미로운 소개글 (1-2줄)",
  "category": "테스트 카테고리 (예: '성격', '연애', '직장', '소비')",
  "questions": [
    {
      "questionNumber": 1,
      "text": "질문 텍스트 (예: '갑자기 보너스가 생겼을 때 나의 행동은?')",
      "options": [
        { "text": "일단 저축하고 미래를 계획한다.", "score": 1 },
        { "text": "평소 갖고 싶던 위시리스트 중 하나를 산다.", "score": 2 },
        { "text": "친구들에게 한 턱 쏘며 기분을 낸다.", "score": 3 },
        { "text": "장바구니에 담아둔 것을 전부 결제해버린다.", "score": 4 }
      ]
    }
  ],
  "results": [
    {
      "minScore": 10,
      "maxScore": 17,
      "title": "결과 유형 타이틀 (예: '철벽 저축형 자산가')",
      "content": "이 유형에 대한 매우 구체적이고 깊이 있는 방대한 분량(최소 6~10줄 이상)의 뼈 때리는 팩폭 성향 분석. '주요 특징 3가지', '개웃긴 팩폭', '추천 생존전략' 등을 종합하여 스릴과 재미가 넘치게 기술해 주세요. 가독성을 위해 개행 문자(\\n)를 삽입해 문단을 구분해 주세요.",
      "emoji": "해당 성향 유형을 가장 잘 나타내어 소셜미디어 공유 시 시선을 끄는 단일 이모지 캐릭터 (예: '🌱', '💸', '🧘‍♂️', '👑')"
    }
  ]
}
`;

    // Gemini API 호출 (최신 @google/genai 사용)
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error('Gemini API returned empty content');
    }

    const quizData = JSON.parse(jsonText.trim());

    // 데이터 유효성 검증
    if (!quizData.title || !quizData.questions || !quizData.results) {
      throw new Error('Invalid quiz format received from AI');
    }

    // 3. 트랜잭션으로 DB에 퀴즈 생성
    const createdQuiz = await prisma.$transaction(async (tx) => {
      // 퀴즈 마스터 저장
      const quiz = await tx.quiz.create({
        data: {
          title: quizData.title,
          description: quizData.description || '',
          category: quizData.category || 'Personality',
        }
      });

      // 질문 및 선택지 저장
      for (const q of quizData.questions) {
        const question = await tx.question.create({
          data: {
            quizId: quiz.id,
            questionNumber: q.questionNumber,
            text: q.text,
          }
        });

        if (q.options && Array.isArray(q.options)) {
          await tx.option.createMany({
            data: q.options.map((opt: { text: string; score: number }) => ({
              questionId: question.id,
              text: opt.text,
              score: opt.score
            }))
          });
        }
      }

      // 결과 유형 저장
      if (quizData.results && Array.isArray(quizData.results)) {
        await tx.result.createMany({
          data: quizData.results.map((res: { minScore: number; maxScore: number; title: string; content: string; emoji?: string }) => ({
            quizId: quiz.id,
            minScore: res.minScore,
            maxScore: res.maxScore,
            title: res.title,
            content: res.content,
            emoji: res.emoji || '🧅'
          }))
        });
      }

      return quiz;
    });

    return NextResponse.json({
      success: true,
      message: 'New quiz generated successfully!',
      quizId: createdQuiz.id,
      title: createdQuiz.title
    });

  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred during quiz generation.'
    }, { status: 500 });
  }
}
