// ═══════════════════════════════════════════════════════════════════════════
//  motor/cortante.ts — força cortante resistente (NBR 8800:2024, 5.4.3)
// ---------------------------------------------------------------------------
//  Em Y (paralela à alma, 5.4.3.1): a alma resiste, Aw = d·tw, h = d' (a parte
//  plana da alma, no laminado), kv pelos enrijecedores.
//  Em X (paralela às mesas, 5.4.3.5): as duas mesas resistem, Aw = 2·bf·tf,
//  h = bf/2, "tw" = tf, kv = 1,2.
//
//  ⚠️ γa1 UMA VEZ SÓ. Dividir o Vpl por 1,10 e o VRd de novo (erro achado na
//  planilha de referência) dá 10 % a menos em todo caso. Aqui Vpl = 0,60·Aw·fy é característico, e só o
//  VRd leva o γa1 (5.4.3.1.1 e 5.4.3.1.2).
//
//  ⚠️ kv = 5,34 SEM ENRIJECEDOR é da 2024 (a 2008 usava 5,0), e só vale
//  também para a/h > 3. Abaixo disso, 5 + 5/(a/h)².
// ═══════════════════════════════════════════════════════════════════════════

import { fr, n, par, pot, rz, situacaoPelaRazao, v, x, type Conta, type Passo, type Verificacao } from './memoria';
import { E, GAMA_A1, type SecaoI } from './secao';
import type { Aco } from './tipos';

export interface ChapaAoCisalhamento {
  lambda: number;
  kv: number;
  lambdaP: number;
  lambdaR: number;
  Aw: number;
  Vpl: number;
  VRd: number;
  ramo: string;
}

/** Os três trechos de 5.4.3.1.1, para uma chapa de esbeltez λ. */
export function cisalhamento(lambda: number, kv: number, Aw: number, fy: number): ChapaAoCisalhamento {
  const lambdaP = 1.1 * Math.sqrt((kv * E) / fy);
  const lambdaR = 1.37 * Math.sqrt((kv * E) / fy);
  const Vpl = 0.6 * Aw * fy;
  if (lambda <= lambdaP) return { lambda, kv, lambdaP, lambdaR, Aw, Vpl, VRd: Vpl / GAMA_A1, ramo: 'λ ≤ λp' };
  if (lambda <= lambdaR)
    return { lambda, kv, lambdaP, lambdaR, Aw, Vpl, VRd: ((lambdaP / lambda) * Vpl) / GAMA_A1, ramo: 'λp < λ ≤ λr' };
  return { lambda, kv, lambdaP, lambdaR, Aw, Vpl, VRd: (1.24 * (lambdaP / lambda) ** 2 * Vpl) / GAMA_A1, ramo: 'λ > λr' };
}

function contasComuns(c: ChapaAoCisalhamento, fy: number, VSd: number, aw: Conta, lambda: Conta): Conta[] {
  const contas: Conta[] = [
    lambda,
    { simbolo: v('λ', 'p'), formula: x('1,10 ', rz(fr(x(v('k', 'v'), ' ', v('E')), v('f', 'y')))), numeros: x('1,10 · ', rz(fr(x(n(c.kv, 2), ' · ', n(E)), n(fy)))), valor: c.lambdaP, casas: 2 },
    { simbolo: v('λ', 'r'), formula: x('1,37 ', rz(fr(x(v('k', 'v'), ' ', v('E')), v('f', 'y')))), numeros: x('1,37 · ', rz(fr(x(n(c.kv, 2), ' · ', n(E)), n(fy)))), valor: c.lambdaR, casas: 2 },
    aw,
    { simbolo: v('V', 'pl'), formula: x('0,60 ', v('A', 'w'), ' ', v('f', 'y')), numeros: x('0,60 · ', n(c.Aw), ' · ', n(fy)), valor: c.Vpl, unidade: 'kN' },
  ];
  if (c.lambda <= c.lambdaP) {
    contas.push({ simbolo: v('V', 'Rd'), formula: fr(v('V', 'pl'), v('γ', 'a1')), numeros: fr(n(c.Vpl), n(GAMA_A1, 2)), valor: c.VRd, unidade: 'kN', rotulo: c.ramo });
  } else if (c.lambda <= c.lambdaR) {
    contas.push({
      simbolo: v('V', 'Rd'),
      formula: x(fr(v('λ', 'p'), v('λ')), ' ', fr(v('V', 'pl'), v('γ', 'a1'))),
      numeros: x(fr(n(c.lambdaP, 2), n(c.lambda, 2)), ' · ', fr(n(c.Vpl), n(GAMA_A1, 2))),
      valor: c.VRd,
      unidade: 'kN',
      rotulo: c.ramo,
    });
  } else {
    contas.push({
      simbolo: v('V', 'Rd'),
      formula: x('1,24 ', pot(par(fr(v('λ', 'p'), v('λ'))), 2), ' ', fr(v('V', 'pl'), v('γ', 'a1'))),
      numeros: x('1,24 · ', pot(par(fr(n(c.lambdaP, 2), n(c.lambda, 2))), 2), ' · ', fr(n(c.Vpl), n(GAMA_A1, 2))),
      valor: c.VRd,
      unidade: 'kN',
      rotulo: c.ramo,
    });
  }
  const razao = VSd / c.VRd;
  contas.push({ simbolo: fr(v('V', 'Sd'), v('V', 'Rd')), numeros: fr(n(VSd), n(c.VRd)), valor: razao, casas: 3, rotulo: razao <= 1 ? '≤ 1,0' : '> 1,0' });
  return contas;
}

export interface ResultadoCortante {
  VSd: number;
  chapa: ChapaAoCisalhamento;
  /** a/h, só na Y com enrijecedor. */
  aSobreH?: number;
  verificacao: Verificacao;
}

export function verificarCortanteY(s: SecaoI, aco: Aco, a: number, VSd: number): ResultadoCortante {
  const fy = aco.fy;
  const lambda = s.h / s.tw;
  const aSobreH = a > 0 ? a / s.h : undefined;
  const kv = aSobreH === undefined || aSobreH > 3 ? 5.34 : 5 + 5 / aSobreH ** 2;
  const c = cisalhamento(lambda, kv, s.d * s.tw, fy);
  const razao = Math.abs(VSd) / c.VRd;

  const kvConta: Conta[] =
    aSobreH === undefined
      ? [{ simbolo: v('k', 'v'), valor: kv, casas: 2, rotulo: 'sem enrijecedores transversais' }]
      : [
          { simbolo: x(v('a'), '/', v('h')), numeros: fr(n(a), n(s.h)), valor: aSobreH, casas: 3 },
          aSobreH > 3
            ? { simbolo: v('k', 'v'), valor: kv, casas: 2, rotulo: 'a/h > 3' }
            : { simbolo: v('k', 'v'), formula: x('5,0 + ', fr(5, pot(par(x(v('a'), '/', v('h'))), 2))), numeros: x('5,0 + ', fr(5, pot(n(aSobreH, 3), 2))), valor: kv, casas: 3, rotulo: 'a/h ≤ 3' },
        ];

  const passos: Passo[] = [
    {
      ref: '5.4.3.1.1; 5.4.3.1.2',
      titulo: 'Alma — seções I fletidas em relação ao eixo perpendicular à alma',
      contas: [
        ...kvConta,
        ...contasComuns(
          c,
          fy,
          Math.abs(VSd),
          { simbolo: v('A', 'w'), formula: x(v('d'), ' ', v('t', 'w')), numeros: x(n(s.d), ' · ', n(s.tw)), valor: c.Aw, unidade: 'cm²' },
          { simbolo: v('λ'), formula: fr(v('h'), v('t', 'w')), numeros: fr(n(s.h), n(s.tw)), valor: lambda, casas: 2 },
        ),
      ],
    },
  ];

  return {
    VSd,
    chapa: c,
    aSobreH,
    verificacao: {
      chave: 'cortanteY',
      titulo: 'Cortante em Y',
      item: '5.4.3.1',
      sd: Math.abs(VSd),
      rd: c.VRd,
      unidade: 'kN',
      razao,
      situacao: situacaoPelaRazao(razao),
      governa: c.ramo === 'λ ≤ λp' ? 'escoamento da alma' : 'instabilidade da alma',
      passos,
      avisos: [],
    },
  };
}

export function verificarCortanteX(s: SecaoI, aco: Aco, VSd: number): ResultadoCortante {
  const fy = aco.fy;
  const lambda = s.bf / 2 / s.tf;
  const c = cisalhamento(lambda, 1.2, 2 * s.bf * s.tf, fy);
  const razao = Math.abs(VSd) / c.VRd;
  const passos: Passo[] = [
    {
      ref: '5.4.3.5; 5.4.3.1.1',
      titulo: 'Mesas — seções I fletidas em relação ao eixo perpendicular às mesas',
      contas: [
        { simbolo: v('k', 'v'), valor: 1.2, casas: 1 },
        ...contasComuns(
          c,
          fy,
          Math.abs(VSd),
          { simbolo: v('A', 'w'), formula: x('2 ', v('b', 'f'), ' ', v('t', 'f')), numeros: x('2 · ', n(s.bf), ' · ', n(s.tf)), valor: c.Aw, unidade: 'cm²' },
          { simbolo: v('λ'), formula: fr(x(v('b', 'f'), '/2'), v('t', 'f')), numeros: fr(x(n(s.bf), '/2'), n(s.tf)), valor: lambda, casas: 2 },
        ),
      ],
    },
  ];
  return {
    VSd,
    chapa: c,
    verificacao: {
      chave: 'cortanteX',
      titulo: 'Cortante em X',
      item: '5.4.3.5',
      sd: Math.abs(VSd),
      rd: c.VRd,
      unidade: 'kN',
      razao,
      situacao: situacaoPelaRazao(razao),
      governa: c.ramo === 'λ ≤ λp' ? 'escoamento das mesas' : 'instabilidade das mesas',
      passos,
      avisos: [],
    },
  };
}
