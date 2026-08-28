import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testGeminiSearch() {
  const ai = new GoogleGenAI({ apiKey });
  const prodId = '9422863245';
  const url = `https://www.coupang.com/vp/products/${prodId}`;

  const prompt = `웹 검색을 통해 "${url}" 또는 "쿠팡 ${prodId}" 상품의 정확한 실제 상품명(예: 브랜드명 + 제품명 + 용량)을 찾아줘.
반드시 첫 줄에 [PRODUCT_NAME: 실제 상품명] 으로만 답해줘.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let raw = res.text?.trim() || '';
    if (!raw && res.candidates && res.candidates[0]?.content?.parts) {
      raw = res.candidates[0].content.parts.map(p => p.text || '').filter(Boolean).join('\n');
    }
    console.log('Search Grounding Raw Result:\n', raw);
  } catch (e) {
    console.error('Err:', e.message);
  }
}

testGeminiSearch();
