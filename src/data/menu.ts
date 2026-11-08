/**
 * Cardápio validado + fotos. Qualquer erro no JSON (preço inválido, foto que não
 * existe, id repetido…) interrompe o build com uma mensagem clara.
 */
import type { ImageMetadata } from 'astro';
import raw from './cardapio.json';
import { parseCardapio, type Item } from '../lib/menu.ts';

const photos = import.meta.glob<ImageMetadata>('../assets/cardapio/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

export const cardapio = parseCardapio(raw);

for (const item of cardapio.categorias.flatMap((categoria) => categoria.itens)) {
  if (!photos[`../assets/cardapio/${item.imagem}`]) {
    throw new Error(
      `Foto "${item.imagem}" do item "${item.id}" não encontrada em src/assets/cardapio/ (confira o nome do arquivo).`,
    );
  }
}

export function photoOf(item: Item): ImageMetadata {
  return photos[`../assets/cardapio/${item.imagem}`]!;
}
