async function testShoppingHow(query) {
  const url = `https://m.shoppinghow.kakao.com/m/search/q/${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const html = await res.text();
  console.log('ShoppingHow length:', html.length);

  // Extract all img srcs
  const imgMatches = html.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
  const validProductImgs = Array.from(new Set(imgMatches.filter(u => 
    (u.includes('daumcdn.net/thumb') || u.includes('img1.daumcdn.net/thumb') || u.includes('shoppinghow')) &&
    !u.includes('logo') &&
    !u.includes('icon') &&
    !u.includes('banner')
  )));

  console.log(`ShoppingHow product images for "${query}":`, validProductImgs.slice(0, 5));
  return validProductImgs[0];
}

async function run() {
  const tests = [
    'AHC 마스터즈 에어리치 선스틱',
    '부쉬맨 워터프루프 선크림',
    '페리페라 무드 글로이 틴트'
  ];

  for (const t of tests) {
    const img = await testShoppingHow(t);
    console.log(`🎯 RESULT: "${t}" -> ${img}\n`);
  }
}

run();
