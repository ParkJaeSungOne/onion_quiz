async function testCleanProductImageSearch(query) {
  console.log(`Searching clean product image for: "${query}"`);

  // Method 1: Naver Shopping search scrap
  try {
    const naverUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(query)}`;
    const res = await fetch(naverUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });
    const html = await res.text();
    console.log('Naver Shopping HTML length:', html.length);
    const imgMatches = html.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
    const naverCdnImgs = imgMatches.filter(src => 
      (src.includes('shopping-phinf.pstatic.net') || src.includes('shop-phinf.pstatic.net')) &&
      !src.includes('ico') &&
      !src.includes('icon')
    );
    console.log('Naver Shopping CDN product images found:', naverCdnImgs.slice(0, 3));
    if (naverCdnImgs.length > 0) return naverCdnImgs[0];
  } catch (e) {
    console.error('Naver search error:', e.message);
  }

  // Method 2: Danawa Product Search scrap
  try {
    const danawaUrl = `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(query)}`;
    const res = await fetch(danawaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('Danawa HTML length:', html.length);
    const imgMatches = html.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
    const danawaImgs = imgMatches.filter(src => 
      src.includes('img.danawa.com/prod_img') &&
      !src.includes('ico')
    );
    console.log('Danawa product images found:', danawaImgs.slice(0, 3));
    if (danawaImgs.length > 0) return danawaImgs[0];
  } catch (e) {
    console.error('Danawa search error:', e.message);
  }

  return null;
}

async function run() {
  const tests = [
    'AHC 마스터즈 에어리치 선스틱 SPF50+ PA++++',
    '부쉬맨 워터프루프 선크림',
    '페리페라 무드 글로이 틴트'
  ];

  for (const t of tests) {
    const img = await testCleanProductImageSearch(t);
    console.log(`Final image for "${t}":`, img);
  }
}

run();
