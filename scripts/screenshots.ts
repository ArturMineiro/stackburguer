/**
 * Capturas de tela do cardápio em vários aparelhos (útil para revisão e para
 * divulgar o projeto). Uso:
 *   node scripts/screenshots.ts [url] [pasta] [dpr]
 *   node scripts/screenshots.ts http://localhost:4321 screenshots 2
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const [base = 'http://localhost:4321', outDir = 'screenshots', dprArg = '1'] = process.argv.slice(2);
const deviceScaleFactor = Number(dprArg) || 1;
const only = process.env.SHOTS?.split(',');

const viewports = [
  { name: 'fold-280', width: 280, height: 653, mobile: true },
  { name: 'iphone-se-375', width: 375, height: 667, mobile: true },
  { name: 'iphone-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-820', width: 820, height: 1180, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
  { name: 'wide-1920', width: 1920, height: 1080, mobile: false },
].filter((v) => !only || only.includes(v.name));

/** Espera fontes e as imagens visíveis na tela (imagens lazy fora da tela nunca carregam). */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = [...document.images].filter((img) => {
      const r = img.getBoundingClientRect();
      return !img.complete && r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
    });
    const loads = visible.map((img) => new Promise((r) => img.addEventListener('load', r, { once: true })));
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 6000))]);
  });
  await page.waitForTimeout(400);
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await settle(page);
  await page.screenshot({ path: join(outDir, `${vp.name}-1-hero.png`) });

  await page
    .locator('#cardapio')
    .evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70));
  await settle(page);
  await page.screenshot({ path: join(outDir, `${vp.name}-2-menu.png`) });

  await page.locator('[data-open-item]').nth(3).click();
  await page.waitForTimeout(500);
  await settle(page);
  await page.screenshot({ path: join(outDir, `${vp.name}-3-detalhe.png`) });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await settle(page);
  await page.screenshot({ path: join(outDir, `${vp.name}-4-rodape.png`) });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${vp.name}: ok${overflow > 0 ? ` — ATENÇÃO: ${overflow}px de rolagem horizontal` : ''}`);
  await context.close();
}
await browser.close();
