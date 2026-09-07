import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Waiting 25s for rate limit to reset...');
  await sleep(25000);

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Trendy 2D Korean indie character sticker mascot for 'pickmycabinet'. In the aesthetic of Gosim, Dinotaeng, or Koongya. An adorable chubby, doughy, quirky little marshmallow creature with a funny deadpan meme face and tiny dot eyes, carrying a cute pastel butter-yellow locker on its back like a backpack and holding a little golden key. Bold black ink outlines, flat solid colors, humorous indie character aesthetic, pure white background, centered circular avatar design.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: ['IMAGE']
      }
    });

    if (res.candidates && res.candidates[0]?.content?.parts) {
      for (const part of res.candidates[0].content.parts) {
        if (part.inlineData) {
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          const outPath = 'public/pickmycabinet/profile_hip_indie_mascot.jpg';
          fs.writeFileSync(outPath, buffer);
          console.log('SUCCESS! Saved to:', outPath);
          return;
        }
      }
    }
  } catch (e) {
    console.error('Err:', e.message);
  }
}

run();
