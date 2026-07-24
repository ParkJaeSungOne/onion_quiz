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

    // 2. Gemini API 세팅 (Master Commercial Quiz Engine)
    const ai = new GoogleGenAI({ apiKey });
    
    const systemInstruction = `당신은 유료 심리검사 서비스(MBTI, 에니어그램, 갤럽 강점검사)와 2030 세대의 밈(Meme) 트렌드를 완벽하게 결합하는 대한민국 최고의 '상업용 B급 성향 테스트 마스터 디렉터'입니다.
당신의 목표는 유저가 "와 이건 100% 내 얘기다", "돈 주고 사서 볼 정도로 소름 돋는다", "당장 단톡방에 캡처해서 공유해야겠다"고 느끼는 극상위 퀄리티의 팩폭 성향 테스트를 기획하는 것입니다.`;

    const prompt = `
🎯 [최우선 핵심 지침]
${subject ? `▶ **[사용자 지정 강제 주제]**: "${subject}"
▶ 사용자가 입력한 위 주제 "${subject}"의 심리적 본질, 현실 갈등, 유저의 속마음을 100% 핵심으로 삼아 퀴즈 전체를 완벽하게 설계하세요. 절대 입력된 주제를 변경하거나 다른 엉뚱한 테마로 섞지 마세요!` : `▶ 기존에 작성된 다음 퀴즈들과 중복되지 않는 완전히 신선하고 독창적인 주제를 선정하세요: [ ${existingTitles || '없음'} ]`}

[돈 주고 팔아도 될 수준의 상업용 퀄리티 4대 법칙]

1. 🧠 **심리학적 선형 스펙트럼 (Scoring Integrity)**:
   - 4개 선택지의 점수(1점~4점)는 무작위가 아니라 **해당 성향의 강도 스펙트럼(1점: 극단적 세이프/낮음 ~ 4점: 극단적 광기/높음)**을 일관되게 평가해야 합니다.
   - 모든 질문이 하나의 일관된 심리 평가 축을 따라야 테스트 결과 점수가 수학적/논리적으로 100% 정확해집니다.

2. 🎭 **2026 현실 고증 딜레마 상황극**:
   - 질문은 무미건조한 이론이 아니라 **카톡 단톡방, 인스타 릴스, 직장 탕비실, 연애 딜레마, 야식 결제** 등 머릿속에 바로 영화처럼 그려지는 날것의 극사실주의 상황극으로 작성하세요.
   - 선택지 4개는 유저들이 속으로 생각할 법한 진짜 날것의 속마음과 인터넷 드립을 섞어 작성하세요.

3. 💥 **소름 돋는 3단계 명치 팩폭 결과 리포트**:
   - 결과 4개 타이틀은 2026년식 뇌리에 박히는 B급 캐릭터명으로 지정하세요.
   - 결과 내용(content)은 존댓말을 배제하고 아래 3단계 양식으로 모바일 화면 가독성을 높여 줄바꿈(\\n)과 함께 작성해 주세요:
     ■ 뼈 때리는 팩폭 분석: (유저의 본모습 꼬집기 2줄)
     ■ 현실 행동 특성: (단톡방/직장/연애에서 저지르는 짓 1~2줄)
     ■ 처방전 & 생존 비책: (유저를 위한 짧고 강렬한 조언 1줄)

4. 📊 **수학적 점수 구간 규격**:
   - 질문(questions) 개수: 정확히 ${safeQCount}개
   - 결과(results) 4구간:
     1구간: ${r1_min}~${r1_max}점 / 2구간: ${r2_min}~${r2_max}점 / 3구간: ${r3_min}~${r3_max}점 / 4구간: ${r4_min}~${r4_max}점.

반드시 아래 JSON 스키마 포맷으로만 정밀 응답해 주세요. (마크다운 기호 없이 순수 JSON만 출력)

[JSON Schema]
{
  "title": "퀴즈 제목 (예: '${subject ? subject : '도파민 중독 팩폭 판독기'}')",
  "description": "유저의 호기심을 극대화하는 매력적인 소개글 1-2줄",
  "category": "카테고리 ('성격', '연애', '직장', '소비', '도파민' 중 택1)",
  "questions": [
    {
      "questionNumber": 1,
      "text": "상황극 질문 텍스트",
      "options": [
        { "text": "1점 선택지 (낮은 성향 / 차분함)", "score": 1 },
        { "text": "2점 선택지 (적당함 / 타협)", "score": 2 },
        { "text": "3점 선택지 (높은 성향 / 과몰입)", "score": 3 },
        { "text": "4점 선택지 (극단적 광기 / 통제불능)", "score": 4 }
      ]
    }
  ],
  "results": [
    {
      "minScore": ${r1_min},
      "maxScore": ${r1_max},
      "title": "1구간 결과 타이틀",
      "content": "■ 뼈 때리는 팩폭 분석: ...\\n■ 현실 행동 특성: ...\\n■ 처방전 & 생존 비책: ...",
      "emoji": "해당 캐릭터 대표 이모지"
    },
    {
      "minScore": ${r2_min},
      "maxScore": ${r2_max},
      "title": "2구간 결과 타이틀",
      "content": "■ 뼈 때리는 팩폭 분석: ...\\n■ 현실 행동 특성: ...\\n■ 처방전 & 생존 비책: ...",
      "emoji": "해당 캐릭터 대표 이모지"
    },
    {
      "minScore": ${r3_min},
      "maxScore": ${r3_max},
      "title": "3구간 결과 타이틀",
      "content": "■ 뼈 때리는 팩폭 분석: ...\\n■ 현실 행동 특성: ...\\n■ 처방전 & 생존 비책: ...",
      "emoji": "해당 캐릭터 대표 이모지"
    },
    {
      "minScore": ${r4_min},
      "maxScore": ${r4_max},
      "title": "4구간 결과 타이틀",
      "content": "■ 뼈 때리는 팩폭 분석: ...\\n■ 현실 행동 특성: ...\\n■ 처방전 & 생존 비책: ...",
      "emoji": "해당 캐릭터 대표 이모지"
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
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.9,
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
          create: quizData.results.map((res: any) => {
            const text = (res.title + ' ' + res.content + ' ' + (res.emoji || '')).toLowerCase();
            let imageUrl = '/images/char-lazy.jpg'; // default
            
            if (text.includes('💸') || text.includes('돈') || text.includes('거지') || text.includes('지름') || text.includes('탕진') || text.includes('쇼핑') || text.includes('소비') || text.includes('적자')) {
              imageUrl = '/images/char-broke.jpg';
            } else if (text.includes('📱') || text.includes('도파민') || text.includes('좀비') || text.includes('중독') || text.includes('릴스') || text.includes('쇼츠') || text.includes('알고리즘')) {
              imageUrl = '/images/char-zombie.jpg';
            } else if (text.includes('🛌') || text.includes('침대') || text.includes('눕') || text.includes('게으름') || text.includes('귀차니즘') || text.includes('백수')) {
              imageUrl = '/images/char-lazy.jpg';
            } else if (text.includes('💖') || text.includes('❤️') || text.includes('사랑') || text.includes('연애') || text.includes('소개팅') || text.includes('썸') || text.includes('커플')) {
              imageUrl = '/images/char-love.jpg';
            } else if (text.includes('😡') || text.includes('화') || text.includes('분노') || text.includes('진상') || text.includes('빌런') || text.includes('금쪽')) {
              imageUrl = '/images/char-angry.jpg';
            } else if (text.includes('🍔') || text.includes('식욕') || text.includes('음식') || text.includes('먹') || text.includes('다이어트') || text.includes('돼지') || text.includes('야식')) {
              imageUrl = '/images/char-food.jpg';
            } else if (text.includes('🥺') || text.includes('소심') || text.includes('유리멘탈') || text.includes('개복치') || text.includes('상처') || text.includes('눈치')) {
              imageUrl = '/images/char-shy.jpg';
            } else if (text.includes('👑') || text.includes('대장') || text.includes('보스') || text.includes('킹') || text.includes('자신감') || text.includes('리더')) {
              imageUrl = '/images/char-king.jpg';
            } else if (text.includes('💼') || text.includes('회사') || text.includes('공부') || text.includes('업무') || text.includes('라떼') || text.includes('야근') || text.includes('피곤')) {
              imageUrl = '/images/char-work.jpg';
            }
            
            return {
              minScore: res.minScore,
              maxScore: res.maxScore,
              title: res.title,
              content: res.content,
              emoji: res.emoji || '🧅',
              imageUrl: imageUrl
            };
          })
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
