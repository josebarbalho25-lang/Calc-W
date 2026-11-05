// ═══════════════════════════════════════════════════════════════════════════
//  motor/compressao.ts — força axial de compressão resistente (NBR 8800:2024, 5.3)
// ---------------------------------------------------------------------------
//  Nc,Rd = χ · Aef · fy / γa1 (5.3.2), com a flambagem global pelo Ne da
//  família (`flambagemGlobal.ts`, 5.3.5) e a local pela ÁREA EFETIVA (5.3.4).
//
//  ⚠️ NÃO É O FATOR Q DA 2008. A edição de 2024 trocou o Q = Qs·Qa pela
//  largura efetiva de cada chapa, que depende do próprio χ: a chapa que
//  flamba localmente perde mais largura quanto mais a barra já está perto de
//  flambar inteira. Por isso λ0 sai com Ag (5.3.3.2) e o χ entra de volta na
//  largura efetiva — a ordem da conta importa.
//
//  As chapas de cada família, pela Tabela 4:
//    · I: 4 meias mesas (grupo 4, b = bf/2) e a alma (grupo 2, b = d');
//    · U: 2 mesas inteiras (grupo 4, b = bf — a figura da Tabela 4 e o
//      D.2.8-h) e a alma (grupo 2, b = d');
//    · cantoneira: as 2 abas (grupo 3, b = largura da aba);
//    · I SOLDADO: as meias mesas no grupo 5, com o kc da nota a da Tabela 4
//      — a alma fina do soldado solta a borda da mesa, e o kc desconta isso;
//      a alma segue no grupo 2, com h entre as faces internas das mesas.
// ═══════════════════════════════════════════════════════════════════════════

import {
  flambagemDaCantoneira,
  flambagemDaCantoneiraDeTrelica,
  flambagemDoI,
  flambagemDoU,
  type FlambagemGlobal,
} from './flambagemGlobal';
import { fr, n, par, pot, rz, situacaoPelaRazao, v, x, type Conta, type Expr, type Passo, type Verificacao } from './memoria';
import { E, GAMA_A1, type Secao } from './secao';
import type { Aco, Comprimentos, LigacaoPorUmaAba } from './tipos';

/** Grupo da Tabela 4: 2 alma de I/U, 3 aba de cantoneira simples, 4 mesa de laminado, 5 mesa de soldado. */
export type GrupoDaTabela4 = 2 | 3 | 4 | 5;

/** O kc da mesa de soldado (Tabela 4, nota a), com o que entrou na conta. */
export interface KcDaMesa {
  kc: number;
  /** 4/√(h/tw) antes do corte em 0,35 e 0,76. */
  kcCalculado: number;
  h: number;
  tw: number;
}

/** Uma chapa da seção na flambagem local (5.3.4.2). */
export interface ChapaComprimida {
  /** AL: uma borda livre; AA: duas apoiadas. */
  tipo: 'AL' | 'AA';
  grupo: GrupoDaTabela4;
  /** Como a memória chama: "Mesas", "Alma", "Aba maior"… */
  nome: string;
  /** Largura e espessura, cm. */
  b: number;
  t: number;
  /** Quantas chapas iguais a esta a seção tem (4 meias mesas, 1 alma). */
  quantas: number;
  bt: number;
  /** O coeficiente de (b/t)lim na Tabela 4 (0,56; 1,49; 0,45; 0,64). */
  kLim: number;
  /** Só no grupo 5: o kc que divide o fy dentro da raiz. */
  kc?: KcDaMesa;
  btLim: number;
  /** (b/t)lim / √χ — abaixo disto a chapa trabalha inteira. */
  btLimChi: number;
  c1: number;
  c2: number;
  sigmaEl: number;
  bef: number;
  /** Os símbolos de b, bef e t na fórmula da área efetiva. */
  simbolos: { b: Expr; bef: Expr; t: Expr };
}

export interface ResultadoCompressao {
  NcSd: number;
  /** A flambagem global inteira (Ne de cada modo, passos). */
  global: FlambagemGlobal;
  Nex: number;
  Ney: number;
  Nez: number;
  r0q: number;
  Ne: number;
  /** O modo que dá o menor Ne, por extenso. */
  modo: string;
  lambda0: number;
  chi: number;
  chapas: ChapaComprimida[];
  /** Só no I e no U: as mesas e a alma (atalho para as chapas). */
  mesa?: ChapaComprimida;
  alma?: ChapaComprimida;
  Aef: number;
  NcRd: number;
  /** A maior relação L/r da flexão (5.3.7). */
  esbeltez: number;
  verificacao: Verificacao;
}

/** Limite recomendado do índice de esbeltez de barra comprimida (5.3.7.1). */
export const ESBELTEZ_RECOMENDADA = 200;

/** Fator de redução χ (5.3.3.1). */
export function fatorChi(lambda0: number): number {
  return lambda0 <= 1.5 ? 0.658 ** (lambda0 ** 2) : 0.877 / lambda0 ** 2;
}

const K_LIM: Record<GrupoDaTabela4, number> = { 2: 1.49, 3: 0.45, 4: 0.56, 5: 0.64 };

export function chapa(
  grupo: GrupoDaTabela4,
  nome: string,
  b: number,
  t: number,
  quantas: number,
  fy: number,
  chi: number,
  simbolos: ChapaComprimida['simbolos'],
  kc?: KcDaMesa,
): ChapaComprimida {
  const tipo = grupo === 2 ? 'AA' : 'AL';
  // Tabela 4: (b/t)lim do grupo — no grupo 5, 0,64·√(E/(fy/kc)). Tabela 5:
  // c1 e c2 de AA (fora tubo) e AL; a mesa de soldado é AL como a laminada.
  const kLim = K_LIM[grupo];
  if (grupo === 5 && !kc) throw new Error('mesa de soldado (grupo 5) sem o kc');
  const btLim = kLim * Math.sqrt(E / (grupo === 5 ? fy / kc!.kc : fy));
  const c1 = tipo === 'AL' ? 0.22 : 0.18;
  const c2 = tipo === 'AL' ? 1.49 : 1.31;
  const bt = b / t;
  const btLimChi = btLim / Math.sqrt(chi);
  const sigmaEl = ((c2 * btLim) / bt) ** 2 * fy;
  const k = Math.sqrt(sigmaEl / (chi * fy));
  // ⚠️ bef NUNCA PASSA DE b. Logo acima do limite (b/t)lim/√χ, as constantes
  // arredondadas da Tabela 5 dão (1 − c1·k)·k = 1,0016 na mesa e 1,0011 na
  // alma: a fórmula, ao pé da letra, devolve a chapa 0,16 % MAIOR do que ela
  // é, e a área efetiva passa da bruta (achado da revisão de 01/11/2026, no
  // HP 310 x 79,0 com L = 210 cm). Largura efetiva maior que a largura não
  // existe; o teto só tira esse degrau para cima na emenda dos dois trechos.
  const bef = bt <= btLimChi ? b : Math.min(b, b * (1 - c1 * k) * k);
  return { tipo, grupo, nome, b, t, quantas, bt, kLim, ...(kc ? { kc } : {}), btLim, btLimChi, c1, c2, sigmaEl, bef, simbolos };
}

/** As chapas comprimidas de cada família (Tabela 4). */
function chapasDaSecao(s: Secao, fy: number, chi: number): ChapaComprimida[] {
  if (s.familia === 'L') {
    if (s.iguais) return [chapa(3, 'Abas', s.b, s.t, 2, fy, chi, { b: v('b'), bef: v('b', 'ef'), t: v('t') })];
    return [
      chapa(3, 'Aba maior', s.b, s.t, 1, fy, chi, { b: v('b', 'maior'), bef: v('b', 'ef,maior'), t: v('t') }),
      chapa(3, 'Aba menor', s.bmenor, s.t, 1, fy, chi, { b: v('b', 'menor'), bef: v('b', 'ef,menor'), t: v('t') }),
    ];
  }
  const mesa =
    s.familia === 'U'
      ? chapa(4, 'Mesas', s.bf, s.tf, 2, fy, chi, { b: v('b', 'f'), bef: v('b', 'ef,m'), t: v('t', 'f') })
      : s.soldado
        ? chapa(5, 'Mesas', s.bf / 2, s.tf, 4, fy, chi, { b: v('b', 'm'), bef: v('b', 'ef,m'), t: v('t', 'f') }, { ...s.soldado, h: s.h, tw: s.tw })
        : chapa(4, 'Mesas', s.bf / 2, s.tf, 4, fy, chi, { b: v('b', 'm'), bef: v('b', 'ef,m'), t: v('t', 'f') });
  const alma = chapa(2, 'Alma', s.h, s.tw, 1, fy, chi, { b: v('h'), bef: v('b', 'ef,a'), t: v('t', 'w') });
  // Mesas diferentes: cada mesa é uma chapa, com as suas duas metades.
  if (s.familia === 'I' && s.monossimetrico && s.geo && s.soldado) {
    const g = s.geo;
    const kc = { ...s.soldado, h: s.h, tw: s.tw };
    return [
      chapa(5, 'Mesa superior', g.bs / 2, g.ts, 2, fy, chi, { b: v('b', 'ms'), bef: v('b', 'ef,ms'), t: v('t', 'fs') }, kc),
      chapa(5, 'Mesa inferior', g.bi / 2, g.ti, 2, fy, chi, { b: v('b', 'mi'), bef: v('b', 'ef,mi'), t: v('t', 'fi') }, kc),
      alma,
    ];
  }
  return [mesa, alma];
}

/** kc = 4/√(h/tw), entre 0,35 e 0,76 (Tabela 4, nota a) — a conta, com o limite que pegou. */
export function contaKc(k: KcDaMesa): Conta {
  const rotulo = k.kcCalculado > 0.76 ? 'acima de 0,76 → kc = 0,76' : k.kcCalculado < 0.35 ? 'abaixo de 0,35 → kc = 0,35' : '0,35 ≤ kc ≤ 0,76';
  return {
    simbolo: v('k', 'c'),
    formula: fr('4', rz(fr(v('h'), v('t', 'w')))),
    numeros: fr('4', rz(fr(n(k.h), n(k.tw)))),
    valor: k.kc,
    casas: 3,
    rotulo,
  };
}

function passosDaChapa(c: ChapaComprimida, chi: number, fy: number): Passo {
  const contas: Conta[] = [
    { simbolo: x(v('b'), '/', v('t')), numeros: fr(n(c.b), n(c.t)), valor: c.bt, casas: 2 },
    ...(c.kc ? [contaKc(c.kc)] : []),
    c.kc
      ? {
          simbolo: x(par(x(v('b'), '/', v('t'))), v('', 'lim')),
          formula: x(n(c.kLim, 2), ' ', rz(fr(v('E'), par(x(v('f', 'y'), '/', v('k', 'c')))))),
          numeros: x(n(c.kLim, 2), ' ', rz(fr(n(E), par(x(n(fy), '/', n(c.kc.kc, 3)))))),
          valor: c.btLim,
          casas: 2,
        }
      : {
          simbolo: x(par(x(v('b'), '/', v('t'))), v('', 'lim')),
          formula: x(n(c.kLim, 2), ' ', rz(fr(v('E'), v('f', 'y')))),
          numeros: x(n(c.kLim, 2), ' ', rz(fr(n(E), n(fy)))),
          valor: c.btLim,
          casas: 2,
        },
    {
      simbolo: fr(x(par(x(v('b'), '/', v('t'))), v('', 'lim')), rz(v('χ'))),
      numeros: fr(n(c.btLim), rz(n(chi, 4))),
      valor: c.btLimChi,
      casas: 2,
      rotulo: c.bt <= c.btLimChi ? 'b/t ≤ (b/t)lim/√χ → bef = b' : 'b/t > (b/t)lim/√χ → largura efetiva',
    },
  ];
  if (c.bt > c.btLimChi) {
    const k = Math.sqrt(c.sigmaEl / (chi * fy));
    contas.push(
      {
        simbolo: v('σ', 'el'),
        formula: x(pot(par(x(v('c', '2'), ' ', fr(x(par(x(v('b'), '/', v('t'))), v('', 'lim')), x(v('b'), '/', v('t'))))), 2), ' ', v('f', 'y')),
        numeros: x(pot(par(x(n(c.c2, 2), ' · ', fr(n(c.btLim), n(c.bt)))), 2), ' · ', n(fy)),
        valor: c.sigmaEl,
        unidade: 'kN/cm²',
      },
      {
        simbolo: v('b', 'ef'),
        formula: x(v('b'), ' ', par(x('1 − ', v('c', '1'), ' ', rz(fr(v('σ', 'el'), x(v('χ'), ' ', v('f', 'y')))))), ' ', rz(fr(v('σ', 'el'), x(v('χ'), ' ', v('f', 'y'))))),
        numeros: x(n(c.b), ' · ', par(x('1 − ', n(c.c1, 2), ' · ', n(k, 4))), ' · ', n(k, 4)),
        valor: c.bef,
        casas: 3,
        unidade: 'cm',
      },
    );
  } else {
    contas.push({ simbolo: v('b', 'ef'), formula: v('b'), valor: c.bef, casas: 3, unidade: 'cm' });
  }
  const papel = c.grupo === 2 ? 'alma de I ou U' : c.grupo === 3 ? 'aba de cantoneira simples' : c.grupo === 5 ? 'mesa de soldado' : 'mesa de laminado';
  return {
    ref: '5.3.4.2; Tabelas 4 e 5',
    titulo: `${c.nome} — elemento ${c.tipo}, grupo ${c.grupo} (${papel}), c₁ = ${String(c.c1).replace('.', ',')}, c₂ = ${String(c.c2).replace('.', ',')}`,
    contas,
  };
}

function flambagemGlobal(s: Secao, L: Comprimentos, fy: number, ligacao?: LigacaoPorUmaAba): FlambagemGlobal {
  if (s.familia === 'U') return flambagemDoU(s, L);
  if (s.familia === 'L') return ligacao ? flambagemDaCantoneiraDeTrelica(s, L, ligacao, fy) : flambagemDaCantoneira(s, L);
  return flambagemDoI(s, L);
}

export function verificarCompressao(s: Secao, aco: Aco, L: Comprimentos, NcSd: number, ligacao?: LigacaoPorUmaAba): ResultadoCompressao {
  const fy = aco.fy;
  const g = flambagemGlobal(s, L, fy, s.familia === 'L' ? ligacao : undefined);
  const Ne = g.Ne;
  const lambda0 = Number.isFinite(Ne) ? Math.sqrt((s.A * fy) / Ne) : 0;
  const chi = fatorChi(lambda0);

  const chapas = chapasDaSecao(s, fy, chi);
  const Aef = chapas.reduce((A, c) => A - c.quantas * (c.b - c.bef) * c.t, s.A);
  const NcRd = (chi * Aef * fy) / GAMA_A1;

  const esbeltez = g.esbeltez;
  const avisos = [
    ...(NcSd > 0 ? g.avisos : []),
    ...(NcSd > 0 && esbeltez > ESBELTEZ_RECOMENDADA ? [`Esbeltez ${esbeltez.toFixed(0)} acima de ${ESBELTEZ_RECOMENDADA} (5.3.7.1).`] : []),
  ];
  const razao = NcSd / NcRd;

  // A área efetiva por extenso: Ag − Σ n·(b − bef)·t, chapa a chapa.
  const termos = chapas.flatMap((c) => [' − ', c.quantas > 1 ? `${c.quantas} ` : '', par(x(c.simbolos.b, ' − ', c.simbolos.bef)), ' ', c.simbolos.t]);
  const termosN = chapas.flatMap((c) => [' − ', c.quantas > 1 ? `${c.quantas} · ` : '', par(x(n(c.b), ' − ', n(c.bef, 3))), ' · ', n(c.t)]);

  const passos: Passo[] = [
    ...g.passos,
    {
      ref: '5.3.3',
      titulo: 'Fator de redução χ',
      contas: [
        {
          simbolo: v('λ', '0'),
          formula: rz(fr(x(v('A', 'g'), ' ', v('f', 'y')), v('N', 'e'))),
          numeros: rz(fr(x(n(s.A), ' · ', n(fy)), Number.isFinite(Ne) ? n(Ne) : '∞')),
          valor: lambda0,
          casas: 3,
        },
        lambda0 <= 1.5
          ? { simbolo: v('χ'), formula: pot(n(0.658, 3), pot(v('λ', '0'), 2)), numeros: pot(n(0.658, 3), pot(n(lambda0, 3), 2)), valor: chi, casas: 3, rotulo: 'λ₀ ≤ 1,5' }
          : { simbolo: v('χ'), formula: fr(n(0.877, 3), pot(v('λ', '0'), 2)), numeros: fr(n(0.877, 3), pot(n(lambda0, 3), 2)), valor: chi, casas: 3, rotulo: 'λ₀ > 1,5' },
      ],
    },
    ...chapas.map((c) => passosDaChapa(c, chi, fy)),
    {
      ref: '5.3.4.1',
      titulo: 'Área efetiva',
      contas: [{ simbolo: v('A', 'ef'), formula: x(v('A', 'g'), ...termos), numeros: x(n(s.A), ...termosN), valor: Aef, unidade: 'cm²' }],
    },
    {
      ref: '5.3.2',
      titulo: 'Força axial de compressão resistente de cálculo',
      contas: [
        {
          simbolo: v('N', 'c,Rd'),
          formula: fr(x(v('χ'), ' ', v('A', 'ef'), ' ', v('f', 'y')), v('γ', 'a1')),
          numeros: fr(x(n(chi, 3), ' · ', n(Aef), ' · ', n(fy)), n(GAMA_A1, 2)),
          valor: NcRd,
          unidade: 'kN',
        },
        { ...g.contaEsbeltez, rotulo: esbeltez <= ESBELTEZ_RECOMENDADA ? '≤ 200 (5.3.7.1)' : '> 200 (5.3.7.1)' },
        { simbolo: fr(v('N', 'c,Sd'), v('N', 'c,Rd')), numeros: fr(n(NcSd), n(NcRd)), valor: razao, casas: 3, rotulo: razao <= 1 ? '≤ 1,0' : '> 1,0' },
      ],
    },
  ];

  return {
    NcSd,
    global: g,
    Nex: g.Nex,
    Ney: g.Ney,
    Nez: g.Nez,
    r0q: g.r0q,
    Ne,
    modo: g.modo,
    lambda0,
    chi,
    chapas,
    mesa: s.familia === 'L' ? undefined : chapas[0],
    alma: s.familia === 'L' ? undefined : chapas[chapas.length - 1],
    Aef,
    NcRd,
    esbeltez,
    verificacao: {
      chave: 'compressao',
      titulo: 'Compressão',
      item: '5.3',
      sd: NcSd,
      rd: NcRd,
      unidade: 'kN',
      razao,
      situacao: situacaoPelaRazao(razao, avisos),
      governa: Number.isFinite(Ne) ? g.modo : 'escoamento',
      passos,
      avisos,
    },
  };
}
