import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testLink() {
  const url = 'https://link.coupang.com/a/gzCD87x3EO';
  
  // 1. Follow redirect
  const res = await fetch(url, { redirect: 'manual' });
  console.log('Status:', res.status);
  const loc = res.headers.get('location');
  console.log('Location:', loc);

  if (loc) {
    const urlObj = new URL(loc);
    console.log('Pathname:', urlObj.pathname);
    console.log('Params:', Array.from(urlObj.searchParams.entries()).map(([k, v]) => `${k}=${v}`).join(', '));
  }

  // 2. Fetch HTML
  try {
    const crawlRes = await fetch(loc || url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await crawlRes.text();
    console.log('HTML Length:', html.length);
    console.log('HTML snippet:', html.substring(0, 500));
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'None');
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    console.log('og:title:', ogTitle ? ogTitle[1] : 'None');
    const ogImg = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    console.log('og:image:', ogImg ? ogImg[1] : 'None');
  } catch (e) {
    console.error('Crawl err:', e);
  }

  // 3. Test Gemini Search Grounding on this specific URL and product ID
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
다음 쿠팡 핫딜 링크에 연결된 상품이 정확히 어떤 상품인지 구체적으로 조사하고 알려줘:
- 링크: ${url}
- 리다이렉트: ${loc}
`;
    const searchRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log('Gemini Search Result:\n', searchRes.text);
  } catch (err) {
    console.error('Gemini err:', err);
  }
}

testLink();
