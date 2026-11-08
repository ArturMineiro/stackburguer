import { describe, expect, it } from 'vitest';
import { formatPrice, plural } from '../../src/lib/format.ts';

const nbsp = ' ';

describe('formatPrice', () => {
  it('formata em reais com vírgula decimal', () => {
    expect(formatPrice(32)).toBe(`R$${nbsp}32,00`);
    expect(formatPrice(4.5)).toBe(`R$${nbsp}4,50`);
    expect(formatPrice(1250)).toBe(`R$${nbsp}1.250,00`);
  });
  it('usa espaço inseparável para o "R$" nunca quebrar de linha', () => {
    expect(formatPrice(10)).toContain(nbsp);
  });
});

describe('plural', () => {
  it('flexiona singular e plural', () => {
    expect(plural(1, 'item', 'itens')).toBe('1 item');
    expect(plural(0, 'item', 'itens')).toBe('0 itens');
    expect(plural(12, 'item', 'itens')).toBe('12 itens');
  });
});
