async function testCoupangSearch() {
  const prodId = '7088737172';
  const url = `https://www.coupang.com/np/search?q=${prodId}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    });

    console.log('Search Status:', res.status);
    const html = await res.text();
    console.log('Search length:', html.length);
    const titles = html.match(/class="name"[^>]*>([^<]+)<\/div>/gi) || html.match(/alt="([^"]+)"/gi);
    console.log('Search titles found:', titles?.slice(0, 5));
  } catch (e) {
    console.error('Err:', e.message);
  }
}

testCoupangSearch();
