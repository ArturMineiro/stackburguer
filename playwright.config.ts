import { defineConfig, devices } from '@playwright/test';

/**
 * Testes de ponta a ponta no site já construído (npm run build).
 * - Local: só Chromium em vários tamanhos de tela.
 * - CI: também WebKit (Safari/iPhone) e Firefox.
 * Para testar um servidor já no ar (ex.: Docker): BASE_URL=http://localhost:8080 npm run test:e2e
 */
const externalBaseUrl = process.env.BASE_URL;
const allBrowsers = Boolean(process.env.CI) || process.env.ALL_BROWSERS === '1';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseUrl ?? 'http://127.0.0.1:4322',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'fold-280', use: { ...devices['Galaxy S9+'], viewport: { width: 280, height: 653 } } },
    { name: 'iphone-se', use: { ...devices['iPhone SE'], defaultBrowserType: 'chromium' } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'ipad-portrait', use: { ...devices['iPad (gen 7)'], defaultBrowserType: 'chromium' } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    ...(allBrowsers
      ? [
          { name: 'iphone-15-webkit', use: { ...devices['iPhone 15'] } },
          { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
        ]
      : []),
  ],
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: 'npx astro preview --host 127.0.0.1 --port 4322',
          url: 'http://127.0.0.1:4322',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
