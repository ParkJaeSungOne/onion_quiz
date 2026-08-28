import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testGrounding() {
  const ai = new GoogleGenAI({ apiKey });
  const prodId = '30000011448565';
  const url = `https://trip.coupang.com/tp/products/${prodId}`;

  // Search query for Google
  const query = `쿠팡 트래블 상품 ${prodId} 또는 쿠팡 여행 ${prodId}`;

  const prompt = `
당신은 대한민국 최고의 바이럴 마케터입니다.
웹 검색을 통해 쿠팡 트래블/여행 상품 번호 "${prodId}" 또는 링크 "${url}"에 해당하는 상품(호텔/리조트/숙소/패키지 등)이 무엇인지 찾아서, 상품명, 숙소명, 포함 혜택, 특징을 파악하고 스레드용 바이럴 B급 팩폭 글을 작성해 주세요.
`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    console.log('Candidates:', JSON.stringify(res.candidates, null, 2));
    console.log('Text property:', res.text);
    if (res.candidates && res.candidates[0]?.content?.parts) {
      for (const part of res.candidates[0].content.parts) {
        if (part.text) {
          console.log('Part text:', part.text);
        }
      }
    }
  } catch (e) {
    console.error('Err:', e);
  }
}

testGrounding();
