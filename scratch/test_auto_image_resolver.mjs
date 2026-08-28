async function autoFindProductImage(productName) {
  if (!productName || productName.length < 2) return null;

  // 1. Daum Image search scrap (Fast & high quality)
  try {
    const url = `https://search.daum.net/search?w=img&q=${encodeURIComponent(productName)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    // Daum image search data-src / src extraction
    const srcMatches = html.match(/https:\/\/[^"'\s]+(?:jpg|jpeg|png|webp)/gi) || [];
    const candidates = srcMatches.filter(src => 
      (src.includes('daumcdn.net') || src.includes('search.daum')) &&
      !src.includes('ico') &&
      !src.includes('top') &&
      !src.includes('icon') &&
      !src.includes('blank') &&
      !src.includes('transparent')
    );

    if (candidates.length > 0) {
      console.log('Found Daum candidate image:', candidates[0]);
      return candidates[0];
    }
  } catch (e) {
    console.error('Daum img scrap error:', e.message);
  }

  // 2. Unsplash / fallback
  return null;
}

async function run() {
  const tests = [
    '페리페라 무드 글로이 틴트',
    '비발디파크 오션월드 종일권',
    '닥터지 그린 마일드 업 선크림'
  ];

  for (const t of tests) {
    const img = await autoFindProductImage(t);
    console.log(`Product: "${t}" -> Image:`, img);
  }
}

run();
