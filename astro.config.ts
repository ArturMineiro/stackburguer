import { defineConfig, fontProviders } from 'astro/config';
import { siteUrl } from './src/config/site.ts';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: siteUrl(),
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  // CSP com hashes gerados pelo Astro para scripts/estilos da página (meta tag).
  security: {
    csp: true,
  },
  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/inter-latin-wght-normal.woff2'],
            weight: '100 900',
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Bebas Neue',
      cssVariable: '--font-display',
      fallbacks: ['Impact', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/bebas-neue-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
            display: 'swap',
          },
        ],
      },
    },
  ],
  // Sem blocos de código no site: desliga o Shiki (incompatível com a CSP).
  markdown: { syntaxHighlight: false },
  devToolbar: { enabled: false },
  vite: {
    server: {
      // Necessário no container de desenvolvimento (bind mount do Windows não propaga eventos).
      watch: process.env.ASTRO_POLLING === 'true' ? { usePolling: true, interval: 300 } : {},
    },
  },
});
