import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)/);
const apiKey = match ? match[1] : '';

async function testPeriperaViralCopy() {
  const ai = new GoogleGenAI({ apiKey });
  const productName = '페리페라 무드 글로이 틴트';
  const cleanUrl = 'https://link.coupang.com/a/gzLgI99p6q';
  const productDetails = '탕후루 광택립, 올영 1위 틴트, 마라탕 먹어도 안 지워지는 지속력과 착색';

  const viralPrompt = `
당신은 대한민국 스레드(Threads)에서 10만+ 조회수와 폭발적인 댓글/공유를 터뜨리는 최고의 '트렌드 & 핫딜 바이럴 마케터'입니다.
다음 상품 정보를 바탕으로, 해당 상품의 카테고리(뷰티/화장품, 여행/숙박, 식품/음료, 생활가전 등)에 딱 맞는 **센스 넘치고 찰진 현실 공감 B급 팩폭 카피**를 작성하세요.

[상품 및 딜 정보]
- 상품명: "${productName}"
- 링크: "${cleanUrl}"
- 특징/메모: "${productDetails}"

[카테고리별 바이럴 훅 작성 가이드]
1. **뷰티/화장품/틴트인 경우**:
   - 일상 속 현실 공감 & 극단적 지속력/발색 훅 (예: "이 틴트 바르고 나갔더니 입술 어디 거냐고 세 번 질문받음 ㅋㅋㅋ", "마라탕 폭풍 흡입하고 탕후루까지 조졌는데도 탕후루 립 광택이랑 착색 그대로 살아있는 거 실화냐 ㄷㄷ", "올영 세일 때 맨날 품절 뜨던 거 쿠팡에 이 가격으로 풀림")
2. **여행/호텔/워터파크/레저인 경우**:
   - 시간/비용 절약 팩폭 (예: "남들 땡볕에서 2시간 줄 설 때 7시 반에 들어가서 슬라이드 3개 연속 조지는 법", "호텔 1박에 조식+워터파크 다 묶어서 이 가격이면 무조건 이득인 이유")
3. **식품/음료/생필품인 경우**:
   - 편의점/마트 대비 개당 단가 팩폭 및 대량 쟁여두기 (예: "편의점에서 1개 2천원 넘게 주고 사 먹던 사람들 이거 모르면 손해 ㅋㅋㅋ 1개당 700원대로 쟁여두는 법")

[공통 작성 규칙]
- 첫 문장은 무조건 스크롤을 멈추게 만드는 강력한 현실 공감 훅으로 시작.
- 찐사용자 솔직 반말 구어체 ("~했음", "~임 ㅋㅋㅋ", "~인 거 알지?", "~추천함!").
- 마크다운 볼드(**), 제목(#), 따옴표 없이 자연스러운 줄바꿈과 이모지(🔥, ㄷㄷ, ㅋㅋㅋ, 💄, ✨, 👍 등)를 적절히 섞어 딱 3~4문단 (공백 포함 280~400자).
- 마지막 문장은 반드시 **"👇 쿠팡 단독 특가 링크는 아래 첫 댓글에 달아둘게!"** 로 마무리.
`;

  const res = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: viralPrompt
  });

  console.log('Result:\n', res.text);
}

testPeriperaViralCopy();
