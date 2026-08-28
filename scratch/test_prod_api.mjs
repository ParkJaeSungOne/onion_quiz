async function testProductApi() {
  const prodId = '7088737172';
  const itemId = '17657649305';

  const urls = [
    `https://www.coupang.com/vm/mlp/web/mlp-landing-page?isMLP=Y&itemId=${itemId}&landingId=1806&productId=${prodId}`,
    `https://www.coupang.com/vp/products/${prodId}?itemId=${itemId}`,
    `https://m.coupang.com/vm/products/${prodId}?itemId=${itemId}`,
    `https://apis.coupang.com/v2/providers/openapi/apis/api/v4/vendors/A00010028/products/${prodId}`
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.3.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      console.log(`URL: ${u} -> Status: ${res.status}`);
      const text = await res.text();
      console.log(`  Length: ${text.length}`);
      
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) console.log(`  Title: ${titleMatch[1]}`);

      const ogTitle = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      if (ogTitle) console.log(`  og:title: ${ogTitle[1]}`);

      const prodName = text.match(/"productName"\s*:\s*"([^"]+)"/i) || text.match(/"title"\s*:\s*"([^"]+)"/i);
      if (prodName) console.log(`  productName: ${prodName[1]}`);

      const ogImg = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImg) console.log(`  og:image: ${ogImg[1]}`);
    } catch (e) {
      console.error('Err:', e.message);
    }
  }
}

testProductApi();
