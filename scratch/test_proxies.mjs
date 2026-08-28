async function testProxies() {
  const coupangUrl = 'https://link.coupang.com/a/gzCD87x3EO';
  const targetUrl = 'https://trip.coupang.com/tp/products/30000011448565';

  // Test 1: allorigins proxy
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    console.log('AllOrigins status:', res.status);
    const text = await res.text();
    console.log('AllOrigins text length:', text.length);
    const ogTitle = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    console.log('AllOrigins og:title:', ogTitle ? ogTitle[1] : 'None');
  } catch (e) {
    console.error('AllOrigins err:', e.message);
  }

  // Test 2: corsproxy.io
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
    console.log('CorsProxy status:', res.status);
    const text = await res.text();
    console.log('CorsProxy text length:', text.length);
    const ogTitle = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    console.log('CorsProxy og:title:', ogTitle ? ogTitle[1] : 'None');
  } catch (e) {
    console.error('CorsProxy err:', e.message);
  }

  // Test 3: Daum search proxy for "쿠팡 30000011448565"
  try {
    const query = '30000011448565';
    const res = await fetch(`https://search.daum.net/search?w=tot&q=${encodeURIComponent(`쿠팡 ${query}`)}`);
    const text = await res.text();
    console.log('Daum search length:', text.length);
    const match = text.match(/오션월드|비발디|호텔|리조트|패키지/gi);
    console.log('Daum keyword matches:', match);
  } catch (e) {
    console.error('Daum err:', e.message);
  }
}

testProxies();
