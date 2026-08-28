async function inspectCoupang() {
  const prodId = '30000011448565';
  const urls = [
    `https://trip.coupang.com/tp/products/${prodId}`,
    `https://trip.coupang.com/m/tp/products/${prodId}`,
    `https://trip.coupang.com/api/v1/products/${prodId}`,
    `https://trip.coupang.com/api/v2/products/${prodId}`,
    `https://trip.coupang.com/tp/products/${prodId}/detail`,
    `https://www.coupang.com/vp/products/${prodId}`,
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/html, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"'
        }
      });
      console.log(`URL: ${u} -> Status: ${res.status}, Type: ${res.headers.get('content-type')}`);
      const text = await res.text();
      console.log(`  Length: ${text.length}`);
      
      // Look for Vivaldi / Ocean World keywords
      if (text.includes('비발디') || text.includes('오션월드') || text.includes('Vivaldi') || text.includes('Ocean')) {
        console.log('  🎯 FOUND KEYWORD IN THIS URL!');
      }

      // Look for title or json
      const title = text.match(/<title>([^<]+)<\/title>/i);
      if (title) console.log('  Title:', title[1]);

      const jsonMatch = text.match(/"productName"\s*:\s*"([^"]+)"/i) || text.match(/"title"\s*:\s*"([^"]+)"/i);
      if (jsonMatch) console.log('  JSON Title:', jsonMatch[1]);

      const ogTitle = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      if (ogTitle) console.log('  OG Title:', ogTitle[1]);

      const ogImg = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImg) console.log('  OG Image:', ogImg[1]);

    } catch (err) {
      console.error(`URL: ${u} -> Error: ${err.message}`);
    }
  }
}

inspectCoupang();
