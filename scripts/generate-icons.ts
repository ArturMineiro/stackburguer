/**
 * Gera os ícones PNG (atalho na tela inicial, PWA) a partir do logo SVG.
 * Rode depois de trocar o logo:  npm run icons
 */
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { SITE } from '../src/config/site.ts';

const logo = await readFile('src/assets/brand/logo.svg');

const plain = [
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
];
for (const { file, size } of plain) {
  await sharp(logo, { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(`✓ ${file}`);
}

// Ícone "maskable": logo dentro da área segura (80%) sobre a cor da marca.
const inner = Math.round(512 * 0.72);
const logoPng = await sharp(logo, { density: 600 }).resize(inner, inner).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: SITE.themeColor } })
  .composite([{ input: logoPng, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile('public/icon-maskable-512.png');
console.log('✓ public/icon-maskable-512.png');
