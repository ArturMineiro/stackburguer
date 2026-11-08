import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const cardapio = JSON.parse(readFileSync('src/data/cardapio.json', 'utf8')) as {
  categorias: { id: string; titulo: string; itens: { id: string; nome: string }[] }[];
};
const totalItens = cardapio.categorias.reduce((n, c) => n + c.itens.length, 0);

test.describe('Cardápio', () => {
  test('carrega com todas as categorias e itens, sem erros no console', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/Steak Burger/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Steak Burger/i);
    for (const categoria of cardapio.categorias) {
      await expect(page.locator(`section#${categoria.id}`)).toBeAttached();
    }
    await expect(page.locator('[data-menu-item]')).toHaveCount(totalItens);
    expect(errors).toEqual([]);
  });

  test('não tem rolagem horizontal em nenhuma largura', async ({ page }) => {
    await page.goto('/');
    for (const y of [0, 0.35, 0.7, 1]) {
      await page.evaluate((f) => window.scrollTo(0, document.documentElement.scrollHeight * f), y);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `rolagem horizontal em ${Math.round(y * 100)}% da página`).toBeLessThanOrEqual(0);
    }
  });

  test('nenhum botão vaza do seu contêiner', async ({ page }) => {
    await page.goto('/');
    const vazando = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.btn')]
        .filter((el) => el.offsetParent !== null)
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const p = el.parentElement!.getBoundingClientRect();
          return r.left < p.left - 1 || r.right > p.right + 1;
        })
        .map((el) => el.textContent?.trim()),
    );
    expect(vazando).toEqual([]);
  });

  test('botões e links principais têm área de toque confortável (≥ 44px)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'regra pensada para telas de toque');
    await page.goto('/');
    const targets = page.locator('.chip, .catnav-pdf, .hero-actions .btn, .search-field input');
    const count = await targets.count();
    for (let i = 0; i < count; i++) {
      const box = await targets.nth(i).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
    }
  });

  test('busca filtra itens, esconde categorias vazias e permite limpar', async ({ page }) => {
    await page.goto('/');
    const busca = page.getByRole('searchbox', { name: 'Buscar no cardápio' });
    await busca.fill('bacon');
    await expect(page.locator('[data-menu-item]:visible').first()).toBeVisible();
    const visiveis = await page.locator('[data-menu-item]:visible').count();
    expect(visiveis).toBeGreaterThan(0);
    expect(visiveis).toBeLessThan(totalItens);
    await expect(page.locator('section#sobremesas')).toBeHidden();
    await expect(page.getByRole('status').first()).toContainText('encontrado');

    await busca.fill('xyzinexistente');
    await expect(page.getByText('Nada encontrado por aqui.')).toBeVisible();

    await page.getByRole('button', { name: 'Limpar busca' }).click();
    await expect(busca).toHaveValue('');
    await expect(page.locator('[data-menu-item]:visible')).toHaveCount(totalItens);
  });

  test('busca ignora acentos e maiúsculas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Buscar no cardápio' }).fill('PUDIM leite');
    await expect(page.locator('[data-menu-item]:visible')).toHaveCount(1);
    await expect(page.locator('#item-pudim')).toBeVisible();
  });

  test('menu de categorias rola até a seção e marca a categoria atual', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('[data-nav-link="bebidas"]');
    await link.click();
    await expect(page.locator('#bebidas-titulo')).toBeInViewport();
    await expect(link).toHaveAttribute('aria-current', 'true');
  });
});

test.describe('Detalhes do item', () => {
  test('abre com preços e ingredientes e fecha pelo botão', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-item="batata-cheddar-bacon"]').click();
    const dialog = page.getByRole('dialog', { name: 'Batata Cheddar & Bacon' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Meia porção');
    await expect(dialog).toContainText('R$ 32,00');
    await expect(dialog).toContainText('Ingredientes');
    await expect(page).toHaveURL(/#item-batata-cheddar-bacon$/);

    await dialog.getByRole('button', { name: 'Voltar ao cardápio' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/#item-/);
  });

  test('fecha com Esc', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-item="brownie"]').click();
    const dialog = page.getByRole('dialog', { name: 'Brownie com Sorvete' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('o botão "voltar" do navegador/celular fecha o detalhe sem sair do site', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-open-item="milkshake"]').click();
    const dialog = page.getByRole('dialog', { name: 'Milkshakes' });
    await expect(dialog).toBeVisible();
    await page.goBack();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });

  test('link direto abre o item', async ({ page }) => {
    await page.goto('/#item-caipirinha');
    await expect(page.getByRole('dialog', { name: 'Caipirinha' })).toBeVisible();
  });
});

test.describe('QR Code da mesa', () => {
  test('mostra o número da mesa vindo do QR Code', async ({ page }) => {
    await page.goto('/?mesa=07');
    await expect(page.getByText('Você está na mesa 07')).toBeVisible();
  });

  test('ignora valores inválidos', async ({ page }) => {
    await page.goto('/?mesa=abc');
    await expect(page.locator('[data-table-welcome]')).toBeHidden();
  });
});
