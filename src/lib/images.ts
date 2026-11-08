import type { ImageMetadata } from 'astro';

/**
 * Larguras para o srcset sem nunca ampliar a foto original (ampliar só pesa
 * mais e piora a nitidez). Sempre inclui a largura original se ela for menor.
 */
export function widthsFor(image: ImageMetadata, candidates: readonly number[]): number[] {
  const fitting = candidates.filter((w) => w < image.width);
  return [...fitting, Math.min(image.width, Math.max(...candidates))];
}

/** Tamanhos de exibição usados no site (mantidos juntos para o srcset bater com o CSS). */
export const SIZES = {
  card: '(min-width: 48rem) 6.5rem, (max-width: 22rem) 4.25rem, 5.25rem',
  dialog: '(min-width: 56rem) 26rem, 100vw',
  hero: '100vw',
} as const;
