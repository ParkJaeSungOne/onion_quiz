import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 1. 기존 목 데이터가 이미 적재되어 있는지 타이틀로 검증
    const existing = await prisma.quiz.findFirst({
      where: { title: '나의 직장생활 꼰대력 테스트' }
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Mock quizzes already exist in your database!',
        quizzes: [existing.title]
      });
    }

    // 2. Mock 퀴즈 데이터 정의
    const mockQuizzes = [
      {
        title: '나의 직장생활 꼰대력 테스트',
        description: '내가 혹시 회사에서 사이다 선배일까, 아니면 뒤에서 수군대는 꼰대 선배일까? 5문항으로 빠르게 알아보는 꼰대력 측정기!',
        category: '직장',
        questions: [
          {
            questionNumber: 1,
            text: '후배가 업무 지시를 받고 "이걸 제가 왜 해야 하죠?"라고 되물었을 때 나의 첫 반응은?',
            options: [
              { text: '차분하게 해당 업무의 목적과 역할 분담에 대해 설명해준다.', score: 1 },
              { text: '조금 당황스럽지만 일단 해두면 나중에 도움이 된다고 설득한다.', score: 2 },
              { text: '속으로 "요즘 애들은 참 까칠하네"라고 생각하며 직접 가르치려 든다.', score: 3 },
              { text: '어이가 없어서 말문이 막히고, 예의가 없다고 생각한다.', score: 4 }
            ]
          },
          {
            questionNumber: 2,
            text: '신입 사원의 메신저 말투에서 땀땀(;;), 물결(~), 혹은 이모티콘이 전혀 없을 때 드는 생각은?',
            options: [
              { text: '메신저는 명확한 정보 공유 수단일 뿐이므로 전혀 신경 쓰지 않는다.', score: 1 },
              { text: '말투가 좀 딱딱하다고 생각하지만 크게 개의치 않는다.', score: 2 },
              { text: '예의를 좀 더 갖추었으면 좋겠다고 생각하며 가볍게 지적해볼까 고민한다.', score: 3 },
              { text: '개념이 없거나 업무 태도가 불성실하다고 판단한다.', score: 4 }
            ]
          },
          {
            questionNumber: 3,
            text: '퇴근 시간 10분 전, 후배가 외투를 다 챙겨 입고 퇴근 대기를 하고 있는 모습을 본다면?',
            options: [
              { text: '시간에 맞춰 퇴근을 준비하는 합리적인 모습이라고 본다.', score: 1 },
              { text: '준비성이 빠르네 하고 넘긴다.', score: 2 },
              { text: '눈치가 좀 없다고 생각하며, 일이 다 끝났는지 의구심이 든다.', score: 3 },
              { text: '회사는 학교가 아닌데 태도가 글러먹었다고 생각한다.', score: 4 }
            ]
          },
          {
            questionNumber: 4,
            text: '회의 시간에 후배가 내 의견에 대해 "그 방법은 비효율적인 것 같습니다"라고 조목조목 반박한다면?',
            options: [
              { text: '다양한 의견이 나오는 회의 본연의 가치에 기뻐하며 수렴해 본다.', score: 1 },
              { text: '기분은 썩 좋지 않지만 의견의 타당성을 객관적으로 평가한다.', score: 2 },
              { text: '반박하는 태도가 다소 건방지다고 생각하며 내 주장을 강요한다.', score: 3 },
              { text: '회의가 끝나고 괘씸죄를 적용해 따로 불러 훈계한다.', score: 4 }
            ]
          },
          {
            questionNumber: 5,
            text: '업무 관련 노하우를 물어보지 않는 후배를 볼 때 내가 주로 하는 생각은?',
            options: [
              { text: '혼자서도 잘 해내는 똑부러지는 후배라고 믿고 존중한다.', score: 1 },
              { text: '자료를 먼저 스스로 찾아보나 보다 하고 지켜본다.', score: 2 },
              { text: '라떼는 선배들 꽁무니 졸졸 따라다니며 배웠는데 요즘 애들은 편하게 일한다고 생각한다.', score: 3 },
              { text: '성장하려는 의지도 없고 태도가 거만해서 키워줄 가치가 없다고 생각한다.', score: 4 }
            ]
          }
        ],
        results: [
          {
            minScore: 5,
            maxScore: 8,
            title: '🌱 청정 무해 새싹 요정형 선배',
            content: '당신은 꼰대 DNA가 거의 제로에 가까운 청정 요정 선배입니다! 후배들의 개인주의와 다양한 가치관을 진심으로 존중하며, 수평적인 의사소통에 매우 능숙합니다. 후배들에게 인기 만점인 멘토일 가능성이 높습니다!',
            emoji: '🌱'
          },
          {
            minScore: 9,
            maxScore: 12,
            title: '⚖️ 지극히 평범하고 이성적인 동료형 선배',
            content: '당신은 상식적인 수준의 선배입니다. 마음속으로 가끔 섭섭하거나 어이없을 때가 있지만, 이성적으로 후배들을 대하려 노력합니다. 꼰대와 트렌디한 선배 그 사이의 균형을 잘 지키고 계십니다.',
            emoji: '⚖️'
          },
          {
            minScore: 13,
            maxScore: 16,
            title: '🔥 슬슬 시동 거는 라떼 마스터형 선배',
            content: '조심하세요! 입에서 "라떼는 말이야~"가 자연스럽게 튀어나오기 시작하는 단계입니다. 후배들의 개인 성향을 다소 이해하지 못하고 예의와 군기를 은연중에 강요하고 계실 수 있습니다. 조금만 더 열린 마음을 가져보세요!',
            emoji: '🔥'
          },
          {
            minScore: 17,
            maxScore: 20,
            title: '👑 범접할 수 없는 최종 보스 마스터 꼰대',
            content: '당신은 움직이는 교과서적인 부장님급 꼰대 선배입니다. 회사에서의 수직적 서열과 태도를 가장 중요하게 생각하며, 요즘 후배들과의 큰 벽을 느끼고 계십니다. 후배들이 당신과의 소통을 은연중에 피하고 있을 수 있으니 자기 객관화가 절대적으로 필요합니다.',
            emoji: '👑'
          }
        ]
      },
      {
        title: '💸 나의 탕진 잼 소비 성향 테스트',
        description: '나는 과연 알뜰살뜰 소비요정일까, 아니면 스트레스를 지름신 영접으로 푸는 시원한 지름신 마스터일까?',
        category: '소비',
        questions: [
          {
            questionNumber: 1,
            text: '스트레스를 엄청나게 많이 받은 퇴근길, 쇼핑몰 앱을 켰을 때 나는?',
            options: [
              { text: '장바구니에만 넣어두고 앱을 조용히 끈다.', score: 1 },
              { text: '평소에 진짜 필요했던 생필품 하나만 산다.', score: 2 },
              { text: '가성비 좋은 소소한 힐링 아이템을 하나 충동구매한다.', score: 3 },
              { text: '비싸고 예쁜 상품들을 보자마자 마구 결제해버린다.', score: 4 }
            ]
          },
          {
            questionNumber: 2,
            text: '한 달 예산을 초과하여 돈을 많이 썼다는 것을 가계부나 카드 문자 고지로 확인했을 때 드는 기분은?',
            options: [
              { text: '엄청난 죄책감이 들어 다음 달 지출 계획을 바로 조여맨다.', score: 1 },
              { text: '아 이번 달은 좀 많이 썼네 하며 지출을 반성한다.', score: 2 },
              { text: '이미 쓴 돈 어쩌겠어 하고 애써 쿨하게 잊으려 한다.', score: 3 },
              { text: '다음 달의 내가 해결해 줄 거라 굳게 믿고 쇼핑을 지속한다.', score: 4 }
            ]
          },
          {
            questionNumber: 3,
            text: '인터넷 핫딜이나 한정판 할인 정보 알림이 떴을 때 나의 행동은?',
            options: [
              { text: '내가 필요하지 않은 물건이면 쳐다보지도 않는다.', score: 1 },
              { text: '후기나 가성비를 냉정하게 비교해보고 신중히 결정한다.', score: 2 },
              { text: '놓치면 아쉬우니 일단 장바구니에 담고 결제를 고민한다.', score: 3 },
              { text: '안 사면 손해라는 생각에 바로 품절 임박 전 빛의 속도로 결제한다.', score: 4 }
            ]
          },
          {
            questionNumber: 4,
            text: '월급날 통장에 돈이 꽂히자마자 내가 가장 먼저 하는 일은?',
            options: [
              { text: '미리 설정해 둔 적금과 청약 계좌 등으로 돈을 먼저 이체 분할한다.', score: 1 },
              { text: '고정지출(카드값, 월세 등)을 납부하고 남은 돈을 확인한다.', score: 2 },
              { text: '월급을 열심히 모은 나를 위해 위시리스트 쇼핑에 지출한다.', score: 3 },
              { text: '기분 좋게 친구들에게 한턱 쏘거나 평소 사고 싶던 명품 쇼핑에 탕진한다.', score: 4 }
            ]
          },
          {
            questionNumber: 5,
            text: '중고 장터나 중고 거래 앱을 사용할 때 나의 성향은?',
            options: [
              { text: '내가 안 쓰는 불필요한 물건을 팔아서 푼돈이라도 저축한다.', score: 1 },
              { text: '진짜 필요한 물건을 저렴하게 득템하기 위해 매일 키워드 알림을 걸어둔다.', score: 2 },
              { text: '아이쇼핑을 하다가 이쁜 쓰레기(?)를 홀린 듯이 구매한다.', score: 3 },
              { text: '귀찮아서 중고거래는 잘 안 하고, 그냥 새 제품을 바로 일시불로 산다.', score: 4 }
            ]
          }
        ],
        results: [
          {
            minScore: 5,
            maxScore: 8,
            title: '🧘‍♂️ 무소유의 경지에 오른 자산 수호자형',
            content: '당신은 소비보다 저축과 투자에 진심인 무소유의 수호자입니다! 불필요한 충동구매를 극도로 억제하며 지극히 계획적이고 합리적인 자금 흐름을 만듭니다. 가끔은 고생한 본인에게 작은 선물을 주셔도 좋습니다.'
          },
          {
            minScore: 5,
            maxScore: 8,
            title: '🧘‍♂️ 무소유의 경지에 오른 자산 수호자형',
            content: '당신은 소비보다 저축과 투자에 진심인 무소유의 수호자입니다! 불필요한 충동구매를 극도로 억제하며 지극히 계획적이고 합리적인 자금 흐름을 만듭니다. 가끔은 고생한 본인에게 작은 선물을 주셔도 좋습니다.',
            emoji: '🧘‍♂️'
          },
          {
            minScore: 9,
            maxScore: 12,
            title: '🧚‍♀️ 실속파 스마트 소비요정형',
            content: '당신은 가성비와 실용성을 최고로 따지는 실속파 요정입니다. 쓸 땐 쓰고 아낄 땐 아끼는 건전한 소비 철학을 갖고 계십니다. 계획 내에서 소비를 잘 통제하며 유연한 재정 상태를 유지합니다.',
            emoji: '🧚‍♀️'
          },
          {
            minScore: 13,
            maxScore: 16,
            title: '🛒 장바구니 컬렉터이자 힐링 소비형',
            content: '스트레스를 받을 때 쇼핑으로 힐링하는 경향이 있는 유형입니다. 장바구니에 소소한 물건들을 모아두며 소확행을 느낍니다. 매월 신용카드 고지서가 생각보다 높게 나와 깜짝 놀랄 수 있으니 소소한 탕진을 경계하세요!',
            emoji: '🛒'
          },
          {
            minScore: 17,
            maxScore: 20,
            title: '💸 지름신 강림 탕진잼 마스터형',
            content: '스트레스 해소와 기쁨을 대범한 쇼핑으로 해결하는 진정한 탕진잼 마스터입니다! "돈은 다시 벌면 된다"는 모토로 위시리스트를 꽉 채우는 짜릿함을 만끽합니다. 통장이 텅장이 되기 십상이니, 카드 한도를 조절하거나 긴급 비상금 계좌를 강제로 만들어 격리하는 것을 권장합니다.',
            emoji: '💸'
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
            emoji: res.emoji || '🧅'
          }))
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully generated 2 high-quality mock quizzes in your Supabase DB!'
    });

  } catch (error: any) {
    console.error('Mock Generation Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
