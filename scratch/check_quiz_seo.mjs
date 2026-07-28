async function checkQuizSeo() {
  const url = 'https://kkado-kkado.com/quiz/70';
  console.log('Fetching live URL:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  });

  const text = await res.text();
  console.log('HTTP Status:', res.status);

  console.log('=== HEAD META TAGS ===');
  const metaMatches = text.match(/<meta[^>]+>/gi) || [];
  metaMatches.forEach(m => console.log(m));

  console.log('=== LINK TAGS (CANONICAL, FAVICON) ===');
  const linkMatches = text.match(/<link[^>]+>/gi) || [];
  linkMatches.forEach(l => console.log(l));

  console.log('=== TITLE TAG ===');
  const titleMatch = text.match(/<title>[^<]+<\/title>/gi);
  console.log(titleMatch ? titleMatch[0] : 'NO TITLE');

  console.log('=== JSON-LD STRUCTURED DATA ===');
  const jsonLdMatch = text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  console.log(jsonLdMatch ? jsonLdMatch.join('\n') : 'NO JSON-LD');
}

checkQuizSeo().catch(console.error);
