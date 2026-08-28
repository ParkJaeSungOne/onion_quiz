async function parseDetails() {
  try {
    const res = await fetch('https://trip.coupang.com/tp/products/10000010793428', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    // Find price or package description
    const priceMatch = html.match(/"originPrice"\s*:\s*(\d+)/i) || html.match(/"salePrice"\s*:\s*(\d+)/i) || html.match(/"price"\s*:\s*(\d+)/i);
    console.log('Price match:', priceMatch);
    
    const allPrices = html.match(/(\d{2,3},\d{3}원?)/g);
    console.log('Sample prices in text:', allPrices ? allPrices.slice(0, 10) : 'None');

    // Find image URLs with higher resolution
    const largeImgs = html.match(/https:\/\/img\d?\.coupangcdn\.com\/[^"']+/g) || html.match(/https:\/\/thumbnail\.coupangcdn\.com\/thumbnails\/remote\/[^\/]+\/image\/travelSeller\/[^\s"']+/g);
    console.log('Large images:', largeImgs ? largeImgs.slice(0, 5) : 'None');

    // Search for package options or highlights
    const highlights = html.match(/("title"\s*:\s*"[^"]+"| "optionName"\s*:\s*"[^"]+"| "description"\s*:\s*"[^"]+)/g);
    console.log('Highlights:', highlights ? highlights.slice(0, 15) : 'None');
  } catch (err) {
    console.error(err);
  }
}

parseDetails();
