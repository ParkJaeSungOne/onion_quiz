import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function listAll() {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const pager = await ai.models.list();
    for await (const m of pager) {
      if (m.name.includes('image') || m.name.includes('imagen')) {
        console.log('Image model:', m.name);
      }
    }
  } catch (e) {
    console.error('Err:', e.message);
  }
}

listAll();
