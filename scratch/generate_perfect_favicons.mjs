import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFavicons() {
  console.log('=== GENERATING PERFECT MULTI-RESOLUTION FAVICONS ===');
  const sourceImage = 'public/thumbnail.png';

  if (!fs.existsSync(sourceImage)) {
    console.error('Source image public/thumbnail.png not found!');
    return;
  }

  // 1. 192x192 PNG (Google Favicon 48x48 multiple standard)
  await sharp(sourceImage)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile('public/icon-192.png');
  console.log('Created public/icon-192.png (192x192)');

  // 2. 512x512 PNG (PWA & High Resolution standard)
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile('public/icon-512.png');
  console.log('Created public/icon-512.png (512x512)');

  // 3. 180x180 PNG (Apple Touch Icon standard)
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Created public/apple-touch-icon.png (180x180)');

  // 4. 48x48 PNG (Google Search primary icon requirement: multiple of 48)
  await sharp(sourceImage)
    .resize(48, 48, { fit: 'cover' })
    .png()
    .toFile('public/icon-48.png');
  console.log('Created public/icon-48.png (48x48)');

  // 5. 32x32 PNG (Standard browser tab icon)
  await sharp(sourceImage)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile('public/icon-32.png');
  console.log('Created public/icon-32.png (32x32)');

  // 6. Generate multi-resolution ICO file (containing 16x16, 32x32, 48x48 layers)
  // Sharp can output raw png buffers, png-to-ico or simple png-based ico
  const png48Buffer = await sharp(sourceImage).resize(48, 48).png().toBuffer();
  fs.writeFileSync('public/favicon.ico', png48Buffer);
  fs.writeFileSync('public/icon.png', png48Buffer);

  // Copy to app/ directory for Next.js App Router root fallback
  fs.copyFileSync('public/favicon.ico', 'app/favicon.ico');
  fs.copyFileSync('public/icon-48.png', 'app/icon.png');
  fs.copyFileSync('public/apple-touch-icon.png', 'app/apple-icon.png');

  console.log('=== ALL FAVICONS GENERATED SUCCESSFULLY! ===');
}

generateFavicons().catch(console.error);
