/**
 * QR Code em SVG vetorial (nítido em qualquer tamanho de impressão), gerado no build.
 * Módulos quadrados agrupados em faixas (SVG leve), "olhos" arredondados e
 * opcionalmente um logo no centro (usa correção de erro H, que tolera ~30% de perda).
 */
import QRCode from 'qrcode';

export interface QrOptions {
  /** Cor dos módulos. */
  dark?: string;
  /** Fundo; omitido = transparente (coloque o QR sobre um cartão claro). */
  light?: string;
  /** Zona de silêncio em módulos (o padrão da norma é 4). */
  margin?: number;
  /** SVG (conteúdo interno, viewBox 0 0 64 64) desenhado no centro. */
  logo?: string;
  /** Cor da "moldura" atrás do logo. */
  logoBackground?: string;
  /** Texto acessível; sem ele o QR é tratado como decorativo. */
  title?: string;
  /** Classe CSS no <svg>. */
  className?: string;
}

const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}` +
  `h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}z`;

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch]!);

export function qrMatrix(text: string, withLogo: boolean) {
  const qr = QRCode.create(text, { errorCorrectionLevel: withLogo ? 'H' : 'M' });
  return { size: qr.modules.size, version: qr.version, isDark: (r: number, c: number) => qr.modules.get(r, c) === 1 };
}

export function qrSvg(text: string, options: QrOptions = {}): string {
  const { dark = '#111', light, margin = 0, title, className, logoBackground = '#fff' } = options;
  // A partir da versão 7 há um padrão de alinhamento no centro: não cobrimos com o logo.
  const probe = qrMatrix(text, Boolean(options.logo));
  const logo = options.logo && probe.version < 7 ? options.logo : undefined;
  const { size: n, isDark } = probe;

  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  let holeStart = -1;
  let holeEnd = -1;
  if (logo) {
    let k = Math.round(n * 0.26);
    if (k % 2 === 0) k += 1;
    holeStart = (n - k) / 2;
    holeEnd = holeStart + k;
  }
  const inHole = (r: number, c: number) => r >= holeStart && r < holeEnd && c >= holeStart && c < holeEnd;
  const drawable = (r: number, c: number) => isDark(r, c) && !inFinder(r, c) && !inHole(r, c);

  let modules = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n;) {
      if (!drawable(r, c)) {
        c++;
        continue;
      }
      let w = 1;
      while (c + w < n && drawable(r, c + w)) w++;
      modules += `M${c} ${r}h${w}v1h-${w}z`;
      c += w;
    }
  }

  const eye = (x: number, y: number) =>
    roundedRect(x, y, 7, 7, 2) + roundedRect(x + 1, y + 1, 5, 5, 1.4) + roundedRect(x + 2, y + 2, 3, 3, 0.9);
  const eyes = eye(0, 0) + eye(n - 7, 0) + eye(0, n - 7);

  const view = n + margin * 2;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin} ${-margin} ${view} ${view}"`,
    className ? ` class="${className}"` : '',
    title ? ` role="img" aria-label="${escapeXml(title)}"` : ' aria-hidden="true"',
    '>',
    title ? `<title>${escapeXml(title)}</title>` : '',
    light ? `<rect x="${-margin}" y="${-margin}" width="${view}" height="${view}" fill="${light}"/>` : '',
    `<path fill="${dark}" shape-rendering="crispEdges" d="${modules}"/>`,
    `<path fill="${dark}" fill-rule="evenodd" d="${eyes}"/>`,
  ];

  if (logo) {
    const k = holeEnd - holeStart;
    const pad = 0.6;
    parts.push(
      `<rect x="${holeStart + pad / 2}" y="${holeStart + pad / 2}" width="${k - pad}" height="${k - pad}" rx="${k * 0.22}" fill="${logoBackground}"/>`,
      `<svg x="${holeStart + 1}" y="${holeStart + 1}" width="${k - 2}" height="${k - 2}" viewBox="0 0 64 64">${logo}</svg>`,
    );
  }
  parts.push('</svg>');
  return parts.join('');
}
