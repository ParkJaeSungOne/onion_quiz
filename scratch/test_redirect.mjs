async function testRedirect() {
  const coupangUrl = 'https://link.coupang.com/a/gzAKLjJpyC';
  const res = await fetch(coupangUrl, { redirect: 'manual' });
  console.log('Status:', res.status);
  console.log('Location:', res.headers.get('location'));
  const loc = res.headers.get('location');
  if (loc) {
    const urlObj = new URL(loc);
    console.log('Pathname:', urlObj.pathname);
    console.log('SearchParams:', Array.from(urlObj.searchParams.entries()));
  }
}

testRedirect();
