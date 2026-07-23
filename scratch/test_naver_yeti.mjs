async function main() {
  console.log('--- Testing Naver Yeti Crawler Access ---');

  const yetiUserAgent = 'Yeti/1.0 (NHN Corp. +http://help.naver.com/robots/)';

  const urls = [
    'https://kkado-kkado.com/',
    'https://kkado-kkado.com/robots.txt',
    'https://kkado-kkado.com/sitemap.xml',
  ];

  for (const url of urls) {
    try {
      console.log(`\nFetching: ${url}`);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': yetiUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
        redirect: 'manual' // Check if Vercel sends 301/308 redirects that confuse Yeti
      });

      console.log(`Status Code: ${res.status}`);
      console.log(`Headers:`, Object.fromEntries(res.headers.entries()));
      const text = await res.text();
      console.log(`Body snippet (first 200 chars): ${text.substring(0, 200)}...`);
    } catch (err) {
      console.error(`Failed to fetch ${url}:`, err);
    }
  }
}

main();
