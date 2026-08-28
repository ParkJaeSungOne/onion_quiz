import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function listModels() {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const list = await ai.models.list();
    console.log('Available models:');
    for await (const m of list) {
      console.log(`- ${m.name} (${m.displayName}) - Supported: ${m.supportedGenerationMethods?.join(', ')}`);
    }
  } catch (err) {
    console.error('List models error:', err);
  }
}

listModels();
