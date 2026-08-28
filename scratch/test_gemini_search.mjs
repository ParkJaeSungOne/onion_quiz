import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

// Load .env
const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testGeminiSearch() {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const coupangUrl = 'https://link.coupang.com/a/gzAKLjJpyC';
    const redirectLocation = 'https://trip.coupang.com/tp/products/10000010793428?vendorItemId=70000296286212&itemId=20002225932589';

    const prompt = `
당신은 대한민국 최고의 '핫딜 & 트렌드 전문 바이럴 마케터'입니다.
다음 쿠팡 핫딜 상품 링크 및 상품 ID를 웹 검색하여 어떤 상품인지 구체적인 정보(정확한 상품명, 패키지 구성, 핵심 혜택, 숙소/상품 특징, 가격 메리트)를 찾아낸 뒤, 스레드(Threads)에서 수만 조회수가 터지는 찰진 B급 팩폭 카피를 작성하세요.

[링크 정보]
- 쿠팡 단축 링크: ${coupangUrl}
- 쿠팡 상세 URL / 상품 ID: ${redirectLocation} (상품번호: 10000010793428)

[요구사항]
1. 검색을 통해 정확한 상품명(예: 소노벨 단양 쿠팡 단독 특가 패키지)과 구체적 혜택(워터파크 오션플레이, 조식, 객실 뷰 등)을 파악하세요.
2. 왜 이 가격과 구성이 일반 구매 대비 압도적인 혜택인지 논리적으로 팩폭 분석하세요.
3. 찐 사용자 바이브의 찰진 반말체(~했음, ~임 ㅋㅋㅋ, ~추천함!)로 3~4문단 작성하세요.
4. 마지막은 "👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!" 로 끝나야 합니다.
`;

    console.log('Calling Gemini 2.5 Flash with Search Grounding...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    console.log('Gemini Search Response:\n', response.text);
  } catch (err) {
    console.error('Gemini search error:', err);
  }
}

testGeminiSearch();
