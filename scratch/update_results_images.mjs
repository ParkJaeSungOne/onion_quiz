import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating result images with derpy onion characters ---');

  // 모든 퀴즈 결과 조회
  const results = await prisma.result.findMany({
    orderBy: { minScore: 'asc' }
  });

  console.log(`Found ${results.length} total result types across all quizzes.`);

  // 퀴즈별로 그룹화하여 순서 매기기
  const quizResultsMap = {};
  results.forEach(res => {
    if (!quizResultsMap[res.quizId]) {
      quizResultsMap[res.quizId] = [];
    }
    quizResultsMap[res.quizId].push(res);
  });

  let updateCount = 0;

  for (const quizId in quizResultsMap) {
    const quizRes = quizResultsMap[quizId];
    
    // minScore 기준으로 오름차순 정렬 (점수대별 순서)
    quizRes.sort((a, b) => a.minScore - b.minScore);

    for (let idx = 0; idx < quizRes.length; idx++) {
      const res = quizRes[idx];
      let imageUrl = '/images/char-1.jpg'; // 기본값 (1구간: broke/crying)

      if (idx === 1) {
        imageUrl = '/images/char-3.jpg'; // 2구간 (lazy onion)
      } else if (idx >= 2) {
        imageUrl = '/images/char-2.jpg'; // 3, 4구간 (zombie onion)
      }

      await prisma.result.update({
        where: { id: res.id },
        data: { imageUrl }
      });
      updateCount++;
    }
  }

  console.log(`Successfully updated ${updateCount} results with B-grade onion character URLs!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
