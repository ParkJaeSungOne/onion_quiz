async function inspectDanawaImages() {
  const query = 'AHC 마스터즈 에어리치 선스틱';
  const url = `https://search.danawa.com/dsearch.php?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  console.log('HTML length:', html.length);

  // Match all img src or data-original in Danawa
  const imgMatches = html.match(/(?:src|data-original)=["']([^"']+)["']/gi) || [];
  console.log('Image attributes in Danawa:', imgMatches.slice(0, 15));

  // Find images containing img.danawa.com
  const danawaImages = imgMatches
    .map(m => m.replace(/^(?:src|data-original)=["']/, '').replace(/["']$/, ''))
    .filter(u => u.includes('danawa.com') && (u.includes('prod_img') || u.includes('goods') || u.includes('img.danawa.com')));
  
  console.log('Clean Danawa product images:', danawaImages.slice(0, 5));
}

inspectDanawaImages();
