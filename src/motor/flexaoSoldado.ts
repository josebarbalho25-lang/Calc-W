// ═══════════════════════════════════════════════════════════════════════════
//  motor/flexaoSoldado.ts — flexão em X do I soldado com mesas diferentes ou
//  alma esbelta (NBR 8800:2024, Tabela D.1 linha 2, D.2.8-b/-e/-i/-j, Anexo E)
// ---------------------------------------------------------------------------
//  O I de mesas iguais e alma não esbelta continua em `flexao.ts` (linha 1 da
//  Tabela D.1). Aqui ficam os dois casos que dependem da mesa comprimida:
//
//   · MESAS DIFERENTES, alma não esbelta (linha 2 da Tabela D.1):
//       FLT  λ = Lb/ryTc, λr e Mcr do D.2.8-b, Mr = (fy − σr)Wc ≤ fy·Wt;
//       FLM  da mesa comprimida (D.2.8-f de soldado, Wc);
//       FLA  λ = hc/tw, λp = (hc/hp)·√(E/fy)/(0,54·Mpl/Mr − 0,09)² ≤ λr.
//     Fora dos limites do D.2.8-i a conta sai, mas o cartão fica "avaliar".
//
//   · ALMA ESBELTA (λ da FLA > 5,70·√(E/fy)): Anexo E, o menor entre o
//     escoamento da mesa tracionada (E.6.1), a FLT (E.6.2) e a FLM (E.6.3),
//     todos com o fator kpg de redução pela alma esbelta.
//
//  ⚠️ O LIMITE DE h/tw DO E.5.3-b É DA SEÇÃO, NÃO DO ANEXO (achado da revisão
//  de 04/11/2026). O E.5.2 chama de alma esbelta a de h/tw > 5,70·√(E/fy), e
//  o E.5.3-b proíbe a que passa do limite — qualquer que seja o anexo que
//  calcula o momento (o gatilho do Anexo E é o hc/tw, que muda com a mesa
//  comprimida). Conferido uma vez em `flexao.ts`, antes dos lados: a viga não
//  admitida sai "não atende" e SEM número, e a interação também.
//
//  ⚠️ CURVATURA REVERSA (D.2.8-j): cada mesa tem o seu momento resistente, e
//  cada um tem de passar do maior momento que comprime aquela mesa. A entrada
//  é um só Mx (o máximo, em módulo): com a reversa, os DOIS lados são
//  conferidos contra ele, e vale o menor — a favor da segurança. E o Cb leva
//  o Rm do 5.4.2.3 (0,5 + 2·(Iy,m/Iy)²), que só existe nesse caso.
// ═══════════════════════════════════════════════════════════════════════════

import type { GeometriaDoSoldado } from './catalogos/soldados';
import { flm, tresTrechos, type EstadoLimiteLocal } from './flexao';
import type { ResultadoFlt } from './flt';
import { foraDoD28i, ladoComprimido, type LadoComprimido, type Mesa } from './ladoComprimido';
import { fr, n, par, pot, rz, v, x, type Conta, type Passo } from './memoria';
import { E, type SecaoI } from './secao';

const nomeDoLado = (q: Mesa) => (q === 'superior' ? 'mesa superior comprimida' : 'mesa inferior comprimida');

/** O resultado de um lado (uma mesa comprimida), antes do γa1. */
export interface FlexaoDeUmLado {
  lado: LadoComprimido;
  /** 'D' = Anexo D (alma não esbelta); 'E' = Anexo E (alma esbelta). */
  anexo: 'D' | 'E';
  MRk: number;
  governa: string;
  candidatos: Array<[string, number]>;
  flm: EstadoLimiteLocal;
  fla: EstadoLimiteLocal;
  flt: ResultadoFlt;
  passos: Passo[];
  avisos: string[];
  /** Fora dos limites do D.2.8-i / E.5.3-a: a conta sai, o cartão fica "avaliar". */
  foraDosLimites?: boolean;
}

/** Rm do 5.4.2.3: 1,0, ou 0,5 + 2·(Iy,m/Iy)² na monossimétrica com curvatura reversa. */
export function fatorRm(g: GeometriaDoSoldado, reversa: boolean): number {
  if (g.iguais || !reversa) return 1;
  return 0.5 + 2 * (Math.min(g.Iys, g.Iyi) / g.Iy) ** 2;
}

/** A alma é esbelta para este lado? (λ da FLA: hc/tw; nas mesas iguais, h/tw). */
export function almaEsbelta(lado: LadoComprimido, tw: number, fy: number): boolean {
  return lado.hc / tw > 5.7 * Math.sqrt(E / fy);
}

// ─── Anexo D, linha 2: mesas diferentes ─────────────────────────────────────

function fltD28b(s: SecaoI, g: GeometriaDoSoldado, lado: LadoComprimido, fy: number, Lb: number, Cb: number, Mpl: number): ResultadoFlt {
  const sigmaR = 0.3 * fy;
  const MrW = (fy - sigmaR) * lado.Wc;
  const Mr = Math.min(MrW, fy * lado.Wt);
  const beta1 = Mr / (E * s.J);
  const beta3 = 0.45 * g.hf * (2 * lado.alfaY - 1);
  const beta2 = (5.2 * beta1 * beta3) / Cb + 1;
  const lambdaP = 1.76 * Math.sqrt(E / fy);
  const lambdaR =
    ((1.38 * Cb * Math.sqrt(s.Iy * s.J)) / (lado.ryTc * s.J * beta1)) *
    Math.sqrt(beta2 + Math.sqrt(beta2 ** 2 + (27 * s.Cw * beta1 ** 2) / (Cb ** 2 * s.Iy)));
  const ref = 'D.2.1; Tabela D.1; D.2.8-b, -e';
  const contaMr: Conta = {
    simbolo: v('M', 'r'),
    formula: x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'c'), ' ≤ ', v('f', 'y'), ' ', v('W', 't')),
    numeros: x('mín(', par(x(n(fy), ' − ', n(sigmaR))), ' · ', n(lado.Wc), '; ', n(fy), ' · ', n(lado.Wt), ')'),
    valor: Mr,
    unidade: 'kN·cm',
    rotulo: Mr < MrW ? 'fy·Wt governa' : '(fy − σr)·Wc governa',
  };
  const contasComuns: Conta[] = [
    contaMr,
    {
      simbolo: v('β', '1'),
      formula: fr(v('M', 'r'), x(v('E'), ' ', v('J'))),
      numeros: fr(n(Mr), x(n(E), ' · ', n(s.J))),
      valor: beta1,
      casas: 5,
      unidade: 'cm⁻¹',
    },
    {
      simbolo: v('β', '3'),
      formula: x('0,45 ', par(x(v('d'), ' − ', fr(x(v('t', 'fs'), ' + ', v('t', 'fi')), '2'))), ' ', par(x('2', v('α', 'y'), ' − 1'))),
      numeros: x('0,45 · ', n(g.hf), ' · ', par(x('2 · ', n(lado.alfaY, 4), ' − 1'))),
      valor: beta3,
      casas: 3,
      unidade: 'cm',
    },
    {
      simbolo: v('β', '2'),
      formula: x(fr(x('5,2 ', v('β', '1'), ' ', v('β', '3')), v('C', 'b')), ' + 1'),
      numeros: x(fr(x('5,2 · ', n(beta1, 5), ' · ', n(beta3, 3)), n(Cb, 3)), ' + 1'),
      valor: beta2,
      casas: 4,
    },
    { simbolo: v('λ', 'p'), formula: x('1,76 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('1,76 · ', rz(fr(n(E), n(fy)))), valor: lambdaP, casas: 2 },
    {
      simbolo: v('λ', 'r'),
      formula: x(
        fr(x('1,38 ', v('C', 'b'), ' ', rz(x(v('I', 'y'), ' ', v('J')))), x(v('r', 'yTc'), ' ', v('J'), ' ', v('β', '1'))),
        ' ',
        rz(x(v('β', '2'), ' + ', rz(x(pot(v('β', '2'), 2), ' + ', fr(x('27 ', v('C', 'w'), ' ', pot(v('β', '1'), 2)), x(pot(v('C', 'b'), 2), ' ', v('I', 'y'))))))),
      ),
      numeros: x(
        fr(x('1,38 · ', n(Cb, 3), ' · ', rz(x(n(s.Iy), ' · ', n(s.J)))), x(n(lado.ryTc), ' · ', n(s.J), ' · ', n(beta1, 5))),
        ' · ',
        rz(x(n(beta2, 4), ' + ', rz(x(pot(n(beta2, 4), 2), ' + ', fr(x('27 · ', n(s.Cw), ' · ', pot(n(beta1, 5), 2)), x(pot(n(Cb, 3), 2), ' · ', n(s.Iy))))))),
      ),
      valor: lambdaR,
      casas: 2,
    },
  ];
  if (!(Lb > 0)) {
    return {
      Lb,
      Cb,
      Mcr: Infinity,
      classico: { lambda: 0, lambdaP, beta1, lambdaR, Mr, Mrk: Mpl, ramo: 'travada' },
      alternativo: { lambdaLT: 0, chiFLT: 1, Mrk: Mpl, ramo: 'travada' },
      Mrk: Mpl,
      adotado: 'clássico',
      indiceDoRaio: 'yTc',
      passos: [{ ref, titulo: 'Flambagem lateral com torção (FLT)', contas: [{ simbolo: v('M', 'Rk,FLT'), texto: 'mesa comprimida travada continuamente (Lb = 0)', valor: Mpl, unidade: 'kN·cm' }] }],
    };
  }
  const Mcr = ((Cb * Math.PI ** 2 * E * s.Iy) / Lb ** 2) * (beta3 + Math.sqrt(beta3 ** 2 + (s.Cw / s.Iy) * (1 + (0.039 * s.J * Lb ** 2) / s.Cw)));
  const lambda = Lb / lado.ryTc;
  const classico = tresTrechos(lambda, lambdaP, lambdaR, Mpl, Mr, Mcr);
  const lambdaLT = Math.sqrt(Mpl / Mcr);
  const chiFLT = lambdaLT <= 0.4 ? 1 : lambdaLT <= 1.4 ? 1 - 0.49 * (lambdaLT - 0.4) : 1 / lambdaLT ** 2;
  const ramoA = lambdaLT <= 0.4 ? 'λLT ≤ 0,4' : lambdaLT <= 1.4 ? '0,4 < λLT ≤ 1,4' : 'λLT > 1,4';
  const MrkA = chiFLT * Mpl;
  const Mrk = Math.max(classico.Mrk, MrkA);
  const adotado = classico.Mrk >= MrkA ? 'clássico' : 'alternativo';
  const passos: Passo[] = [
    {
      ref,
      titulo: `FLT da seção monossimétrica — ${nomeDoLado(lado.qual)}`,
      contas: [
        ...contasComuns,
        {
          simbolo: v('M', 'cr'),
          formula: x(
            fr(x(v('C', 'b'), ' π² ', v('E'), ' ', v('I', 'y')), pot(v('L', 'b'), 2)),
            ' ',
            par(x(v('β', '3'), ' + ', rz(x(pot(v('β', '3'), 2), ' + ', fr(v('C', 'w'), v('I', 'y')), ' ', par(x('1 + 0,039 ', fr(x(v('J'), ' ', pot(v('L', 'b'), 2)), v('C', 'w')))))))),
          ),
          numeros: x(
            fr(x(n(Cb, 3), ' · π² · ', n(E), ' · ', n(s.Iy)), pot(n(Lb), 2)),
            ' · ',
            par(x(n(beta3, 3), ' + ', rz(x(pot(n(beta3, 3), 2), ' + ', fr(n(s.Cw), n(s.Iy)), ' · ', par(x('1 + 0,039 · ', fr(x(n(s.J), ' · ', pot(n(Lb), 2)), n(s.Cw)))))))),
          ),
          valor: Mcr,
          unidade: 'kN·cm',
        },
        { simbolo: v('λ'), formula: fr(v('L', 'b'), v('r', 'yTc')), numeros: fr(n(Lb), n(lado.ryTc)), valor: lambda, casas: 2 },
        contaTresTrechos(classico, Mpl, 'M', 'Rk'),
        { simbolo: v('λ', 'LT'), formula: rz(fr(v('M', 'pl'), v('M', 'cr'))), numeros: rz(fr(n(Mpl), n(Mcr))), valor: lambdaLT, casas: 3 },
        { simbolo: v('χ', 'FLT'), valor: chiFLT, casas: 3, rotulo: ramoA },
        {
          simbolo: v('M', 'Rk,FLT'),
          formula: x('máx(clássico; ', v('χ', 'FLT'), ' ', v('M', 'pl'), ')'),
          numeros: x('máx(', n(classico.Mrk), '; ', n(MrkA), ')'),
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
    classico: { lambda, lambdaP, beta1, lambdaR, Mr, Mrk: classico.Mrk, ramo: classico.ramo },
    alternativo: { lambdaLT, chiFLT, Mrk: MrkA, ramo: ramoA },
    Mrk,
    adotado,
    passos,
    indiceDoRaio: 'yTc',
  };
}

/** A conta do momento num dos três trechos (λp/λy, λr), com a fórmula do trecho. */
function contaTresTrechos(el: EstadoLimiteLocal, Mtopo: number, simbolo: string, indice: string, nomeTopo = 'pl'): Conta {
  if (el.lambda <= el.lambdaP) return { simbolo: v(simbolo, indice), formula: v('M', nomeTopo), valor: el.Mrk, unidade: 'kN·cm', rotulo: el.ramo };
  if (el.lambda <= el.lambdaR)
    return {
      simbolo: v(simbolo, indice),
      formula: x(v('M', nomeTopo), ' − ', par(x(v('M', nomeTopo), ' − ', v('M', 'r'))), ' ', fr(x(v('λ'), ' − ', v('λ', nomeTopo === 'pl' ? 'p' : 'y')), x(v('λ', 'r'), ' − ', v('λ', nomeTopo === 'pl' ? 'p' : 'y')))),
      numeros: x(n(Mtopo), ' − ', par(x(n(Mtopo), ' − ', n(el.Mr))), ' · ', fr(x(n(el.lambda, 2), ' − ', n(el.lambdaP, 2)), x(n(el.lambdaR, 2), ' − ', n(el.lambdaP, 2)))),
      valor: el.Mrk,
      unidade: 'kN·cm',
      rotulo: el.ramo,
    };
  return { simbolo: v(simbolo, indice), formula: v('M', 'cr'), valor: el.Mrk, unidade: 'kN·cm', rotulo: el.ramo };
}

function ladoAnexoD(s: SecaoI, g: GeometriaDoSoldado, lado: LadoComprimido, fy: number, Lb: number, Cb: number): FlexaoDeUmLado {
  const Mpl = s.Zx * fy;
  const W = Math.min(lado.Wc, lado.Wt);
  const sigmaR = 0.3 * fy;
  const kc = s.soldado!.kc;
  // FLM da mesa comprimida (D.2.8-f de soldado, D.2.8-h: b = bfc/2).
  const lamM = lado.bfc / 2 / lado.tfc;
  const eFlm = flm(lamM, fy, lado.Wc, Mpl, kc);
  // FLA com hc e hp (Tabela D.1, linha 2): o λp cai com a assimetria.
  const lamA = lado.hc / s.tw;
  const MrA = fy * W;
  const lambdaR = 5.7 * Math.sqrt(E / fy);
  // hp = 0: a alma inteira tracionada no regime plástico — não há FLA a
  // reduzir, e o λp vai ao teto (λr).
  const lpBruto = lado.hp > 0 ? ((lado.hc / lado.hp) * Math.sqrt(E / fy)) / (0.54 * (Mpl / MrA) - 0.09) ** 2 : Infinity;
  const lambdaPA = Math.min(lpBruto, lambdaR);
  const eFla = tresTrechos(lamA, lambdaPA, lambdaR, Mpl, MrA, NaN);
  const eFlt = fltD28b(s, g, lado, fy, Lb, Cb, Mpl);
  const teto = 1.5 * W * fy;
  const candidatos: Array<[string, number]> = [
    ['FLM', eFlm.Mrk],
    ['FLA', eFla.Mrk],
    ['FLT', eFlt.Mrk],
    ['1,50 W fy', teto],
  ];
  const MRk = Math.min(...candidatos.map(([, M]) => M));
  const governa = MRk === Mpl ? 'plastificação' : (candidatos.find(([, M]) => M === MRk)?.[0] ?? '');
  const fora = foraDoD28i(g, lado);
  const titulo = nomeDoLado(lado.qual);
  const passos: Passo[] = [
    {
      ref: 'D.3; D.2.8-i',
      titulo: `Seção monossimétrica — ${titulo}`,
      contas: [
        { simbolo: v('W', 'c'), valor: lado.Wc, unidade: 'cm³', rotulo: 'lado comprimido' },
        { simbolo: v('W', 't'), valor: lado.Wt, unidade: 'cm³', rotulo: 'lado tracionado' },
        { simbolo: v('h', 'c'), valor: lado.hc, casas: 2, unidade: 'cm', rotulo: '2 × centroide → face interna da mesa comprimida' },
        { simbolo: v('h', 'p'), valor: lado.hp, casas: 2, unidade: 'cm', rotulo: '2 × linha neutra plástica → face interna da mesa comprimida' },
        { simbolo: v('I', 'yTc'), valor: lado.IyTc, casas: 1, unidade: 'cm⁴', rotulo: 'mesa comprimida + hc/2 de alma' },
        { simbolo: v('r', 'yTc'), formula: rz(fr(v('I', 'yTc'), v('A', 'Tc'))), numeros: rz(fr(n(lado.IyTc), n(lado.ATc))), valor: lado.ryTc, casas: 3, unidade: 'cm' },
        {
          simbolo: v('α', 'y'),
          formula: fr(v('I', 'yTc'), v('I', 'y')),
          numeros: fr(n(lado.IyTc), n(s.Iy)),
          valor: lado.alfaY,
          casas: 3,
          rotulo: fora.length ? 'fora de 0,1 a 0,9' : '0,1 ≤ αy ≤ 0,9',
        },
      ],
    },
    {
      ref: 'D.2.2; Tabela D.1; D.2.8-f, -h',
      titulo: `FLM — ${titulo}`,
      contas: [
        { simbolo: v('λ'), formula: fr(v('b', 'fc'), x('2 ', v('t', 'fc'))), numeros: fr(n(lado.bfc), x('2 · ', n(lado.tfc))), valor: lamM, casas: 2 },
        { simbolo: v('λ', 'p'), valor: eFlm.lambdaP, casas: 2 },
        {
          simbolo: v('λ', 'r'),
          formula: x('0,95 ', rz(fr(v('E'), par(x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), '/', v('k', 'c')))))),
          numeros: x('0,95 · ', rz(fr(n(E), par(x(par(x(n(fy), ' − ', n(sigmaR))), '/', n(kc, 3)))))),
          valor: eFlm.lambdaR,
          casas: 2,
        },
        { simbolo: v('M', 'r'), formula: x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'c')), numeros: x(par(x(n(fy), ' − ', n(sigmaR))), ' · ', n(lado.Wc)), valor: eFlm.Mr, unidade: 'kN·cm' },
        eFlm.lambda > eFlm.lambdaR
          ? {
              simbolo: v('M', 'Rk'),
              formula: fr(x('0,90 ', v('E'), ' ', v('k', 'c'), ' ', v('W', 'c')), pot(v('λ'), 2)),
              numeros: fr(x('0,90 · ', n(E), ' · ', n(kc, 3), ' · ', n(lado.Wc)), pot(n(lamM, 2), 2)),
              valor: eFlm.Mrk,
              unidade: 'kN·cm',
              rotulo: eFlm.ramo,
            }
          : contaTresTrechos(eFlm, Mpl, 'M', 'Rk'),
      ],
    },
    {
      ref: 'D.2.2; Tabela D.1',
      titulo: `FLA — ${titulo}`,
      contas: [
        { simbolo: v('λ'), formula: fr(v('h', 'c'), v('t', 'w')), numeros: fr(n(lado.hc), n(s.tw)), valor: lamA, casas: 2 },
        { simbolo: v('M', 'r'), formula: x(v('f', 'y'), ' ', v('W')), numeros: x(n(fy), ' · ', n(W)), valor: MrA, unidade: 'kN·cm', rotulo: 'W mínimo' },
        {
          simbolo: v('λ', 'p'),
          formula: fr(x(fr(v('h', 'c'), v('h', 'p')), ' ', rz(fr(v('E'), v('f', 'y')))), pot(par(x('0,54 ', fr(v('M', 'pl'), v('M', 'r')), ' − 0,09')), 2)),
          numeros: fr(x(fr(n(lado.hc), n(lado.hp)), ' · ', rz(fr(n(E), n(fy)))), pot(par(x('0,54 · ', fr(n(Mpl), n(MrA)), ' − 0,09')), 2)),
          valor: lambdaPA,
          casas: 2,
          rotulo: lado.hp > 0 ? (lpBruto > lambdaR ? 'limitado a λr' : '≤ λr') : 'hp = 0: λp = λr',
        },
        { simbolo: v('λ', 'r'), formula: x('5,70 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('5,70 · ', rz(fr(n(E), n(fy)))), valor: lambdaR, casas: 2 },
        contaTresTrechos(eFla, Mpl, 'M', 'Rk'),
      ],
    },
    ...eFlt.passos,
  ];
  return {
    lado,
    anexo: 'D',
    MRk,
    governa,
    candidatos,
    flm: eFlm,
    fla: eFla,
    flt: eFlt,
    passos,
    avisos: fora.map((f) => `Seção monossimétrica: ${f} — a Tabela D.1 não cobre esta seção.`),
    foraDosLimites: fora.length > 0,
  };
}

// ─── Anexo E: alma esbelta ──────────────────────────────────────────────────

/** h/tw máximo do E.5.3-b: 260 e 11,7·√(E/fy) (a/h ≤ 1,5) ou 0,42·E/fy (a/h > 1,5 ou sem enrijecedor). */
export function limiteDaAlmaEsbelta(h: number, a: number, fy: number): { limite: number; regra: string } {
  const comEnrijecedor = a > 0 && a / h <= 1.5;
  const lim = comEnrijecedor ? 11.7 * Math.sqrt(E / fy) : (0.42 * E) / fy;
  const regra = comEnrijecedor ? 'a/h ≤ 1,5: 11,7·√(E/fy)' : a > 0 ? 'a/h > 1,5: 0,42·E/fy' : 'sem enrijecedores: 0,42·E/fy';
  return lim < 260 ? { limite: lim, regra } : { limite: 260, regra: `260 (${regra} = ${lim.toFixed(0)})` };
}

function ladoAnexoE(s: SecaoI, g: GeometriaDoSoldado, lado: LadoComprimido, fy: number, Lb: number, Cb: number): FlexaoDeUmLado {
  const sigmaR = 0.3 * fy;
  const kc = s.soldado!.kc;
  const raiz = Math.sqrt(E / fy);
  const arBruto = (lado.hc * s.tw) / lado.Afc;
  const ar = Math.min(arBruto, 10);
  const kpg = Math.min(1, 1 - (ar / (1200 + 300 * ar)) * (lado.hc / s.tw - 5.7 * raiz));
  // E.6.1 — escoamento da mesa tracionada.
  const Mt = lado.Wt * fy;
  const My = kpg * fy * lado.Wc;
  const Mr = kpg * (fy - sigmaR) * lado.Wc;
  // E.6.2 — FLT: λ = Lb/ryc; o Cb fica no λr e no Mcr.
  const lyT = 1.1 * raiz;
  const lrT = Math.PI * Math.sqrt((E * Cb) / (fy - sigmaR));
  const lamT = Lb > 0 ? Lb / lado.ryc : 0;
  const McrT = Lb > 0 ? (Cb * kpg * Math.PI ** 2 * E * lado.Wc) / lamT ** 2 : Infinity;
  const eFlt = tresTrechos(lamT, lyT, lrT, My, Mr, McrT);
  // E.6.3 — FLM da mesa comprimida.
  const lamM = lado.bfc / 2 / lado.tfc;
  const lyM = 0.38 * raiz;
  const lrM = 0.95 * Math.sqrt((kc * E) / (fy - sigmaR));
  const McrM = (0.9 * kpg * E * kc * lado.Wc) / lamM ** 2;
  const eFlm = tresTrechos(lamM, lyM, lrM, My, Mr, McrM);
  const candidatos: Array<[string, number]> = [
    ['escoamento da mesa tracionada', Mt],
    ['FLT', eFlt.Mrk],
    ['FLM', eFlm.Mrk],
  ];
  const MRk = Math.min(...candidatos.map(([, M]) => M));
  const governa = candidatos.find(([, M]) => M === MRk)?.[0] ?? '';

  const fora = g.iguais ? [] : foraDoD28i(g, lado);
  const titulo = nomeDoLado(lado.qual);
  const flt: ResultadoFlt = {
    Lb,
    Cb,
    Mcr: McrT,
    classico: { lambda: lamT, lambdaP: lyT, beta1: NaN, lambdaR: lrT, Mr, Mrk: eFlt.Mrk, ramo: eFlt.ramo },
    alternativo: { lambdaLT: NaN, chiFLT: NaN, Mrk: eFlt.Mrk, ramo: 'Anexo E' },
    Mrk: eFlt.Mrk,
    adotado: 'clássico',
    passos: [],
    indiceDoRaio: 'yc',
  };
  const passos: Passo[] = [
    {
      ref: 'D.1.2; Tabela D.1; E.6',
      titulo: `Viga de alma esbelta — ${titulo}`,
      contas: [
        {
          simbolo: fr(v('h', 'c'), v('t', 'w')),
          numeros: fr(n(lado.hc), n(s.tw)),
          valor: lado.hc / s.tw,
          casas: 2,
          rotulo: `λ da FLA (Tabela D.1) > 5,70·√(E/fy) = ${(5.7 * raiz).toFixed(2).replace('.', ',')}: Anexo E`,
        },
        {
          simbolo: v('a', 'r'),
          formula: fr(x(v('h', 'c'), ' ', v('t', 'w')), v('A', 'fc')),
          numeros: fr(x(n(lado.hc), ' · ', n(s.tw)), n(lado.Afc)),
          valor: ar,
          casas: 3,
          rotulo: arBruto > 10 ? 'limitado a 10' : '≤ 10',
        },
        {
          simbolo: v('k', 'pg'),
          formula: x('1 − ', fr(v('a', 'r'), x('1200 + 300 ', v('a', 'r'))), ' ', par(x(fr(v('h', 'c'), v('t', 'w')), ' − 5,70 ', rz(fr(v('E'), v('f', 'y')))))),
          numeros: x('1 − ', fr(n(ar, 3), x('1200 + 300 · ', n(ar, 3))), ' · ', par(x(n(lado.hc / s.tw, 2), ' − 5,70 · ', rz(fr(n(E), n(fy)))))),
          valor: kpg,
          casas: 4,
          rotulo: 'redução pela alma esbelta (≤ 1,0)',
        },
      ],
    },
    {
      ref: 'E.6.1',
      titulo: `Escoamento da mesa tracionada — ${titulo}`,
      contas: [{ simbolo: v('M', 'Rk'), formula: x(v('W', 'xt'), ' ', v('f', 'y')), numeros: x(n(lado.Wt), ' · ', n(fy)), valor: Mt, unidade: 'kN·cm' }],
    },
    {
      ref: 'E.6.2',
      titulo: `FLT — ${titulo}`,
      contas: [
        { simbolo: v('M', 'y'), formula: x(v('k', 'pg'), ' ', v('f', 'y'), ' ', v('W', 'xc')), numeros: x(n(kpg, 4), ' · ', n(fy), ' · ', n(lado.Wc)), valor: My, unidade: 'kN·cm' },
        { simbolo: v('M', 'r'), formula: x(v('k', 'pg'), ' ', par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'xc')), numeros: x(n(kpg, 4), ' · ', par(x(n(fy), ' − ', n(sigmaR))), ' · ', n(lado.Wc)), valor: Mr, unidade: 'kN·cm' },
        ...(Lb > 0
          ? [
              { simbolo: v('r', 'yc'), valor: lado.ryc, casas: 3, unidade: 'cm', rotulo: 'mesa comprimida + 1/3 da alma comprimida' } as Conta,
              { simbolo: v('λ'), formula: fr(v('L', 'b'), v('r', 'yc')), numeros: fr(n(Lb), n(lado.ryc)), valor: lamT, casas: 2 } as Conta,
              { simbolo: v('λ', 'y'), formula: x('1,10 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('1,10 · ', rz(fr(n(E), n(fy)))), valor: lyT, casas: 2 } as Conta,
              {
                simbolo: v('λ', 'r'),
                formula: x('π ', rz(fr(x(v('E'), ' ', v('C', 'b')), par(x(v('f', 'y'), ' − ', v('σ', 'r')))))),
                numeros: x('π · ', rz(fr(x(n(E), ' · ', n(Cb, 3)), par(x(n(fy), ' − ', n(sigmaR)))))),
                valor: lrT,
                casas: 2,
              } as Conta,
              lamT > lrT
                ? ({
                    simbolo: v('M', 'Rk'),
                    formula: fr(x(v('C', 'b'), ' ', v('k', 'pg'), ' π² ', v('E'), ' ', v('W', 'xc')), pot(v('λ'), 2)),
                    numeros: fr(x(n(Cb, 3), ' · ', n(kpg, 4), ' · π² · ', n(E), ' · ', n(lado.Wc)), pot(n(lamT, 2), 2)),
                    valor: eFlt.Mrk,
                    unidade: 'kN·cm',
                    rotulo: eFlt.ramo,
                  } as Conta)
                : contaTresTrechos(eFlt, My, 'M', 'Rk', 'y'),
            ]
          : [{ simbolo: v('M', 'Rk'), formula: v('M', 'y'), valor: My, unidade: 'kN·cm', rotulo: 'travada (Lb = 0)' } as Conta]),
      ],
    },
    {
      ref: 'E.6.3',
      titulo: `FLM — ${titulo}`,
      contas: [
        { simbolo: v('λ'), formula: fr(v('b', 'f'), x('2 ', v('t', 'f'))), numeros: fr(n(lado.bfc), x('2 · ', n(lado.tfc))), valor: lamM, casas: 2 },
        { simbolo: v('λ', 'y'), formula: x('0,38 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('0,38 · ', rz(fr(n(E), n(fy)))), valor: lyM, casas: 2 },
        {
          simbolo: v('λ', 'r'),
          formula: x('0,95 ', rz(fr(x(v('k', 'c'), ' ', v('E')), par(x(v('f', 'y'), ' − ', v('σ', 'r')))))),
          numeros: x('0,95 · ', rz(fr(x(n(kc, 3), ' · ', n(E)), par(x(n(fy), ' − ', n(sigmaR)))))),
          valor: lrM,
          casas: 2,
        },
        lamM > lrM
          ? {
              simbolo: v('M', 'Rk'),
              formula: fr(x('0,90 ', v('k', 'pg'), ' ', v('E'), ' ', v('k', 'c'), ' ', v('W', 'xc')), pot(v('λ'), 2)),
              numeros: fr(x('0,90 · ', n(kpg, 4), ' · ', n(E), ' · ', n(kc, 3), ' · ', n(lado.Wc)), pot(n(lamM, 2), 2)),
              valor: eFlm.Mrk,
              unidade: 'kN·cm',
              rotulo: eFlm.ramo,
            }
          : contaTresTrechos(eFlm, My, 'M', 'Rk', 'y'),
      ],
    },
  ];
  const avisos = fora.map((f) => `Seção monossimétrica: ${f} — fora do E.5.3-a.`);
  return {
    lado,
    anexo: 'E',
    MRk,
    governa,
    candidatos,
    flm: eFlm,
    fla: { lambda: lado.hc / s.tw, lambdaP: NaN, lambdaR: 5.7 * raiz, Mr: NaN, Mcr: NaN, Mrk: NaN, ramo: 'alma esbelta — Anexo E' },
    flt,
    passos,
    avisos,
    foraDosLimites: fora.length > 0,
  };
}

/** A flexão em X de um lado comprimido: Anexo D (linha 2) ou Anexo E, conforme a alma. */
export function flexaoXDeUmLado(s: SecaoI, fy: number, Lb: number, Cb: number, qual: Mesa): FlexaoDeUmLado {
  const g = s.geo!;
  const lado = ladoComprimido(g, qual);
  return almaEsbelta(lado, s.tw, fy) ? ladoAnexoE(s, g, lado, fy, Lb, Cb) : ladoAnexoD(s, g, lado, fy, Lb, Cb);
}
