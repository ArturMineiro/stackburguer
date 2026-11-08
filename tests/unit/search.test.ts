import { describe, expect, it } from 'vitest';
import { matchesTokens, normalize, searchableText, tokenize } from '../../src/lib/search.ts';
import type { Item } from '../../src/lib/menu.ts';

describe('normalize', () => {
  it('remove acentos, pontuação e caixa', () => {
    expect(normalize('Hambúrguer do Trovão!')).toBe('hamburguer do trovao');
    expect(normalize('  Pão   de   Batata ')).toBe('pao de batata');
    expect(normalize('X-Salada')).toBe('x salada');
  });
});

describe('tokenize', () => {
  it('quebra a busca em termos normalizados', () => {
    expect(tokenize('Bacon  DUPLO')).toEqual(['bacon', 'duplo']);
  });
  it('busca vazia ou só pontuação não gera termos', () => {
    expect(tokenize('   ')).toEqual([]);
    expect(tokenize('?!')).toEqual([]);
  });
});

describe('matchesTokens', () => {
  const haystack = 'cheddar bacon blend bovino 160 g pao australiano';
  it('exige que todos os termos apareçam', () => {
    expect(matchesTokens(haystack, ['bacon', 'cheddar'])).toBe(true);
    expect(matchesTokens(haystack, ['bacon', 'frango'])).toBe(false);
  });
  it('aceita prefixos e trechos de palavras', () => {
    expect(matchesTokens(haystack, ['ched'])).toBe(true);
  });
});

describe('searchableText', () => {
  const item: Item = {
    id: 'teste',
    nome: 'Batata Rústica',
    descricao: 'Crocante',
    imagem: 'teste.jpg',
    ingredientes: ['Alecrim'],
    opcoes: [{ titulo: 'Meia porção', preco: 20 }],
    selos: [],
    tags: ['fritas'],
  };
  it('inclui nome, ingredientes, tags, opções e categoria', () => {
    const text = searchableText(item, { titulo: 'Entradas' });
    for (const term of ['batata rustica', 'alecrim', 'fritas', 'meia porcao', 'entradas']) {
      expect(text).toContain(term);
    }
  });
});
