import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testExtractProduct() {
  const prodId = '9422863245';
  const itemId = '28007863364';
  const shortUrl = 'https://link.coupang.com/a/gzLgI99p6q';

  console.log('=== Test 1: Daum Search for Coupang Product ID ===');
  try {
    const daumUrl = `https://search.daum.net/search?w=tot&q=${encodeURIComponent(`쿠팡 ${prodId}`)}`;
    const res = await fetch(daumUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const text = await res.text();
    console.log('Daum search text length:', text.length);
    // Find snippets containing Coupang or product names
    const titles = text.match(/class="f_tit"[^>]*>([^<]+)<\/a>/gi) || [];
    console.log('Daum titles found:', titles);
  } catch (e) {
    console.error('Daum search error:', e.message);
  }

  console.log('\n=== Test 2: Gemini Google Search Grounding for Coupang Product ID ===');
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `웹 검색을 통해 쿠팡 상품 번호 ${prodId} (아이템 번호: ${itemId}) 또는 쿠팡 링크 ${shortUrl} 가 가리키는 정확한 실제 한국어 상품명(브랜드명 + 제품명 + 용량/규격)을 찾아줘.
답변의 첫 줄에 반드시 "[PRODUCT_NAME: 정확한 상품명]" 형식으로만 정확히 적어줘.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    console.log('Gemini Search Grounding result:\n', res.text);
  } catch (e) {
    console.error('Gemini search error:', e.message);
  }
}

testExtractProduct();
