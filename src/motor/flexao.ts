// ═══════════════════════════════════════════════════════════════════════════
//  motor/flexao.ts — momento fletor resistente (NBR 8800:2024, 5.4.2 e Anexo D)
// ---------------------------------------------------------------------------
//  Em X (o eixo forte): o menor entre FLM, FLA e FLT (D.2.1, D.2.2).
//  Em Y (o fraco): só a FLM — a FLA no eixo fraco é da seção U (D.2.8-c) e a
//  FLT só existe no eixo forte (D.2.8-g).
//
//  ⚠️ O TETO DE 1,50·W·fy/γa1 (5.4.2.2) VALE NOS DOIS EIXOS. No eixo fraco do
//  perfil W ele SEMPRE comanda o plástico: Zy passa de 1,5·Wy em toda bitola
//  do catálogo (até 1,61 no W 610 x 82,0). Sem o teto, o My,Rd sai até 7 %
//  acima do que a norma permite, contra a segurança.
//  A razão do teto é o próprio 5.4.2.2: a análise foi elástica, e a seção não
//  pode escoar em serviço além do que a análise supôs.
// ═══════════════════════════════════════════════════════════════════════════

import { flambagemLateralComTorcao, type ResultadoFlt } from './flt';
import { fr, n, pot, rz, situacaoPelaRazao, v, x, par, type Conta, type Passo, type Verificacao } from './memoria';
import { E, GAMA_A1, type SecaoI } from './secao';
import type { Aco, Comprimentos } from './tipos';

/** Um estado-limite local (FLM, FLA) com os três trechos do D.2.2. */
export interface EstadoLimiteLocal {
  lambda: number;
  lambdaP: number;
  lambdaR: number;
  Mr: number;
  Mcr: number;
  /** Resistente característico, kN·cm. NaN na alma esbelta (Anexo E). */
  Mrk: number;
  ramo: string;
}

function tresTrechos(lambda: number, lambdaP: number, lambdaR: number, Mpl: number, Mr: number, Mcr: number): EstadoLimiteLocal {
  if (lambda <= lambdaP) return { lambda, lambdaP, lambdaR, Mr, Mcr, Mrk: Mpl, ramo: 'λ ≤ λp' };
  if (lambda <= lambdaR)
    return { lambda, lambdaP, lambdaR, Mr, Mcr, Mrk: Mpl - ((Mpl - Mr) * (lambda - lambdaP)) / (lambdaR - lambdaP), ramo: 'λp < λ ≤ λr' };
  return { lambda, lambdaP, lambdaR, Mr, Mcr, Mrk: Mcr, ramo: 'λ > λr' };
}

/** FLM de perfil laminado (Tabela D.1, D.2.8-e, -f, -h), num eixo. */
function flm(s: SecaoI, fy: number, W: number, Mpl: number): EstadoLimiteLocal {
  const sigmaR = 0.3 * fy;
  const lambda = s.bf / 2 / s.tf;
  return tresTrechos(
    lambda,
    0.38 * Math.sqrt(E / fy),
    0.83 * Math.sqrt(E / (fy - sigmaR)),
    Mpl,
    (fy - sigmaR) * W,
    (0.69 * E * W) / lambda ** 2,
  );
}

/** FLA no eixo forte (Tabela D.1). Acima de λr a viga é de alma esbelta: Anexo E. */
function fla(s: SecaoI, fy: number, Mpl: number): EstadoLimiteLocal {
  const lambda = s.h / s.tw;
  const lambdaP = 3.76 * Math.sqrt(E / fy);
  const lambdaR = 5.7 * Math.sqrt(E / fy);
  const Mr = fy * s.Wx;
  if (lambda > lambdaR) return { lambda, lambdaP, lambdaR, Mr, Mcr: NaN, Mrk: NaN, ramo: 'λ > λr — alma esbelta' };
  return tresTrechos(lambda, lambdaP, lambdaR, Mpl, Mr, NaN);
}

function passoLocal(
  ref: string,
  titulo: string,
  el: EstadoLimiteLocal,
  fy: number,
  Mpl: number,
  def: { lambda: Conta; kp: number; kr: string; Mr: Conta; W: number; eixo: string },
): Passo {
  const contas: Conta[] = [
    def.lambda,
    { simbolo: v('λ', 'p'), formula: x(n(def.kp, 2), ' ', rz(fr(v('E'), v('f', 'y')))), numeros: x(n(def.kp, 2), ' · ', rz(fr(n(E), n(fy)))), valor: el.lambdaP, casas: 2 },
    def.kr === 'fla'
      ? { simbolo: v('λ', 'r'), formula: x('5,70 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('5,70 · ', rz(fr(n(E), n(fy)))), valor: el.lambdaR, casas: 2 }
      : { simbolo: v('λ', 'r'), formula: x('0,83 ', rz(fr(v('E'), par(x(v('f', 'y'), ' − ', v('σ', 'r')))))), numeros: x('0,83 · ', rz(fr(n(E), par(x(n(fy), ' − ', n(0.3 * fy)))))), valor: el.lambdaR, casas: 2 },
  ];
  if (el.lambda <= el.lambdaP) {
    contas.push({ simbolo: v('M', 'Rk'), formula: v('M', 'pl'), valor: el.Mrk, unidade: 'kN·cm', rotulo: el.ramo });
  } else if (el.lambda <= el.lambdaR) {
    contas.push(def.Mr, {
      simbolo: v('M', 'Rk'),
      formula: x(v('M', 'pl'), ' − ', par(x(v('M', 'pl'), ' − ', v('M', 'r'))), ' ', fr(x(v('λ'), ' − ', v('λ', 'p')), x(v('λ', 'r'), ' − ', v('λ', 'p')))),
      numeros: x(n(Mpl), ' − ', par(x(n(Mpl), ' − ', n(el.Mr))), ' · ', fr(x(n(el.lambda, 2), ' − ', n(el.lambdaP, 2)), x(n(el.lambdaR, 2), ' − ', n(el.lambdaP, 2)))),
      valor: el.Mrk,
      unidade: 'kN·cm',
      rotulo: el.ramo,
    });
  } else if (Number.isFinite(el.Mrk)) {
    contas.push({
      simbolo: v('M', 'Rk'),
      formula: fr(x('0,69 ', v('E'), ' ', v('W', def.eixo)), pot(v('λ'), 2)),
      numeros: fr(x('0,69 · ', n(E), ' · ', n(def.W)), pot(n(el.lambda, 2), 2)),
      valor: el.Mrk,
      unidade: 'kN·cm',
      rotulo: el.ramo,
    });
  } else {
    contas.push({ simbolo: v('M', 'Rk'), texto: 'alma esbelta — Anexo E, fora do alcance desta calculadora', rotulo: el.ramo });
  }
  return { ref, titulo, contas };
}

function contaMpl(eixo: 'x' | 'y', Z: number, W: number, fy: number, Mpl: number, teto: number): Conta[] {
  return [
    { simbolo: v('M', 'pl'), formula: x(v('Z', eixo), ' ', v('f', 'y')), numeros: x(n(Z), ' · ', n(fy)), valor: Mpl, unidade: 'kN·cm' },
    {
      simbolo: x('1,50 ', v('W', eixo), ' ', v('f', 'y')),
      numeros: x('1,50 · ', n(W), ' · ', n(fy)),
      valor: teto,
      unidade: 'kN·cm',
      rotulo: teto < Mpl ? 'menor que Mpl — o teto comanda' : 'maior que Mpl',
    },
  ];
}

function fecho(simbolo: string, componentes: Array<[string, number]>, MRd: number, MSd: number): Passo {
  const razao = MSd / MRd;
  const nomes = componentes.map(([k]) => k).join('; ');
  return {
    ref: '5.4.2.1; 5.4.2.2',
    titulo: 'Momento fletor resistente de cálculo',
    contas: [
      {
        simbolo: v('M', `${simbolo},Rd`),
        formula: fr(x(`mín(${nomes})`), v('γ', 'a1')),
        numeros: fr(x('mín(', ...componentes.flatMap(([, M], i) => (i ? ['; ', n(M)] : [n(M)])), ')'), n(GAMA_A1, 2)),
        valor: MRd,
        unidade: 'kN·cm',
      },
      {
        simbolo: fr(v('M', `${simbolo},Sd`), v('M', `${simbolo},Rd`)),
        numeros: fr(n(MSd), n(MRd)),
        valor: razao,
        casas: 3,
        rotulo: razao <= 1 ? '≤ 1,0' : '> 1,0',
      },
    ],
  };
}

export interface ResultadoFlexaoX {
  MSd: number;
  Mpl: number;
  teto: number;
  flm: EstadoLimiteLocal;
  fla: EstadoLimiteLocal;
  flt: ResultadoFlt;
  MRd: number;
  governa: string;
  verificacao: Verificacao;
}

export function verificarFlexaoX(s: SecaoI, aco: Aco, L: Comprimentos, MSd: number): ResultadoFlexaoX {
  const fy = aco.fy;
  const Mpl = s.Zx * fy;
  const teto = 1.5 * s.Wx * fy;
  const eFlm = flm(s, fy, s.Wx, Mpl);
  const eFla = fla(s, fy, Mpl);
  const eFlt = flambagemLateralComTorcao(s, fy, L.Lt, L.Cb, Mpl);

  const candidatos: Array<[string, number]> = [
    ['FLM', eFlm.Mrk],
    ['FLA', eFla.Mrk],
    ['FLT', eFlt.Mrk],
    ['1,50 Wx fy', teto],
  ];
  // Alma esbelta (NaN) não pode sumir do mínimo: ela torna a verificação
  // impossível aqui, e o resultado tem de dizer isso, não passar calado.
  const MRk = candidatos.some(([, M]) => Number.isNaN(M)) ? NaN : Math.min(...candidatos.map(([, M]) => M));
  // Seção compacta e travada: FLM, FLA e FLT dão todos Mpl, e dizer "FLM"
  // apontaria um estado-limite que não está reduzindo nada.
  const governa = Number.isNaN(MRk)
    ? 'FLA (alma esbelta)'
    : MRk === Mpl
      ? 'plastificação'
      : (candidatos.find(([, M]) => M === MRk)?.[0] ?? '');
  const MRd = MRk / GAMA_A1;
  const avisos = Number.isNaN(MRk) ? ['Alma esbelta (Anexo E) — fora do alcance desta calculadora.'] : [];
  const razao = Math.abs(MSd) / MRd;

  const passos: Passo[] = [
    { ref: '5.4.2.2; D.2', titulo: 'Momento de plastificação e teto da análise elástica', contas: contaMpl('x', s.Zx, s.Wx, fy, Mpl, teto) },
    passoLocal('D.2.2; Tabela D.1; D.2.8-f', 'Flambagem local da mesa comprimida (FLM)', eFlm, fy, Mpl, {
      lambda: { simbolo: v('λ'), formula: fr(v('b', 'f'), x('2 ', v('t', 'f'))), numeros: fr(n(s.bf), x('2 · ', n(s.tf))), valor: eFlm.lambda, casas: 2 },
      kp: 0.38,
      kr: 'flm',
      Mr: { simbolo: v('M', 'r'), formula: x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'x')), numeros: x(par(x(n(fy), ' − ', n(0.3 * fy))), ' · ', n(s.Wx)), valor: eFlm.Mr, unidade: 'kN·cm' },
      W: s.Wx,
      eixo: 'x',
    }),
    passoLocal('D.2.2; Tabela D.1', 'Flambagem local da alma (FLA)', eFla, fy, Mpl, {
      lambda: { simbolo: v('λ'), formula: fr(v('h'), v('t', 'w')), numeros: fr(n(s.h), n(s.tw)), valor: eFla.lambda, casas: 2 },
      kp: 3.76,
      kr: 'fla',
      Mr: { simbolo: v('M', 'r'), formula: x(v('f', 'y'), ' ', v('W', 'x')), numeros: x(n(fy), ' · ', n(s.Wx)), valor: eFla.Mr, unidade: 'kN·cm' },
      W: s.Wx,
      eixo: 'x',
    }),
    ...eFlt.passos,
    fecho('x', candidatos, MRd, Math.abs(MSd)),
  ];

  return {
    MSd,
    Mpl,
    teto,
    flm: eFlm,
    fla: eFla,
    flt: eFlt,
    MRd,
    governa,
    verificacao: {
      chave: 'flexaoX',
      titulo: 'Flexão em X',
      item: '5.4.2',
      sd: Math.abs(MSd),
      rd: MRd,
      unidade: 'kN·cm',
      razao,
      situacao: situacaoPelaRazao(razao, avisos),
      governa,
      passos,
      avisos,
    },
  };
}

export interface ResultadoFlexaoY {
  MSd: number;
  Mpl: number;
  teto: number;
  flm: EstadoLimiteLocal;
  MRd: number;
  governa: string;
  verificacao: Verificacao;
}

export function verificarFlexaoY(s: SecaoI, aco: Aco, MSd: number): ResultadoFlexaoY {
  const fy = aco.fy;
  const Mpl = s.Zy * fy;
  const teto = 1.5 * s.Wy * fy;
  const eFlm = flm(s, fy, s.Wy, Mpl);
  const candidatos: Array<[string, number]> = [
    ['FLM', eFlm.Mrk],
    ['1,50 Wy fy', teto],
  ];
  const MRk = Math.min(eFlm.Mrk, teto);
  const governa = MRk === teto ? '1,50 Wy fy' : 'FLM';
  const MRd = MRk / GAMA_A1;
  const razao = Math.abs(MSd) / MRd;

  const passos: Passo[] = [
    { ref: '5.4.2.2; D.2', titulo: 'Momento de plastificação e teto da análise elástica', contas: contaMpl('y', s.Zy, s.Wy, fy, Mpl, teto) },
    passoLocal('D.2.2; Tabela D.1; D.2.8-c, -f', 'Flambagem local da mesa (FLM)', eFlm, fy, Mpl, {
      lambda: { simbolo: v('λ'), formula: fr(v('b', 'f'), x('2 ', v('t', 'f'))), numeros: fr(n(s.bf), x('2 · ', n(s.tf))), valor: eFlm.lambda, casas: 2 },
      kp: 0.38,
      kr: 'flm',
      Mr: { simbolo: v('M', 'r'), formula: x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'y')), numeros: x(par(x(n(fy), ' − ', n(0.3 * fy))), ' · ', n(s.Wy)), valor: eFlm.Mr, unidade: 'kN·cm' },
      W: s.Wy,
      eixo: 'y',
    }),
    fecho('y', candidatos, MRd, Math.abs(MSd)),
  ];

  return {
    MSd,
    Mpl,
    teto,
    flm: eFlm,
    MRd,
    governa,
    verificacao: {
      chave: 'flexaoY',
      titulo: 'Flexão em Y',
      item: '5.4.2',
      sd: Math.abs(MSd),
      rd: MRd,
      unidade: 'kN·cm',
      razao,
      situacao: situacaoPelaRazao(razao),
      governa,
      passos,
      avisos: [],
    },
  };
}
