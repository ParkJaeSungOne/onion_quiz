async function testSearchScraper() {
  const prodId = '10000010793428';
  const query = `쿠팡 ${prodId}`;

  // Test Daum search scraper for Coupang product title and image
  try {
    const res = await fetch(`https://search.daum.net/search?w=tot&q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    console.log('Daum search status:', res.status, 'HTML length:', html.length);
    const titles = html.match(/class="tit_main"[^>]*>([^<]+)<\/a>/gi) || html.match(/<strong class="tit_main">([^<]+)<\/strong>/gi);
    console.log('Daum titles:', titles);

    const imgs = html.match(/https:\/\/[^"'\s]+\.(?:jpg|png|webp)/gi) || [];
    console.log('Daum images sample:', imgs.slice(0, 5));
  } catch (e) {
    console.error('Daum err:', e);
  }

  // Test Naver search scraper for Coupang product title and image
  try {
    const res = await fetch(`https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    console.log('Naver search status:', res.status, 'HTML length:', html.length);
    const titles = html.match(/<a[^>]*class="api_txt_lines total_tit"[^>]*>([\s\S]*?)<\/a>/gi) || html.match(/<a[^>]*class="total_tit"[^>]*>([\s\S]*?)<\/a>/gi);
    console.log('Naver titles:', titles);
  } catch (e) {
    console.error('Naver err:', e);
  }
}

testSearchScraper();
