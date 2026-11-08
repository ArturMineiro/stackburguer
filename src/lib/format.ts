import { SITE } from '../config/site.ts';

const currency = new Intl.NumberFormat(SITE.locale, { style: 'currency', currency: SITE.currency });

/** 32 → "R$ 32,00" (com espaço inseparável entre o símbolo e o valor). */
export function formatPrice(value: number): string {
  return currency.format(value);
}

/** Data por extenso no fuso de São Paulo: "8 de novembro de 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(SITE.locale, { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(date);
}

/** Pluralização simples em português: plural(3, 'item', 'itens') → "3 itens". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
