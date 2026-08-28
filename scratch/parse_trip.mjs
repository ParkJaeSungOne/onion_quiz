async function parseTripProduct() {
  const url = 'https://trip.coupang.com/tp/products/30000011448565';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9'
    }
  });

  const text = await res.text();
  console.log('Fetched text length:', text.length);

  // Extract all JSON-like objects or script blocks
  const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log('Script blocks found:', scriptBlocks.length);

  for (const s of scriptBlocks) {
    if (s.includes('비발디파크') || s.includes('오션월드') || s.includes('productName') || s.includes('salePrice')) {
      console.log('Relevant script snippet:');
      console.log(s.substring(0, 1500));
    }
  }

  // Extract image matches
  const imgMatches = text.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
  const cdnImgs = Array.from(new Set(imgMatches.filter(img => img.includes('travelSeller') || img.includes('thumbnail.coupangcdn.com') || img.includes('image.coupangcdn.com'))));
  console.log('CDN Images found:', cdnImgs);

  // Extract price matches
  const priceMatches = text.match(/"salePrice"\s*:\s*(\d+)/i) || text.match(/"originalPrice"\s*:\s*(\d+)/i) || text.match(/"price"\s*:\s*(\d+)/i);
  console.log('Price match:', priceMatches);

  // Extract productName matches
  const nameMatches = text.match(/"productName"\s*:\s*"([^"]+)"/i) 
    || text.match(/"title"\s*:\s*"([^"]+)"/i)
    || text.match(/"itemTitle"\s*:\s*"([^"]+)"/i);
  console.log('Product Name Match:', nameMatches ? nameMatches[1] : 'None');
}

parseTripProduct();
