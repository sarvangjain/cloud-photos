// generate-icons.js — Run: cd client && npm run icons
// Converts SVG to PNG icons for PWA using sharp

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICON_DIR = path.join(process.cwd(), 'public', 'icons');
const SVG = path.join(ICON_DIR, 'icon.svg');

const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32.png', size: 32 },
];

// Maskable icons: add 10% padding over solid bg
const maskable = [
  { name: 'icon-maskable-192.png', size: 192 },
  { name: 'icon-maskable-512.png', size: 512 },
];

async function run() {
  const svgBuf = fs.readFileSync(SVG);

  for (const { name, size } of icons) {
    await sharp(svgBuf).resize(size, size).png().toFile(path.join(ICON_DIR, name));
    console.log(`✓ ${name}`);
  }

  for (const { name, size } of maskable) {
    const padding = Math.round(size * 0.1);
    const inner = size - padding * 2;
    const resized = await sharp(svgBuf).resize(inner, inner).png().toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 10, g: 132, b: 255, alpha: 1 } },
    })
      .composite([{ input: resized, left: padding, top: padding }])
      .png()
      .toFile(path.join(ICON_DIR, name));
    console.log(`✓ ${name} (maskable)`);
  }

  console.log('\n✅ All icons generated!');
}

run().catch(console.error);
