/**
 * Busca do cardápio. O texto pesquisável de cada item é pré-calculado no build
 * (atributo data-search) e o navegador só normaliza o que a pessoa digita.
 */
import type { Categoria, Item } from './menu.ts';

/** Minúsculas, sem acentos e só letras/números separados por espaço. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(query: string): string[] {
  const normalized = normalize(query);
  return normalized ? normalized.split(' ') : [];
}

/** Todos os termos precisam aparecer (busca "E"): "bacon duplo" encontra só o que tem os dois. */
export function matchesTokens(haystack: string, tokens: readonly string[]): boolean {
  return tokens.every((token) => haystack.includes(token));
}

export function searchableText(item: Item, categoria: Pick<Categoria, 'titulo'>): string {
  return normalize(
    [
      item.nome,
      item.descricao,
      item.detalhes ?? '',
      categoria.titulo,
      ...item.ingredientes,
      ...item.tags,
      ...item.opcoes.map((opcao) => opcao.titulo),
    ].join(' '),
  );
}
