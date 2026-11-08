/**
 * Pós-build: converte as páginas /imprimir/* do dist em arquivos finais e as
 * remove do site publicado.
 *   - dist/cardapio-steak-burger.pdf        (PDF do cardápio, botão "Baixar")
 *   - dist/qrcodes-mesas-steak-burger.pdf   (cartões de mesa numerados)
 *   - dist/og-image.jpg                     (prévia do link no WhatsApp etc.)
 * Requer o Chromium do Playwright: npx playwright install chromium
 */
import { createServer, type Server } from 'node:http';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { chromium, type Browser } from '@playwright/test';
import { DOWNLOADS, tableCount } from '../src/config/site.ts';

const DIST = resolve('dist');
const OG_MAX_BYTES = 300 * 1024; // limite prático do WhatsApp

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function serveDist(): Promise<{ server: Server; origin: string }> {
  const server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      let file = resolve(DIST, `.${pathname}`);
      if (file !== DIST && !file.startsWith(DIST + sep)) throw new Error('fora do dist');
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      done({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

async function openReady(browser: Browser, url: string, viewport?: { width: number; height: number }) {
  const page = await browser.newPage(viewport ? { viewport, deviceScaleFactor: 1 } : {});
  const failed: string[] = [];
  page.on('requestfailed', (request) => failed.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)));
  });
  if (failed.length > 0) throw new Error(`Recursos com erro em ${url}:\n  ${failed.join('\n  ')}`);
  return page;
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
  const { server, origin } = await serveDist();
  const browser = await chromium.launch();
  try {
    const pdfOptions = { preferCSSPageSize: true, printBackground: true, tagged: true, outline: true } as const;

    const menu = await openReady(browser, `${origin}/imprimir/cardapio/`);
    await menu.pdf({ ...pdfOptions, path: join(DIST, DOWNLOADS.menuPdf.path) });

    const cards = await openReady(browser, `${origin}/imprimir/qrcodes/`);
    await cards.pdf({ ...pdfOptions, path: join(DIST, DOWNLOADS.qrKitPdf.path) });

    const og = await openReady(browser, `${origin}/imprimir/og/`, {
      width: DOWNLOADS.ogImage.width,
      height: DOWNLOADS.ogImage.height,
    });
    let quality = 86;
    let jpeg = await og.screenshot({ type: 'jpeg', quality });
    while (jpeg.byteLength > OG_MAX_BYTES && quality > 50) {
      quality -= 6;
      jpeg = await og.screenshot({ type: 'jpeg', quality });
    }
    await writeFile(join(DIST, DOWNLOADS.ogImage.path), jpeg);

    const [menuSize, cardsSize] = await Promise.all(
      [DOWNLOADS.menuPdf.path, DOWNLOADS.qrKitPdf.path].map(async (p) => (await stat(join(DIST, p))).size),
    );
    console.log(`✓ ${DOWNLOADS.menuPdf.path} (${kb(menuSize ?? 0)})`);
    console.log(`✓ ${DOWNLOADS.qrKitPdf.path} (${kb(cardsSize ?? 0)}, ${tableCount()} mesas)`);
    console.log(`✓ ${DOWNLOADS.ogImage.path} (${kb(jpeg.byteLength)}, qualidade ${quality})`);
  } finally {
    await browser.close();
    server.close();
  }
  await rm(join(DIST, 'imprimir'), { recursive: true, force: true });
  await removeOrphanAssets();
}

/** Lista recursiva de arquivos de uma pasta. */
async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])),
  );
  return nested.flat();
}

/**
 * Remove de dist/_astro as imagens que só as páginas de impressão usavam (já
 * embutidas nos PDFs): o site publicado fica menor e o deploy, mais rápido.
 */
async function removeOrphanAssets() {
  const files = await walk(DIST);
  const referencing = files.filter((file) => /\.(html|css|js|json|webmanifest|xml)$/.test(file));
  const used = new Set<string>();
  for (const file of referencing) {
    for (const match of (await readFile(file, 'utf8')).matchAll(/\/_astro\/[^"'()\s,]+/g)) {
      used.add(resolve(DIST, `.${match[0]}`));
    }
  }
  const orphans = files.filter(
    (file) => file.startsWith(join(DIST, '_astro') + sep) && /\.(jpe?g|png|webp|avif)$/.test(file) && !used.has(file),
  );
  await Promise.all(orphans.map((file) => rm(file)));
  if (orphans.length > 0) console.log(`✓ ${orphans.length} imagens usadas só nos PDFs removidas do site`);
}

main().catch((error: unknown) => {
  console.error('✗ Falha ao gerar PDFs/prévia:', error instanceof Error ? error.message : error);
  process.exit(1);
});
