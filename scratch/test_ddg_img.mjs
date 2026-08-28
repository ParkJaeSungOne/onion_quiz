async function testDuckDuckGoImages(query) {
  try {
    // Step 1: get vqd token
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const html = await tokenRes.text();
    const vqdMatch = html.match(/vqd=["']?([^"'\s&]+)/i) || html.match(/vqd=([\d-]+)/i);
    const vqd = vqdMatch ? vqdMatch[1] : '';
    console.log(`VQD for "${query}":`, vqd);

    if (vqd) {
      const imgRes = await fetch(`https://duckduckgo.com/i.js?l=kr-kr&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const data = await imgRes.json();
      console.log(`DuckDuckGo results count:`, data?.results?.length);
      if (data?.results?.length > 0) {
        console.log('Top result image:', data.results[0].image);
        console.log('Top result title:', data.results[0].title);
        return data.results[0].image;
      }
    }
  } catch (e) {
    console.error('DDG Error:', e.message);
  }
  return null;
}

async function run() {
  const tests = [
    'AHC 마스터즈 에어리치 선스틱',
    '부쉬맨 워터프루프 선크림',
    '페리페라 무드 글로이 틴트'
  ];

  for (const t of tests) {
    const img = await testDuckDuckGoImages(t);
    console.log(`🎯 RESULT: "${t}" -> ${img}\n`);
  }
}

run();
