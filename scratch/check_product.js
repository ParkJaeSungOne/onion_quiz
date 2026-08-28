async function checkProduct() {
  try {
    const res = await fetch('https://trip.coupang.com/tp/products/10000010793428', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const html = await res.text();
    console.log('Length:', html.length);
    
    // Look for JSON or product name in html
    const prodNameMatch = html.match(/"productName"\s*:\s*"([^"]+)"/i) || html.match(/"title"\s*:\s*"([^"]+)"/i);
    console.log('Product Name Match:', prodNameMatch ? prodNameMatch[1] : 'None');

    const matches = html.match(/<h\d[^>]*>([^<]+)<\/h\d>/gi);
    console.log('Headings:', matches ? matches.slice(0, 10) : 'None');

    // Search for keywords or images
    const imgMatches = html.match(/https:\/\/[^"'\s]+\.(?:jpg|png|webp)/gi);
    console.log('Images sample:', imgMatches ? imgMatches.filter(x => x.includes('coupangcdn') && !x.includes('img_fb')).slice(0, 5) : 'None');
    
    // Check for schema.org or initialState json
    const scriptJson = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (scriptJson) {
      console.log('LD+JSON:', scriptJson);
    }
  } catch (err) {
    console.error(err);
  }
}

checkProduct();
