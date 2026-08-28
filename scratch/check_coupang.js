async function check() {
  try {
    const res = await fetch('https://link.coupang.com/a/gzAKLjJpyC', {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Final URL:', res.url);
    const html = await res.text();
    const title = html.match(/<title>([^<]+)<\/title>/i);
    console.log('Title:', title ? title[1] : 'No title');
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    console.log('OG Title:', ogTitle ? ogTitle[1] : 'No OG title');
    const ogImg = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    console.log('OG Image:', ogImg ? ogImg[1] : 'No OG image');
    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    console.log('OG Desc:', ogDesc ? ogDesc[1] : 'No OG desc');
  } catch (err) {
    console.error(err);
  }
}

check();
