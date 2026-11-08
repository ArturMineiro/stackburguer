import type { Badge } from './menu.ts';
import type { IconName } from './icons.ts';

export type BadgeTone = 'green' | 'orange' | 'red' | 'dark' | 'blue' | 'gray';

export const BADGE_INFO: Record<Badge, { label: string; tone: BadgeTone; icon: IconName }> = {
  novidade: { label: 'Novidade', tone: 'green', icon: 'sparkles' },
  promo: { label: 'Promoção', tone: 'orange', icon: 'badge-percent' },
  'mais-pedido': { label: 'Mais pedido', tone: 'red', icon: 'star' },
  chef: { label: 'Sugestão do chef', tone: 'dark', icon: 'chef-hat' },
  vegetariano: { label: 'Vegetariano', tone: 'green', icon: 'leaf' },
  picante: { label: 'Picante', tone: 'red', icon: 'flame' },
  compartilhar: { label: 'Para compartilhar', tone: 'blue', icon: 'users' },
  alcoolico: { label: '+18', tone: 'gray', icon: 'info' },
};
