/** Créditos das fotos (exigidos pelas licenças CC BY; cortesia para as do Unsplash). */
import raw from './creditos.json';

export interface PhotoCredit {
  foto: string;
  uso: string;
  autor: string;
  fonte: string;
  url: string;
  licenca: string;
  licencaUrl: string;
  alteracoes?: string;
}

export const credits: PhotoCredit[] = raw;

/** Fotos cuja licença exige atribuição (CC BY). */
export const attributionRequired = credits.filter((credit) => credit.licenca.startsWith('CC'));
