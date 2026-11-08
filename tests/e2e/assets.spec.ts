import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Arquivos gerados e SEO', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'checagens de servidor: um navegador basta');

  test('PDF do cardápio e dos QR Codes estão disponíveis', async ({ request }) => {
    for (const path of ['/cardapio-steak-burger.pdf', '/qrcodes-mesas-steak-burger.pdf']) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
      const body = await response.body();
      expect(body.subarray(0, 5).toString()).toBe('%PDF-');
    }
  });

  test('prévia do link (WhatsApp) existe, é JPEG e tem menos de 300 KB', async ({ page, request }) => {
    await page.goto('/');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toMatch(/^https:\/\/.+\/og-image\.jpg$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Steak Burger/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.{40,}/);

    const response = await request.get('/og-image.jpg');
    expect(response.status()).toBe(200);
    const body = await response.body();
    expect(body.byteLength).toBeLessThan(300 * 1024);
    expect(body.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });

  test('manifest, robots, sitemap e versão', async ({ request }) => {
    const manifest = await (await request.get('/site.webmanifest')).json();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:');
    expect(await (await request.get('/sitemap.xml')).text()).toContain('<loc>');
    expect((await (await request.get('/version.json')).json()).app).toBe('stackburguer');
  });

  test('dados estruturados do restaurante com o cardápio', async ({ page }) => {
    await page.goto('/');
    const json = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(json ?? '{}');
    expect(data['@type']).toBe('Restaurant');
    expect(data.hasMenu.hasMenuSection.length).toBeGreaterThanOrEqual(4);
  });

  test('página 404 personalizada', async ({ page }) => {
    const response = await page.goto('/nao-existe');
    expect(response?.status()).toBe(404);
    await expect(page.getByText('Essa página saiu do cardápio')).toBeVisible();
  });
});

test.describe('Acessibilidade (axe)', () => {
  test('home sem violações sérias', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} ocorrência(s)`)).toEqual([]);
  });

  test('detalhe do item aberto sem violações sérias', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-item="classico"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const results = await new AxeBuilder({ page }).include('dialog[open]').analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => v.id)).toEqual([]);
  });
});
