async function inspectHtml() {
  const url = 'https://trip.coupang.com/m/tp/products/30000011448565?vendorItemId=70000302321262&itemId=20002234020846';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Coupang/7.0.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9'
    }
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Length:', text.length);

  // Search for resort/product keywords, JSON, data-props
  const jsonMatches = text.match(/window\.__INITIAL_DATA__\s*=\s*({[\s\S]*?});/i)
    || text.match(/window\.__SSR_DATA__\s*=\s*({[\s\S]*?});/i)
    || text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  
  if (jsonMatches) {
    console.log('Found SSR JSON data!');
    const dataStr = jsonMatches[1];
    console.log('Data snippet:', dataStr.substring(0, 1000));
  }

  // Look for any product title in HTML
  const titles = text.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/gi) || [];
  console.log('Headings:', titles.slice(0, 10));

  // Look for image urls
  const imgs = text.match(/https:\/\/[^"'\s]+\.(?:jpg|png|webp)/gi) || [];
  console.log('Images count:', imgs.length);
  const travelImgs = imgs.filter(img => img.includes('travelSeller') || img.includes('coupangcdn'));
  console.log('Travel CDN images:', travelImgs.slice(0, 5));
}

inspectHtml();
