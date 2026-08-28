import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testImageAutoFind() {
  const query = '닥터지 그린 마일드 업 선크림';

  // 1. Daum Shopping / Image search for thumbnail
  try {
    const daumRes = await fetch(`https://search.daum.net/search?w=img&q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const daumHtml = await daumRes.text();
    const imgMatches = daumHtml.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
    const validDaumImgs = imgMatches.filter(u => 
      !u.includes('daumcdn.net/top') && 
      !u.includes('favicon') && 
      !u.includes('icon') && 
      !u.includes('static') &&
      (u.includes('daumcdn.net/thumb') || u.includes('search.daum') || u.includes('img1.daumcdn'))
    );
    console.log('Daum Image Search found:', validDaumImgs.slice(0, 3));
  } catch (e) {
    console.error('Daum img err:', e.message);
  }

  // 2. Google Search Grounding for official image
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `"${query}"의 고화질 대표 상품 이미지 URL(쿠팡 CDN 또는 공식 제품 이미지 URL, https://...jpg 또는 png)을 딱 1개 찾아서 [IMAGE_URL: URL] 형식으로만 출력해.`
    });
    console.log('Gemini Image search result:', res.text);
  } catch (e) {
    console.error('Gemini img err:', e.message);
  }
}

testImageAutoFind();
