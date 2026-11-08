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
  card: '(min-width: 76rem) 23rem, (min-width: 62rem) 30vw, (min-width: 40rem) 46vw, 7.5rem',
  dialog: '(min-width: 56rem) 26rem, 100vw',
  hero: '100vw',
} as const;
