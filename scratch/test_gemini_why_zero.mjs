import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testGeminiDirect() {
  const ai = new GoogleGenAI({ apiKey });
  const cleanUrl = 'https://link.coupang.com/a/gzLgI99p6q';
  const productName = '쿠팡 역대급 초특가 핫딜 상품';
  const productDetails = '';

  const viralPrompt = `
당신은 대한민국 최고의 '핫딜 & 트렌드 전문 바이럴 마케터'입니다.
다음 쿠팡 핫딜 상품에 대해 스레드(Threads)에서 수만 조회수와 폭발적인 공유/저장을 이끌어내는 최고의 B급 팩폭 카피를 작성하세요.

[상품 및 딜 정보]
- 상품명: "${productName}"
- 링크: "${cleanUrl}"
- 추가 혜택 메모: "${productDetails || '가성비 최우수, 한정 특가, 실사용 만족도 최상'}"

[작성 규칙 - 반드시 준수]
1. **첫 문장 (현실 비교 훅)**: 소비자가 일상에서 겪는 비효율/돈 낭비/고생을 콕 짚으며 시작하세요.
2. **본문 (논리적인 3단 팩트 분해)**:
   - ① [핵심 혜택/구성 팩폭]: 이 상품("${productName}")의 핵심 혜택과 구성이 왜 사기적인지 구체적으로 명시.
   - ② [실사용/가성비 포인트]: 다른 사람들 고생할 때 체력과 시간을 아끼며 100% 뽕 뽑는 실전 꿀팁.
   - ③ [선점 타이밍]: 왜 지금 이 링크로 사두거나 일정을 잡아야 하는지 명확한 이유 제시.
3. **톤앤매너**:
   - 솔직하고 쿨한 찐사용자 반말체 ("~했음", "~임 ㅋㅋㅋ", "~인 거 알지?", "~추천함!").
   - 과장된 광고 티 내지 말고, 아는 사람만 챙겨 먹는 '알짜배기 꿀팁 공유' 느낌.
4. **마무리**:
   - 본문에는 링크를 넣지 말고, 반드시 **"👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!"** 로 마무리.
5. **분량 & 포맷**:
   - 마크다운 볼드(**), 제목(#), 따옴표 없이 자연스러운 줄바꿈과 이모지(🔥, ㄷㄷ, ㅋㅋㅋ, 👍, ✈️ 등)를 적절히 섞어 딱 3~4문단(공백 포함 280~400자).
`;

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  for (const m of models) {
    try {
      console.log(`Calling model: ${m}...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: viralPrompt
      });
      console.log(`Model ${m} text:`, res.text);
      console.log(`Model ${m} candidates:`, JSON.stringify(res.candidates, null, 2));
    } catch (e) {
      console.error(`Model ${m} error:`, e);
    }
  }
}

testGeminiDirect();
