import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testVivaldi() {
  const ai = new GoogleGenAI({ apiKey });
  const productName = '비발디파크 오션월드 얼리파크인 종일권 (07:30분부터 입장 가능)';
  const cleanUrl = 'https://link.coupang.com/a/gzCD87x3EO';

  const prompt = `
당신은 대한민국 최고의 '핫딜 & 트렌드 전문 바이럴 마케터'입니다.
다음 쿠팡 핫딜 상품에 대해 스레드(Threads)에서 폭발적인 반응과 공유가 터지는 찰진 B급 팩폭 카피를 작성하세요.

[상품 정보]
- 상품명: "${productName}"
- 핵심 특징: 07시 30분부터 조기 입장 가능한 '얼리파크인' 종일권, 몬스터블라스터/더블토네이도 등 인기 어트랙션 대기 없이 1빠로 타는 사기적인 혜택, 정규 개장 전 쾌적한 물놀이
- 링크: "${cleanUrl}"

[작성 가이드라인]
1. **첫 문장 (현실 비교 훅)**: 땡볕에서 2시간 줄 서는 사람들과 비교하며 시작 (예: "남들 땡볕에서 2시간 줄 서서 어트랙션 하나 탈 때, 7시 반에 들어가서 인기 슬라이드 3개 연속 조지는 법 알려줌 ㄷㄷ")
2. **논리적인 3단 팩트 분해**:
   - ① [얼리파크인의 사기성]: 07:30 입장으로 일반 입장객 몰려오기 전에 대기 0분으로 몬스터블라스터 탑승
   - ② [체력 & 가성비]: 오후에 사람 터질 때 여유롭게 선베드 쉬거나 퇴장 가능
   - ③ [선점 타이밍]: 얼리파크인 수량 한정이라 날짜 빠지기 전에 잡아야 함
3. **톤앤매너**: 찐 사용자 구어체 반말 (~했음, ~임 ㅋㅋㅋ, ~추천함!)
4. **마무리**: 반드시 "👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!"
5. **분량**: 마크다운 볼드(**) 없이 깔끔한 줄바꿈과 이모지 섞어 3~4문단.
`;

  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });

  console.log('Result:\n', res.text);
}

testVivaldi();
