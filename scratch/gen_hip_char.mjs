import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function generateHipCharacter() {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Trendy 2D Korean indie character mascot (similar to Dinotaeng, Gosim, or Koongya vibe). An adorable chubby, doughy, quirky little marshmallow creature with a funny deadpan derpy face and tiny black dot eyes, wearing a cute pastel butter-yellow locker on its back like a backpack and holding a little golden key. Bold clean black ink outlines, flat matte pastel colors, funny quirky meme energy, simple iconic mascot on a solid clean white background, centered circular avatar framing. Purely 2D indie vector sticker style, not 3D, not childish, very hip and cute.`;

  const models = ['gemini-2.5-flash-image', 'gemini-3-pro-image', 'gemini-3.1-flash-lite-image'];

  for (const model of models) {
    try {
      console.log('Trying model:', model);
      const res = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'image/jpeg'
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
      console.error(`Error with ${model}:`, e.message);
    }
  }
}

generateHipCharacter();
