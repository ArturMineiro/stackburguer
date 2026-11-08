import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { basePrice, cardapioJsonSchema, countItems, hasVariations, parseCardapio } from '../../src/lib/menu.ts';

const raw: unknown = JSON.parse(readFileSync('src/data/cardapio.json', 'utf8'));

describe('src/data/cardapio.json', () => {
  const cardapio = parseCardapio(raw);
  const itens = cardapio.categorias.flatMap((categoria) => categoria.itens);

  it('é válido segundo o esquema', () => {
    expect(cardapio.categorias.length).toBeGreaterThanOrEqual(4);
    expect(countItems(cardapio)).toBe(itens.length);
  });

  it('tem foto existente para cada item', () => {
    const faltando = itens.filter((item) => !existsSync(`src/assets/cardapio/${item.imagem}`)).map((i) => i.imagem);
    expect(faltando).toEqual([]);
  });

  it('não repete ids', () => {
    const ids = [...cardapio.categorias.map((c) => c.id), ...itens.map((i) => i.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lista ingredientes para todos os pratos de comida', () => {
    const comida = cardapio.categorias.filter((c) => c.id !== 'bebidas').flatMap((c) => c.itens);
    expect(comida.filter((item) => item.ingredientes.length === 0).map((i) => i.id)).toEqual([]);
  });

  it('o JSON Schema do editor está em dia com o esquema (rode `npm run schema` se falhar)', () => {
    const committed: unknown = JSON.parse(readFileSync('src/data/cardapio.schema.json', 'utf8'));
    expect(committed).toEqual(cardapioJsonSchema());
  });

  it('marca bebidas alcoólicas com o selo +18', () => {
    const alcoolicos = ['cervejas', 'caipirinha', 'gin-tonica'];
    for (const id of alcoolicos) {
      expect(itens.find((item) => item.id === id)?.selos).toContain('alcoolico');
    }
  });
});

describe('parseCardapio', () => {
  const valido = {
    categorias: [
      {
        id: 'lanches',
        titulo: 'Lanches',
        icone: 'hamburger',
        itens: [{ id: 'x', nome: 'X', descricao: 'D', imagem: 'x.jpg', opcoes: [{ titulo: 'Único', preco: 10 }] }],
      },
    ],
  };

  it('preenche padrões (listas vazias)', () => {
    const item = parseCardapio(valido).categorias[0]?.itens[0];
    expect(item?.ingredientes).toEqual([]);
    expect(item?.selos).toEqual([]);
  });

  it('recusa preço negativo com mensagem clara', () => {
    const invalido = structuredClone(valido);
    invalido.categorias[0]!.itens[0]!.opcoes[0]!.preco = -1;
    expect(() => parseCardapio(invalido)).toThrow(/preço deve ser maior que zero/);
  });

  it('recusa ids duplicados', () => {
    const duplicado = structuredClone(valido);
    duplicado.categorias[0]!.itens.push(structuredClone(duplicado.categorias[0]!.itens[0]!));
    expect(() => parseCardapio(duplicado)).toThrow(/id duplicado/);
  });

  it('recusa campos desconhecidos (erros de digitação)', () => {
    const digitado = structuredClone(valido) as Record<string, unknown>;
    (digitado.categorias as { itens: Record<string, unknown>[] }[])[0]!.itens[0]!.precoo = 10;
    expect(() => parseCardapio(digitado)).toThrow(/cardapio\.json inválido/);
  });
});

describe('preços', () => {
  const item = parseCardapio({
    categorias: [
      {
        id: 'c',
        titulo: 'C',
        icone: 'utensils',
        itens: [
          {
            id: 'i',
            nome: 'I',
            descricao: 'D',
            imagem: 'i.jpg',
            opcoes: [
              { titulo: 'Grande', preco: 40 },
              { titulo: 'Pequena', preco: 25 },
            ],
          },
        ],
      },
    ],
  }).categorias[0]!.itens[0]!;

  it('"a partir de" usa o menor preço', () => {
    expect(basePrice(item)).toBe(25);
    expect(hasVariations(item)).toBe(true);
  });
});
