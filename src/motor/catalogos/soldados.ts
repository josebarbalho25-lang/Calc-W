// ═══════════════════════════════════════════════════════════════════════════
//  motor/catalogos/soldados.ts — o perfil I soldado, montado pelas chapas
// ---------------------------------------------------------------------------
//  Toda propriedade sai das quatro chapas (d, tw e as duas mesas), por conta
//  de retângulo: o soldado não tem raio de concordância, então a conta é
//  exata e é a mesma para a bitola de catálogo (CS, CVS, VS) e para o perfil
//  de chapas digitadas (PS). O catálogo publicado entra só como conferência
//  (selo em `soldados.test.ts`): se a tabela e a conta divergirem, a tabela
//  foi lida errado.
//
//  A CONTA É A DA SEÇÃO MONOSSIMÉTRICA (centroide fora do meio, Zx pela linha
//  neutra plástica, centro de torção, Cw do D.2.8-b); com as mesas iguais ela
//  cai nas fórmulas do I duplamente simétrico.
//
//  J (constante de torção): soma de b·t³/3 das três chapas, com a alma medida
//  entre as faces internas das mesas (h = d − tfs − tfi). Ver `constanteDeTorcao`.
// ═══════════════════════════════════════════════════════════════════════════

import type { ChapasDoSoldado, PerfilI, SeriePerfilI } from '../tipos';

/** Um retângulo da seção, cm: base, altura e cota de baixo (a partir da face de baixo). */
interface Retangulo {
  b: number;
  h: number;
  y0: number;
}

function retangulos(c: ChapasDoSoldado): Retangulo[] {
  const d = c.d / 10;
  const ts = c.mesaSuperior.tf / 10;
  const ti = c.mesaInferior.tf / 10;
  return [
    { b: c.mesaInferior.bf / 10, h: ti, y0: 0 },
    { b: c.tw / 10, h: d - ts - ti, y0: ti },
    { b: c.mesaSuperior.bf / 10, h: ts, y0: d - ts },
  ];
}

/** Momento estático plástico de um retângulo em relação à cota yp: ∫|y − yp| dA. */
function momentoPlastico(r: Retangulo, yp: number): number {
  const a = r.y0;
  const b = r.y0 + r.h;
  if (yp <= a) return (r.b * ((b - yp) ** 2 - (a - yp) ** 2)) / 2;
  if (yp >= b) return (r.b * ((yp - a) ** 2 - (yp - b) ** 2)) / 2;
  return (r.b * ((yp - a) ** 2 + (b - yp) ** 2)) / 2;
}

/**
 * J = Σ b·t³/3 — mesas inteiras (bf·tf³/3) e a alma entre as faces internas
 * das mesas (h·tw³/3). É a convenção das tabelas da NBR 5884 e do exemplo do
 * manual "Uso Fácil" (CVS 500 x 123: J = 109 cm⁴). A memória diz qual é.
 */
export function constanteDeTorcao(c: ChapasDoSoldado): number {
  return retangulos(c).reduce((J, r) => J + (Math.max(r.b, r.h) * Math.min(r.b, r.h) ** 3) / 3, 0);
}

export const FORMULA_DO_J = 'J = Σ b·t³/3 (mesas inteiras e alma entre as faces internas das mesas)';

/** O que impede a verificação destas chapas, por extenso; null quando servem. */
export function problemaDasChapas(c: ChapasDoSoldado): string | null {
  const medidas: Array<[string, number]> = [
    ['d', c.d],
    ['tw', c.tw],
    ['bf', c.mesaSuperior.bf],
    ['tf', c.mesaSuperior.tf],
    ['bf (mesa de baixo)', c.mesaInferior.bf],
    ['tf (mesa de baixo)', c.mesaInferior.tf],
  ];
  for (const [k, valor] of medidas) if (!(Number.isFinite(valor) && valor > 0)) return `${k} = ${valor}: a chapa tem de ter medida > 0`;
  if (c.d <= c.mesaSuperior.tf + c.mesaInferior.tf) return `d = ${c.d} mm não passa da soma das espessuras das mesas: não sobra alma`;
  if (c.tw >= Math.min(c.mesaSuperior.bf, c.mesaInferior.bf)) return `tw = ${c.tw} mm não cabe na mesa (bf menor que a alma)`;
  return null;
}

/** Número à brasileira, sem zero à toa: 12,5; 8; 0,95. */
function mm(x: number): string {
  return String(Math.round(x * 100) / 100).replace('.', ',');
}

/** "PS 500 x 250 x 16 x 8": d × bf × tf × tw, em mm. */
export function nomeDoSoldado(c: ChapasDoSoldado): string {
  const ms = c.mesaSuperior;
  const mi = c.mesaInferior;
  const iguais = ms.bf === mi.bf && ms.tf === mi.tf;
  return iguais
    ? `PS ${mm(c.d)} x ${mm(ms.bf)} x ${mm(ms.tf)} x ${mm(c.tw)}`
    : `PS ${mm(c.d)} x ${mm(ms.bf)}/${mm(mi.bf)} x ${mm(ms.tf)}/${mm(mi.tf)} x ${mm(c.tw)}`;
}

/**
 * A geometria inteira das chapas, em cm, com as cotas medidas a partir da
 * FACE DE BAIXO da mesa inferior: centroide (yc), linha neutra plástica
 * (ypl) e centro de torção (y0, do centroide para cima). É daqui que o motor
 * tira hc, hp, Wc, Wt e o ryTc da seção monossimétrica (`ladoComprimido.ts`).
 */
export interface GeometriaDoSoldado {
  d: number;
  tw: number;
  /** Mesa superior (s) e inferior (i): largura e espessura. */
  bs: number;
  ts: number;
  bi: number;
  ti: number;
  /** Alma entre as faces internas das mesas. */
  hw: number;
  A: number;
  yc: number;
  ypl: number;
  Ix: number;
  Iy: number;
  Zx: number;
  Zy: number;
  /** Inércia de cada mesa em torno do eixo da alma (t·b³/12). */
  Iys: number;
  Iyi: number;
  /** Centro de torção a partir do centroide, positivo para cima. Zero nas mesas iguais. */
  y0: number;
  /** Distância entre os planos médios das mesas. */
  hf: number;
  Cw: number;
  iguais: boolean;
}

export function geometriaDoSoldado(c: ChapasDoSoldado): GeometriaDoSoldado {
  const rs = retangulos(c);
  const d = c.d / 10;
  const A = rs.reduce((s, r) => s + r.b * r.h, 0);
  const yc = rs.reduce((s, r) => s + r.b * r.h * (r.y0 + r.h / 2), 0) / A;
  const Ix = rs.reduce((s, r) => s + (r.b * r.h ** 3) / 12 + r.b * r.h * (r.y0 + r.h / 2 - yc) ** 2, 0);
  const Iy = rs.reduce((s, r) => s + (r.h * r.b ** 3) / 12, 0);
  // A linha neutra plástica divide a área ao meio (bissecção: a área abaixo
  // cresce com a cota). Nas mesas iguais ela cai no meio da altura.
  let a = 0;
  let b = d;
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2;
    const abaixo = rs.reduce((s, r) => s + r.b * Math.min(Math.max(m - r.y0, 0), r.h), 0);
    if (abaixo < A / 2) a = m;
    else b = m;
  }
  const ypl = (a + b) / 2;
  const Zx = rs.reduce((s, r) => s + momentoPlastico(r, ypl), 0);
  const Zy = rs.reduce((s, r) => s + (r.h * r.b ** 2) / 4, 0);
  const bs = c.mesaSuperior.bf / 10;
  const ts = c.mesaSuperior.tf / 10;
  const bi = c.mesaInferior.bf / 10;
  const ti = c.mesaInferior.tf / 10;
  const iguais = bs === bi && ts === ti;
  const Iys = (ts * bs ** 3) / 12;
  const Iyi = (ti * bi ** 3) / 12;
  const hf = d - (ts + ti) / 2;
  // Centro de torção entre as mesas, mais perto da mais rígida: a distância
  // dele ao plano médio da mesa de cima é hf·Iyi/(Iys + Iyi).
  const ysc = d - ts / 2 - (hf * Iyi) / (Iys + Iyi);
  // Cw: D.2.8-a para I com dois eixos de simetria; D.2.8-b quando as mesas
  // diferem (a mesma conta dá o D.2.8-a, a menos da parcela da alma no Iy).
  const Cw = iguais ? (Iy * hf ** 2) / 4 : ((hf ** 2 / 12) * (ti * bi ** 3 * ts * bs ** 3)) / (ti * bi ** 3 + ts * bs ** 3);
  return { d, tw: c.tw / 10, bs, ts, bi, ti, hw: d - ts - ti, A, yc, ypl, Ix, Iy, Zx, Zy, Iys, Iyi, y0: iguais ? 0 : ysc - yc, hf, Cw, iguais };
}

/** O perfil soldado com todas as propriedades, pronto para o motor. */
export function perfilSoldado(c: ChapasDoSoldado, nome = nomeDoSoldado(c), serie: SeriePerfilI = 'PS'): PerfilI {
  const g = geometriaDoSoldado(c);
  const { d, A, yc, Ix, Iy, Zx, Zy, Cw, iguais } = g;
  const bfMax = Math.max(g.bs, g.bi);
  const hw = c.d - c.mesaSuperior.tf - c.mesaInferior.tf;
  return {
    familia: 'I',
    nome,
    serie,
    massa: 0.785 * A,
    d: c.d,
    bf: c.mesaSuperior.bf,
    tw: c.tw,
    tf: c.mesaSuperior.tf,
    h: hw,
    // Sem raio de concordância: a parte plana da alma é a alma inteira.
    dLinha: hw,
    A,
    Ix,
    // W mínimo: o da fibra mais distante do centroide (Wc e Wt, cada um do
    // seu lado, saem de `ladoComprimido.ts`).
    Wx: Ix / Math.max(yc, d - yc),
    rx: Math.sqrt(Ix / A),
    Zx,
    Iy,
    Wy: Iy / (bfMax / 2),
    ry: Math.sqrt(Iy / A),
    Zy,
    J: constanteDeTorcao(c),
    Cw,
    origem: { J: FORMULA_DO_J, Zx: 'chapas (linha neutra plástica)', Zy: 'chapas', Cw: iguais ? 'D.2.8-a' : 'D.2.8-b' },
    soldado: c,
  };
}

/** Chapas de mesas iguais (o caso da primeira etapa e de todo o catálogo NBR 5884). */
export function chapasIguais(d: number, bf: number, tf: number, tw: number): ChapasDoSoldado {
  return { d, tw, mesaSuperior: { bf, tf }, mesaInferior: { bf, tf } };
}
