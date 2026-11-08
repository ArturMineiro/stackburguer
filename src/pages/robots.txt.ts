import type { APIRoute } from 'astro';
import { siteUrl } from '../config/site.ts';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /imprimir/\n\nSitemap: ${siteUrl()}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
