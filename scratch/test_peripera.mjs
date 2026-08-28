async function testCoupangProduct() {
  const url = 'https://link.coupang.com/a/gzLgI99p6q';
  const redirectRes = await fetch(url, { redirect: 'manual' });
  const loc = redirectRes.headers.get('location');
  console.log('Location:', loc);

  const prodId = '9422863245';
  const itemId = '28007863364';

  // Test 1: Coupang mobile gateway
  const testUrls = [
    `https://www.coupang.com/vp/products/${prodId}?itemId=${itemId}`,
    `https://m.coupang.com/vm/products/${prodId}?itemId=${itemId}`,
    `https://m.coupang.com/nm/products/${prodId}`,
    `https://www.coupang.com/vp/products/${prodId}/items/${itemId}`,
  ];

  for (const u of testUrls) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Coupang/7.0.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9'
        }
      });
      console.log(`URL: ${u} -> Status: ${res.status}`);
      const text = await res.text();
      console.log(`  Length: ${text.length}`);
      if (text.includes('페리페라') || text.includes('틴트') || text.includes('무드')) {
        console.log('  🎯 FOUND PRODUCT TITLE IN THIS URL!');
      }
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      console.log('  Title:', titleMatch ? titleMatch[1] : 'None');
      const ogTitle = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      console.log('  og:title:', ogTitle ? ogTitle[1] : 'None');
      const ogImg = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      console.log('  og:image:', ogImg ? ogImg[1] : 'None');
      const imgMatches = text.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
      const coupangImgs = imgMatches.filter(i => i.includes('thumbnail.coupangcdn.com') || i.includes('image.coupangcdn.com') || i.includes('img1a.coupangcdn.com'));
      console.log('  Coupang CDN images count:', coupangImgs.length, coupangImgs.slice(0, 3));
    } catch (e) {
      console.error('Err:', e.message);
    }
  }
}

testCoupangProduct();
