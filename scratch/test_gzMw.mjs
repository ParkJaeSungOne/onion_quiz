import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function inspectLink() {
  const url = 'https://link.coupang.com/a/gzMwJGMldQ';
  console.log('Resolving short link:', url);

  const res = await fetch(url, { redirect: 'manual' });
  const loc = res.headers.get('location');
  console.log('Redirect Location:', loc);

  const prodMatch = loc?.match(/products\/(\d+)/i) || loc?.match(/productId=(\d+)/i);
  const prodId = prodMatch ? prodMatch[1] : '';
  const itemMatch = loc?.match(/itemId=(\d+)/i);
  const itemId = itemMatch ? itemMatch[1] : '';
  const vendorMatch = loc?.match(/vendorItemId=(\d+)/i);
  const vendorItemId = vendorMatch ? vendorMatch[1] : '';

  console.log(`Extracted: prodId=${prodId}, itemId=${itemId}, vendorItemId=${vendorItemId}`);

  // Test Google Search Grounding with this URL
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `웹 검색을 통해 쿠팡 링크 "${loc}" 또는 쿠팡 상품 번호 ${prodId} (아이템: ${itemId}, 벤더: ${vendorItemId})의 실제 한국어 상품명(브랜드명 + 제품명 + 용량/옵션)과 고화질 이미지 URL을 찾아줘.
답변 형식:
[PRODUCT_NAME: 실제 상품명]
[IMAGE_URL: 이미지URL]`;

  try {
    const searchRes = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let raw = searchRes.text?.trim() || '';
    if (!raw && searchRes.candidates && searchRes.candidates[0]?.content?.parts) {
      raw = searchRes.candidates[0].content.parts.map(p => p.text || '').filter(Boolean).join('\n');
    }
    console.log('Search Grounding Result:\n', raw);
  } catch (e) {
    console.error('Grounding err:', e.message);
  }
}

inspectLink();
