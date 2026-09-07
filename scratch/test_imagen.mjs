import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testImagen() {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Trendy Korean indie sticker character mascot (in the aesthetic of Dinotaeng, Gosim, or Koongya). A cute chubby, doughy, quirky little white jelly-bean creature with a funny deadpan derpy face and tiny black dot eyes, wearing a cute pastel butter-yellow locker on its back like a backpack and holding a little golden key. Bold clean black ink outlines, flat matte pastel colors, funny quirky meme energy, simple iconic mascot on a solid clean white background, centered circular avatar framing. Purely 2D indie vector sticker style.`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64Image = response.generatedImages[0].image.imageBytes;
      const buffer = Buffer.from(base64Image, 'base64');
      const outPath = 'public/pickmycabinet/profile_hip_korean_indie_mascot.jpg';
      fs.writeFileSync(outPath, buffer);
      console.log('Successfully generated via Imagen 3:', outPath);
    } else {
      console.log('No image returned');
    }
  } catch (err) {
    console.error('Imagen error:', err.message);
  }
}

testImagen();
