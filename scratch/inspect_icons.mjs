import sharp from 'sharp';
import fs from 'fs';

async function checkIcon(path) {
  if (!fs.existsSync(path)) {
    console.log(`${path}: FILE NOT FOUND`);
    return;
  }
  try {
    const meta = await sharp(path).metadata();
    console.log(`${path}: ${meta.width}x${meta.height} (${meta.format})`);
  } catch (err) {
    console.log(`${path}: ERROR ${err.message}`);
  }
}

async function run() {
  console.log('=== ICON DIMENSION INSPECTOR ===');
  await checkIcon('public/favicon.ico');
  await checkIcon('public/icon.png');
  await checkIcon('public/icon-192.png');
  await checkIcon('public/icon-512.png');
  await checkIcon('public/apple-touch-icon.png');
  await checkIcon('public/thumbnail.png');
  await checkIcon('app/icon.png');
  await checkIcon('app/favicon.ico');
}

run();
