// ═══════════════════════════════════════════════════════════════════════════
//  motor/flt.ts — flambagem lateral com torção (NBR 8800:2024, D.2.1 e D.2.8-a)
// ---------------------------------------------------------------------------
//  A norma de 2024 dá DOIS caminhos no D.2.1, os dois válidos:
//
//   · o clássico — λ = Lb/ry entre λp e λr, interpolando de Mpl a Mr;
//   · o alternativo — χFLT pela esbeltez λLT = √(Mpl/Mcr), o da planilha.
//
//  Decisão dele (01/11/2026): calcula os dois, a memória mostra os dois, VALE
//  O MAIOR. No trecho inelástico o clássico chega a dar ~9 % a mais. Os dois
//  só coincidem quando AMBOS estão no elástico (λ > λr e λLT > 1,4, os dois
//  dão Mcr); entre um limite e outro — o clássico já em Mcr, o alternativo
//  ainda na reta — eles diferem, e vale de novo o maior.
//
//  ⚠️ O Cb MUDOU DE LUGAR NA 2024. Na 2008 ele multiplicava o trecho
//  inelástico (Cb·[...] ≤ Mpl); agora entra só no λr e no Mcr. Copiar a
//  fórmula da 2008 com o λr novo contaria o Cb duas vezes.
// ═══════════════════════════════════════════════════════════════════════════

import { fr, n, par, pot, rz, v, x, type Conta, type Passo } from './memoria';
import { E, type SecaoI } from './secao';

export interface ResultadoFlt {
  Lb: number;
  Cb: number;
  /** Momento crítico elástico, kN·cm (o mesmo nos dois caminhos). */
  Mcr: number;
  classico: { lambda: number; lambdaP: number; beta1: number; lambdaR: number; Mr: number; Mrk: number; ramo: string };
  alternativo: { lambdaLT: number; chiFLT: number; Mrk: number; ramo: string };
  /** O maior dos dois, kN·cm (ainda sem γa1). */
  Mrk: number;
  adotado: 'clássico' | 'alternativo';
  passos: Passo[];
  /** O índice do raio do λ = Lb/r: 'y' (I e U), 'yTc' (mesas diferentes), 'yc' (Anexo E). */
  indiceDoRaio?: string;
}

export function flambagemLateralComTorcao(
  s: Pick<SecaoI, 'Wx' | 'J' | 'Iy' | 'ry' | 'Cw'>,
  fy: number,
  Lb: number,
  Cb: number,
  Mpl: number,
): ResultadoFlt {
  const sigmaR = 0.3 * fy;
  const Mr = (fy - sigmaR) * s.Wx;
  const beta1 = ((fy - sigmaR) * s.Wx) / (E * s.J);
  const lambdaP = 1.76 * Math.sqrt(E / fy);
  const lambdaR =
    ((1.38 * Cb * Math.sqrt(s.Iy * s.J)) / (s.ry * s.J * beta1)) *
    Math.sqrt(1 + Math.sqrt(1 + (27 * s.Cw * beta1 ** 2) / (Cb ** 2 * s.Iy)));

  // Travada continuamente: não há comprimento para flambar.
  if (!(Lb > 0)) {
    return {
      Lb,
      Cb,
      Mcr: Infinity,
      classico: { lambda: 0, lambdaP, beta1, lambdaR, Mr, Mrk: Mpl, ramo: 'travada' },
      alternativo: { lambdaLT: 0, chiFLT: 1, Mrk: Mpl, ramo: 'travada' },
      Mrk: Mpl,
      adotado: 'clássico',
      passos: [
        {
          ref: 'D.2.1',
          titulo: 'Flambagem lateral com torção (FLT)',
          contas: [{ simbolo: v('M', 'Rk,FLT'), texto: 'mesa comprimida travada continuamente (Lb = 0)', valor: Mpl, unidade: 'kN·cm' }],
        },
      ],
    };
  }

  const Mcr = ((Cb * Math.PI ** 2 * E * s.Iy) / Lb ** 2) * Math.sqrt((s.Cw / s.Iy) * (1 + (0.039 * s.J * Lb ** 2) / s.Cw));

  // ── o clássico ──
  const lambda = Lb / s.ry;
  let MrkC: number;
  let ramoC: string;
  if (lambda <= lambdaP) {
    MrkC = Mpl;
    ramoC = 'λ ≤ λp';
  } else if (lambda <= lambdaR) {
    MrkC = Mpl - ((Mpl - Mr) * (lambda - lambdaP)) / (lambdaR - lambdaP);
    ramoC = 'λp < λ ≤ λr';
  } else {
    MrkC = Mcr;
    ramoC = 'λ > λr';
  }

  // ── o alternativo ──
  const lambdaLT = Math.sqrt(Mpl / Mcr);
  let chiFLT: number;
  let ramoA: string;
  if (lambdaLT <= 0.4) {
    chiFLT = 1;
    ramoA = 'λLT ≤ 0,4';
  } else if (lambdaLT <= 1.4) {
    chiFLT = 1 - 0.49 * (lambdaLT - 0.4);
    ramoA = '0,4 < λLT ≤ 1,4';
  } else {
    chiFLT = 1 / lambdaLT ** 2;
    ramoA = 'λLT > 1,4';
  }
  const MrkA = chiFLT * Mpl;

  const adotado = MrkC >= MrkA ? 'clássico' : 'alternativo';
  const Mrk = Math.max(MrkC, MrkA);

  const contaMcr: Conta = {
    simbolo: v('M', 'cr'),
    formula: x(fr(x(v('C', 'b'), ' π² ', v('E'), ' ', v('I', 'y')), pot(v('L', 'b'), 2)), ' ', rz(x(fr(v('C', 'w'), v('I', 'y')), ' ', par(x('1 + 0,039 ', fr(x(v('J'), ' ', pot(v('L', 'b'), 2)), v('C', 'w'))))))),
    numeros: x(fr(x(n(Cb), ' · π² · ', n(E), ' · ', n(s.Iy)), pot(n(Lb), 2)), ' ', rz(x(fr(n(s.Cw), n(s.Iy)), ' · ', par(x('1 + 0,039 · ', fr(x(n(s.J), ' · ', pot(n(Lb), 2)), n(s.Cw))))))),
    valor: Mcr,
    unidade: 'kN·cm',
  };

  const ramoClassico: Conta =
    lambda <= lambdaP
      ? { simbolo: v('M', 'Rk'), formula: v('M', 'pl'), valor: MrkC, unidade: 'kN·cm', rotulo: ramoC }
      : lambda <= lambdaR
        ? {
            simbolo: v('M', 'Rk'),
            formula: x(v('M', 'pl'), ' − ', par(x(v('M', 'pl'), ' − ', v('M', 'r'))), ' ', fr(x(v('λ'), ' − ', v('λ', 'p')), x(v('λ', 'r'), ' − ', v('λ', 'p')))),
            numeros: x(n(Mpl), ' − ', par(x(n(Mpl), ' − ', n(Mr))), ' · ', fr(x(n(lambda, 2), ' − ', n(lambdaP, 2)), x(n(lambdaR, 2), ' − ', n(lambdaP, 2)))),
            valor: MrkC,
            unidade: 'kN·cm',
            rotulo: ramoC,
          }
        : { simbolo: v('M', 'Rk'), formula: v('M', 'cr'), valor: MrkC, unidade: 'kN·cm', rotulo: ramoC };

  const ramoAlternativo: Conta =
    lambdaLT <= 0.4
      ? { simbolo: v('χ', 'FLT'), valor: chiFLT, casas: 3, rotulo: ramoA }
      : lambdaLT <= 1.4
        ? { simbolo: v('χ', 'FLT'), formula: x('1,0 − 0,49 ', par(x(v('λ', 'LT'), ' − 0,4'))), numeros: x('1,0 − 0,49 · ', par(x(n(lambdaLT, 3), ' − 0,4'))), valor: chiFLT, casas: 3, rotulo: ramoA }
        : { simbolo: v('χ', 'FLT'), formula: fr('1,0', pot(v('λ', 'LT'), 2)), numeros: fr('1,0', pot(n(lambdaLT, 3), 2)), valor: chiFLT, casas: 3, rotulo: ramoA };

  const passos: Passo[] = [
    {
      ref: 'D.2.8-a',
      titulo: 'FLT — momento crítico elástico',
      contas: [contaMcr],
    },
    {
      ref: 'D.2.1; Tabela D.1; D.2.8-a',
      titulo: 'FLT — caminho clássico',
      contas: [
        { simbolo: v('λ'), formula: fr(v('L', 'b'), v('r', 'y')), numeros: fr(n(Lb), n(s.ry)), valor: lambda, casas: 2 },
        { simbolo: v('λ', 'p'), formula: x('1,76 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('1,76 · ', rz(fr(n(E), n(fy)))), valor: lambdaP, casas: 2 },
        {
          simbolo: v('β', '1'),
          formula: fr(x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'x')), x(v('E'), ' ', v('J'))),
          numeros: fr(x(par(x(n(fy), ' − ', n(sigmaR))), ' · ', n(s.Wx)), x(n(E), ' · ', n(s.J))),
          valor: beta1,
          casas: 5,
          unidade: 'cm⁻¹',
        },
        {
          simbolo: v('λ', 'r'),
          formula: x(fr(x('1,38 ', v('C', 'b'), ' ', rz(x(v('I', 'y'), ' ', v('J')))), x(v('r', 'y'), ' ', v('J'), ' ', v('β', '1'))), ' ', rz(x('1 + ', rz(x('1 + ', fr(x('27 ', v('C', 'w'), ' ', pot(v('β', '1'), 2)), x(pot(v('C', 'b'), 2), ' ', v('I', 'y')))))))),
          numeros: x(fr(x('1,38 · ', n(Cb), ' · ', rz(x(n(s.Iy), ' · ', n(s.J)))), x(n(s.ry), ' · ', n(s.J), ' · ', n(beta1, 5))), ' · ', rz(x('1 + ', rz(x('1 + ', fr(x('27 · ', n(s.Cw), ' · ', pot(n(beta1, 5), 2)), x(pot(n(Cb), 2), ' · ', n(s.Iy)))))))),
          valor: lambdaR,
          casas: 2,
        },
        {
          simbolo: v('M', 'r'),
          formula: x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'x')),
          numeros: x(par(x(n(fy), ' − ', n(sigmaR))), ' · ', n(s.Wx)),
          valor: Mr,
          unidade: 'kN·cm',
        },
        ramoClassico,
      ],
    },
    {
      ref: 'D.2.1',
      titulo: 'FLT — caminho alternativo (χFLT)',
      contas: [
        { simbolo: v('λ', 'LT'), formula: rz(fr(v('M', 'pl'), v('M', 'cr'))), numeros: rz(fr(n(Mpl), n(Mcr))), valor: lambdaLT, casas: 3 },
        ramoAlternativo,
        { simbolo: v('M', 'Rk'), formula: x(v('χ', 'FLT'), ' ', v('M', 'pl')), numeros: x(n(chiFLT, 3), ' · ', n(Mpl)), valor: MrkA, unidade: 'kN·cm' },
      ],
    },
    {
      ref: 'D.2.1',
      titulo: 'FLT — valor adotado',
      contas: [
        {
          simbolo: v('M', 'Rk,FLT'),
          formula: x('máx(clássico; alternativo)'),
          numeros: x('máx(', n(MrkC), '; ', n(MrkA), ')'),
          valor: Mrk,
          unidade: 'kN·cm',
          rotulo: `caminho ${adotado}`,
        },
      ],
    },
  ];

  return {
    Lb,
    Cb,
    Mcr,
    classico: { lambda, lambdaP, beta1, lambdaR, Mr, Mrk: MrkC, ramo: ramoC },
    alternativo: { lambdaLT, chiFLT, Mrk: MrkA, ramo: ramoA },
    Mrk,
    adotado,
    passos,
  };
}
