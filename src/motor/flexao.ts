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

import { contaKc, type KcDaMesa } from './compressao';
import { almaEsbelta, fatorRm, flexaoXDeUmLado, limiteDaAlmaEsbelta, type FlexaoDeUmLado } from './flexaoSoldado';
import { flambagemLateralComTorcao, type ResultadoFlt } from './flt';
import { ladoComprimido, ladosAVerificar, type Mesa } from './ladoComprimido';
import { fr, n, pot, rz, situacaoPelaRazao, v, x, par, type Conta, type Passo, type Verificacao } from './memoria';
import { E, GAMA_A1, type SecaoI } from './secao';
import type { Aco, Comprimentos, Curvatura } from './tipos';

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

export function tresTrechos(lambda: number, lambdaP: number, lambdaR: number, Mpl: number, Mr: number, Mcr: number): EstadoLimiteLocal {
  if (lambda <= lambdaP) return { lambda, lambdaP, lambdaR, Mr, Mcr, Mrk: Mpl, ramo: 'λ ≤ λp' };
  if (lambda <= lambdaR)
    return { lambda, lambdaP, lambdaR, Mr, Mcr, Mrk: Mpl - ((Mpl - Mr) * (lambda - lambdaP)) / (lambdaR - lambdaP), ramo: 'λp < λ ≤ λr' };
  return { lambda, lambdaP, lambdaR, Mr, Mcr, Mrk: Mcr, ramo: 'λ > λr' };
}

/**
 * FLM (Tabela D.1, D.2.8-e, -f, -h), num eixo. O λ é o b/t da mesa: bf/(2tf)
 * no I, bf/tf no U (D.2.8-h). Com `kc`, é a FLM de perfil SOLDADO do D.2.8-f:
 * λr = 0,95·√(E/((fy − σr)/kc)) e Mcr = 0,90·E·kc·W/λ². Sem ele, a de laminado.
 */
export function flm(lambda: number, fy: number, W: number, Mpl: number, kc?: number): EstadoLimiteLocal {
  const sigmaR = 0.3 * fy;
  return tresTrechos(
    lambda,
    0.38 * Math.sqrt(E / fy),
    kc ? 0.95 * Math.sqrt(E / ((fy - sigmaR) / kc)) : 0.83 * Math.sqrt(E / (fy - sigmaR)),
    Mpl,
    (fy - sigmaR) * W,
    kc ? (0.9 * E * kc * W) / lambda ** 2 : (0.69 * E * W) / lambda ** 2,
  );
}

/** O kc da seção, quando ela é soldada, no formato da conta da memória. */
export function kcDaSecao(s: SecaoI): KcDaMesa | undefined {
  return s.soldado ? { ...s.soldado, h: s.h, tw: s.tw } : undefined;
}

/** FLA no eixo forte (Tabela D.1). Acima de λr a viga é de alma esbelta: Anexo E. */
export function fla(s: Pick<SecaoI, 'h' | 'tw' | 'Wx'>, fy: number, Mpl: number): EstadoLimiteLocal {
  const lambda = s.h / s.tw;
  const lambdaP = 3.76 * Math.sqrt(E / fy);
  const lambdaR = 5.7 * Math.sqrt(E / fy);
  const Mr = fy * s.Wx;
  if (lambda > lambdaR) return { lambda, lambdaP, lambdaR, Mr, Mcr: NaN, Mrk: NaN, ramo: 'λ > λr — alma esbelta' };
  return tresTrechos(lambda, lambdaP, lambdaR, Mpl, Mr, NaN);
}

export function passoLocal(
  ref: string,
  titulo: string,
  el: EstadoLimiteLocal,
  fy: number,
  Mpl: number,
  def: { lambda: Conta; kp: number; kr: string; Mr: Conta; W: number; eixo: string; kc?: KcDaMesa },
): Passo {
  const kc = def.kr === 'flm' ? def.kc : undefined;
  const contas: Conta[] = [
    def.lambda,
    { simbolo: v('λ', 'p'), formula: x(n(def.kp, 2), ' ', rz(fr(v('E'), v('f', 'y')))), numeros: x(n(def.kp, 2), ' · ', rz(fr(n(E), n(fy)))), valor: el.lambdaP, casas: 2 },
    ...(kc ? [contaKc(kc)] : []),
    def.kr === 'fla'
      ? { simbolo: v('λ', 'r'), formula: x('5,70 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('5,70 · ', rz(fr(n(E), n(fy)))), valor: el.lambdaR, casas: 2 }
      : kc
        ? {
            simbolo: v('λ', 'r'),
            formula: x('0,95 ', rz(fr(v('E'), par(x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), '/', v('k', 'c')))))),
            numeros: x('0,95 · ', rz(fr(n(E), par(x(par(x(n(fy), ' − ', n(0.3 * fy))), '/', n(kc.kc, 3)))))),
            valor: el.lambdaR,
            casas: 2,
          }
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
  } else if (Number.isFinite(el.Mrk) && kc) {
    contas.push({
      simbolo: v('M', 'Rk'),
      formula: fr(x('0,90 ', v('E'), ' ', v('k', 'c'), ' ', v('W', def.eixo)), pot(v('λ'), 2)),
      numeros: fr(x('0,90 · ', n(E), ' · ', n(kc.kc, 3), ' · ', n(def.W)), pot(n(el.lambda, 2), 2)),
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
    contas.push({ simbolo: v('M', 'Rk'), texto: 'viga de alma esbelta — Anexo E, ainda fora desta calculadora', rotulo: el.ramo });
  }
  return { ref, titulo, contas };
}

export function contaMpl(eixo: 'x' | 'y', Z: number, W: number, fy: number, Mpl: number, teto: number): Conta[] {
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

export function fecho(simbolo: string, componentes: Array<[string, number]>, MRd: number, MSd: number): Passo {
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
  /** Só no soldado do caminho novo: a mesa que governou (a tela 3D acende ela). */
  mesaComprimida?: Mesa;
  /** Só na curvatura reversa com mesas diferentes: o Rm que multiplicou o Cb. */
  Rm?: number;
}

/**
 * O I soldado sai deste arquivo quando tem mesas diferentes (linha 2 da
 * Tabela D.1) ou alma esbelta (Anexo E): os dois dependem da mesa comprimida,
 * e moram em `flexaoSoldado.ts`. O resto — laminados e soldados de mesas
 * iguais com alma não esbelta — segue a linha 1, aqui embaixo.
 */
export function verificarFlexaoX(s: SecaoI, aco: Aco, L: Comprimentos, MSd: number, curvatura: Curvatura = 'simples'): ResultadoFlexaoX {
  if (s.geo && (s.monossimetrico || almaEsbelta(ladoComprimido(s.geo, 'superior'), s.tw, aco.fy))) return flexaoXDoSoldado(s, aco, L, MSd, curvatura);
  const fy = aco.fy;
  const Mpl = s.Zx * fy;
  const teto = 1.5 * s.Wx * fy;
  const kc = kcDaSecao(s);
  const eFlm = flm(s.bf / 2 / s.tf, fy, s.Wx, Mpl, kc?.kc);
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
  // ⚠️ ALMA ESBELTA SAI "AVALIAR", NÃO "NÃO ATENDE" (pedido dele, 04/11/2026,
  // com o soldado: chapa fina de alma alta é o caso comum de viga soldada).
  // A viga de alma esbelta tem resistência — pelo Anexo E, que ainda não está
  // aqui. Reprovar diria que o perfil não serve, e isso a conta não sabe.
  const avisos = Number.isNaN(MRk)
    ? [`Alma esbelta: h/tw = ${eFla.lambda.toFixed(1).replace('.', ',')} > 5,70·√(E/fy) = ${eFla.lambdaR.toFixed(1).replace('.', ',')} — o momento resistente é o do Anexo E (viga de alma esbelta), ainda fora desta calculadora.`]
    : [];
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
      kc,
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
      situacao: Number.isNaN(razao) ? 'avaliar' : situacaoPelaRazao(razao, avisos),
      governa,
      passos,
      avisos,
    },
  };
}

function flexaoXDoSoldado(s: SecaoI, aco: Aco, L: Comprimentos, MSd: number, curvatura: Curvatura): ResultadoFlexaoX {
  const fy = aco.fy;
  const g = s.geo!;
  const reversa = curvatura === 'reversa' && !g.iguais;
  // Mesas iguais: os dois lados dão o mesmo número — basta um, o do sinal
  // (para a memória dizer a mesa certa).
  const lados: Mesa[] = g.iguais ? [MSd >= 0 ? 'superior' : 'inferior'] : ladosAVerificar(MSd, reversa);
  const Rm = fatorRm(g, reversa);
  const Cb = L.Cb * Rm;
  const r = lados.map((q) => flexaoXDeUmLado(s, fy, L.Lt, Cb, q));
  const pior = r.reduce((a, b): FlexaoDeUmLado => (b.MRk < a.MRk ? b : a));
  const Mpl = s.Zx * fy;
  const W = Math.min(...r.map((x) => Math.min(x.lado.Wc, x.lado.Wt)));
  const teto = 1.5 * W * fy;
  // E.5.2 e E.5.3-b: a viga de alma esbelta (h/tw > 5,70·√(E/fy)) que passa
  // do limite de h/tw não é admitida — sem momento resistente.
  const hTw = g.hw / s.tw;
  const esbeltaE52 = hTw > 5.7 * Math.sqrt(E / fy);
  const lim = limiteDaAlmaEsbelta(g.hw, L.a, fy);
  const naoAdmitida = esbeltaE52 && hTw > lim.limite;
  const MRk = naoAdmitida ? NaN : pior.MRk;
  const MRd = MRk / GAMA_A1;
  const razao = Math.abs(MSd) / MRd;
  const fora = r.some((x) => x.foraDosLimites);
  const avisos = [
    ...(naoAdmitida
      ? [`Alma com h/tw = ${hTw.toFixed(1).replace('.', ',')} acima do limite de ${lim.limite.toFixed(1).replace('.', ',')} (E.5.3-b, ${lim.regra}): a norma não admite esta viga.`]
      : []),
    ...new Set(r.flatMap((x) => x.avisos)),
  ];
  const governa = naoAdmitida ? 'viga não admitida (E.5.3-b)' : `${pior.governa}${pior.anexo === 'E' ? ' (Anexo E)' : ''}${lados.length > 1 || !g.iguais ? ` — ${pior.lado.qual === 'superior' ? 'mesa superior' : 'mesa inferior'}` : ''}`;
  const passos: Passo[] = [];
  if (esbeltaE52)
    passos.push({
      ref: 'E.5.2; E.5.3-b',
      titulo: 'Limite de h/tw da viga de alma esbelta',
      contas: [
        {
          simbolo: fr(v('h'), v('t', 'w')),
          numeros: fr(n(g.hw), n(s.tw)),
          valor: hTw,
          casas: 2,
          rotulo: naoAdmitida
            ? `> ${lim.limite.toFixed(1).replace('.', ',')} (${lim.regra}): não admitida`
            : `entre 5,70·√(E/fy) e ${lim.limite.toFixed(1).replace('.', ',')} (${lim.regra})`,
        },
      ],
    });
  if (pior.anexo === 'D' || r.some((x) => x.anexo === 'D')) passos.push({ ref: '5.4.2.2; D.2', titulo: 'Momento de plastificação e teto da análise elástica', contas: contaMpl('x', s.Zx, W, fy, Mpl, teto) });
  if (Rm !== 1)
    passos.push({
      ref: '5.4.2.3; D.2.8-j',
      titulo: 'Curvatura reversa na seção monossimétrica',
      contas: [
        {
          simbolo: v('R', 'm'),
          formula: x('0,5 + 2 ', pot(par(fr(v('I', 'y,m'), v('I', 'y'))), 2)),
          numeros: x('0,5 + 2 · ', pot(par(fr(n(Math.min(g.Iys, g.Iyi)), n(s.Iy))), 2)),
          valor: Rm,
          casas: 4,
        },
        { simbolo: v('C', 'b'), formula: x(v('C', 'b'), ' ', v('R', 'm')), numeros: x(n(L.Cb, 3), ' · ', n(Rm, 4)), valor: Cb, casas: 3, rotulo: 'as duas mesas são verificadas' },
      ],
    });
  for (const x0 of r) passos.push(...x0.passos);
  const candidatos: Array<[string, number]> = r.length > 1 ? r.map((x0) => [x0.lado.qual === 'superior' ? 'mesa superior' : 'mesa inferior', x0.MRk]) : pior.candidatos;
  if (!naoAdmitida) passos.push(fecho('x', candidatos, MRd, Math.abs(MSd)));
  return {
    MSd,
    Mpl,
    teto,
    flm: pior.flm,
    fla: pior.fla,
    flt: pior.flt,
    MRd,
    governa,
    mesaComprimida: pior.lado.qual,
    Rm,
    verificacao: {
      chave: 'flexaoX',
      titulo: 'Flexão em X',
      item: '5.4.2',
      sd: Math.abs(MSd),
      rd: MRd,
      unidade: 'kN·cm',
      razao,
      situacao: naoAdmitida ? 'naoAtende' : razao > 1 ? 'naoAtende' : fora ? 'avaliar' : situacaoPelaRazao(razao),
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
  /** No U com a alma comprimida (My < 0) não há FLM: vale a FLA (D.2.8-c). */
  flm?: EstadoLimiteLocal;
  fla?: EstadoLimiteLocal;
  MRd: number;
  governa: string;
  verificacao: Verificacao;
}

export function verificarFlexaoY(s: SecaoI, aco: Aco, MSd: number): ResultadoFlexaoY {
  const fy = aco.fy;
  const Mpl = s.Zy * fy;
  const teto = 1.5 * s.Wy * fy;
  const kc = kcDaSecao(s);
  // Mesas diferentes: as pontas das DUAS mesas são comprimidas pelo My; vale
  // a de b/t maior (a mais esbelta), com o Wy da seção.
  const g = s.geo;
  const mesaY = g && !g.iguais && g.bi / g.ti > g.bs / g.ts ? { bf: g.bi, tf: g.ti } : { bf: s.bf, tf: s.tf };
  const eFlm = flm(mesaY.bf / 2 / mesaY.tf, fy, s.Wy, Mpl, kc?.kc);
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
    passoLocal('D.2.2; Tabela D.1; D.2.8-c, -f', g && !g.iguais ? `Flambagem local da mesa (FLM) — mesa ${mesaY.bf === g.bs && mesaY.tf === g.ts ? 'superior' : 'inferior'}, a de b/t maior` : 'Flambagem local da mesa (FLM)', eFlm, fy, Mpl, {
      lambda: { simbolo: v('λ'), formula: fr(v('b', 'f'), x('2 ', v('t', 'f'))), numeros: fr(n(mesaY.bf), x('2 · ', n(mesaY.tf))), valor: eFlm.lambda, casas: 2 },
      kp: 0.38,
      kr: 'flm',
      Mr: { simbolo: v('M', 'r'), formula: x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'y')), numeros: x(par(x(n(fy), ' − ', n(0.3 * fy))), ' · ', n(s.Wy)), valor: eFlm.Mr, unidade: 'kN·cm' },
      W: s.Wy,
      eixo: 'y',
      kc,
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
