async function testMicrolink() {
  const coupangUrl = 'https://link.coupang.com/a/gzAKLjJpyC';
  try {
    const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(coupangUrl)}&screenshot=true&meta=true`);
    const data = await res.json();
    console.log('Microlink result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Microlink err:', err);
  }
}

testMicrolink();
