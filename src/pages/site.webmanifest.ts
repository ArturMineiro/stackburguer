import type { APIRoute } from 'astro';
import { SITE } from '../config/site.ts';

/** Manifesto do app: permite "Adicionar à tela inicial" com ícone e cores da marca. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: `${SITE.name} · Cardápio digital`,
        short_name: SITE.name,
        description: SITE.description,
        lang: SITE.locale,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: SITE.themeColor,
        background_color: SITE.backgroundColor,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } },
  );
