async function testDaumImage() {
  const query = 'AHC 마스터즈 에어리치 선스틱';
  const url = `https://search.daum.net/search?w=img&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  console.log('Daum HTML length:', html.length);

  // Extract all img srcs
  const imgMatches = html.match(/https:\/\/[^"'\s]+(?:jpg|jpeg|png|webp)/gi) || [];
  console.log('Total matches:', imgMatches.length);

  // Look for Daum CDN thumbnails
  const daumThumbs = imgMatches.filter(u => u.includes('daumcdn.net') || u.includes('search.daum'));
  console.log('Daum thumbs found:', daumThumbs.slice(0, 5));

  // Check if Threads Meta API accepts daumcdn images or if they are cropped/low-res
  for (const img of daumThumbs.slice(0, 3)) {
    console.log('Checking image URL:', img);
    try {
      const headRes = await fetch(img);
      console.log('  Status:', headRes.status, 'Type:', headRes.headers.get('content-type'), 'Length:', headRes.headers.get('content-length'));
    } catch (e) {
      console.error('  Head error:', e.message);
    }
  }
}

testDaumImage();
