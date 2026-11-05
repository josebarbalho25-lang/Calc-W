// ═══════════════════════════════════════════════════════════════════════════
//  motor/cantoneira.ts — momento fletor e força cortante da cantoneira
//  simples, pelo AISC 360-22 (F10 e G3)
// ---------------------------------------------------------------------------
//  A NBR 8800:2024 não dá momento nem cortante resistente para a cantoneira
//  simples: o 5.4.1.1 lista I, H, T, dupla cantoneira em T, U, caixão, tubo e
//  seção sólida, e o 5.4.3.4 é só da dupla em T. O 5.3.5.4.5 manda a
//  cantoneira com força transversal para "força axial e momentos fletores"
//  sem dizer de onde sai o momento resistente.
//
//  Decisão dele (01/11/2026): a flexão sai do AISC 360-22, F10, e o cortante
//  do G3, com a memória dizendo que é fora da NBR. O resistente nominal do
//  AISC é dividido pelo γa1 = 1,10 da NBR (não pelo φ do AISC), e a
//  interação é a do 5.5.1.2 da NBR, com os momentos nos eixos principais —
//  é o que o 5.3.5.4.5 pede.
//
//  ⚠️ EIXOS PRINCIPAIS SEMPRE. O F10 permite o eixo geométrico só com
//  contenção lateral contínua; aqui a conta é sempre nos principais (u, o de
//  maior inércia; v, o do rmín) — os momentos digitados em x e y são girados.
//  Lt = 0 (contenção contínua) só tira a FLT.
//
//  ⚠️ O βw DAS ABAS DESIGUAIS NÃO ESTÁ NA ESPECIFICAÇÃO: o F10-4 manda ao
//  Comentário, que não veio no PDF. Até ele chegar, a FLT no eixo u da
//  cantoneira desigual (com Lt > 0) fica "avaliar". Nas de abas iguais o
//  próprio F10.2 dá βw = 0.
// ═══════════════════════════════════════════════════════════════════════════

import { fr, n, par, pot, rz, situacaoPelaRazao, v, x, type Conta, type Passo, type Verificacao } from './memoria';
import { E, GAMA_A1, type SecaoL } from './secao';

/** Os seis cantos da cantoneira (canto vivo), nos eixos principais, cm. */
interface Cantos {
  todos: Array<[number, number]>;
  /** Ponta da aba maior (vertical) e da menor (deitada). */
  pontaMaior: Array<[number, number]>;
  pontaMenor: Array<[number, number]>;
}

function cantos(s: SecaoL): Cantos {
  const { xg, yg } = s;
  const c = Math.cos(s.alfa);
  const sn = Math.sin(s.alfa);
  const p = (x0: number, y0: number): [number, number] => [x0 * c + y0 * sn, -x0 * sn + y0 * c];
  const A = p(-xg, -yg);
  const B = p(s.bmenor - xg, -yg);
  const C = p(s.bmenor - xg, s.t - yg);
  const D = p(s.t - xg, s.t - yg);
  const F = p(s.t - xg, s.b - yg);
  const G = p(-xg, s.b - yg);
  return { todos: [A, B, C, D, F, G], pontaMaior: [F, G], pontaMenor: [B, C] };
}

/** Os momentos digitados (eixos das abas) girados para os principais. */
export function momentosPrincipais(alfa: number, Mx: number, My: number): { Mu: number; Mv: number } {
  // Mx > 0 comprime o lado y > 0 e My > 0 o lado x > 0: o par (My, Mx) é a
  // direção que comprime, e gira como vetor. Mu > 0 comprime o lado v > 0;
  // Mv > 0, o lado u > 0.
  const c = Math.cos(alfa);
  const s = Math.sin(alfa);
  return { Mu: Mx * c - My * s, Mv: Mx * s + My * c };
}

export interface ResultadoFlexaoCantoneira {
  eixo: 'u' | 'v';
  MSd: number;
  /** NaN quando falta a FLT da desigual (sem o βw). */
  MRd: number;
  governa: string;
  verificacao: Verificacao;
}

/** F10 num eixo principal, para um momento com sinal. */
export function flexaoDaCantoneira(s: SecaoL, fy: number, eixo: 'u' | 'v', M: number, Lb: number, Cb: number): ResultadoFlexaoCantoneira {
  const k = cantos(s);
  const I = eixo === 'u' ? s.Iu : s.Iv;
  // Coordenada que a flexão neste eixo estica ou encurta: v para Mu, u para Mv.
  const d = (q: [number, number]) => (eixo === 'u' ? q[1] : q[0]);
  const sinal = M >= 0 ? 1 : -1;
  const cMax = Math.max(...k.todos.map((q) => Math.abs(d(q))));
  const My = (fy * I) / cMax;
  const nomeEixo = eixo === 'u' ? 'u (maior inércia)' : 'v (menor inércia)';
  const candidatos: Array<[string, number]> = [['escoamento', 1.5 * My]];
  const contas: Conta[] = [
    { simbolo: v('M', `${eixo},Sd`), valor: Math.abs(M), unidade: 'kN·cm', rotulo: M === 0 ? undefined : M > 0 ? `comprime o lado ${eixo === 'u' ? 'v' : 'u'} > 0` : `comprime o lado ${eixo === 'u' ? 'v' : 'u'} < 0` },
    { simbolo: v('c', 'máx'), valor: cMax, casas: 3, unidade: 'cm', rotulo: 'canto mais distante do eixo' },
    { simbolo: v('M', 'y'), formula: x(v('f', 'y'), ' ', fr(v('I', eixo), v('c', 'máx'))), numeros: x(n(fy), ' · ', fr(n(I), n(cMax, 3))), valor: My, unidade: 'kN·cm' },
    { simbolo: x(v('M', 'n'), ' (F10-1)'), formula: x('1,5 ', v('M', 'y')), numeros: x('1,5 · ', n(My)), valor: 1.5 * My, unidade: 'kN·cm' },
  ];
  const passos: Passo[] = [{ ref: 'AISC 360-22, F10.1', titulo: `Escoamento — eixo ${nomeEixo}`, contas }];
  const avisos: string[] = [];
  let semBetaW = false;

  // FLT: só no eixo u (nota do F10) e só sem contenção contínua (Lb > 0).
  if (eixo === 'u' && Lb > 0 && M !== 0) {
    if (!s.iguais) {
      semBetaW = true;
      avisos.push('FLT da cantoneira de abas desiguais (F10-4) pede o βw do Comentário do AISC 360-22, que não está na pasta das fontes.');
      passos.push({ ref: 'AISC 360-22, F10.2', titulo: 'Flambagem lateral com torção', contas: [{ simbolo: v('β', 'w'), texto: 'abas desiguais: fórmula no Comentário do AISC 360-22 — fonte ausente' }] });
    } else {
      const CbF = Math.min(Cb, 1.5);
      const rMin = s.rv;
      // βw = 0 nas de abas iguais (F10.2): o colchete do F10-4 vale 1.
      const Mcr = (9 * E * s.A * rMin * s.t * CbF) / (8 * Lb);
      const razao = My / Mcr;
      const Mn = razao <= 1 ? Math.min((1.92 - 1.17 * Math.sqrt(razao)) * My, 1.5 * My) : (0.92 - (0.17 * Mcr) / My) * Mcr;
      candidatos.push(['FLT', Mn]);
      passos.push({
        ref: 'AISC 360-22, F10.2',
        titulo: 'Flambagem lateral com torção — abas iguais, βw = 0',
        contas: [
          { simbolo: v('C', 'b'), formula: x('mín(', v('C', 'b'), '; 1,5)'), valor: CbF, casas: 2 },
          {
            simbolo: x(v('M', 'cr'), ' (F10-4)'),
            formula: fr(x('9 ', v('E'), ' ', v('A', 'g'), ' ', v('r', 'z'), ' ', v('t'), ' ', v('C', 'b')), x('8 ', v('L', 'b'))),
            numeros: fr(x('9 · ', n(E), ' · ', n(s.A), ' · ', n(rMin, 3), ' · ', n(s.t), ' · ', n(CbF, 2)), x('8 · ', n(Lb))),
            valor: Mcr,
            unidade: 'kN·cm',
          },
          { simbolo: fr(v('M', 'y'), v('M', 'cr')), numeros: fr(n(My), n(Mcr)), valor: razao, casas: 3 },
          razao <= 1
            ? {
                simbolo: x(v('M', 'n'), ' (F10-2)'),
                formula: x(par(x('1,92 − 1,17 ', rz(fr(v('M', 'y'), v('M', 'cr'))))), ' ', v('M', 'y'), ' ≤ 1,5 ', v('M', 'y')),
                numeros: x(par(x('1,92 − 1,17 · ', rz(n(razao, 3)))), ' · ', n(My)),
                valor: Mn,
                unidade: 'kN·cm',
                rotulo: 'My/Mcr ≤ 1,0',
              }
            : {
                simbolo: x(v('M', 'n'), ' (F10-3)'),
                formula: x(par(x('0,92 − ', fr(x('0,17 ', v('M', 'cr')), v('M', 'y')))), ' ', v('M', 'cr')),
                numeros: x(par(x('0,92 − ', fr(x('0,17 · ', n(Mcr)), n(My)))), ' · ', n(Mcr)),
                valor: Mn,
                unidade: 'kN·cm',
                rotulo: 'My/Mcr > 1,0',
              },
        ],
      });
    }
  }

  // Flambagem local da aba: só a aba com a PONTA comprimida (F10.3).
  const lp = 0.54 * Math.sqrt(E / fy);
  const lr = 0.91 * Math.sqrt(E / fy);
  for (const [nome, ponta, b] of [['maior', k.pontaMaior, s.b], ['menor', k.pontaMenor, s.bmenor]] as const) {
    if (s.iguais && nome === 'menor' && candidatos.some(([c]) => c.startsWith('FLL'))) continue;
    const comp = Math.max(...ponta.map((q) => sinal * d(q)));
    if (!(comp > 0) || M === 0) continue;
    const lambda = b / s.t;
    const Sc = I / comp;
    const aba = s.iguais ? 'aba' : `aba ${nome}`;
    const contasL: Conta[] = [
      { simbolo: x(v('b'), '/', v('t')), numeros: fr(n(b), n(s.t)), valor: lambda, casas: 2 },
      { simbolo: v('λ', 'p'), formula: x('0,54 ', rz(fr(v('E'), v('f', 'y')))), valor: lp, casas: 2 },
      { simbolo: v('λ', 'r'), formula: x('0,91 ', rz(fr(v('E'), v('f', 'y')))), valor: lr, casas: 2 },
    ];
    if (lambda <= lp) {
      contasL.push({ simbolo: v('M', 'n'), texto: 'aba compacta: a flambagem local não se aplica (F10.3-a)' });
    } else {
      contasL.push({ simbolo: v('S', 'c'), formula: fr(v('I', eixo), v('c', 'ponta')), numeros: fr(n(I), n(comp, 3)), valor: Sc, unidade: 'cm³', rotulo: 'até a ponta comprimida' });
      if (lambda <= lr) {
        const Mn = fy * Sc * (2.43 - 1.72 * lambda * Math.sqrt(fy / E));
        candidatos.push([`FLL (${aba})`, Mn]);
        contasL.push({
          simbolo: x(v('M', 'n'), ' (F10-6)'),
          formula: x(v('f', 'y'), ' ', v('S', 'c'), ' ', par(x('2,43 − 1,72 ', fr(v('b'), v('t')), ' ', rz(fr(v('f', 'y'), v('E')))))),
          numeros: x(n(fy), ' · ', n(Sc), ' · ', par(x('2,43 − 1,72 · ', n(lambda, 2), ' · ', rz(fr(n(fy), n(E)))))),
          valor: Mn,
          unidade: 'kN·cm',
          rotulo: 'aba não compacta',
        });
      } else {
        const Fcr = (0.71 * E) / lambda ** 2;
        const Mn = Fcr * Sc;
        candidatos.push([`FLL (${aba})`, Mn]);
        contasL.push(
          { simbolo: x(v('F', 'cr'), ' (F10-8)'), formula: fr(x('0,71 ', v('E')), pot(par(fr(v('b'), v('t'))), 2)), numeros: fr(x('0,71 · ', n(E)), pot(n(lambda, 2), 2)), valor: Fcr, unidade: 'kN/cm²' },
          { simbolo: x(v('M', 'n'), ' (F10-7)'), formula: x(v('F', 'cr'), ' ', v('S', 'c')), numeros: x(n(Fcr), ' · ', n(Sc)), valor: Mn, unidade: 'kN·cm', rotulo: 'aba esbelta' },
        );
      }
    }
    passos.push({ ref: 'AISC 360-22, F10.3; Tabela B4.1b, caso 12', titulo: `Flambagem local da ${aba} (ponta comprimida)`, contas: contasL });
  }

  const Mn = Math.min(...candidatos.map(([, m]) => m));
  const governa = candidatos.find(([, m]) => m === Mn)![0];
  const MRd = semBetaW ? NaN : Mn / GAMA_A1;
  const razao = Math.abs(M) / MRd;
  passos.push({
    ref: 'AISC 360-22, F10; NBR 8800:2024, Tabela 3',
    titulo: 'Momento fletor resistente de cálculo',
    contas: [
      { simbolo: v('M', 'n'), formula: x(`mín(${candidatos.map(([c]) => c).join('; ')})`), valor: Mn, unidade: 'kN·cm' },
      semBetaW
        ? { simbolo: v('M', `${eixo},Rd`), texto: 'sem a FLT (falta o βw) — não calculado' }
        : { simbolo: v('M', `${eixo},Rd`), formula: fr(v('M', 'n'), v('γ', 'a1')), numeros: fr(n(Mn), n(GAMA_A1, 2)), valor: MRd, unidade: 'kN·cm' },
      ...(semBetaW ? [] : [{ simbolo: fr(v('M', `${eixo},Sd`), v('M', `${eixo},Rd`)), numeros: fr(n(Math.abs(M)), n(MRd)), valor: razao, casas: 3, rotulo: razao <= 1 ? '≤ 1,0' : '> 1,0' } as Conta]),
    ],
    nota: 'Fora da NBR 8800:2024 (decisão do engenheiro): resistente nominal do AISC 360-22 dividido pelo γa1 da NBR.',
  });
  return {
    eixo,
    MSd: M,
    MRd,
    governa: semBetaW ? 'FLT sem βw' : governa,
    verificacao: {
      chave: eixo === 'u' ? 'flexaoX' : 'flexaoY',
      titulo: `Flexão em ${eixo}`,
      item: 'AISC F10',
      sd: Math.abs(M),
      rd: MRd,
      unidade: 'kN·cm',
      razao,
      situacao: semBetaW ? 'avaliar' : situacaoPelaRazao(razao),
      governa: semBetaW ? 'FLT sem βw' : governa,
      passos,
      avisos,
    },
  };
}

/** G3: a aba paralela à força resiste, Vn = 0,6·fy·b·t·Cv2, kv = 1,2. */
export function cortanteDaCantoneira(s: SecaoL, fy: number, direcao: 'x' | 'y', V: number): { VRd: number; verificacao: Verificacao } {
  const b = direcao === 'x' ? s.bmenor : s.b;
  const lambda = b / s.t;
  const kv = 1.2;
  const l1 = 1.1 * Math.sqrt((kv * E) / fy);
  const l2 = 1.37 * Math.sqrt((kv * E) / fy);
  const Cv2 = lambda <= l1 ? 1 : lambda <= l2 ? l1 / lambda : (1.51 * kv * E) / (lambda ** 2 * fy);
  const Vn = 0.6 * fy * b * s.t * Cv2;
  const VRd = Vn / GAMA_A1;
  const razao = Math.abs(V) / VRd;
  const aba = s.iguais ? 'a aba' : direcao === 'x' ? 'a aba menor (deitada)' : 'a aba maior (de pé)';
  const contas: Conta[] = [
    { simbolo: x(v('b'), '/', v('t')), numeros: fr(n(b), n(s.t)), valor: lambda, casas: 2, rotulo: `resiste ${aba}` },
    { simbolo: v('k', 'v'), valor: kv, casas: 1 },
    {
      simbolo: v('C', 'v2'),
      ...(lambda <= l1
        ? { formula: x('1,0') }
        : lambda <= l2
          ? { formula: fr(x('1,10 ', rz(fr(x(v('k', 'v'), ' ', v('E')), v('f', 'y')))), x(v('b'), '/', v('t'))) }
          : { formula: fr(x('1,51 ', v('k', 'v'), ' ', v('E')), x(pot(par(fr(v('b'), v('t'))), 2), ' ', v('f', 'y'))) }),
      valor: Cv2,
      casas: 3,
      rotulo: lambda <= l1 ? 'G2-9' : lambda <= l2 ? 'G2-10' : 'G2-11',
    },
    { simbolo: x(v('V', 'n'), ' (G3-1)'), formula: x('0,6 ', v('f', 'y'), ' ', v('b'), ' ', v('t'), ' ', v('C', 'v2')), numeros: x('0,6 · ', n(fy), ' · ', n(b), ' · ', n(s.t), ' · ', n(Cv2, 3)), valor: Vn, unidade: 'kN' },
    { simbolo: v('V', `${direcao},Rd`), formula: fr(v('V', 'n'), v('γ', 'a1')), numeros: fr(n(Vn), n(GAMA_A1, 2)), valor: VRd, unidade: 'kN' },
    { simbolo: fr(v('V', `${direcao},Sd`), v('V', `${direcao},Rd`)), numeros: fr(n(Math.abs(V)), n(VRd)), valor: razao, casas: 3, rotulo: razao <= 1 ? '≤ 1,0' : '> 1,0' },
  ];
  return {
    VRd,
    verificacao: {
      chave: direcao === 'x' ? 'cortanteX' : 'cortanteY',
      titulo: `Cortante em ${direcao.toUpperCase()}`,
      item: 'AISC G3',
      sd: Math.abs(V),
      rd: VRd,
      unidade: 'kN',
      razao,
      situacao: situacaoPelaRazao(razao),
      governa: Cv2 === 1 ? 'escoamento da aba' : 'instabilidade da aba',
      avisos: [],
      passos: [{ ref: 'AISC 360-22, G3; G2.2', titulo: `Força cortante — resiste ${aba}`, contas, nota: 'Fora da NBR 8800:2024 (decisão do engenheiro): resistente nominal do AISC 360-22 dividido pelo γa1 da NBR.' }],
    },
  };
}

/** O passo que gira os momentos digitados para os eixos principais. */
export function passoDosMomentos(alfa: number, Mx: number, My: number): Passo {
  const { Mu, Mv } = momentosPrincipais(alfa, Mx, My);
  return {
    ref: 'AISC 360-22, F10',
    titulo: 'Momentos nos eixos principais',
    contas: [
      { simbolo: v('α'), valor: (alfa * 180) / Math.PI, casas: 2, unidade: '°' },
      { simbolo: v('M', 'u,Sd'), formula: x(v('M', 'x,Sd'), ' cos α − ', v('M', 'y,Sd'), ' sen α'), numeros: x(n(Mx), ' · cos α − ', n(My), ' · sen α'), valor: Mu, unidade: 'kN·cm', rotulo: 'positivo comprime o lado v > 0' },
      { simbolo: v('M', 'v,Sd'), formula: x(v('M', 'x,Sd'), ' sen α + ', v('M', 'y,Sd'), ' cos α'), numeros: x(n(Mx), ' · sen α + ', n(My), ' · cos α'), valor: Mv, unidade: 'kN·cm', rotulo: 'positivo comprime o lado u > 0' },
    ],
  };
}
