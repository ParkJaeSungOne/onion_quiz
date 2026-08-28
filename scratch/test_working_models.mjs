import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testWorkingModels() {
  const ai = new GoogleGenAI({ apiKey });
  const productName = '비발디파크 오션월드 얼리파크인 종일권';

  const prompt = `다음 쿠팡 핫딜 상품(${productName})에 대해 스레드 바이럴 팩폭 글을 3단락으로 작성해. 마지막은 "👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!"로 끝나야 함.`;

  const candidates = [
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-2.5-pro'
  ];

  for (const model of candidates) {
    try {
      console.log(`Testing ${model}...`);
      const res = await ai.models.generateContent({
        model,
        contents: prompt
      });
      console.log(`✅ SUCCESS ${model}:`, res.text?.substring(0, 150) + '...');
    } catch (e) {
      console.error(`❌ FAILED ${model}:`, e.message);
    }
  }
}

testWorkingModels();
