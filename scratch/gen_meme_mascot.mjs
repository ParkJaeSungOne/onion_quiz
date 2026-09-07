import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Sleeping 50s to guarantee clean rate-limit window...');
  await sleep(50000);

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Trendy and hip Korean indie meme character sticker (in the style of Dinotaeng, Gosim, or Koongya). A chubby cute little doughy white creature with a funny deadpan derpy blank expression (two tiny black dot eyes, no mouth or simple straight line mouth) wearing a boxy pastel butter-yellow locker on its back like a big backpack, proudly holding a simple yellow key in its tiny round hand. 100% flat 2D graphic vector art, clean bold black ink outlines, solid flat pastel colors, zero gradients, zero airbrush shading, quirky B-grade meme humor, iconic minimalist indie brand mascot, centered on pure solid white background, perfect circular avatar composition.`;

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
          const outPath = 'public/pickmycabinet/profile_hip_meme_mascot.jpg';
          fs.writeFileSync(outPath, buffer);
          console.log('SUCCESS! Saved image to:', outPath);
          return;
        }
      }
    }
    console.log('No image part in response');
  } catch (e) {
    console.error('Err:', e.message);
  }
}

run();
