import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';
import { after } from 'next/server';

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

  const subject = searchParams.get('subject') || '';
  const questionCountParam = searchParams.get('questionCount');
  const qCount = questionCountParam ? parseInt(questionCountParam, 10) : 7;
  const safeQCount = isNaN(qCount) || qCount < 4 || qCount > 15 ? 7 : qCount;

  // 결과 유형 4개의 수학적 점수 범위를 동적으로 계산합니다.
  const minPossible = safeQCount;
  const maxPossible = safeQCount * 4;
  const rangeSpan = maxPossible - minPossible;
  const step = rangeSpan / 4;

  const r1_min = minPossible;
  const r1_max = Math.floor(minPossible + step);

  const r2_min = r1_max + 1;
  const r2_max = Math.floor(minPossible + 2 * step);

  const r3_min = r2_max + 1;
  const r3_max = Math.floor(minPossible + 3 * step);

  const r4_min = r3_max + 1;
  const r4_max = maxPossible;

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
    
    // 프롬프트 작성 - 문제수는 동적으로 설정
    const prompt = `
당신은 트위터(X), 인스타그램 스토리, 스레드(Threads) 등 SNS에서 폭발적인 조회수와 자발적 공유를 유도하는 대한민국 최고의 B급 감성 성향 테스트 기획자입니다.
2030 세대가 자신의 결과를 보고 소름 돋아하거나 피드에 캡처본을 올리지 않고선 못 배길 정도로 **자극적이고, 뼈 때리는 팝아트 테마의 심리/성향 테스트**를 기획해 주세요.

[기획 및 작화 가이드라인]
1. **주제 선정 (트렌디 & 스파이시)**:
   ${subject ? `- **[강제 요구 주제]: 반드시 다음 테마를 깊이 있게 각색하여 퀴즈로 만드세요: "${subject}"**\n` : ''}   - 다음 기존에 생성된 퀴즈 제목과 완전히 차별화된 새로운 주제여야 합니다:
     [ ${existingTitles || '없음'} ]
   - **주제 예시 (이러한 톤앤매너를 지켜주세요)**: 
     * '도파민 좀비 측정기 (쇼츠/릴스 중독)', '아가리 갓생 호소인 위선도 판독기', '유리멘탈 두부 개복치 측정기', '아싸 중의 마이웨이 독고다이 지수', '답정너 금쪽이 진상력 테스트', '카카오톡 안읽씹/읽씹 빌런 판독기', '회피형 인간 말기 진단서' 등.
2. **질문 & 선택지 구성 (현실 고증 + 드립력)**:
   - 질문은 무미건조한 상황이 아닌 **SNS, 단톡방, 일상생활의 구체적이고 킹받는 상황극**으로 적어주세요.
     * (예시): "친구가 '나 우울해서 화분 샀어'라고 했을 때 나의 반응은?" / "단톡방에서 내 말만 읽씹당했을 때 속마음은?"
   - 선택지는 정제된 문장이 아닌 **실제 유저들이 속으로 생각할 법한 날것의 속마음과 인터넷 드립**을 섞어 4개씩 작성해 주세요.
     * (점수 배정): 1점, 2점, 3점, 4점을 중복 없이 4개 선택지에 고르게 할당해야 합니다.
3. **결과 유형 (초극딜 팩폭 리포트)**:
   - 결과명은 무난한 성격명이 아닌 **명치 때리는 별명형 타이틀**로 지어주세요 (예: '겉바속촉 유리멘탈 개복치', '지갑에 구멍 뚫린 소비 요정', '아가리로만 우주 정복하는 게으름 뱅이').
   - 결과 내용(content)은 존댓말이나 칭찬을 배제하고 **적나라한 팩폭, 모순점 꼬집기, 그리고 실생활 행동 특성**을 4~5줄의 강렬한 문장으로 적어주세요. 줄바꿈 기호(\\n)를 섞어 모바일 화면에서 가독성이 좋게 작성해 주세요.
   - 단일 이모지(emoji)는 각 유형의 기괴함이나 귀여움을 가장 잘 대변하는 것으로 선택해 주세요.
4. **구조 제약**:
   - 질문(questions) 개수는 **정확히 ${safeQCount}개**여야 합니다.
   - 결과 유형(results)은 정확히 4개 구간이어야 하며 점수대는 다음과 같이 빈틈없이 수학적으로 채워주세요:
     * 1구간: ${r1_min}~${r1_max}점 / 2구간: ${r2_min}~${r2_max}점 / 3구간: ${r3_min}~${r3_max}점 / 4구간: ${r4_min}~${r4_max}점.

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
      "content": "이 유형에 대한 핵심 뼈 때리는 팩폭 성향 분석. 10초 타임아웃 방지 및 모바일 가독성을 극대화하기 위해 '■ 주요 특징: ... (1줄)\\n■ 개웃긴 팩폭: ... (2줄)\\n■ 생존 전략: ... (1줄)' 형식으로 가독성 좋고 밀도 높은 분량(총 4~5줄)으로 간결하고 강력하게 기술해 주세요.",
      "emoji": "해당 성향 유형을 가장 잘 나타내어 소셜미디어 공유 시 시선을 끄는 단일 이모지 캐릭터 (예: '🌱', '💸', '🧘‍♂️', '👑')"
    }
  ]
}
`;
    let response;
    let retries = 3;
    let delay = 2000; // 2초 대기부터 시작

    for (let i = 0; i < retries; i++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });
        break; // 성공 시 루프 탈출
      } catch (err: any) {
        const errMsg = err.message || '';
        const isRateLimit = errMsg.includes('429') || 
                            errMsg.toLowerCase().includes('resource_exhausted') ||
                            errMsg.toLowerCase().includes('quota');
        const isUnavailable = errMsg.includes('503') ||
                              errMsg.toLowerCase().includes('unavailable') ||
                              errMsg.toLowerCase().includes('high demand') ||
                              errMsg.toLowerCase().includes('overloaded');
        
        if ((isRateLimit || isUnavailable) && i < retries - 1) {
          console.warn(`[Gemini API] Transient error (429/503) hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2.5; // 지수 백오프 (2초 -> 5초 -> 12.5초)
        } else {
          throw err; // 다른 에러이거나 재시도 횟수 소진 시 최종 에러 투척
        }
      }
    }

    const jsonText = response?.text;
    if (!jsonText) {
      throw new Error('Gemini API returned empty content');
    }

    const quizData = JSON.parse(jsonText.trim());

    // 데이터 유효성 검증
    if (!quizData.title || !quizData.questions || !quizData.results) {
      throw new Error('Invalid quiz format received from AI');
    }

    // 3. 중첩 쓰기(Nested Write) 기법으로 단 1회의 DB 요청만으로 퀴즈, 질문, 선택지, 결과를 통째로 원샷 저장
    const createdQuiz = await prisma.quiz.create({
      data: {
        title: quizData.title,
        description: quizData.description || '',
        category: quizData.category || 'Personality',
        questions: {
          create: quizData.questions.map((q: any) => ({
            questionNumber: q.questionNumber,
            text: q.text,
            options: {
              create: q.options.map((opt: any) => ({
                text: opt.text,
                score: opt.score
              }))
            }
          }))
        },
        results: {
          create: quizData.results.map((res: any) => ({
            minScore: res.minScore,
            maxScore: res.maxScore,
            title: res.title,
            content: res.content,
            emoji: res.emoji || '🧅'
          }))
        }
      }
    });

    // 4. [신규 기능] AI 퀴즈 생성 성공 시 Threads 채널 즉시 자동 포스팅 및 유입 링크 생성 (오토파일럿)
    const threadsTokenRaw = process.env.THREADS_ACCESS_TOKEN || '';
    const threadsToken = threadsTokenRaw.replace(/["']/g, '').trim();
    let threadsResult = 'Not attempted (No token)';

    // 안전한 API 호출 및 응답 해석용 로컬 헬퍼 (URL Query Parameter 방식 사용)
    const safeFetchJson = async (url: string, params: Record<string, string>) => {
      const queryStr = new URLSearchParams(params).toString();
      const targetUrl = `${url}?${queryStr}`;
      
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const text = await res.text();
      const wwwAuth = res.headers.get('www-authenticate');
      try {
        const data = JSON.parse(text || '{}');
        if (data.error) {
          throw new Error(data.error.message || JSON.stringify(data.error));
        }
        if (res.status !== 200 && (!text || text.trim() === '')) {
          throw new Error(`Meta API 인증 에러. 상태코드: ${res.status}${wwwAuth ? ` [인증오류 정보: ${wwwAuth}]` : ''}`);
        }
        return data;
      } catch (err: any) {
        if (err.message.includes('에러') || err.message.includes('오류') || err.message.includes('Meta API')) {
          throw err;
        }
        const extraInfo = wwwAuth ? ` [인증헤더 상세: ${wwwAuth}]` : '';
        throw new Error(`Meta API가 비정상 응답을 반환했습니다 (HTTP ${res.status}). 내용: ${text || '빈 응답'}${extraInfo}`);
      }
    };

    threadsResult = threadsToken 
      ? '백그라운드에서 스레드 자동 발행 진행 중 🚀 (약 3~5초 뒤 스레드에 업로드됩니다)' 
      : '스킵됨 (THREADS_ACCESS_TOKEN 환경변수 설정 없음)';

    if (threadsToken) {
      // 10초 타임아웃(504 Gateway Timeout) 방지를 위해 Next.js의 after() API를 사용해 백그라운드 비동기 처리 가동
      after(async () => {
        try {
          console.log(`[Background Threads Auto-Poster] Publishing new quiz #${createdQuiz.id} to Threads...`);
          // ⚠️ 메타 스레드 API는 본문 500자 제한이 매우 엄격하며 초과 시 HTTP 500 에러를 뿜습니다.
          // 이를 방지하기 위해 생성된 제목과 설명을 안전 구간으로 강제 자르기 처리합니다.
          const safeTitle = createdQuiz.title.length > 50 
            ? createdQuiz.title.substring(0, 47) + '...'
            : createdQuiz.title;
          const safeDesc = createdQuiz.description.length > 200
            ? createdQuiz.description.substring(0, 197) + '...'
            : createdQuiz.description;

          const postText = `📢 [따끈따끈 성향테스트 신작 개봉! 🧅]\n\n이번에 새로 기획되어 출시된 따끈따끈한 성향 테스트를 소개합니다!\n\n🎯 주제: "${safeTitle}"\n\n👉 "${safeDesc}"\n\n내가 과연 어떤 유형일지, 남들은 어떻게 나올지 지금 바로 팩폭 테스트를 까보세요! ㅋㅋㅋ\n\n👇 테스트 플레이 링크는 댓글에 남겨둘게!`;
          const replyText = `✨ [신작 플레이] "${safeTitle}" 플레이하러 가기! 👇\nhttps://kkado-kkado.com/quiz/${createdQuiz.id}`;

          // 1. 본문 즉시 발행 (auto_publish_text 사용으로 2단계 호출을 1단계로 단축)
          const cData = await safeFetchJson(
            `https://graph.threads.net/v1.0/me/threads`,
            {
              media_type: 'TEXT',
              text: postText,
              auto_publish_text: 'true',
              access_token: threadsToken
            }
          );
          
          if (cData.id) {
            const parentPostId = cData.id;
            console.log(`[Background Threads Auto-Poster] Parent Post Published: ${parentPostId}`);
            
            // 2. 2초 대기 후 댓글 링크 즉시 발행 (auto_publish_text 사용)
            await new Promise((resolve) => setTimeout(resolve, 2000));
            
            const rData = await safeFetchJson(
              `https://graph.threads.net/v1.0/me/threads`,
              {
                media_type: 'TEXT',
                text: replyText,
                reply_to_id: parentPostId,
                auto_publish_text: 'true',
                access_token: threadsToken
              }
            );
            
            if (rData.id) {
              console.log(`[Background Threads Auto-Poster] Successfully autoposted new quiz #${createdQuiz.id} to Threads!`);
            }
          }
        } catch (threadsErr: any) {
          console.error('[Background Threads Auto-Poster Error] Failed to publish quiz to Threads:', threadsErr);
        }
      });
    } else {
      console.log(`[Threads Auto-Poster] THREADS_ACCESS_TOKEN is not configured. Skipping Threads auto-post for new quiz.`);
    }

    return NextResponse.json({
      success: true,
      message: 'New quiz generated successfully!',
      quizId: createdQuiz.id,
      title: createdQuiz.title,
      threadsResult: threadsResult
    });

  } catch (error: any) {
    console.error('Quiz Generation Error:', error);
    let errMsg = error.message || 'An error occurred during quiz generation.';
    
    // 429 / RESOURCE_EXHAUSTED / 할당량 초과 에러 해석
    if (
      errMsg.includes('429') || 
      errMsg.toLowerCase().includes('resource_exhausted') || 
      errMsg.toLowerCase().includes('quota') ||
      errMsg.toLowerCase().includes('rate limit')
    ) {
      errMsg = 'Gemini API 호출 제한(Rate Limit - 429 Too Many Requests)에 도달했습니다. 무료 티어 할당량이 소진되었거나 1분 동안 너무 많은 질문 생성이 가동되었습니다. 1~2분 가량 대기하신 후에 다시 트리거 버튼을 눌러주세요.';
    }
    
    return NextResponse.json({
      success: false,
      error: errMsg
    }, { status: 500 });
  }
}
