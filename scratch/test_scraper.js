async function testFetch() {
  const url = 'https://link.coupang.com/a/gzAKLjJpyC';
  
  // Test 1: Mobile User-Agent
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      }
    });
    console.log('Test 1 (FB bot) status:', res.status, res.headers.get('location'));
  } catch (e) {
    console.error('Test 1 err:', e);
  }

  // Test 2: KakaoTalk bot User-Agent
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'kakaotalk-scrap/1.0',
      }
    });
    console.log('Test 2 (Kakao scrap) status:', res.status, res.headers.get('location'));
  } catch (e) {
    console.error('Test 2 err:', e);
  }

  // Test 3: Follow redirect with KakaoTalk Scrap user agent (Coupang allows social scrapers to read og:title and og:image!)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const text = await res.text();
    console.log('Test 3 final url:', res.url);
    console.log('Test 3 length:', text.length);
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    console.log('Test 3 Title:', titleMatch ? titleMatch[1] : 'No title');
    const ogTitle = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    console.log('Test 3 og:title:', ogTitle ? ogTitle[1] : 'No og:title');
    const ogImg = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    console.log('Test 3 og:image:', ogImg ? ogImg[1] : 'No og:image');
  } catch (e) {
    console.error('Test 3 err:', e);
  }
}

testFetch();
