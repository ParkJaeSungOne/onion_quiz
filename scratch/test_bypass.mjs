async function testCoupangBypass() {
  const shortUrl = 'https://link.coupang.com/a/gzNMRzg3eS';

  // 1. Follow redirect
  const redirectRes = await fetch(shortUrl, {
    redirect: 'manual',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
    }
  });

  const targetUrl = redirectRes.headers.get('location') || shortUrl;
  console.log('Target URL:', targetUrl);

  const prodMatch = targetUrl.match(/products\/(\d+)/i) || targetUrl.match(/productId=(\d+)/i);
  const prodId = prodMatch ? prodMatch[1] : '';
  const itemMatch = targetUrl.match(/itemId=(\d+)/i);
  const itemId = itemMatch ? itemMatch[1] : '';
  const vendorMatch = targetUrl.match(/vendorItemId=(\d+)/i);
  const vendorItemId = vendorMatch ? vendorMatch[1] : '';

  console.log(`Extracted: prodId=${prodId}, itemId=${itemId}, vendorItemId=${vendorItemId}`);

  // Test various endpoints and headers
  const testHeaders = [
    {
      name: 'Googlebot Smartphone',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.118 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    },
    {
      name: 'Yeti (Naverbot)',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Yeti/1.1; +http://naver.me/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    },
    {
      name: 'Daumoa',
      headers: {
        'User-Agent': 'Daumoa 4.0 (compatible; Daumoa/4.0; +http://top.daum.net/cgi-bin/oa/oa.cgi)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    },
    {
      name: 'Kakaotalk InApp Browser',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.3.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    },
    {
      name: 'Coupang App Mobile Gateway',
      headers: {
        'User-Agent': 'Coupang/7.5.0 (iPhone; iOS 17.5; Scale/3.00)',
        'Accept': '*/*'
      }
    }
  ];

  for (const th of testHeaders) {
    try {
      const res = await fetch(targetUrl, { headers: th.headers });
      const text = await res.text();
      console.log(`[${th.name}] Status: ${res.status}, Length: ${text.length}`);
      
      const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) console.log(`  Title: ${titleMatch[1]}`);

      const ogTitle = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      if (ogTitle) console.log(`  og:title: ${ogTitle[1]}`);

      const prodName = text.match(/"productName"\s*:\s*"([^"]+)"/i) || text.match(/"title"\s*:\s*"([^"]+)"/i);
      if (prodName) console.log(`  productName: ${prodName[1]}`);

      const ogImg = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImg) console.log(`  og:image: ${ogImg[1]}`);

    } catch (e) {
      console.error(`[${th.name}] Error: ${e.message}`);
    }
  }
}

testCoupangBypass();
