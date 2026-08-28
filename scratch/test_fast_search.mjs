async function findProductFast() {
  const prodId = '6909042474';
  const itemId = '23318372951';

  // Test 1: Google HTML search
  try {
    const gUrl = `https://www.google.com/search?q=${encodeURIComponent(`site:coupang.com ${prodId}`)}&hl=ko`;
    const res = await fetch(gUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('Google search length:', html.length);
    const titleMatch = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi);
    console.log('Google titles:', titleMatch);
  } catch (e) {
    console.error('Google err:', e.message);
  }

  // Test 2: Daum HTML search
  try {
    const dUrl = `https://search.daum.net/search?w=tot&q=${encodeURIComponent(`"products/${prodId}"`)}`;
    const res = await fetch(dUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('Daum search length:', html.length);
    const matches = html.match(/class="f_tit"[^>]*>([^<]+)<\/a>/gi) || html.match(/<a[^>]*class="tit_main"[^>]*>([^<]+)<\/a>/gi);
    console.log('Daum matches:', matches);
  } catch (e) {
    console.error('Daum err:', e.message);
  }

  // Test 3: Zum search
  try {
    const zUrl = `https://search.zum.com/search.zum?query=${encodeURIComponent(`쿠팡 ${prodId}`)}`;
    const res = await fetch(zUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('Zum search length:', html.length);
    const titles = html.match(/class="tit"[^>]*>([^<]+)<\/a>/gi) || html.match(/<strong[^>]*>([^<]+)<\/strong>/gi);
    console.log('Zum titles:', titles?.slice(0, 5));
  } catch (e) {
    console.error('Zum err:', e.message);
  }
}

findProductFast();
