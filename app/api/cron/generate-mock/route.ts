import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. 기존 목 데이터가 이미 적재되어 있는지 타이틀로 검증
    const existing = await prisma.quiz.findFirst({
      where: { title: '나의 숨겨진 백수 DNA 테스트' }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Mock quizzes already exist in your database!',
        quizzes: ['나의 숨겨진 백수 DNA 테스트', '연애 눈치 코치 호구도 테스트', '나의 게으름 유형 테스트', '나의 유리멘탈 지수 테스트', '나의 SNS 중독 지수 테스트']
      });
    }

    // 2. 엄청 웃긴 퀴즈 5가지 데이터 정의 (각 5문항씩)
    const mockQuizzes = [
      {
        title: '나의 숨겨진 백수 DNA 테스트',
        description: '나는 과연 열심히 갓생을 사는 미래의 자본가일까, 아니면 숨만 쉬어도 침대와 한 몸이 되는 뼈속까지 백수일까?',
        category: '일상',
        questions: [
          {
            questionNumber: 1,
            text: '갑자기 찾아온 주말 공휴일, 눈을 떴을 때 나의 첫 행동은?',
            options: [
              { text: '미리 계획해 둔 스케줄에 맞춰 세수하고 나갈 준비를 한다.', score: 1 },
              { text: '일단 폰으로 오늘의 날씨와 뉴스를 가볍게 훑어본다.', score: 2 },
              { text: '유튜브 쇼츠를 켜고 나도 모르게 2시간이 흐른다.', score: 3 },
              { text: '화장실 가기 전까지 누워서 절대 몸을 일으키지 않는다.', score: 4 }
            ]
          },
          {
            questionNumber: 2,
            text: '친구들이 오늘 저녁 급 번개 모임을 제안했을 때 드는 생각은?',
            options: [
              { text: '당장 옷을 고르고 나갈 생각에 신이 난다.', score: 1 },
              { text: '거리와 멤버를 고려해보고 갈지 말지 신중히 정한다.', score: 2 },
              { text: '거절할 그럴듯한 핑계를 머릿속으로 급히 짜내기 시작한다.', score: 3 },
              { text: '이미 침대와 물아일체가 되었으므로 메신저를 읽지 않고 씹는다.', score: 4 }
            ]
          },
          {
            questionNumber: 3,
            text: '부자가 되어 평생 일하지 않아도 된다면 내가 가장 하고 싶은 것은?',
            options: [
              { text: '나만의 브랜드를 창업하거나 자기계발 공부를 더 한다.', score: 1 },
              { text: '전 세계로 호화로운 장기 여행을 다녀온다.', score: 2 },
              { text: '넷플릭스 전편 정주행과 배달 음식을 무한 반복한다.', score: 3 },
              { text: '아무것도 안 하고 숨만 쉬면서 누워있는 최고의 게으름을 만끽한다.', score: 4 }
            ]
          },
          {
            questionNumber: 4,
            text: '배달 음식을 시켰는데 일회용 수저를 빠뜨리고 주지 않았다면 나의 행동은?',
            options: [
              { text: '가게에 전화해서 정중하게 컴플레인을 건다.', score: 1 },
              { text: '집에 있는 쇠수저를 꺼내 씻어서 쓴다.', score: 2 },
              { text: '귀찮아서 지난번에 남겨둔 일회용 나무젓가락을 뒤져서 쓴다.', score: 3 },
              { text: '젓가락 씻는 것조차 귀찮아 손으로 대충 집어 먹을지 진지하게 고민한다.', score: 4 }
            ]
          },
          {
            questionNumber: 5,
            text: '해야 할 일이 산더미처럼 쌓여 있는 책상 앞에 앉았을 때 드는 생각은?',
            options: [
              { text: '우선순위를 정해 계획대로 척척 처리해 나간다.', score: 1 },
              { text: '한숨을 크게 한 번 쉬고 일단 시작은 해본다.', score: 2 },
              { text: '책상 정리나 방 청소부터 갑자기 의욕적으로 시작한다.', score: 3 },
              { text: '내일의 내가 알아서 해결해 줄 거라 믿고 폰을 켜서 눕는다.', score: 4 }
            ]
          }
        ],
        results: [
          {
            minScore: 5,
            maxScore: 8,
            title: '🔥 갓생 사는 불도저형 예비 자본가',
            content: '당신은 백수 DNA가 거의 0%에 수렴하는 프로 갓생러입니다! 쉬는 날에도 가만히 있지 못하고 끊임없이 움직이고 무언가 생산적인 활동을 해야 직성이 풀리는 스타일이군요. 훌륭한 예비 성공가입니다!',
            emoji: '🔥'
          },
          {
            minScore: 9,
            maxScore: 12,
            title: '⚖️ 무난한 일상형 월급 루팡 요정',
            content: '평소에는 성실히 일하고 주말에는 적당히 쉬는 지극히 균형 잡힌 유형입니다. 다만 회사에 있을 때는 호시탐탐 탕비실을 털거나 메신저 루팡 짓을 하는 소소한 월급 루팡 본능을 지니고 계시는군요!',
            emoji: '⚖️'
          },
          {
            minScore: 13,
            maxScore: 16,
            title: '🛌 침대 위 우주 정복형 게으름뱅이',
            content: '당신은 이미 척추의 80%가 누워있는 게으름뱅이입니다! 침대 위에 누워 상상 속으로 우주 정복까지 마쳤지만, 실제로 냉장고 물을 가지러 가는 발걸음조차 무거워하는 전형적인 집돌이/집순이 성향을 가집니다.',
            emoji: '🛌'
          },
          {
            minScore: 17,
            maxScore: 20,
            title: '👑 숨만 쉬어도 행복한 프로 백수 마스터',
            content: '축하합니다! 당신은 뼛속까지, 유전자 깊숙이 백수 DNA가 흐르는 프로 백수 마스터입니다. 침대, 스마트폰, 배달 음식만 있다면 한 달 동안 밖으로 한 발자국도 안 나가고 최고의 행복을 느낄 수 있는 궁극의 게으름 능력자입니다.',
            emoji: '👑'
          }
        ]
      },
      {
        title: '연애 눈치 코치 호구도 테스트',
        description: '연애할 때 나는 과연 밀당의 제왕일까, 아니면 간 쓸개 다 빼주고 뒷통수 맞는 삐에로 호구일까?',
        category: '연애',
        questions: [
          {
            questionNumber: 1,
            text: '연인이 화난 목소리로 "나 오늘 연락하지 마"라고 톡을 보냈을 때 나의 대처는?',
            options: [
              { text: '연인의 심리를 즉각 파악하고 바로 집 앞으로 꽃이나 디저트를 배달시킨다.', score: 1 },
              { text: '상황을 좀 지켜보고 1시간 뒤 진지하게 사과 톡을 보낸다.', score: 2 },
              { text: '진짜 연락 안 하면 더 화낼 테니 5분 간격으로 폭풍 톡을 보낸다.', score: 3 },
              { text: '말 잘 듣는 사람처럼 진짜 밤늦게까지 연락을 일절 안 하고 꿀잠 잔다.', score: 4 }
            ]
          },
          {
            questionNumber: 2,
            text: '연인이 평소보다 엄청 비싼 코스요리 식당 링크를 뜬금없이 보냈을 때 나의 반응은?',
            options: [
              { text: '특별한 날도 아니니 다른 가성비 좋은 맛집을 추천한다.', score: 1 },
              { text: '기분 낼 겸 가자고 하며 더치페이나 번갈아 낼 궁리를 한다.', score: 2 },
              { text: '조금 부담스럽지만 기쁘게 해주고 싶어 바로 예약하고 카드 한도를 체크한다.', score: 3 },
              { text: '무조건 내가 다 사야겠다고 생각하고 당장 영혼과 통장을 탈탈 턴다.', score: 4 }
            ]
          },
          {
            questionNumber: 3,
            text: '약속 시간에 연락도 없이 30분째 늦고 있는 연인을 기다릴 때 드는 생각은?',
            options: [
              { text: '시간 개념에 대해 화를 내며 약속을 취소하고 집에 간다.', score: 1 },
              { text: '이유가 있겠지 하고 전화 한 통만 넣어본다.', score: 2 },
              { text: '오는 길에 무슨 사고라도 났을까 안절부절못하며 걱정한다.', score: 3 },
              { text: '오기만 하면 다행이라고 생각하며 추운 밖에서 웃으며 하염없이 기다린다.', score: 4 }
            ]
          },
          {
            questionNumber: 4,
            text: '친구들이 내 연인에 대해 "너한테 너무 함부로 대하는 거 아냐?"라고 조언했을 때 나의 태도는?',
            options: [
              { text: '친구들의 객관적인 조언을 듣고 연인과의 관계를 냉정하게 돌아본다.', score: 1 },
              { text: '기분은 썩 좋지 않지만 속상해하며 고민한다.', score: 2 },
              { text: '"내 애인은 원래 이런 성격이야"라며 애써 쉴드를 친다.', score: 3 },
              { text: '오히려 연인을 대변하고, 그런 말을 한 친구와 관계를 끊어버린다.', score: 4 }
            ]
          },
          {
            questionNumber: 5,
            text: '헤어지고 난 뒤, 연인에게 빌려준 돈이나 빌려준 물건을 돌려받아야 할 때 나는?',
            options: [
              { text: '법적 대응이나 단호한 독촉을 통해 끝까지 1원 한 장 다 돌려받는다.', score: 1 },
              { text: '계좌번호를 보내고 조용히 이체하라고 통보한다.', score: 2 },
              { text: '차마 달라고 말 못하고 혼자 끙끙 앓으며 며칠 밤을 설친다.', score: 3 },
              { text: '그냥 기부했다고 생각하고 쿨한 척하며 내가 다 독박 쓴다.', score: 4 }
            ]
          }
        ],
        results: [
          {
            minScore: 5,
            maxScore: 8,
            title: '🦊 밀당 만렙 여우형 밀당 대마왕',
            content: '당신은 연애 판을 손바닥 위에 두고 굴리는 밀당의 제왕입니다! 절대로 손해 보는 연애를 하지 않으며, 상대방의 머리꼭대기에 올라타 눈치 코치 백단으로 연애를 주도합니다. 호구 지수 0%!',
            emoji: '🦊'
          },
          {
            minScore: 9,
            maxScore: 12,
            title: '🐶 순둥하고 따뜻한 리트리버형 연인',
            content: '적당히 헌신할 줄 알면서도 선을 지킬 줄 아는 아주 현명한 연인입니다. 대인배 성격에 눈치도 적당히 빨라 싸움을 잘 만들지 않는 이 시대의 평화주의자입니다.',
            emoji: '🐶'
          },
          {
            minScore: 13,
            maxScore: 16,
            title: '🕯️ 영혼까지 활활 태우는 자발적 촛불 헌신가',
            content: '연인이 기뻐한다면 나의 힘듦은 아무것도 아니라고 믿는 자발적 순종가입니다. 은근히 상대방의 감정에 조종당하고 퍼주는 성격이므로, 주위 친구들이 한숨을 자주 쉴 가능성이 높습니다.',
            emoji: '🕯'
          },
          {
            minScore: 17,
            maxScore: 20,
            title: '🤡 우주 최강 호구 삐에로 마스터',
            content: '축하합니다(?)! 당신은 간과 쓸개, 지갑 털기부터 멘탈 붕괴까지 당하면서도 상대방 앞에서 바보처럼 헤헤 웃어주는 진정한 호구 삐에로입니다. 본인의 멘탈과 통장을 지키기 위해 당장 연애 다이어트가 필요합니다.',
            emoji: '🤡'
          }
        ]
      },
      {
        title: '나의 아침잠 게으름 유형 테스트',
        description: '아침 알람 소리를 대하는 나의 본능적인 행동으로 보는 진짜 게으름/지각 지수 측정기!',
        category: '일상',
        questions: [
          {
            questionNumber: 1,
            text: '내일 중요한 아침 미팅이 있을 때, 알람 설정을 몇 개 해두나요?',
            options: [
              { text: '깔끔하게 1개만 맞춰두고 무조건 한 번에 일어난다.', score: 1 },
              { text: '만일을 대비해 5분 간격으로 2~3개 설정해둔다.', score: 2 },
              { text: '적어도 10개 이상, 1분 단위로 화면을 가득 채워둔다.', score: 3 },
              { text: '알람을 안 맞추거나 내 본능적인 바이오리듬에 맡긴다.', score: 4 }
            ]
          },
          {
            questionNumber: 2,
            text: '눈을 떴을 때 이미 출근/등교 시간 10분 전이라면 나의 첫 반응은?',
            options: [
              { text: '빛의 속도로 세수하고 머리 대충 감으며 나갈 채비를 마친다.', score: 1 },
              { text: '택시비가 얼마가 나오든 일단 카카오 택시를 부른다.', score: 2 },
              { text: '머릿속으로 아프다는 핑계를 만들어내어 연차/지각계를 낼 시나리오를 짠다.', score: 3 },
              { text: '이미 틀렸음을 인지하고 그냥 다시 누워 꿀잠을 청한다.', score: 4 }
            ]
          },
          {
            questionNumber: 3,
            text: '아침에 알람 스누즈(Snooze) 버튼을 누를 때 나의 무의식 상태는?',
            options: [
              { text: '한 번 누르고 정신 바짝 차려 일어난다.', score: 1 },
              { text: '눈 감고 3번쯤 반복해 누르며 서서히 일어난다.', score: 2 },
              { text: '아예 귀를 막거나 폰을 베개 밑으로 던지고 계속 잔다.', score: 3 },
              { text: '내가 알람을 껐는지조차 모르는 기절 상태를 유지한다.', score: 4 }
            ]
          },
          {
            questionNumber: 4,
            text: '준비 시간을 아끼기 위해 내가 해본 행동 중 극단적인 것은?',
            options: [
              { text: '아침에 나갈 준비는 꼬박꼬박 샤워까지 완벽히 하고 나간다.', score: 1 },
              { text: '세수와 양치만 하고 모자를 푹 눌러쓰고 나간다.', score: 2 },
              { text: '전날 옷을 아예 입고 자서 눈 뜨자마자 가방만 들고 뛴다.', score: 3 },
              { text: '일어나자마자 세수를 생략하고 마스크만 쓴 채 그냥 출근한다.', score: 4 }
            ]
          },
          {
            questionNumber: 5,
            text: '출근/통학 길에 지각할 것 같은 예감이 99% 확정적일 때 나는?',
            options: [
              { text: '최대한 뛰어가서 1분이라도 아끼려 든다.', score: 1 },
              { text: '팀장님이나 교수님께 미리 죄송하다는 톡을 보낸다.', score: 2 },
              { text: '어차피 늦은 거 가성비 좋게 맥모닝이나 커피를 사서 유유히 걸어간다.', score: 3 },
              { text: '포기하고 당장 지하철에서 내려서 PC방이나 집으로 탈출한다.', score: 4 }
            ]
          }
        ],
        results: [
          {
            minScore: 5,
            maxScore: 8,
            title: '🏃‍♂️ 미라클 모닝 갓생 러너',
            content: '당신은 알람이 울리자마자 군대 5분 대기조처럼 즉각 몸을 일으키는 갓생러입니다! 아침 시간을 알차게 쓰며 시간 관리에 철저한 이 시대의 부지런한 주자입니다.',
            emoji: '🏃‍♂️'
          },
          {
            minScore: 9,
            maxScore: 12,
            title: '🧚‍♀️ 턱걸이 세이프 슬라이딩 요정',
            content: '매일 아침 스릴을 즐기는 유형입니다. 간당간당하게 지각 면제 타이밍을 칼같이 계산해서 머리도 안 말린 채 세이프하는 아침잠 눈치 백단 요정입니다.',
            emoji: '🧚‍♀️'
          },
          {
            minScore: 13,
            maxScore: 16,
            title: '💤 스누즈 버튼 파괴자 "5분만 더" 인간',
            content: '당신의 아침은 늘 알람과의 치열한 격투로 가득 차 있습니다. 알람 10개를 모조리 끄면서도 "딱 5분만"을 우주 법칙처럼 읊조리는 전형적인 침대 지박령입니다.',
            emoji: '💤'
          },
          {
            minScore: 17,
            maxScore: 20,
            title: '🛌 시공간을 초월한 프로 지각 대장',
            content: '축하합니다! 당신은 알람 소리 따위는 뇌에서 소음 필터링으로 차단해버리는 궁극의 지각 대장입니다. 지각이 일상이 되어 아침에 다시 눈을 감아도 아무런 양심의 가책을 느끼지 않는 해탈의 경지입니다.',
            emoji: '🛌'
          }
        ]
      },
      {
        title: '나의 유리멘탈 지수 테스트',
        description: '조그만 바람에도 바스라지는 쿠쿠다스 멘탈일까, 아니면 태풍이 불어도 끄떡없는 다이아몬드 강철 멘탈일까?',
        category: '성격',
        questions: [
          {
            questionNumber: 1,
            text: '회사 상사나 친구가 지나가듯 "너 오늘 헤어스타일 좀 특이하네?"라고 툭 던졌을 때 나의 속마음은?',
            options: [
              { text: '전혀 개의치 않고 "오늘 바빠서 대충 나왔어~" 하고 넘긴다.', score: 1 },
              { text: '거울을 한번 보며 신경 쓰이네 하고 가볍게 지나친다.', score: 2 },
              { text: '하루 종일 머리 모양만 보이며 집에서 머리를 감고 나올 걸 후회한다.', score: 3 },
              { text: '그 말이 가슴에 박혀 일주일 내내 머리스타일 때문에 위축된다.', score: 4 }
            ]
          },
          {
            questionNumber: 2,
            text: '카카오톡 메시지를 보냈는데 상대방이 읽고 3시간째 답장이 없을 때 나의 멘탈 상태는?',
            options: [
              { text: '보낸 사실조차 까맣게 잊고 내 할 일 열심히 한다.', score: 1 },
              { text: '바쁜가 보네 하고 가끔 톡방을 확인한다.', score: 2 },
              { text: '내가 무슨 실수를 했나 이전 대화 기록을 10번씩 정독해 본다.', score: 3 },
              { text: '미움을 받았다고 확신하며 이불을 차고 멘탈이 와르르 무너진다.', score: 4 }
            ]
          },
          {
            questionNumber: 3,
            text: '유튜브 쇼츠나 릴스를 올렸는데 악플(예: "재미없네요")이 딱 1개 달렸을 때 나의 리액션은?',
            options: [
              { text: '관심 감사하다며 악플을 쿨하게 차단하거나 조롱짤로 대응한다.', score: 1 },
              { text: '그냥 지워버리고 기분 나빠하고 넘긴다.', score: 2 },
              { text: '내가 그렇게 재능이 없나 슬퍼하며 채널을 지워버릴까 고민한다.', score: 3 },
              { text: '가슴 깊이 큰 상처를 입고 평생 인터넷에 글을 쓰지 않겠다고 다짐한다.', score: 4 }
            ]
          },
          {
            questionNumber: 4,
            text: '키우던 반려식물이 내 실수로 물을 안 줘서 살짝 시들었을 때 드는 생각은?',
            options: [
              { text: '물을 흠뻑 주고 살려보려 애쓴다. 죽으면 다시 산다.', score: 1 },
              { text: '조금 미안하지만 얼른 물을 챙겨 준다.', score: 2 },
              { text: '식물도 못 키우는 내 자신이 너무 원망스럽고 속상해진다.', score: 3 },
              { text: '생명을 죽였다는 죄책감에 눈물을 흘리며 며칠 동안 시무룩해진다.', score: 4 }
            ]
          },
          {
            questionNumber: 5,
            text: '협동 게임(롤, 오버워치 등) 도중 같은 팀원이 나에게 "못하면 겜 접으셈"이라고 욕설 핀잔을 줬을 때 나는?',
            options: [
              { text: '즉시 차단하고 신고를 먹이거나 똑같이 한마디 쏘아붙여 준다.', score: 1 },
              { text: '기분은 썩 나쁘지만 조용히 게임에 집중한다.', score: 2 },
              { text: '심장이 벌렁거리고 손이 바들바들 떨려 게임 플레이를 더 망친다.', score: 3 },
              { text: '그날로 게임을 당장 삭제하고 내 자아 정체성에 상처를 입어 이불속으로 대피한다.', score: 4 }
            ]
          }
        ],
        results: [
          {
            minScore: 5,
            maxScore: 8,
            title: '💎 무념무상 다이아몬드 강철 멘탈',
            content: '당신은 외부의 어떠한 비난이나 조롱에도 상처 하나 입지 않는 무적의 다이아몬드 강철 멘탈입니다! 세상만사 마이웨이로 살아가며 스트레스를 거의 받지 않는 축복받은 멘탈 소유자입니다.',
            emoji: '💎'
          },
          {
            minScore: 9,
            maxScore: 12,
            title: '🥫 단단하고 유연한 알루미늄 캔 멘탈',
            content: '일반적인 수준의 멘탈입니다. 가끔 기분 나쁘거나 찌그러질 때(우울할 때)가 있지만 금세 툭툭 털고 본래 상태로 펴지는 복원력이 우수한 훌륭한 회복 탄력성의 인재입니다.',
            emoji: '🥫'
          },
          {
            minScore: 13,
            maxScore: 16,
            title: '🍪 스치면 바스락 쿠쿠다스 멘탈',
            content: '조심하세요! 당신은 사소한 말 한마디에도 쿠쿠다스 과자처럼 멘탈이 와르르 바스라지는 여린 심성의 소유자입니다. 남의 시선에 지나치게 집착하고 혼자 속앓이를 많이 하시는군요.',
            emoji: '🍪'
          },
          {
            minScore: 17,
            maxScore: 20,
            title: '🌪️ 크게 숨 쉬면 바스라지는 나노 먼지 멘탈',
            content: '당신은 멘탈이 실존하는지 의구심이 드는 나노 먼지 멘탈입니다! 눈빛 한번, 카톡 답장 속도 하나에 온 우주가 무너지는 극도의 유리멘탈이며, 상처를 받기 전에 본능적으로 이불 속으로 숨어드는 방어형 멘탈 보유자입니다.',
            emoji: '🌪️'
          }
        ]
      },
      {
        title: '나의 SNS 스마트폰 중독 지수 테스트',
        description: '내가 과연 자연인 수준의 아날로그 감성인지, 아니면 뇌가 도파민 알고리즘 좀비가 되었는지 알아보는 중독 측정기!',
        category: '소비',
        questions: [
          {
            questionNumber: 1,
            text: '화장실에 갈 때 스마트폰을 두고 들어갔다는 사실을 알았을 때 드는 내 마음은?',
            options: [
              { text: '볼일에 집중하는 경건한 시간이라 생각하며 개의치 않는다.', score: 1 },
              { text: '심심하지만 그냥 대충 볼일을 보고 나온다.', score: 2 },
              { text: '급하게 나와서 폰을 다시 챙겨 들고 굳이 화장실로 들어간다.', score: 3 },
              { text: '폰 없는 5분이 지옥과 같다고 느끼며 벽에 걸린 샴푸 뒷면 성분을 쥐어짜듯 읽는다.', score: 4 }
            ]
          },
          {
            questionNumber: 2,
            text: '인스타그램이나 블로그에 올린 글에 좋아요(하트)가 1시간째 0개인 것을 확인했다면 나의 행동은?',
            options: [
              { text: '전혀 신경 쓰지 않고 앱을 끈다.', score: 1 },
              { text: '오늘 사람이 없네 하고 가끔 열어본다.', score: 2 },
              { text: '해시태그를 더 달거나 사진을 바꾸어 수정 업로드해본다.', score: 3 },
              { text: '미움받는 느낌에 우울해져 피드 자체를 비공개하거나 삭제해버린다.', score: 4 }
            ]
          },
          {
            questionNumber: 3,
            text: '하루 중 스마트폰 스크린 타임(사용 시간)을 조회했을 때 평균 시간은?',
            options: [
              { text: '2시간 미만으로, 전화를 빼면 거의 폰을 보지 않는다.', score: 1 },
              { text: '3~4시간 수준으로 지극히 대중적인 사용 패턴이다.', score: 2 },
              { text: '6~8시간으로, 밥 먹을 때나 걸어갈 때도 폰을 늘 쥐고 있다.', score: 3 },
              { text: '10시간 이상으로 잠자는 시간 빼고는 폰과 눈이 합체되어 있다.', score: 4 }
            ]
          },
          {
            questionNumber: 4,
            text: '유튜브 쇼츠나 틱톡, 릴스 등 숏폼 비디오를 볼 때 나의 패턴은?',
            options: [
              { text: '숏폼 영상은 도파민 낭비라 거의 보지 않는다.', score: 1 },
              { text: '정보성 쇼츠 등 가끔 눈팅으로 15분 내외만 즐긴다.', score: 2 },
              { text: '손가락으로 아래로 스와이프하며 나도 모르게 2시간이 훌쩍 지나간다.', score: 3 },
              { text: '새벽까지 무한 스크롤링을 하며 뇌가 마비되는 듯한 도파민 중독을 매일 겪는다.', score: 4 }
            ]
          },
          {
            questionNumber: 5,
            text: '핸드폰 배터리가 5% 미만으로 남아 있고 충전기를 쓸 수 없을 때 나의 심리적 상태는?',
            options: [
              { text: '꺼지면 꺼지는 대로 아날로그 감성을 즐기며 편안하게 있는다.', score: 1 },
              { text: '연락이 안 될까 봐 살짝 신경 쓰이지만 내 할 일 한다.', score: 2 },
              { text: '근처 편의점이나 보조배터리 대여 서비스를 이잡듯 뒤지기 시작한다.', score: 3 },
              { text: '세상과의 끈이 끊어진다는 심각한 공포와 심장 박동수 급상승을 경험한다.', score: 4 }
            ]
          }
        ],
        results: [
          {
            minScore: 5,
            maxScore: 8,
            title: '🧘 아날로그 감성 자연인',
            content: '당신은 스마트폰 없이도 책을 읽거나 명상을 즐길 수 있는 이 시대의 보기 드문 웰빙 자연인입니다! 디지털 디톡스가 이미 삶에 녹아있는 평온한 영혼입니다.',
            emoji: '🧘'
          },
          {
            minScore: 9,
            maxScore: 12,
            title: '📱 평범한 눈팅러 요정',
            content: '가장 평범하고 건강한 스마트폰 라이프를 누리고 계십니다. 필요할 땐 쓰고 쉴 땐 폰을 멀리 둘 줄 아는 훌륭한 자제력의 보유자입니다.',
            emoji: '📱'
          },
          {
            minScore: 13,
            maxScore: 16,
            title: '🍭 도파민 중독 숏폼 요정',
            content: '조심하세요! 유튜브 쇼츠와 릴스에 뇌를 빼앗겨 손가락이 자동 반사로 스크롤을 하고 계십니다. 서서히 뇌가 도파민 중독에 절어가고 있으니 하루 1시간 폰 안 만지기 미션을 해보세요.',
            emoji: '🍭'
          },
          {
            minScore: 17,
            maxScore: 20,
            title: '🧟 알고리즘이 지배한 스마트폰 좀비',
            content: '축하합니다(?)! 당신은 눈과 뇌가 스마트폰 액정과 완전히 하나가 된 알고리즘 좀비 마스터입니다. 폰이 없으면 호흡 곤란을 겪고 새벽 4시까지 쇼츠를 보며 충혈된 눈으로 아침을 맞이하는 중증 중독 상태입니다. 강제 디지털 디톡스가 시급합니다!',
            emoji: '🧟'
          }
        ]
      }
    ];

    // 3. 트랜잭션으로 DB에 퀴즈 적재
    for (const quizData of mockQuizzes) {
      await prisma.$transaction(async (tx) => {
        const quiz = await tx.quiz.create({
          data: {
            title: quizData.title,
            description: quizData.description,
            category: quizData.category,
          }
        });

        for (const q of quizData.questions) {
          const question = await tx.question.create({
            data: {
              quizId: quiz.id,
              questionNumber: q.questionNumber,
              text: q.text,
            }
          });

          await tx.option.createMany({
            data: q.options.map(opt => ({
              questionId: question.id,
              text: opt.text,
              score: opt.score
            }))
          });
        }

        await tx.result.createMany({
          data: quizData.results.map(res => ({
            quizId: quiz.id,
            minScore: res.minScore,
            maxScore: res.maxScore,
            title: res.title,
            content: res.content,
            emoji: res.emoji
          }))
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully generated 5 extremely funny mock quizzes in your Supabase DB!'
    });

  } catch (error: any) {
    console.error('Mock Generation Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
