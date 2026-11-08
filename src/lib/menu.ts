import { z } from 'astro/zod';

/** Ícones disponíveis para as categorias (ver src/lib/icons.ts). */
export const CATEGORY_ICONS = ['utensils', 'hamburger', 'cup-soda', 'ice-cream-cone'] as const;

/** Selos que podem aparecer nos itens — rótulo/cor/ícone ficam em src/lib/badges.ts. */
export const BADGES = [
  'novidade',
  'promo',
  'mais-pedido',
  'chef',
  'vegetariano',
  'picante',
  'compartilhar',
  'alcoolico',
] as const;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
  error: 'use só letras minúsculas, números e hífens (ex.: "batata-frita")',
});
const texto = z.string().trim().min(1, { error: 'não pode ficar vazio' });
const preco = z
  .number({ error: 'o preço deve ser um número (ex.: 32 ou 32.5)' })
  .positive({ error: 'o preço deve ser maior que zero' })
  .max(10_000)
  .refine((n) => Number.isInteger(Math.round(n * 100)) && Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, {
    error: 'use no máximo 2 casas decimais',
  });

export const opcaoSchema = z.strictObject({ titulo: texto, preco });

export const extraSchema = z.strictObject({
  titulo: texto,
  descricao: texto.optional(),
  itens: z.array(z.strictObject({ nome: texto, preco })).min(1),
});

export const itemSchema = z.strictObject({
  id: slug,
  nome: texto,
  descricao: texto,
  detalhes: texto.optional(),
  imagem: z.string().regex(/^[a-z0-9-]+\.(?:jpe?g|png|webp|avif)$/, {
    error: 'nome de arquivo da foto em src/assets/cardapio/ (ex.: "batata-frita.jpg")',
  }),
  ingredientes: z.array(texto).default([]),
  opcoes: z.array(opcaoSchema).min(1, { error: 'informe ao menos uma opção com preço' }),
  selos: z.array(z.enum(BADGES)).default([]),
  tags: z.array(texto).default([]),
  nota: texto.optional(),
});

export const categoriaSchema = z.strictObject({
  id: slug,
  titulo: texto,
  subtitulo: texto.optional(),
  icone: z.enum(CATEGORY_ICONS),
  itens: z.array(itemSchema).min(1),
  extras: z.array(extraSchema).default([]),
});

export const cardapioSchema = z
  .strictObject({
    $schema: z.string().optional(),
    categorias: z.array(categoriaSchema).min(1),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    const check = (id: string, path: (string | number)[]) => {
      if (seen.has(id)) ctx.addIssue({ code: 'custom', path, message: `id duplicado: "${id}"` });
      seen.add(id);
    };
    data.categorias.forEach((cat, c) => {
      check(cat.id, ['categorias', c, 'id']);
      cat.itens.forEach((item, i) => check(item.id, ['categorias', c, 'itens', i, 'id']));
    });
  });

export type Cardapio = z.infer<typeof cardapioSchema>;
export type Categoria = Cardapio['categorias'][number];
export type Item = Categoria['itens'][number];
export type Badge = (typeof BADGES)[number];
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

/** Valida o JSON do cardápio e devolve uma mensagem amigável apontando cada problema. */
export function parseCardapio(raw: unknown): Cardapio {
  const result = cardapioSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  • ${issue.path.join(' › ') || '(raiz)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`src/data/cardapio.json inválido:\n${issues}`);
  }
  return result.data;
}

/** JSON Schema do cardápio (para o editor autocompletar o cardapio.json). */
export function cardapioJsonSchema(): Record<string, unknown> {
  return {
    ...z.toJSONSchema(cardapioSchema, { io: 'input', target: 'draft-7' }),
    title: 'Cardápio',
    description: 'Cardápio do site. Gerado de src/lib/menu.ts — rode `npm run schema` após mudar o esquema.',
  };
}

/** Menor preço entre as opções — exibido como "a partir de". */
export function basePrice(item: Item): number {
  return Math.min(...item.opcoes.map((opcao) => opcao.preco));
}

export function hasVariations(item: Item): boolean {
  return item.opcoes.length > 1;
}

export function countItems(cardapio: Cardapio): number {
  return cardapio.categorias.reduce((total, cat) => total + cat.itens.length, 0);
}
