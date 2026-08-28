async function inspectDeeplinkHtml() {
  const url = 'https://link.coupang.com/a/gzNMRzg3eS';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.3.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const text = await res.text();
  console.log('Deeplink HTML:\n', text);
}

inspectDeeplinkHtml();
