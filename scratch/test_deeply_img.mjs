async function testDeeplyImage(rawTitle) {
  console.log('Raw title:', rawTitle);

  // Clean title for search: remove [BRACKETS], ", 1개", ", 블랙", options
  const cleanTitle = rawTitle
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\([^)]+\)/g, '')
    .replace(/,\s*\d+개[^,]*/g, '')
    .replace(/,\s*(?:블랙|화이트|네이비|그레이|단품|세트|옵션)[^,]*/gi, '')
    .replace(/,\s*\d+(?:g|ml|kg|L|개입)[^,]*/gi, '')
    .replace(/,\s*1개/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('Sanitized query:', cleanTitle);

  // Tier 1: DuckDuckGo
  try {
    const tokenRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(cleanTitle)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const tokenHtml = await tokenRes.text();
    const vqdMatch = tokenHtml.match(/vqd=["']?([^"'\s&]+)/i) || tokenHtml.match(/vqd=([\d-]+)/i);
    const vqd = vqdMatch ? vqdMatch[1] : '';

    if (vqd) {
      const imgRes = await fetch(`https://duckduckgo.com/i.js?l=kr-kr&o=json&q=${encodeURIComponent(cleanTitle)}&vqd=${vqd}&f=,,,`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const data = await imgRes.json();
      console.log('DDG results count:', data?.results?.length);
      if (data?.results && data.results.length > 0) {
        console.log('DDG top image:', data.results[0].image);
        return data.results[0].image;
      }
    }
  } catch (e) {
    console.error('DDG err:', e.message);
  }

  // Tier 2: Bing open search
  try {
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(cleanTitle)}&form=HDRSC2&first=1`;
    const bRes = await fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const bHtml = await bRes.text();
    const murlMatches = bHtml.match(/murl&quot;:&quot;(https:\/\/[^&]+)&quot;/gi) || bHtml.match(/https:\/\/[^"'\s]+\.(?:jpg|jpeg|png)/gi);
    console.log('Bing matches count:', murlMatches?.length);
    if (murlMatches && murlMatches.length > 0) {
      const cleanBingImg = murlMatches[0].replace(/^murl&quot;:&quot;/, '').replace(/&quot;$/, '');
      console.log('Bing top image:', cleanBingImg);
      return cleanBingImg;
    }
  } catch (e) {
    console.error('Bing err:', e.message);
  }

  return null;
}

testDeeplyImage('[DEEPLY] 디플리 베이직 판초타월 극세사 비치타올 서핑 다이빙, 1개, 블랙');
