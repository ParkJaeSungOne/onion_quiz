import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using API key:', apiKey);

const ai = new GoogleGenAI({ apiKey });

try {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Hi, hello',
  });
  console.log('Response text:', response.text);
} catch (error) {
  console.error('Error generating content:', error);
}
