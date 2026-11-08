/**
 * Prepara fotos novas do cardápio: recorte quadrado inteligente (o sharp detecta
 * a região de interesse, então o prato fica centralizado), 1400 px e JPEG
 * otimizado (mozjpeg, qualidade 80). O site ainda gera AVIF/WebP no tamanho
 * certo para cada tela, então o original pode ser grande.
 *
 * Uso: node scripts/prepare-photos.ts <pasta-com-as-fotos-originais> [pasta-destino]
 *      (destino padrão: src/assets/cardapio)
 */
import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const [input, output = 'src/assets/cardapio'] = process.argv.slice(2);
if (!input) {
  console.error('Uso: node scripts/prepare-photos.ts <pasta-com-as-fotos> [destino]');
  process.exit(1);
}

const SIZE = 1400;
const files = (await readdir(input)).filter((f) => /\.(jpe?g|png|webp|avif|heic)$/i.test(f) && !f.startsWith('hero'));
await mkdir(output, { recursive: true });

for (const file of files) {
  const name = `${basename(file, extname(file))
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')}.jpg`;
  const target = join(output, name);
  await sharp(join(input, file))
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover', position: sharp.strategy.attention, withoutEnlargement: false })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(target);
  const { size } = await stat(target);
  console.log(`✓ ${name} (${Math.round(size / 1024)} KB)`);
}
