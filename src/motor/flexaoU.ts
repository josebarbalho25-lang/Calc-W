// ═══════════════════════════════════════════════════════════════════════════
//  motor/flexaoU.ts — momento fletor resistente do perfil U laminado
//  (NBR 8800:2024, 5.4.2 e Anexo D)
// ---------------------------------------------------------------------------
//  Em X (o eixo de simetria, o forte): a mesma linha da Tabela D.1 do I
//  duplamente simétrico — "seções U não sujeitas a momento de torção" —, com
//  três diferenças: o b/t da mesa é bf/tf (a mesa inteira, D.2.8-h), o Cw é
//  o do U (D.2.8-a) e a carga tem de passar pelo centro de torção ou a torção
//  tem de estar impedida (5.4.1.2). Esta última é premissa: vai na memória.
//
//  Em Y o SINAL MANDA (D.2.8-c). My > 0 comprime as pontas das mesas: só a
//  FLM. My < 0 comprime a alma: só a FLA, com o Wef da alma (D.2.8-d).
//
//  ⚠️ O TETO DE 1,50·W·fy usa o W MÍNIMO (5.4.2.2) — no U em Y é o do lado
//  das pontas, mesmo quando quem está comprimida é a alma.
// ═══════════════════════════════════════════════════════════════════════════

import { chapa } from './compressao';
import { contaMpl, fecho, fla, flm, passoLocal, tresTrechos, type EstadoLimiteLocal, type ResultadoFlexaoX, type ResultadoFlexaoY } from './flexao';
import { flambagemLateralComTorcao } from './flt';
import { fr, n, par, pot, rz, situacaoPelaRazao, v, x, type Conta, type Passo } from './memoria';
import { E, GAMA_A1, type SecaoU } from './secao';
import type { Aco, Comprimentos } from './tipos';

/** O Cw do U pela fórmula do D.2.8-a, escrito (o catálogo traz o mesmo número). */
function passoCw(s: SecaoU): Passo {
  const bl = x(par(x(v('b', 'f'), ' − 0,5 ', v('t', 'w'))));
  const hl = x(par(x(v('d'), ' − ', v('t', 'f'))));
  const bln = par(x(n(s.bf), ' − 0,5 · ', n(s.tw)));
  const hln = par(x(n(s.d), ' − ', n(s.tf)));
  return {
    ref: 'D.2.8-a',
    titulo: 'Constante de empenamento da seção U',
    contas: [
      {
        simbolo: v('C', 'w'),
        formula: x(
          fr(x(v('t', 'f'), ' ', pot(bl, 3), ' ', pot(hl, 2)), 12),
          ' ',
          fr(x('3 ', bl, ' ', v('t', 'f'), ' + 2 ', hl, ' ', v('t', 'w')), x('6 ', bl, ' ', v('t', 'f'), ' + ', hl, ' ', v('t', 'w'))),
        ),
        numeros: x(
          fr(x(n(s.tf), ' · ', pot(bln, 3), ' · ', pot(hln, 2)), 12),
          ' · ',
          fr(x('3 · ', bln, ' · ', n(s.tf), ' + 2 · ', hln, ' · ', n(s.tw)), x('6 · ', bln, ' · ', n(s.tf), ' + ', hln, ' · ', n(s.tw))),
        ),
        valor: s.Cw,
        unidade: 'cm⁶',
      },
    ],
  };
}

export function verificarFlexaoXU(s: SecaoU, aco: Aco, L: Comprimentos, MSd: number): ResultadoFlexaoX {
  const fy = aco.fy;
  const Mpl = s.Zx * fy;
  const teto = 1.5 * s.Wx * fy;
  const eFlm = flm(s.bf / s.tf, fy, s.Wx, Mpl);
  const eFla = fla(s, fy, Mpl);
  const eFlt = flambagemLateralComTorcao(s, fy, L.Lt, L.Cb, Mpl);

  const candidatos: Array<[string, number]> = [
    ['FLM', eFlm.Mrk],
    ['FLA', eFla.Mrk],
    ['FLT', eFlt.Mrk],
    ['1,50 Wx fy', teto],
  ];
  const MRk = candidatos.some(([, M]) => Number.isNaN(M)) ? NaN : Math.min(...candidatos.map(([, M]) => M));
  const governa = Number.isNaN(MRk) ? 'FLA (alma esbelta)' : MRk === Mpl ? 'plastificação' : (candidatos.find(([, M]) => M === MRk)?.[0] ?? '');
  const MRd = MRk / GAMA_A1;
  const avisos = Number.isNaN(MRk) ? ['Alma esbelta (Anexo E) — fora do alcance desta calculadora.'] : [];
  const razao = Math.abs(MSd) / MRd;

  const passos: Passo[] = [
    { ref: '5.4.2.2; D.2', titulo: 'Momento de plastificação e teto da análise elástica', contas: contaMpl('x', s.Zx, s.Wx, fy, Mpl, teto) },
    passoLocal('D.2.2; Tabela D.1; D.2.8-f, -h', 'Flambagem local da mesa comprimida (FLM)', eFlm, fy, Mpl, {
      lambda: { simbolo: v('λ'), formula: fr(v('b', 'f'), v('t', 'f')), numeros: fr(n(s.bf), n(s.tf)), valor: eFlm.lambda, casas: 2, rotulo: 'mesa de U: a largura total' },
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
    passoCw(s),
    ...eFlt.passos.map((p, i) => (i === 0 ? { ...p, nota: 'Carga transversal pelo centro de torção ou torção impedida (5.4.1.2) — premissa desta conta.' } : p)),
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

/**
 * Wef do U em Y com a alma comprimida (D.2.8-d): a alma com a largura
 * efetiva de 5.3.4.2 tomando χ = 1, e o W mínimo da seção que sobra. O
 * pedaço que não colabora sai do eixo da alma (tw/2 da face externa).
 */
export function wefDaAlma(s: SecaoU, fy: number): { hef: number; Wef: number; contas: Conta[] } {
  const c = chapa(2, 'Alma', s.h, s.tw, 1, fy, 1, { b: v('h'), bef: v('h', 'ef'), t: v('t', 'w') });
  const hef = c.bef;
  const contas: Conta[] = [
    { simbolo: x(v('h'), '/', v('t', 'w')), numeros: fr(n(s.h), n(s.tw)), valor: c.bt, casas: 2 },
    { simbolo: x(par(x(v('b'), '/', v('t'))), v('', 'lim')), formula: x('1,49 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('1,49 ', rz(fr(n(E), n(fy)))), valor: c.btLim, casas: 2, rotulo: c.bt <= c.btLim ? 'h/tw ≤ (b/t)lim → hef = h, Wef = Wy' : 'alma com largura efetiva (χ = 1)' },
  ];
  if (hef >= s.h) return { hef, Wef: s.Wy, contas: [...contas, { simbolo: v('W', 'ef'), formula: v('W', 'y'), valor: s.Wy, unidade: 'cm³' }] };
  const dA = (s.h - hef) * s.tw;
  const A1 = s.A - dA;
  const xg1 = (s.A * s.xg - (dA * s.tw) / 2) / A1;
  const Iy1 = s.Iy + s.A * (s.xg - xg1) ** 2 - dA * (s.tw / 2 - xg1) ** 2 - ((s.h - hef) * s.tw ** 3) / 12;
  const Wef = Math.min(Iy1 / xg1, Iy1 / (s.bf - xg1));
  contas.push(
    { simbolo: v('h', 'ef'), valor: hef, casas: 3, unidade: 'cm' },
    { simbolo: v('x', 'g,ef'), formula: fr(x(v('A', 'g'), ' ', v('x', 'g'), ' − ', par(x(v('h'), ' − ', v('h', 'ef'))), ' ', v('t', 'w'), ' ', fr(v('t', 'w'), 2)), x(v('A', 'g'), ' − ', par(x(v('h'), ' − ', v('h', 'ef'))), ' ', v('t', 'w'))), valor: xg1, casas: 3, unidade: 'cm' },
    { simbolo: v('I', 'y,ef'), valor: Iy1, unidade: 'cm⁴' },
    { simbolo: v('W', 'ef'), formula: x('mín', par(x(fr(v('I', 'y,ef'), v('x', 'g,ef')), '; ', fr(v('I', 'y,ef'), x(v('b', 'f'), ' − ', v('x', 'g,ef')))))), valor: Wef, unidade: 'cm³' },
  );
  return { hef, Wef, contas };
}

export function verificarFlexaoYU(s: SecaoU, aco: Aco, MSd: number): ResultadoFlexaoY {
  const fy = aco.fy;
  const Mpl = s.Zy * fy;
  const teto = 1.5 * s.Wy * fy;
  const pontas = MSd >= 0;
  const passos: Passo[] = [
    {
      ref: '5.4.2.2; D.2',
      titulo: 'Momento de plastificação e teto da análise elástica',
      contas: contaMpl('y', s.Zy, s.Wy, fy, Mpl, teto),
      nota: pontas ? 'My ≥ 0: pontas das mesas comprimidas — só a FLM (D.2.8-c).' : 'My < 0: alma comprimida — só a FLA (D.2.8-c).',
    },
  ];
  let el: EstadoLimiteLocal;
  let nome: string;
  if (pontas) {
    el = flm(s.bf / s.tf, fy, s.Wy, Mpl);
    nome = 'FLM';
    passos.push(
      passoLocal('D.2.2; Tabela D.1; D.2.8-c, -f, -h', 'Flambagem local das mesas (FLM)', el, fy, Mpl, {
        lambda: { simbolo: v('λ'), formula: fr(v('b', 'f'), v('t', 'f')), numeros: fr(n(s.bf), n(s.tf)), valor: el.lambda, casas: 2 },
        kp: 0.38,
        kr: 'flm',
        Mr: { simbolo: v('M', 'r'), formula: x(par(x(v('f', 'y'), ' − ', v('σ', 'r'))), ' ', v('W', 'y')), numeros: x(par(x(n(fy), ' − ', n(0.3 * fy))), ' · ', n(s.Wy)), valor: el.Mr, unidade: 'kN·cm' },
        W: s.Wy,
        eixo: 'y',
      }),
    );
  } else {
    const { Wef, contas: contasWef } = wefDaAlma(s, fy);
    const lambda = s.h / s.tw;
    const lambdaP = 1.12 * Math.sqrt(E / fy);
    const lambdaR = 1.4 * Math.sqrt(E / fy);
    // Mcr = Wef²/W · fy: com a alma inteira (Wef = W) ele cai em Mr = fy·W,
    // e os três trechos emendam sem degrau em λr.
    const Mcr = (Wef ** 2 / s.Wy) * fy;
    el = tresTrechos(lambda, lambdaP, lambdaR, Mpl, fy * Wef, Mcr);
    nome = 'FLA';
    const contas: Conta[] = [
      ...contasWef,
      { simbolo: v('λ'), formula: fr(v('h'), v('t', 'w')), numeros: fr(n(s.h), n(s.tw)), valor: lambda, casas: 2 },
      { simbolo: v('λ', 'p'), formula: x('1,12 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('1,12 · ', rz(fr(n(E), n(fy)))), valor: lambdaP, casas: 2 },
      { simbolo: v('λ', 'r'), formula: x('1,40 ', rz(fr(v('E'), v('f', 'y')))), numeros: x('1,40 · ', rz(fr(n(E), n(fy)))), valor: lambdaR, casas: 2 },
    ];
    if (el.lambda <= lambdaP) {
      contas.push({ simbolo: v('M', 'Rk'), formula: v('M', 'pl'), valor: el.Mrk, unidade: 'kN·cm', rotulo: el.ramo });
    } else if (el.lambda <= lambdaR) {
      contas.push(
        { simbolo: v('M', 'r'), formula: x(v('f', 'y'), ' ', v('W', 'ef')), numeros: x(n(fy), ' · ', n(Wef)), valor: el.Mr, unidade: 'kN·cm' },
        {
          simbolo: v('M', 'Rk'),
          formula: x(v('M', 'pl'), ' − ', par(x(v('M', 'pl'), ' − ', v('M', 'r'))), ' ', fr(x(v('λ'), ' − ', v('λ', 'p')), x(v('λ', 'r'), ' − ', v('λ', 'p')))),
          numeros: x(n(Mpl), ' − ', par(x(n(Mpl), ' − ', n(el.Mr))), ' · ', fr(x(n(lambda, 2), ' − ', n(lambdaP, 2)), x(n(lambdaR, 2), ' − ', n(lambdaP, 2)))),
          valor: el.Mrk,
          unidade: 'kN·cm',
          rotulo: el.ramo,
        },
      );
    } else {
      contas.push({ simbolo: v('M', 'Rk'), formula: x(fr(pot(v('W', 'ef'), 2), v('W', 'y')), ' ', v('f', 'y')), numeros: x(fr(pot(n(Wef), 2), n(s.Wy)), ' · ', n(fy)), valor: el.Mrk, unidade: 'kN·cm', rotulo: el.ramo });
    }
    passos.push({ ref: 'D.2.2; Tabela D.1; D.2.8-c, -d', titulo: 'Flambagem local da alma comprimida (FLA)', contas });
  }
  const candidatos: Array<[string, number]> = [
    [nome, el.Mrk],
    ['1,50 Wy fy', teto],
  ];
  const MRk = Math.min(el.Mrk, teto);
  const governa = MRk === teto ? '1,50 Wy fy' : MRk === Mpl ? 'plastificação' : nome;
  const MRd = MRk / GAMA_A1;
  const razao = Math.abs(MSd) / MRd;
  passos.push(fecho('y', candidatos, MRd, Math.abs(MSd)));

  return {
    MSd,
    Mpl,
    teto,
    flm: pontas ? el : undefined,
    fla: pontas ? undefined : el,
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
