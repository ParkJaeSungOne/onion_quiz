/**
 * 🌀 까도까도 스레드(Threads) 공식 API 자동 업로드 스크립트
 * 
 * [실행 방법]
 * 1. .env 파일에 THREADS_ACCESS_TOKEN 과 THREADS_USER_ID 를 설정합니다.
 * 2. 특정 번호의 게시글을 올릴 때:
 *    node threads_autoposter.js 1  (1번 템플릿 발행)
 *    node threads_autoposter.js 5  (5번 템플릿 발행)
 * 3. 전체 목록을 조회할 때:
 *    node threads_autoposter.js list
 */

const dotenv = require('dotenv');
const path = require('path');

// 로컬 환경변수 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '.env') });

const token = process.env.THREADS_ACCESS_TOKEN;
const userId = process.env.THREADS_USER_ID || 'me'; // 기본값 'me' 사용 가능

// 스레드 바이럴 템플릿 10개 정의
const templates = [
  {
    num: 1,
    title: "여름휴가 계획력 테스트 (P vs J)",
    text: "이번에 새로 뜨는 여름휴가 계획 테스트인데 난 진짜 뼈 맞음 ㅋㅋㅋ\n계획은 짜는데 결국 침대 밖으로 못 나가는 내 성격 그대로 나와서 소름 돋았다...\n즉흥 P형들이랑 계획 J형들 이거 해보고 서로 궁합 몇 프로인지 맞춰보셈 ㅋㅋㅋ\n\n👇 테스트 링크는 댓글에 달아둘게!",
    reply: "🏖️ 나의 여름휴가 J / P 계획력 테스트하러 가기! 👇\nhttps://kkado-kkado.com/quiz/32"
  },
  {
    num: 2,
    title: "💸 나의 탕진 잼 소비 성향 테스트",
    text: "월급날 하루 지나면 통장에 스쳐 지나가는 돈 다 어디로 갔나 했더니 ㅋㅋㅋ\n소비 탕진 잼 테스트 해보니까 나 '오늘만 사는 지름신 마스터' 나옴 ㅋㅋㅋ\n카드값 보면서 한숨 쉬는 친구들 태그하고 자폭해보자;\n\n👇 탕진 잼 테스트 링크는 댓글에!",
    reply: "💸 나의 소비 중독 & 탕진 유형 진단하기 👇\nhttps://kkado-kkado.com/quiz/2"
  },
  {
    num: 3,
    title: "나의 숨겨진 백수 DNA 테스트",
    text: "솔직히 로또 1등 되면 그 길로 침대랑 물아일체 될 백수 유전자 있는 사람? 🙋\n이거 해봤는데 내 잠재적 백수 지수 95% 나옴 ㅋㅋㅋ\n뼈 속까지 드러나는 게으름 팩폭기니까 갓생 사는 척하는 친구들 태그하셈 ㅋㅋㅋ\n\n👇 링크는 아래 댓글에!",
    reply: "🛌 나의 백수 DNA & 게으름 지표 테스트 👇\nhttps://kkado-kkado.com/quiz/3"
  },
  {
    num: 4,
    title: "도파민 좀비 측정기 (쇼츠/릴스 중독)",
    text: "쇼츠나 릴스 5분만 봐야지 하다가 2시간 뚝딱 지나가는 사람 무조건 해보셈 ㅋㅋㅋ\n내 뇌가 도파민 알고리즘에 얼마나 절여졌는지 등급으로 말해줌;\n나 '도파민 좀비 3단계' 떴다... 너네는 몇 단계 나옴?\n\n👇 링크는 아래 첫 댓글에!",
    reply: "📱 나의 도파민 중독 수준 판독하기 👇\nhttps://kkado-kkado.com/quiz/21"
  },
  {
    num: 5,
    title: "내 안의 '금쪽이/진상력' 농도 테스트",
    text: "솔직히 나도 가끔 킹받게 행동하는 거 인정하는데...\n내 안의 진상력 테스트해 보니까 나 '답정너 금쪽이 80%' 뜸 ㅋㅋㅋ\n팩폭 수위 존나 높아서 상처받을 수도 있으니까 조심해서 해라 ㅋㅋㅋ\n\n👇 금쪽이 테스트 링크는 댓글에!\n",
    reply: "😈 내 안의 숨겨진 금쪽이/진상력 농도 알아보기 👇\nhttps://kkado-kkado.com/quiz/36"
  },
  {
    num: 6,
    title: "소개팅 꼰대력 판독기 (썸 브레이커)",
    text: "첫 소개팅에서 파스타 먹으면서 이빨에 낀 거 지적하면 꼰대냐 매너냐? ㅋㅋㅋ\n이거 소개팅 꼰대력 판독기인데 나 '썸 브레이커' 나옴 ㅋㅋㅋ\n솔직히 나 연애 잘 못하는 이유가 여기 다 적혀있었네;\n\n👇 소개팅 꼰대력 확인은 아래 댓글로!",
    reply: "💔 나의 소개팅 꼰대력 & 연애 지수 테스트 👇\nhttps://kkado-kkado.com/quiz/37"
  },
  {
    num: 7,
    title: "나의 '갓생 호소인' 위선도 판독기",
    text: "인스타에 공부하는 척, 운동하는 척 사진만 찍어 올리는 '갓생 호소인' 다 모여라 ㅋㅋㅋ\n나의 갓생 위선도 판독해 주는데 나 위선율 90% 뜸 ㅋㅋㅋ\n솔직히 다들 보여주기식 갓생이잖아 ㅋㅋㅋ 해보고 솔직히 팩폭 맞자\n\n👇 위선도 링크 댓글 확인!",
    reply: "🏃‍♂️ 나의 갓생 호소인 위선율 진단받기 👇\nhttps://kkado-kkado.com/quiz/30"
  },
  {
    num: 8,
    title: "나의 유리멘탈 지수 테스트",
    text: "상사가 한마디 하면 하루 종일 곱씹으면서 퇴사 고민하는 쿠쿠다스 멘탈 다 모여봐 ㅋㅋㅋ\n멘탈 유리 지수 테스트인데 나 그냥 유리 수준이 아니라 비눗방울 멘탈 나옴 ㅋㅋㅋ\n너네는 다이아몬드 강철이냐 아니면 나처럼 먼지냐?\n\n👇 멘탈 지수 링크는 댓글에 고정!\n",
    reply: "💎 나의 멘탈 강도 & 유리멘탈 테스트 👇\nhttps://kkado-kkado.com/quiz/6"
  },
  {
    num: 9,
    title: "연애 눈치 코치 호구도 테스트",
    text: "맨날 연애할 때 퍼주기만 하다가 뒷통수 맞고 눈물 흘리는 사람? ㅋㅋㅋ\n연애 호구도 테스트인데 나 '간 쓸개 다 빼주는 삐에로' 뜸 ㅋㅋㅋ\n나 눈물 흘리면서 결과 읽었다... 다들 해보고 호구 탈출하자\n\n👇 호구도 테스트 링크는 아래 댓글!",
    reply: "🤡 나의 연애 호구 등급 진단하러 가기 👇\nhttps://kkado-kkado.com/quiz/4"
  },
  {
    num: 10,
    title: "MZ 오피스 빌런 판독기",
    text: "SNL MZ오피스에 나오는 맑은 눈의 광인 회사에 꼭 한 명씩 있지 않음? ㅋㅋㅋ\n오피스 빌런 판독기인데 나 '라떼 꼰대형 선배' 나옴 ㅋㅋㅋ\n신입들 에어팟 끼는 거 이해 못 하면 나 꼰대 맞지? 다들 솔직히 테스트해보자\n\n👇 오피스 빌런 링크 댓글에 고정!",
    reply: "💼 나의 MZ 오피스 빌런 지수 진단받기 👇\nhttps://kkado-kkado.com/quiz/19"
  }
];

// 도움말 출력
function showHelp() {
  console.log(`
==================================================
🤖 까도까도 스레드 자동화 발행 가이드
==================================================
설정 필요 변수 (.env):
  - THREADS_ACCESS_TOKEN : 메타 개발자 센터에서 발행한 사용자 액세스 토큰
  - THREADS_USER_ID      : 본인의 스레드 유저 고유 ID (기본값: me)

사용 명령어:
  - node threads_autoposter.js list      : 템플릿 목록 보기
  - node threads_autoposter.js <번호>    : 해당 번호의 글과 링크 댓글을 자동 업로드
  - 예시: node threads_autoposter.js 1
==================================================
`);
}

// 스레드 업로드 핵심 API 호출기
async function publishToThreads(postText, replyText) {
  if (!token) {
    console.error("❌ 에러: THREADS_ACCESS_TOKEN이 .env 파일에 구성되지 않았습니다.");
    showHelp();
    process.exit(1);
  }

  console.log("🚀 [1단계] 본문 게시물 생성 중...");
  
  try {
    // 1. 본문 컨테이너 등록 API 호출
    const containerRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'TEXT',
        text: postText,
        access_token: token
      })
    });
    const containerData = await containerRes.json();
    
    if (containerData.error) {
      throw new Error(JSON.stringify(containerData.error));
    }
    
    const creationId = containerData.id;
    console.log(`✅ 본문 컨테이너 생성 완료! (ID: ${creationId})`);

    // 2. 본문 최종 발행 API 호출
    console.log("🚀 [2단계] 본문 게시물 발행 완료하는 중...");
    const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: token
      })
    });
    const publishData = await publishRes.json();

    if (publishData.error) {
      throw new Error(JSON.stringify(publishData.error));
    }

    const parentPostId = publishData.id;
    console.log(`🎉 본문 발행 성공! (스레드 Post ID: ${parentPostId})`);
    
    // 3. 2초 대기 후 링크 댓글 추가 (첫 댓글 바이럴 모델)
    console.log("⏳ [3단계] 댓글 유입 링크 생성 준비 (2초 대기)...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("🚀 [4단계] 유입 링크 댓글 생성 중...");
    const replyContainerRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'TEXT',
        text: replyText,
        reply_to_id: parentPostId, // 부모 본문 포스트에 연결
        access_token: token
      })
    });
    const replyContainerData = await replyContainerRes.json();

    if (replyContainerData.error) {
      throw new Error(JSON.stringify(replyContainerData.error));
    }

    const replyCreationId = replyContainerData.id;

    // 4. 댓글 최종 발행
    console.log("🚀 [5단계] 유입 링크 댓글 최종 발행 중...");
    const replyPublishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: replyCreationId,
        access_token: token
      })
    });
    const replyPublishData = await replyPublishRes.json();

    if (replyPublishData.error) {
      throw new Error(JSON.stringify(replyPublishData.error));
    }

    console.log(`🔥 성공! 스레드 포스트와 링크 댓글이 실시간 업로드 완료되었습니다. 🚀`);
  } catch (err) {
    console.error("❌ 스레드 API 전송 도중 에러 발생:");
    console.error(err.message);
  }
}

// 메인 컨트롤러
async function run() {
  const arg = process.argv[2];

  if (!arg) {
    showHelp();
    process.exit(0);
  }

  if (arg === 'list') {
    console.log("\n📋 --- 스레드 자동 업로드 템플릿 목록 ---");
    templates.forEach((t) => {
      console.log(`[${t.num}번] ${t.title}`);
    });
    console.log("---------------------------------------\n");
    console.log("👉 발행 실행 예: node threads_autoposter.js 1\n");
    process.exit(0);
  }

  const selectedNum = parseInt(arg, 10);
  const target = templates.find((t) => t.num === selectedNum);

  if (!target) {
    console.error(`❌ 에러: ${arg}번 템플릿은 존재하지 않습니다. (1~10번 중에서 선택하세요)`);
    process.exit(1);
  }

  console.log(`\n📢 [선택 템플릿: ${target.num}번] ${target.title}`);
  console.log(`--------------------------------------------------`);
  console.log(`[본문]\n${target.text}`);
  console.log(`--------------------------------------------------`);
  console.log(`[댓글]\n${target.reply}`);
  console.log(`--------------------------------------------------\n`);

  await publishToThreads(target.text, target.reply);
}

run();
