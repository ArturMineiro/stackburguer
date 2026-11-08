/**
 * Garante que os QR Codes realmente escaneiam: renderiza o SVG em pixels
 * (sharp) e decodifica como um celular faria (jsQR).
 */
import { readFileSync } from 'node:fs';
import jsQR from 'jsqr';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { qrSvg } from '../../src/lib/qr.ts';
import { tableUrl } from '../../src/config/site.ts';

const logoSvg = readFileSync('src/assets/brand/logo.svg', 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

async function decode(svg: string): Promise<string | undefined> {
  const size = 400;
  const { data, info } = await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size)
    .flatten({ background: '#ffffff' })
    .extend({ top: 40, bottom: 40, left: 40, right: 40, background: '#ffffff' }) // zona de silêncio
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data;
}

describe('qrSvg', () => {
  it('gera um QR legível sem logo', async () => {
    const url = 'https://steakburger.forgedevapps.com/';
    expect(await decode(qrSvg(url, { dark: '#10291f' }))).toBe(url);
  });

  it('continua legível com o logo no centro', async () => {
    const url = tableUrl();
    expect(await decode(qrSvg(url, { dark: '#10291f', logo: logoSvg }))).toBe(url);
  });

  it.each([1, 7, 10, 42])('cartão da mesa %i leva o número no link', async (mesa) => {
    const url = tableUrl(mesa);
    expect(url).toMatch(new RegExp(`\\?mesa=${String(mesa).padStart(2, '0')}$`));
    expect(await decode(qrSvg(url, { dark: '#10291f', logo: logoSvg }))).toBe(url);
  });

  it('marca o SVG como imagem acessível quando há título', () => {
    const svg = qrSvg('https://exemplo.com/', { title: 'QR do cardápio' });
    expect(svg).toContain('role="img"');
    expect(svg).toContain('<title>QR do cardápio</title>');
  });

  it('omite o logo quando o QR fica denso demais (padrão de alinhamento no centro)', () => {
    const longUrl = `https://exemplo.com/${'a'.repeat(120)}`;
    expect(qrSvg(longUrl, { logo: logoSvg })).not.toContain('viewBox="0 0 64 64"');
  });
});
