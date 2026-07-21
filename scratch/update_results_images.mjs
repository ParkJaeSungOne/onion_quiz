import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getCharacterImage(title, content, emoji) {
  const text = (title + ' ' + content + ' ' + emoji).toLowerCase();
  
  if (text.includes('💸') || text.includes('돈') || text.includes('거지') || text.includes('지름') || text.includes('탕진') || text.includes('쇼핑') || text.includes('소비') || text.includes('적자') || text.includes('카드값')) {
    return '/images/char-broke.jpg';
  }
  if (text.includes('📱') || text.includes('도파민') || text.includes('좀비') || text.includes('알고리즘') || text.includes('중독') || text.includes('유튜브') || text.includes('쇼츠') || text.includes('인스타')) {
    return '/images/char-zombie.jpg';
  }
  if (text.includes('🛌') || text.includes('귀차니즘') || text.includes('침대') || text.includes('눕') || text.includes('게으름') || text.includes('백수') || text.includes('물아일체') || text.includes('멍')) {
    return '/images/char-lazy.jpg';
  }
  if (text.includes('💖') || text.includes('❤️') || text.includes('사랑') || text.includes('연애') || text.includes('소개팅') || text.includes('썸') || text.includes('호구') || text.includes('커플') || text.includes('궁합')) {
    return '/images/char-love.jpg';
  }
  if (text.includes('😡') || text.includes('화') || text.includes('분노') || text.includes('진상') || text.includes('빌런') || text.includes('금쪽') || text.includes('독설') || text.includes('킹받')) {
    return '/images/char-angry.jpg';
  }
  if (text.includes('🍔') || text.includes('식욕') || text.includes('음식') || text.includes('먹') || text.includes('다이어트') || text.includes('야식') || text.includes('간식') || text.includes('돼지')) {
    return '/images/char-food.jpg';
  }
  if (text.includes('🥺') || text.includes('소심') || text.includes('유리멘탈') || text.includes('개복치') || text.includes('상처') || text.includes('눈치') || text.includes('쿠쿠다스') || text.includes('멘탈')) {
    return '/images/char-shy.jpg';
  }
  if (text.includes('👑') || text.includes('대장') || text.includes('보스') || text.includes('킹') || text.includes('자신감') || text.includes('리더') || text.includes('관종') || text.includes('마스터') || text.includes('1위')) {
    return '/images/char-king.jpg';
  }
  if (text.includes('💼') || text.includes('회사') || text.includes('공부') || text.includes('업무') || text.includes('라떼') || text.includes('야근') || text.includes('피곤') || text.includes('퇴사') || text.includes('꼰대')) {
    return '/images/char-work.jpg';
  }
  
  // fallback based on string hashing
  const charCodeSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hash = charCodeSum % 9;
  const fallbacks = [
    '/images/char-lazy.jpg',
    '/images/char-zombie.jpg',
    '/images/char-broke.jpg',
    '/images/char-love.jpg',
    '/images/char-angry.jpg',
    '/images/char-food.jpg',
    '/images/char-shy.jpg',
    '/images/char-king.jpg',
    '/images/char-work.jpg'
  ];
  return fallbacks[hash];
}

async function main() {
  console.log('--- Updating result images with smart semantic tags ---');

  const results = await prisma.result.findMany();
  console.log(`Found ${results.length} total result types across all quizzes.`);

  let updateCount = 0;

  for (const res of results) {
    const imageUrl = getCharacterImage(res.title, res.content, res.emoji);
    
    await prisma.result.update({
      where: { id: res.id },
      data: { imageUrl }
    });
    updateCount++;
  }

  console.log(`Successfully updated ${updateCount} results with matched B-grade onion character URLs!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
