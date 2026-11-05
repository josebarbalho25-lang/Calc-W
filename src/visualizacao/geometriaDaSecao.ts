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

import { geometriaDoSoldado } from '../motor/catalogos/soldados';
import type { Perfil, PerfilI } from '../motor/tipos';
import { numExato } from '../relatorio/formatos';
import { contornoDoPerfil } from './contornoDoPerfil';
import { desenhoDaCantoneira, desenhoDoU } from './geometriaLaminados';

export interface Linha {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  classe: 'cota' | 'chamada' | 'eixo' | 'eixo-principal' | 'traco';
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
  classe: 'cota' | 'eixo' | 'centro';
}

/** Centroide (G) e centro de torção (CT), marcados no desenho. */
export interface Marca {
  x: number;
  y: number;
  tipo: 'centroide' | 'torcao';
}

export interface DesenhoDaSecao {
  largura: number;
  altura: number;
  contorno: string;
  linhas: Linha[];
  textos: Texto[];
  /** Raio de concordância deduzido, mm (só W e HP; 0 nos outros). */
  r: number;
  /** G e CT — no U e na cantoneira, onde o CT sai do centroide. */
  marcas?: Marca[];
}

/**
 * O raio de concordância das abas paralelas (W, HP). No padrão americano a
 * mesa é inclinada e esta conta não vale: o raio sai do contorno
 * (`contornoDoPerfil.ts`), e não vai para a lista de propriedades.
 */
export function raioDeConcordancia(p: PerfilI): number {
  return Math.max(0, (p.d - 2 * p.tf - p.dLinha) / 2);
}

/** O desenho de qualquer perfil do catálogo. */
export function desenhoDoPerfil(p: Perfil, largura = 380, altura = 300): DesenhoDaSecao {
  if (p.familia === 'U') return desenhoDoU(p, largura, altura);
  if (p.familia === 'L') return desenhoDaCantoneira(p, largura, altura);
  return desenhoDaSecao(p, largura, altura);
}

const mm = (v: number) => numExato(v, 1);

/**
 * I soldado de mesas diferentes: as duas mesas cotadas (bfs em cima, bfi
 * embaixo, tfs e tfi à esquerda), o eixo X no centroide — que sobe para a mesa
 * maior — e o centro de torção (CT) marcado no eixo da alma.
 */
function desenhoDoIMonossimetrico(p: PerfilI, largura: number, altura: number): DesenhoDaSecao {
  const c = p.soldado!;
  const g = geometriaDoSoldado(c);
  const S = c.mesaSuperior;
  const I = c.mesaInferior;
  const bMax = Math.max(S.bf, I.bf);
  const folga = { esq: 74, dir: 64, cima: 38, baixo: 40 };
  const s = Math.min((largura - folga.esq - folga.dir) / bMax, (altura - folga.cima - folga.baixo) / c.d);
  const cx = folga.esq + (largura - folga.esq - folga.dir) / 2;
  const topo = folga.cima + (altura - folga.cima - folga.baixo - c.d * s) / 2;
  const base = topo + c.d * s;
  const yG = base - g.yc * 10 * s; // centroide, na tela
  const yCT = yG - g.y0 * 10 * s;
  const Bs = (S.bf * s) / 2;
  const Bi = (I.bf * s) / 2;
  const ts = S.tf * s;
  const ti = I.tf * s;
  const tw = (c.tw * s) / 2;
  const pt = (x: number, y: number) => `${(cx + x).toFixed(2)} ${y.toFixed(2)}`;
  const contorno = [
    `M ${pt(-Bs, topo)}`,
    `L ${pt(Bs, topo)}`,
    `L ${pt(Bs, topo + ts)}`,
    `L ${pt(tw, topo + ts)}`,
    `L ${pt(tw, base - ti)}`,
    `L ${pt(Bi, base - ti)}`,
    `L ${pt(Bi, base)}`,
    `L ${pt(-Bi, base)}`,
    `L ${pt(-Bi, base - ti)}`,
    `L ${pt(-tw, base - ti)}`,
    `L ${pt(-tw, topo + ts)}`,
    `L ${pt(-Bs, topo + ts)}`,
    'Z',
  ].join(' ');
  const linhas: Linha[] = [];
  const textos: Texto[] = [];
  const traco = (x: number, y: number) => linhas.push({ x1: x - 3, y1: y + 3, x2: x + 3, y2: y - 3, classe: 'traco' });
  const cotaH = (B: number, y: number, yt: number, ind: string, valor: number) => {
    linhas.push({ x1: cx - B, y1: y, x2: cx - B, y2: yt + (yt < y ? -4 : 4), classe: 'chamada' });
    linhas.push({ x1: cx + B, y1: y, x2: cx + B, y2: yt + (yt < y ? -4 : 4), classe: 'chamada' });
    linhas.push({ x1: cx - B, y1: yt, x2: cx + B, y2: yt, classe: 'cota' });
    traco(cx - B, yt);
    traco(cx + B, yt);
    textos.push({ x: cx, y: yt < y ? yt - 6 : yt + 14, texto: 'b', indice: ind, valor: mm(valor), ancora: 'middle', classe: 'cota' });
  };
  cotaH(Bs, topo - 3, topo - 18, 'fs', S.bf);
  cotaH(Bi, base + 3, base + 18, 'fi', I.bf);
  const cotaT = (B: number, y0: number, t: number, ind: string, valor: number) => {
    const xt = cx - B - 14;
    linhas.push({ x1: cx - B - 3, y1: y0, x2: xt - 4, y2: y0, classe: 'chamada' });
    linhas.push({ x1: cx - B - 3, y1: y0 + t, x2: xt - 4, y2: y0 + t, classe: 'chamada' });
    linhas.push({ x1: xt, y1: y0 - 8, x2: xt, y2: y0 + t + 8, classe: 'cota' });
    traco(xt, y0);
    traco(xt, y0 + t);
    textos.push({ x: xt - 6, y: y0 + t / 2 + 4, texto: 't', indice: ind, valor: mm(valor), ancora: 'end', classe: 'cota' });
  };
  cotaT(Bs, topo, ts, 'fs', S.tf);
  cotaT(Bi, base - ti, ti, 'fi', I.tf);
  const xd = cx + Math.max(Bs, Bi) + 34;
  linhas.push({ x1: cx + Bs + 3, y1: topo, x2: xd + 4, y2: topo, classe: 'chamada' });
  linhas.push({ x1: cx + Bi + 3, y1: base, x2: xd + 4, y2: base, classe: 'chamada' });
  linhas.push({ x1: xd, y1: topo, x2: xd, y2: base, classe: 'cota' });
  traco(xd, topo);
  traco(xd, base);
  textos.push({ x: xd + 12, y: (topo + base) / 2, texto: 'd', valor: mm(c.d), ancora: 'middle', rot: -90, classe: 'cota' });
  const yw = (yG + base) / 2;
  linhas.push({ x1: cx - tw - 14, y1: yw, x2: cx + tw + 14, y2: yw, classe: 'cota' });
  traco(cx - tw, yw);
  traco(cx + tw, yw);
  textos.push({ x: cx + tw + 18, y: yw + 4, texto: 't', indice: 'w', valor: mm(c.tw), ancora: 'start', classe: 'cota' });
  const B = Math.max(Bs, Bi);
  const sobra = 16;
  linhas.push({ x1: cx - B - sobra, y1: yG, x2: cx + B + sobra, y2: yG, classe: 'eixo' });
  linhas.push({ x1: cx, y1: topo - 6, x2: cx, y2: base + 6, classe: 'eixo' });
  textos.push({ x: cx - B - sobra - 4, y: yG + 4, texto: 'X', valor: '', ancora: 'end', classe: 'eixo' });
  textos.push({ x: cx + B + sobra + 4, y: yG + 4, texto: 'X', valor: '', ancora: 'start', classe: 'eixo' });
  return {
    largura,
    altura,
    contorno,
    linhas,
    textos,
    r: 0,
    marcas: [
      { x: cx, y: yG, tipo: 'centroide' },
      { x: cx, y: yCT, tipo: 'torcao' },
    ],
  };
}

export function desenhoDaSecao(p: PerfilI, largura = 380, altura = 300): DesenhoDaSecao {
  if (p.soldado && (p.soldado.mesaSuperior.bf !== p.soldado.mesaInferior.bf || p.soldado.mesaSuperior.tf !== p.soldado.mesaInferior.tf))
    return desenhoDoIMonossimetrico(p, largura, altura);
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
  const inclinada = p.serie === 'I';
  const r = inclinada ? 0 : raioDeConcordancia(p);
  const R = r * s;

  // Contorno no sentido horário, a partir do canto de cima à esquerda. Os
  // quatro arcos são côncavos (o centro fica no vazio): sweep 0 em todos.
  const pt = (x: number, y: number) => `${(cx + x).toFixed(2)} ${(cy + y).toFixed(2)}`;
  const arco = (x: number, y: number) => `A ${R.toFixed(2)} ${R.toFixed(2)} 0 0 0 ${pt(x, y)}`;
  // Mesa inclinada: o contorno vem da geometria comum (rampa 1:6, raio pelo c).
  const contornoInclinado = inclinada
    ? contornoDoPerfil(p)
        .pontos.map(([x, y], i) => `${i ? 'L' : 'M'} ${(cx + x * s).toFixed(2)} ${(cy - y * s).toFixed(2)}`)
        .join(' ') + ' Z'
    : '';
  const contorno = inclinada ? contornoInclinado : [
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
