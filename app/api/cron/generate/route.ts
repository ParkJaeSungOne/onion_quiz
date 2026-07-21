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

  const subject = searchParams.get('subject') || '';

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
   ${subject ? `- **[중요 강제 주제] 반드시 다음 주제/키워드에 직접 연관되거나 이 내용을 심도 깊게 기획 테마로 삼아주세요: "${subject}"**\n` : ''}   - 다음 기존에 만들어진 퀴즈들과 전혀 겹치지 않는 완전 새로운 주제여야 합니다.
   - 기존 퀴즈들: [ ${existingTitles || '없음'} ]
   - **GenZ(20-30대)가 격하게 공감할 수 있는 최신 인터넷 밈(Meme)과 힙한 감성의 신선한 키워드**를 적극 활용해주세요 (예: '나의 밤티(BAM-T) 텐션 관상 테스트', 'MZ 오피스 빌런 판독기', '카카오톡 안읽씹 빌런 테스트', '도파민 좀비 측정기', '자발적 마이웨이 아싸 지수' 등).
   - 선택지(options)와 결과 피드백은 딱딱한 설명 조가 아닌, 친근하면서 위트 있는 스낵 콘텐츠 말투로 웃음을 유발할 수 있도록 작성해 주세요.
2. 구조 제약:
   - 질문(questions) 개수는 **반드시 정확히 7개**여야 합니다. (이 범위를 지켜 7개로 고정 기획해 주세요. 10초 타임아웃을 피하기 위해 7개가 절대 권장됩니다).
   - 각 질문마다 선택지(options)는 정확히 4개씩 제공되어야 합니다.
   - 각 선택지는 1점, 2점, 3점, 4점의 점수(score)를 가집니다. 4개 선택지 각각 점수가 중복되지 않고 1, 2, 3, 4가 고르게 배분되어야 합니다.
   - 결과 유형(results)은 정확히 4가지 구간이어야 합니다.
   - 질문 수가 7개이므로, 사용자가 얻을 수 있는 총점은 최소 7점 ~ 최대 28점입니다.
     결과 구간(minScore, maxScore)을 다음과 같이 수학적 빈틈 없이 정확히 분할해 주세요:
     - 7~12점 / 13~17점 / 18~22점 / 23~28점
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
    const threadsToken = process.env.THREADS_ACCESS_TOKEN;
    const threadsUserId = process.env.THREADS_USER_ID || 'me';
    let threadsResult = 'Not attempted (No token)';

    if (threadsToken) {
      try {
        console.log(`[Threads Auto-Poster] Publishing new quiz #${createdQuiz.id} to Threads...`);
        const postText = `📢 [따끈따끈 성향테스트 신작 개봉! 🧅]\n\n이번에 새로 기획되어 출시된 따끈따끈한 성향 테스트를 소개합니다!\n\n🎯 주제: "${createdQuiz.title}"\n\n👉 "${createdQuiz.description}"\n\n내가 과연 어떤 유형일지, 남들은 어떻게 나올지 지금 바로 팩폭 테스트를 까보세요! ㅋㅋㅋ\n\n👇 테스트 플레이 링크는 댓글에 남겨둘게!`;
        const replyText = `✨ [신작 플레이] "${createdQuiz.title}" 플레이하러 가기! 👇\nhttps://kkado-kkado.com/quiz/${createdQuiz.id}`;

        // 1. 본문 생성
        const cRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type: 'TEXT',
            text: postText,
            access_token: threadsToken
          })
        });
        const cData = await cRes.json();
        
        if (cData.error) {
          throw new Error(`본문 컨테이너 생성 에러: ${JSON.stringify(cData.error)}`);
        }
        
        if (cData.id) {
          const creationId = cData.id;
          
          // 2. 본문 발행
          const pRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: creationId,
              access_token: threadsToken
            })
          });
          const pData = await pRes.json();
          
          if (pData.error) {
            throw new Error(`본문 발행 에러: ${JSON.stringify(pData.error)}`);
          }
          
          if (pData.id) {
            const parentPostId = pData.id;
            threadsResult = `본문 발행 완료 (Post ID: ${parentPostId})`;
            
            // 3. 2초 대기 후 댓글 링크 발행
            await new Promise((resolve) => setTimeout(resolve, 2000));
            
            const rRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                media_type: 'TEXT',
                text: replyText,
                reply_to_id: parentPostId,
                access_token: threadsToken
              })
            });
            const rData = await rRes.json();
            
            if (rData.error) {
              throw new Error(`댓글 컨테이너 생성 에러: ${JSON.stringify(rData.error)}`);
            }
            
            if (rData.id) {
              const rPublishRes = await fetch(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  creation_id: rData.id,
                  access_token: threadsToken
                })
              });
              const rPublishData = await rPublishRes.json();
              
              if (rPublishData.error) {
                throw new Error(`댓글 발행 에러: ${JSON.stringify(rPublishData.error)}`);
              }
              
              threadsResult = `본문 + 유입 링크 댓글 전체 발행 성공 (Post ID: ${parentPostId})`;
              console.log(`[Threads Auto-Poster] Successfully autoposted new quiz #${createdQuiz.id} to Threads!`);
            }
          }
        }
      } catch (threadsErr: any) {
        console.error('[Threads Auto-Poster Error] Failed to publish quiz to Threads:', threadsErr);
        threadsResult = `실패: ${threadsErr.message || threadsErr}`;
      }
    } else {
      threadsResult = '스킵됨 (THREADS_ACCESS_TOKEN 환경변수 설정 없음)';
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
