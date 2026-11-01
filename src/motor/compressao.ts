// ═══════════════════════════════════════════════════════════════════════════
//  motor/compressao.ts — força axial de compressão resistente (NBR 8800:2024, 5.3)
// ---------------------------------------------------------------------------
//  Nc,Rd = χ · Aef · fy / γa1 (5.3.2), com a flambagem global pelo menor de
//  Nex, Ney e Nez (5.3.5.1) e a local pela ÁREA EFETIVA (5.3.4).
//
//  ⚠️ NÃO É O FATOR Q DA 2008. A edição de 2024 trocou o Q = Qs·Qa pela
//  largura efetiva de cada chapa, que depende do próprio χ: a chapa que
//  flamba localmente perde mais largura quanto mais a barra já está perto de
//  flambar inteira. Por isso λ0 sai com Ag (5.3.3.2) e o χ entra de volta na
//  largura efetiva — a ordem da conta importa.
// ═══════════════════════════════════════════════════════════════════════════

import { fr, n, par, pot, rz, situacaoPelaRazao, v, x, type Conta, type Passo, type Verificacao } from './memoria';
import { E, G, GAMA_A1, type SecaoI } from './secao';
import type { Aco, Comprimentos } from './tipos';

/** Uma chapa da seção na flambagem local (5.3.4.2). */
export interface ChapaComprimida {
  /** AL: uma borda livre (a meia mesa); AA: duas apoiadas (a alma). */
  tipo: 'AL' | 'AA';
  /** Largura e espessura, cm. */
  b: number;
  t: number;
  /** Quantas chapas iguais a esta a seção tem (4 meias mesas, 1 alma). */
  quantas: number;
  bt: number;
  btLim: number;
  /** (b/t)lim / √χ — abaixo disto a chapa trabalha inteira. */
  btLimChi: number;
  c1: number;
  c2: number;
  sigmaEl: number;
  bef: number;
}

export interface ResultadoCompressao {
  NcSd: number;
  Nex: number;
  Ney: number;
  Nez: number;
  r0q: number;
  Ne: number;
  /** Qual modo dá o menor Ne. */
  modo: 'x' | 'y' | 'z';
  lambda0: number;
  chi: number;
  mesa: ChapaComprimida;
  alma: ChapaComprimida;
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

/** π²·E·I/L², infinito quando a barra está travada (L = 0). */
function euler(I: number, L: number): number {
  return L > 0 ? (Math.PI ** 2 * E * I) / L ** 2 : Infinity;
}

function chapa(tipo: 'AL' | 'AA', b: number, t: number, quantas: number, fy: number, chi: number): ChapaComprimida {
  // Tabela 4: grupo 4 (mesa de I laminado) para AL, grupo 2 (alma de I) para
  // AA. Tabela 5: c1 e c2.
  const btLim = (tipo === 'AL' ? 0.56 : 1.49) * Math.sqrt(E / fy);
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
  return { tipo, b, t, quantas, bt, btLim, btLimChi, c1, c2, sigmaEl, bef };
}

/** A conta da flambagem por flexão, escrita (ou "travada" quando L = 0). */
function contaEuler(eixo: 'x' | 'y', I: number, L: number, N: number): Conta {
  const simbolo = v('N', `e${eixo}`);
  if (!(L > 0)) return { simbolo, valor: Infinity, texto: `travada (L${eixo} = 0)` };
  return {
    simbolo,
    formula: fr(x('π² ', v('E'), ' ', v('I', eixo)), pot(v('L', eixo), 2)),
    numeros: fr(x('π² · ', n(E), ' · ', n(I)), pot(n(L), 2)),
    valor: N,
    unidade: 'kN',
  };
}

function passosDaChapa(c: ChapaComprimida, chi: number, fy: number, nome: string): Passo {
  const sufixo = c.tipo === 'AL' ? 'mesa' : 'alma';
  const contas: Conta[] = [
    {
      simbolo: x(v('b'), '/', v('t')),
      numeros: fr(n(c.b), n(c.t)),
      valor: c.bt,
      casas: 2,
    },
    {
      simbolo: x(par(x(v('b'), '/', v('t'))), v('', 'lim')),
      formula: x(n(c.tipo === 'AL' ? 0.56 : 1.49, 2), ' ', rz(fr(v('E'), v('f', 'y')))),
      numeros: x(n(c.tipo === 'AL' ? 0.56 : 1.49, 2), ' ', rz(fr(n(E), n(fy)))),
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
  return {
    ref: '5.3.4.2; Tabelas 4 e 5',
    titulo: `${nome} — elemento ${c.tipo} (${sufixo}), c₁ = ${String(c.c1).replace('.', ',')}, c₂ = ${String(c.c2).replace('.', ',')}`,
    contas,
  };
}

export function verificarCompressao(s: SecaoI, aco: Aco, L: Comprimentos, NcSd: number): ResultadoCompressao {
  const fy = aco.fy;
  const Nex = euler(s.Ix, L.Lx);
  const Ney = euler(s.Iy, L.Ly);
  // Seção duplamente simétrica: o centro de cisalhamento é o centroide (x0 = y0 = 0).
  const r0q = s.rx ** 2 + s.ry ** 2;
  const Nez = L.Lt > 0 ? ((Math.PI ** 2 * E * s.Cw) / L.Lt ** 2 + G * s.J) / r0q : Infinity;
  const Ne = Math.min(Nex, Ney, Nez);
  const modo = Ne === Nex ? 'x' : Ne === Ney ? 'y' : 'z';
  const lambda0 = Number.isFinite(Ne) ? Math.sqrt((s.A * fy) / Ne) : 0;
  const chi = fatorChi(lambda0);

  const mesa = chapa('AL', s.bf / 2, s.tf, 4, fy, chi);
  const alma = chapa('AA', s.h, s.tw, 1, fy, chi);
  const Aef = s.A - mesa.quantas * (mesa.b - mesa.bef) * mesa.t - alma.quantas * (alma.b - alma.bef) * alma.t;
  const NcRd = (chi * Aef * fy) / GAMA_A1;

  const esbeltez = Math.max(L.Lx > 0 ? L.Lx / s.rx : 0, L.Ly > 0 ? L.Ly / s.ry : 0);
  const avisos =
    NcSd > 0 && esbeltez > ESBELTEZ_RECOMENDADA
      ? [`Esbeltez ${esbeltez.toFixed(0)} acima de ${ESBELTEZ_RECOMENDADA} (5.3.7.1).`]
      : [];
  const razao = NcSd / NcRd;

  const passos: Passo[] = [
    {
      ref: '5.3.5.1',
      titulo: 'Força axial de flambagem elástica',
      contas: [
        contaEuler('x', s.Ix, L.Lx, Nex),
        contaEuler('y', s.Iy, L.Ly, Ney),
        {
          simbolo: pot(v('r', '0'), 2),
          formula: x(pot(v('r', 'x'), 2), ' + ', pot(v('r', 'y'), 2)),
          numeros: x(pot(n(s.rx), 2), ' + ', pot(n(s.ry), 2)),
          valor: r0q,
          unidade: 'cm²',
        },
        L.Lt > 0
          ? {
              simbolo: v('N', 'ez'),
              formula: x(fr(1, pot(v('r', '0'), 2)), ' ', par(x(fr(x('π² ', v('E'), ' ', v('C', 'w')), pot(v('L', 'z'), 2)), ' + ', v('G'), ' ', v('J')))),
              numeros: x(fr(1, n(r0q)), ' · ', par(x(fr(x('π² · ', n(E), ' · ', n(s.Cw)), pot(n(L.Lt), 2)), ' + ', n(G), ' · ', n(s.J)))),
              valor: Nez,
              unidade: 'kN',
            }
          : { simbolo: v('N', 'ez'), valor: Infinity, texto: 'travada (Lt = 0)' },
        {
          simbolo: v('N', 'e'),
          formula: x('mín(', v('N', 'ex'), '; ', v('N', 'ey'), '; ', v('N', 'ez'), ')'),
          valor: Ne,
          unidade: 'kN',
          rotulo: Number.isFinite(Ne) ? `flambagem ${modo === 'z' ? 'por torção' : `por flexão em ${modo}`}` : undefined,
        },
      ],
    },
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
          ? {
              simbolo: v('χ'),
              formula: pot(n(0.658, 3), pot(v('λ', '0'), 2)),
              numeros: pot(n(0.658, 3), pot(n(lambda0, 3), 2)),
              valor: chi,
              casas: 3,
              rotulo: 'λ₀ ≤ 1,5',
            }
          : {
              simbolo: v('χ'),
              formula: fr(n(0.877, 3), pot(v('λ', '0'), 2)),
              numeros: fr(n(0.877, 3), pot(n(lambda0, 3), 2)),
              valor: chi,
              casas: 3,
              rotulo: 'λ₀ > 1,5',
            },
      ],
    },
    passosDaChapa(mesa, chi, fy, 'Mesas'),
    passosDaChapa(alma, chi, fy, 'Alma'),
    {
      ref: '5.3.4.1',
      titulo: 'Área efetiva',
      contas: [
        {
          simbolo: v('A', 'ef'),
          formula: x(v('A', 'g'), ' − 4 ', par(x(v('b', 'm'), ' − ', v('b', 'ef,m'))), ' ', v('t', 'f'), ' − ', par(x(v('h'), ' − ', v('b', 'ef,a'))), ' ', v('t', 'w')),
          numeros: x(n(s.A), ' − 4 · ', par(x(n(mesa.b), ' − ', n(mesa.bef, 3))), ' · ', n(s.tf), ' − ', par(x(n(alma.b), ' − ', n(alma.bef, 3))), ' · ', n(s.tw)),
          valor: Aef,
          unidade: 'cm²',
        },
      ],
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
        {
          simbolo: v('λ', 'máx'),
          formula: x('máx(', fr(v('L', 'x'), v('r', 'x')), '; ', fr(v('L', 'y'), v('r', 'y')), ')'),
          numeros: x('máx(', fr(n(L.Lx), n(s.rx)), '; ', fr(n(L.Ly), n(s.ry)), ')'),
          valor: esbeltez,
          casas: 0,
          rotulo: esbeltez <= ESBELTEZ_RECOMENDADA ? '≤ 200 (5.3.7.1)' : '> 200 (5.3.7.1)',
        },
        {
          simbolo: fr(v('N', 'c,Sd'), v('N', 'c,Rd')),
          numeros: fr(n(NcSd), n(NcRd)),
          valor: razao,
          casas: 3,
          rotulo: razao <= 1 ? '≤ 1,0' : '> 1,0',
        },
      ],
    },
  ];

  return {
    NcSd,
    Nex,
    Ney,
    Nez,
    r0q,
    Ne,
    modo,
    lambda0,
    chi,
    mesa,
    alma,
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
      governa: Number.isFinite(Ne) ? (modo === 'z' ? 'flambagem por torção' : `flambagem por flexão em ${modo}`) : 'escoamento',
      passos,
      avisos,
    },
  };
}
