async function checkCoupangBannerImage() {
  const url = 'https://image13.coupangcdn.com/image/affiliate/banner/752df3a8b4d13a2b3f4ce5bd2fed3a33@2x.jpg';
  const res = await fetch(url);
  console.log('Banner Image Status:', res.status, 'Type:', res.headers.get('content-type'), 'Length:', res.headers.get('content-length'));
}

checkCoupangBannerImage();
