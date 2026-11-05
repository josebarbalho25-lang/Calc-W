// ═══════════════════════════════════════════════════════════════════════════
//  motor/ladoComprimido.ts — o I soldado visto pela mesa que o momento comprime
// ---------------------------------------------------------------------------
//  Na seção monossimétrica (mesas diferentes) quase tudo da flexão em X depende
//  de QUAL mesa está comprimida: Wc e Wt, hc e hp (D.3), a seção T comprimida
//  (IyTc, ryTc, αy do D.2.8-b e -i) e, na viga de alma esbelta, o ryc, o ar e
//  a área da mesa comprimida (Anexo E). Este arquivo junta isso num objeto só,
//  para cada lado; nas mesas iguais os dois lados dão o mesmo.
//
//  ⚠️ CONVENÇÃO DO SINAL: Mx POSITIVO COMPRIME A MESA SUPERIOR. Com curvatura
//  reversa no trecho destravado (D.2.8-j) as duas mesas ficam comprimidas em
//  algum ponto, e a flexão confere os dois lados.
// ═══════════════════════════════════════════════════════════════════════════

import type { GeometriaDoSoldado } from './catalogos/soldados';

export type Mesa = 'superior' | 'inferior';

export interface LadoComprimido {
  qual: Mesa;
  /** Mesa comprimida e tracionada, cm. */
  bfc: number;
  tfc: number;
  bft: number;
  tft: number;
  Afc: number;
  /** Módulos elásticos do lado comprimido e do tracionado, cm³. */
  Wc: number;
  Wt: number;
  /** 2 × (centroide → face interna da mesa comprimida), cm (D.3). */
  hc: number;
  /** 2 × (linha neutra plástica → face interna da mesa comprimida), cm (D.3). */
  hp: number;
  /** Seção T: mesa comprimida + parte comprimida da alma (hc/2), em torno do plano da alma. */
  IyTc: number;
  ATc: number;
  ryTc: number;
  /** αy = IyTc/Iy (D.2.8-i). */
  alfaY: number;
  /** Anexo E: mesa comprimida + 1/3 da alma comprimida (hc/6). */
  ryc: number;
}

export function ladoComprimido(g: GeometriaDoSoldado, qual: Mesa): LadoComprimido {
  const sup = qual === 'superior';
  const bfc = sup ? g.bs : g.bi;
  const tfc = sup ? g.ts : g.ti;
  const bft = sup ? g.bi : g.bs;
  const tft = sup ? g.ti : g.ts;
  // Do centroide (e da linha neutra plástica) até a face interna da mesa
  // comprimida — a de cima está em d − ts, a de baixo em ti.
  const ateFace = (y: number) => (sup ? g.d - g.ts - y : y - g.ti);
  // ⚠️ PISO ZERO (achado da revisão de 04/11/2026): com o centroide ou a
  // linha neutra plástica DENTRO da mesa comprimida, a conta daria hc ou hp
  // negativos — a alma estaria toda tracionada. Zero é o que a definição do
  // D.3 quer dizer aí: não há alma comprimida. (Essas seções sempre furam a
  // regra de áreas do D.2.8-i, então o cartão já sai "avaliar".)
  const hc = Math.max(0, 2 * ateFace(g.yc));
  const hp = Math.max(0, 2 * ateFace(g.ypl));
  const Wc = g.Ix / (sup ? g.d - g.yc : g.yc);
  const Wt = g.Ix / (sup ? g.yc : g.d - g.yc);
  const Iflange = (tfc * bfc ** 3) / 12;
  const alma = (h: number) => ({ I: (h * g.tw ** 3) / 12, A: h * g.tw });
  const t = alma(hc / 2);
  const IyTc = Iflange + t.I;
  const ATc = bfc * tfc + t.A;
  const e = alma(hc / 6);
  return {
    qual,
    bfc,
    tfc,
    bft,
    tft,
    Afc: bfc * tfc,
    Wc,
    Wt,
    hc,
    hp,
    IyTc,
    ATc,
    ryTc: Math.sqrt(IyTc / ATc),
    alfaY: IyTc / g.Iy,
    ryc: Math.sqrt((Iflange + e.I) / (bfc * tfc + e.A)),
  };
}

/**
 * Os limites do D.2.8-i (e do E.5.3-a): 0,1 ≤ αy ≤ 0,9, e a mesa menor mais a
 * alma com mais área que a mesa maior. Devolve o que falhou, por extenso.
 */
export function foraDoD28i(g: GeometriaDoSoldado, lado: LadoComprimido): string[] {
  const fora: string[] = [];
  const virgula = (x: number) => x.toFixed(3).replace('.', ',');
  if (lado.alfaY < 0.1 || lado.alfaY > 0.9) fora.push(`αy = ${virgula(lado.alfaY)} fora de 0,1 ≤ αy ≤ 0,9 (D.2.8-i)`);
  const As = g.bs * g.ts;
  const Ai = g.bi * g.ti;
  const Aw = g.hw * g.tw;
  if (!(Math.min(As, Ai) + Aw > Math.max(As, Ai))) fora.push('a mesa menor mais a alma têm menos área que a mesa maior (D.2.8-i)');
  return fora;
}

/** O lado (ou os dois) que a verificação tem de olhar: pelo sinal, ou os dois na curvatura reversa. */
export function ladosAVerificar(Mx: number, reversa: boolean): Mesa[] {
  if (reversa) return ['superior', 'inferior'];
  return [Mx >= 0 ? 'superior' : 'inferior'];
}
