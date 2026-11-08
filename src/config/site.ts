/**
 * Configuração do estabelecimento (white-label).
 *
 * Para criar o cardápio de outro cliente, troque:
 *   1. este arquivo (nome, textos, contatos, horários, links);
 *   2. src/styles/theme.css (cores da marca);
 *   3. src/assets/brand/logo.svg + public/favicon.svg (logo) e rode `npm run icons`;
 *   4. src/data/cardapio.json + fotos em src/assets/cardapio/ (o cardápio em si).
 *
 * Endereço, CNPJ e horários abaixo são fictícios (projeto de demonstração).
 */
export const SITE = {
  name: 'Steak Burger',
  tagline: 'Os melhores hambúrgueres em um só lugar!',
  description:
    'Cardápio digital da Steak Burger: hambúrgueres artesanais, porções, bebidas e sobremesas com preços atualizados. Veja no celular ou baixe o PDF.',
  /** URL pública do site (sem barra no final). Pode ser sobrescrita com a env SITE_URL. */
  url: 'https://steakburger.forgedevapps.com',
  locale: 'pt-BR',
  currency: 'BRL',
  /** Cor da barra do navegador no celular — use a mesma de --brand-600 em theme.css. */
  themeColor: '#275643',
  backgroundColor: '#fbf7f0',

  address: {
    street: 'Rua Fictícia, 123 – Centro',
    city: 'Rio de Janeiro',
    region: 'RJ',
    postalCode: '20000-000',
    country: 'BR',
  },
  cnpj: '12.345.678/0001-90',

  /** Horário de funcionamento exibido no site, no PDF e nos dados estruturados. */
  hours: [
    { label: 'Terça a quinta', time: '18h às 23h', days: ['Tu', 'We', 'Th'], opens: '18:00', closes: '23:00' },
    { label: 'Sexta e sábado', time: '18h às 0h', days: ['Fr', 'Sa'], opens: '18:00', closes: '23:59' },
    { label: 'Domingo', time: '12h às 22h', days: ['Su'], opens: '12:00', closes: '22:00' },
  ],

  social: [
    { name: 'Instagram', handle: '@forgedevapps', url: 'https://www.instagram.com/Forgedevapps', icon: 'instagram' },
    { name: 'Facebook', handle: 'Steak Burger', url: 'https://facebook.com', icon: 'facebook' },
    { name: 'TikTok', handle: 'Steak Burger', url: 'https://tiktok.com', icon: 'tiktok' },
  ],

  /** Aviso exibido no rodapé e no PDF. */
  priceNotice: 'Preços em reais (R$), sujeitos a alteração sem aviso prévio. Imagens meramente ilustrativas.',

  /** Crédito de quem desenvolveu o cardápio (aparece discretamente no rodapé). */
  credit: { name: 'Forge Dev Apps', url: 'https://forgedevapps.com' },

  /** Cartões de mesa com QR Code (PDF gerado no build). */
  tableCards: {
    /** Quantidade de mesas: um cartão numerado por mesa (Mesa 01, 02…). Sobrescreva com a env MESAS. */
    count: 10,
    /** Inclui ?mesa=NN no link do QR — o site mostra "Mesa NN" para quem escaneou. */
    tableInUrl: true,
  },
} as const;

/** Quantidade de mesas considerando a variável de ambiente MESAS (1 a 200). */
export function tableCount(): number {
  const fromEnv = typeof process !== 'undefined' ? Number(process.env.MESAS) : Number.NaN;
  const count = Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : SITE.tableCards.count;
  return Math.min(Math.max(count, 1), 200);
}

/** Link gravado no QR Code de cada mesa (ou o link geral, sem número). */
export function tableUrl(table?: number): string {
  const base = `${siteUrl()}/`;
  if (!table || !SITE.tableCards.tableInUrl) return base;
  return `${base}?mesa=${String(table).padStart(2, '0')}`;
}

/** Arquivos gerados no build (scripts/generate-assets.ts) e servidos na raiz do site. */
export const DOWNLOADS = {
  menuPdf: { path: '/cardapio-steak-burger.pdf', filename: 'Cardapio-Steak-Burger.pdf' },
  qrKitPdf: { path: '/qrcodes-mesas-steak-burger.pdf', filename: 'QR-Codes-Mesas-Steak-Burger.pdf' },
  /** Prévia do link (WhatsApp exige < 300 KB, por isso JPEG). */
  ogImage: { path: '/og-image.jpg', width: 1200, height: 630, type: 'image/jpeg' },
} as const;

export type SocialIcon = (typeof SITE.social)[number]['icon'];

/** URL canônica, permitindo sobrescrever por variável de ambiente (ex.: staging). */
export function siteUrl(): string {
  const fromEnv = typeof process !== 'undefined' ? process.env.SITE_URL : undefined;
  return (fromEnv || SITE.url).replace(/\/+$/, '');
}
