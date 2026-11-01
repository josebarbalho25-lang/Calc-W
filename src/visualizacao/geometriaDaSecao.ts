// ═══════════════════════════════════════════════════════════════════════════
//  visualizacao/geometriaDaSecao.ts — o corte do perfil I, em escala, cotado
// ---------------------------------------------------------------------------
//  Conta pura: devolve o contorno, as linhas de cota e os textos já na
//  coordenada da caixa. Quem desenha na tela (`SecaoPerfil2D.tsx`) e quem
//  desenha na memória (`relatorio/`) leem a MESMA geometria — o desenho da
//  tela e o do papel não podem discordar.
//
//  ⚠️ ESCALA ÚNICA nos dois sentidos: a mesa larga do HP aparece larga, a alma
//  fina do W 410 aparece fina. Nada de esticar para encher a caixa.
//
//  ⚠️ O RAIO DE CONCORDÂNCIA NÃO É PUBLICADO pela Gerdau. Sai da geometria:
//  r = (d − 2·tf − d')/2 — o que sobra da alma depois das mesas e da parte
//  plana. É o mesmo raio que trava a borda da alma na FLA.
//
//  A cota é a do CAD: traço a 45° na ponta, não seta.
// ═══════════════════════════════════════════════════════════════════════════

import type { PerfilI } from '../motor/tipos';
import { numExato } from '../relatorio/formatos';

export interface Linha {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  classe: 'cota' | 'chamada' | 'eixo' | 'traco';
}

export interface Texto {
  x: number;
  y: number;
  texto: string;
  /** Índice do símbolo: "f" em bf, "w" em tw. */
  indice?: string;
  valor: string;
  ancora: 'start' | 'middle' | 'end';
  rot?: number;
  classe: 'cota' | 'eixo';
}

export interface DesenhoDaSecao {
  largura: number;
  altura: number;
  contorno: string;
  linhas: Linha[];
  textos: Texto[];
  /** Raio de concordância deduzido, mm. */
  r: number;
}

export function raioDeConcordancia(p: PerfilI): number {
  return Math.max(0, (p.d - 2 * p.tf - p.dLinha) / 2);
}

const mm = (v: number) => numExato(v, 1);

export function desenhoDaSecao(p: PerfilI, largura = 380, altura = 300): DesenhoDaSecao {
  // Folgas: em cima a cota de bf, à direita a de d, à esquerda a de tf,
  // embaixo o "Y" do eixo (28 abaixo da mesa — com 26 ele saía da caixa).
  const folga = { esq: 74, dir: 64, cima: 38, baixo: 34 };
  const s = Math.min((largura - folga.esq - folga.dir) / p.bf, (altura - folga.cima - folga.baixo) / p.d);
  const cx = folga.esq + (largura - folga.esq - folga.dir) / 2;
  const cy = folga.cima + (altura - folga.cima - folga.baixo) / 2;
  const B = (p.bf * s) / 2;
  const D = (p.d * s) / 2;
  const tw = (p.tw * s) / 2;
  const tf = p.tf * s;
  const r = raioDeConcordancia(p);
  const R = r * s;

  // Contorno no sentido horário, a partir do canto de cima à esquerda. Os
  // quatro arcos são côncavos (o centro fica no vazio): sweep 0 em todos.
  const pt = (x: number, y: number) => `${(cx + x).toFixed(2)} ${(cy + y).toFixed(2)}`;
  const arco = (x: number, y: number) => `A ${R.toFixed(2)} ${R.toFixed(2)} 0 0 0 ${pt(x, y)}`;
  const contorno = [
    `M ${pt(-B, -D)}`,
    `L ${pt(B, -D)}`,
    `L ${pt(B, -D + tf)}`,
    `L ${pt(tw + R, -D + tf)}`,
    arco(tw, -D + tf + R),
    `L ${pt(tw, D - tf - R)}`,
    arco(tw + R, D - tf),
    `L ${pt(B, D - tf)}`,
    `L ${pt(B, D)}`,
    `L ${pt(-B, D)}`,
    `L ${pt(-B, D - tf)}`,
    `L ${pt(-tw - R, D - tf)}`,
    arco(-tw, D - tf - R),
    `L ${pt(-tw, -D + tf + R)}`,
    arco(-tw - R, -D + tf),
    `L ${pt(-B, -D + tf)}`,
    'Z',
  ].join(' ');

  const linhas: Linha[] = [];
  const textos: Texto[] = [];
  const traco = (x: number, y: number) => linhas.push({ x1: x - 3, y1: y + 3, x2: x + 3, y2: y - 3, classe: 'traco' });

  // ── bf, em cima ──
  const yb = cy - D - 18;
  linhas.push({ x1: cx - B, y1: cy - D - 3, x2: cx - B, y2: yb - 4, classe: 'chamada' });
  linhas.push({ x1: cx + B, y1: cy - D - 3, x2: cx + B, y2: yb - 4, classe: 'chamada' });
  linhas.push({ x1: cx - B, y1: yb, x2: cx + B, y2: yb, classe: 'cota' });
  traco(cx - B, yb);
  traco(cx + B, yb);
  textos.push({ x: cx, y: yb - 6, texto: 'b', indice: 'f', valor: mm(p.bf), ancora: 'middle', classe: 'cota' });

  // ── d, à direita ──
  // Longe o bastante para o "X" do eixo caber entre a mesa e a cota.
  const xd = cx + B + 34;
  linhas.push({ x1: cx + B + 3, y1: cy - D, x2: xd + 4, y2: cy - D, classe: 'chamada' });
  linhas.push({ x1: cx + B + 3, y1: cy + D, x2: xd + 4, y2: cy + D, classe: 'chamada' });
  linhas.push({ x1: xd, y1: cy - D, x2: xd, y2: cy + D, classe: 'cota' });
  traco(xd, cy - D);
  traco(xd, cy + D);
  textos.push({ x: xd + 12, y: cy, texto: 'd', valor: mm(p.d), ancora: 'middle', rot: -90, classe: 'cota' });

  // ── tf, à esquerda da mesa de cima ──
  const xt = cx - B - 14;
  linhas.push({ x1: cx - B - 3, y1: cy - D, x2: xt - 4, y2: cy - D, classe: 'chamada' });
  linhas.push({ x1: cx - B - 3, y1: cy - D + tf, x2: xt - 4, y2: cy - D + tf, classe: 'chamada' });
  linhas.push({ x1: xt, y1: cy - D - 8, x2: xt, y2: cy - D + tf + 8, classe: 'cota' });
  traco(xt, cy - D);
  traco(xt, cy - D + tf);
  textos.push({ x: xt - 6, y: cy - D + tf / 2 + 4, texto: 't', indice: 'f', valor: mm(p.tf), ancora: 'end', classe: 'cota' });

  // ── tw, atravessando a alma abaixo do centro ──
  const yw = cy + D / 2;
  linhas.push({ x1: cx - tw - 14, y1: yw, x2: cx + tw + 14, y2: yw, classe: 'cota' });
  traco(cx - tw, yw);
  traco(cx + tw, yw);
  textos.push({ x: cx + tw + 18, y: yw + 4, texto: 't', indice: 'w', valor: mm(p.tw), ancora: 'start', classe: 'cota' });

  // ── r, com chamada a partir do arco de cima à esquerda ──
  if (r > 0) {
    const ax = cx - tw - R * (1 - Math.SQRT1_2);
    const ay = cy - D + tf + R * (1 - Math.SQRT1_2);
    linhas.push({ x1: ax, y1: ay, x2: ax - 22, y2: ay + 22, classe: 'chamada' });
    linhas.push({ x1: ax - 22, y1: ay + 22, x2: ax - 34, y2: ay + 22, classe: 'chamada' });
    textos.push({ x: ax - 37, y: ay + 26, texto: 'r', valor: mm(r), ancora: 'end', classe: 'cota' });
  }

  // ── eixos baricêntricos ──
  const sobra = 16;
  linhas.push({ x1: cx - B - sobra, y1: cy, x2: cx + B + sobra, y2: cy, classe: 'eixo' });
  linhas.push({ x1: cx, y1: cy - D - 6, x2: cx, y2: cy + D + sobra, classe: 'eixo' });
  textos.push({ x: cx - B - sobra - 4, y: cy + 4, texto: 'X', valor: '', ancora: 'end', classe: 'eixo' });
  textos.push({ x: cx + B + sobra + 4, y: cy + 4, texto: 'X', valor: '', ancora: 'start', classe: 'eixo' });
  textos.push({ x: cx, y: cy + D + sobra + 12, texto: 'Y', valor: '', ancora: 'middle', classe: 'eixo' });

  return { largura, altura, contorno, linhas, textos, r };
}
