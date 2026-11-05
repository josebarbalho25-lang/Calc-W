// ═══════════════════════════════════════════════════════════════════════════
//  motor/flambagemGlobal.ts — a força axial de flambagem elástica Ne de cada
//  família de perfil (NBR 8800:2024, 5.3.5)
// ---------------------------------------------------------------------------
//  · I (W, HP, padrão americano): dupla simetria, o menor de Nex, Ney e Nez
//    (5.3.5.1).
//  · U: monossimétrico, X é o eixo de simetria — Ney sozinho e Nexz, a flexão
//    em X acoplada à torção pelo x0 (5.3.5.2, com a troca de índices do fim do
//    item).
//  · Cantoneira de abas iguais: monossimétrica em relação ao eixo principal u
//    — Nev sozinho e Neuz (5.3.5.2 nos eixos principais).
//  · Cantoneira de abas desiguais: sem simetria, a menor raiz da cúbica
//    (5.3.5.3) nos eixos principais.
//  · Cantoneira de treliça ligada por uma aba: comprimento equivalente
//    (5.3.5.4), quando as condições do 5.3.5.4.1 fecham.
//
//  ⚠️ NA CANTONEIRA, TUDO NOS EIXOS PRINCIPAIS. O 5.3.5.2 e o 5.3.5.3 supõem
//  que a flexão em um eixo não puxa o outro — só vale nos principais. Os
//  comprimentos digitados (Lx, Ly) vão para o eixo principal mais próximo; a
//  45° (abas iguais) os dois levam o maior, a favor (a mesma regra da irmã
//  de formados a frio, que ele aprovou).
// ═══════════════════════════════════════════════════════════════════════════

import { fr, n, par, pot, rz, v, x, type Conta, type Expr, type Passo } from './memoria';
import { E, G, type SecaoI, type SecaoL, type SecaoU } from './secao';
import type { Comprimentos, LigacaoPorUmaAba } from './tipos';

export interface FlambagemGlobal {
  Ne: number;
  /** O modo que dá o menor Ne, por extenso: "flexão em y", "flexo-torção"… */
  modo: string;
  /** Nos eixos do desenho (I e U). Na cantoneira, ver `principais`. */
  Nex: number;
  Ney: number;
  Nez: number;
  /** r0² em relação ao centro de torção, cm². */
  r0q: number;
  /** Só na cantoneira (fora da treliça): os eixos principais. */
  principais?: { Neu: number; Nev: number; KLu: number; KLv: number };
  /** Só na cantoneira de treliça (5.3.5.4). */
  trelica?: { Lx1: number; rx1: number; Lx1eq: number; Nex1: number; aplicavel: boolean };
  /** Esbeltez para o 5.3.7.1: o maior L/r da flexão. */
  esbeltez: number;
  contaEsbeltez: Conta;
  passos: Passo[];
  avisos: string[];
}

/** π²·E·I/L², infinito quando a barra está travada (L = 0). */
export function euler(I: number, L: number): number {
  return L > 0 ? (Math.PI ** 2 * E * I) / L ** 2 : Infinity;
}

/** A conta de π²EI/L², escrita (ou "travada" quando L = 0). */
function contaEuler(simbolo: Expr, Is: Expr, Ls: Expr, I: number, L: number, N: number, rotuloL: string): Conta {
  if (!(L > 0)) return { simbolo, valor: Infinity, texto: `travada (${rotuloL} = 0)` };
  return {
    simbolo,
    formula: fr(x('π² ', v('E'), ' ', Is), pot(Ls, 2)),
    numeros: fr(x('π² · ', n(E), ' · ', n(I)), pot(n(L), 2)),
    valor: N,
    unidade: 'kN',
  };
}

function torcao(Cw: number, J: number, Lz: number, r0q: number): number {
  return Lz > 0 ? ((Math.PI ** 2 * E * Cw) / Lz ** 2 + G * J) / r0q : Infinity;
}

function contaNez(Cw: number, J: number, Lz: number, r0q: number, Nez: number): Conta {
  if (!(Lz > 0)) return { simbolo: v('N', 'ez'), valor: Infinity, texto: 'travada (Lt = 0)' };
  return {
    simbolo: v('N', 'ez'),
    formula: x(fr(1, pot(v('r', '0'), 2)), ' ', par(x(fr(x('π² ', v('E'), ' ', v('C', 'w')), pot(v('L', 'z'), 2)), ' + ', v('G'), ' ', v('J')))),
    numeros: x(fr(1, n(r0q)), ' · ', par(x(fr(x('π² · ', n(E), ' · ', n(Cw)), pot(n(Lz), 2)), ' + ', n(G), ' · ', n(J)))),
    valor: Nez,
    unidade: 'kN',
  };
}

/**
 * A flexo-torção da seção monossimétrica (5.3.5.2-b): a flexão no eixo
 * perpendicular ao de simetria acoplada à torção. `a` é a coordenada do
 * centro de torção ao longo do eixo de simetria.
 */
export function flexoTorcao(Nef: number, Nez: number, a: number, r0q: number): number {
  const k = 1 - a ** 2 / r0q;
  if (!Number.isFinite(Nef) && !Number.isFinite(Nez)) return Infinity;
  // Um dos dois travado: o limite da fórmula é o outro (com Nez → ∞, o
  // colchete vale 2·Nef·k/Nez e sobra Nef). À parte, para não fazer ∞ − ∞.
  if (!Number.isFinite(Nez)) return Nef;
  if (!Number.isFinite(Nef)) return Nez;
  const s = Nef + Nez;
  return (s / (2 * k)) * (1 - Math.sqrt(1 - (4 * Nef * Nez * k) / s ** 2));
}

/**
 * A menor raiz da cúbica do 5.3.5.3. Fica entre 0 e o menor dos três Ne
 * (f(0) < 0 e f(mín) ≥ 0), então a bissecção acha sempre ela.
 */
export function raizDaCubica(Nex: number, Ney: number, Nez: number, x0: number, y0: number, r0q: number): number {
  const finitos = [Nex, Ney, Nez].filter(Number.isFinite);
  if (!finitos.length) return Infinity;
  // Travado = muito grande: com 1e9 vezes o maior finito, a cúbica se reduz
  // à equação do caso com aquele modo impedido, sem ∞ − ∞.
  const grande = 1e9 * Math.max(...finitos);
  const [a, b, c] = [Nex, Ney, Nez].map((N) => (Number.isFinite(N) ? N : grande));
  const px = x0 ** 2 / r0q;
  const py = y0 ** 2 / r0q;
  const f = (N: number) => (N - a) * (N - b) * (N - c) - N ** 2 * (N - b) * px - N ** 2 * (N - a) * py;
  let lo = 0;
  let hi = Math.min(a, b, c);
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (f(m) < 0) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

function contaFlexoTorcao(simbolo: Expr, Nf: Expr, a: Expr, Nef: number, Nez: number, av: number, r0q: number, valor: number): Conta {
  const k = x('1 − ', pot(par(fr(a, v('r', '0'))), 2));
  return {
    simbolo,
    formula: x(fr(x(Nf, ' + ', v('N', 'ez')), x('2 ', par(k))), ' ', par(x('1 − ', rz(x('1 − ', fr(x('4 ', Nf, ' ', v('N', 'ez'), ' ', par(k)), pot(par(x(Nf, ' + ', v('N', 'ez'))), 2))))))),
    numeros: x(
      fr(x(n(Nef), ' + ', n(Nez)), x('2 · ', par(x('1 − ', pot(par(fr(n(av, 3), rz(n(r0q)))), 2))))),
      ' · ',
      par(x('1 − ', rz(x('1 − ', fr(x('4 · ', n(Nef), ' · ', n(Nez), ' · ', n(1 - av ** 2 / r0q, 4)), pot(par(x(n(Nef), ' + ', n(Nez))), 2)))))),
    ),
    valor,
    unidade: 'kN',
  };
}

function contaNe(simbolos: Expr[], Ne: number, modo: string): Conta {
  return {
    simbolo: v('N', 'e'),
    formula: x('mín(', ...simbolos.flatMap((s, i) => (i ? ['; ', s] : [s])), ')'),
    valor: Ne,
    unidade: 'kN',
    rotulo: Number.isFinite(Ne) ? modo : undefined,
  };
}

function esbeltezXY(rx: number, ry: number, L: Comprimentos): { valor: number; conta: Conta } {
  const valor = Math.max(L.Lx > 0 ? L.Lx / rx : 0, L.Ly > 0 ? L.Ly / ry : 0);
  return {
    valor,
    conta: {
      simbolo: v('λ', 'máx'),
      formula: x('máx(', fr(v('L', 'x'), v('r', 'x')), '; ', fr(v('L', 'y'), v('r', 'y')), ')'),
      numeros: x('máx(', fr(n(L.Lx), n(rx)), '; ', fr(n(L.Ly), n(ry)), ')'),
      valor,
      casas: 0,
    },
  };
}

// ─── I: dupla simetria (5.3.5.1) ────────────────────────────────────────────

export function flambagemDoI(s: SecaoI, L: Comprimentos): FlambagemGlobal {
  if (s.monossimetrico && s.geo) return flambagemDoIMonossimetrico(s, s.geo.y0, L);
  const Nex = euler(s.Ix, L.Lx);
  const Ney = euler(s.Iy, L.Ly);
  // Dupla simetria: o centro de cisalhamento é o centroide (x0 = y0 = 0).
  const r0q = s.rx ** 2 + s.ry ** 2;
  const Nez = torcao(s.Cw, s.J, L.Lt, r0q);
  const Ne = Math.min(Nex, Ney, Nez);
  const modo = Ne === Nex ? 'flambagem por flexão em x' : Ne === Ney ? 'flambagem por flexão em y' : 'flambagem por torção';
  const esb = esbeltezXY(s.rx, s.ry, L);
  return {
    Ne,
    modo,
    Nex,
    Ney,
    Nez,
    r0q,
    esbeltez: esb.valor,
    contaEsbeltez: esb.conta,
    avisos: [],
    passos: [
      {
        ref: '5.3.5.1',
        titulo: 'Força axial de flambagem elástica',
        contas: [
          contaEuler(v('N', 'ex'), v('I', 'x'), v('L', 'x'), s.Ix, L.Lx, Nex, 'Lx'),
          contaEuler(v('N', 'ey'), v('I', 'y'), v('L', 'y'), s.Iy, L.Ly, Ney, 'Ly'),
          {
            simbolo: pot(v('r', '0'), 2),
            formula: x(pot(v('r', 'x'), 2), ' + ', pot(v('r', 'y'), 2)),
            numeros: x(pot(n(s.rx), 2), ' + ', pot(n(s.ry), 2)),
            valor: r0q,
            unidade: 'cm²',
          },
          contaNez(s.Cw, s.J, L.Lt, r0q, Nez),
          contaNe([v('N', 'ex'), v('N', 'ey'), v('N', 'ez')], Ne, modo),
        ],
      },
    ],
  };
}

// ─── U: monossimétrico, X é o eixo de simetria (5.3.5.2) ────────────────────

/**
 * I de mesas diferentes (5.3.5.2): o eixo de simetria é o y (o plano da alma),
 * e o centro de torção sai do centroide ao longo dele, de y0. A flexão em y
 * se acopla com a torção (Neyz); a flexão em x fica sozinha. É o U com os
 * eixos trocados.
 */
function flambagemDoIMonossimetrico(s: SecaoI, y0: number, L: Comprimentos): FlambagemGlobal {
  const Nex = euler(s.Ix, L.Lx);
  const Ney = euler(s.Iy, L.Ly);
  const r0q = s.rx ** 2 + s.ry ** 2 + y0 ** 2;
  const Nez = torcao(s.Cw, s.J, L.Lt, r0q);
  const Neyz = flexoTorcao(Ney, Nez, y0, r0q);
  const Ne = Math.min(Nex, Neyz);
  const modo = Ne === Nex ? 'flambagem por flexão em x' : 'flambagem por flexo-torção (y com torção)';
  const esb = esbeltezXY(s.rx, s.ry, L);
  return {
    Ne,
    modo,
    Nex,
    Ney,
    Nez,
    r0q,
    esbeltez: esb.valor,
    contaEsbeltez: esb.conta,
    avisos: [],
    passos: [
      {
        ref: '5.3.5.1; 5.3.5.2',
        titulo: 'Força axial de flambagem elástica — seção monossimétrica (eixo y de simetria)',
        contas: [
          contaEuler(v('N', 'ex'), v('I', 'x'), v('L', 'x'), s.Ix, L.Lx, Nex, 'Lx'),
          contaEuler(v('N', 'ey'), v('I', 'y'), v('L', 'y'), s.Iy, L.Ly, Ney, 'Ly'),
          { simbolo: v('y', '0'), valor: y0, casas: 3, unidade: 'cm', rotulo: 'centro de torção a partir do centroide (+ para a mesa superior)' },
          {
            simbolo: pot(v('r', '0'), 2),
            formula: x(pot(v('r', 'x'), 2), ' + ', pot(v('r', 'y'), 2), ' + ', pot(v('y', '0'), 2)),
            numeros: x(pot(n(s.rx), 2), ' + ', pot(n(s.ry), 2), ' + ', pot(n(y0, 3), 2)),
            valor: r0q,
            unidade: 'cm²',
          },
          contaNez(s.Cw, s.J, L.Lt, r0q, Nez),
          Number.isFinite(Ney) && Number.isFinite(Nez)
            ? contaFlexoTorcao(v('N', 'eyz'), v('N', 'ey'), v('y', '0'), Ney, Nez, y0, r0q, Neyz)
            : { simbolo: v('N', 'eyz'), valor: Neyz, unidade: 'kN', texto: Number.isFinite(Neyz) ? undefined : 'travada', rotulo: Number.isFinite(Neyz) ? (Number.isFinite(Ney) ? 'torção travada: = Ney' : 'flexão em y travada: = Nez') : undefined },
          contaNe([v('N', 'ex'), v('N', 'eyz')], Ne, modo),
        ],
      },
    ],
  };
}

export function flambagemDoU(s: SecaoU, L: Comprimentos): FlambagemGlobal {
  const Nex = euler(s.Ix, L.Lx);
  const Ney = euler(s.Iy, L.Ly);
  const r0q = s.rx ** 2 + s.ry ** 2 + s.x0 ** 2;
  const Nez = torcao(s.Cw, s.J, L.Lt, r0q);
  const Nexz = flexoTorcao(Nex, Nez, s.x0, r0q);
  const Ne = Math.min(Ney, Nexz);
  const modo = Ne === Ney ? 'flambagem por flexão em y' : 'flambagem por flexo-torção (x com torção)';
  const esb = esbeltezXY(s.rx, s.ry, L);
  return {
    Ne,
    modo,
    Nex,
    Ney,
    Nez,
    r0q,
    esbeltez: esb.valor,
    contaEsbeltez: esb.conta,
    avisos: [],
    passos: [
      {
        ref: '5.3.5.1; 5.3.5.2',
        titulo: 'Força axial de flambagem elástica — seção monossimétrica (eixo x de simetria)',
        contas: [
          contaEuler(v('N', 'ey'), v('I', 'y'), v('L', 'y'), s.Iy, L.Ly, Ney, 'Ly'),
          contaEuler(v('N', 'ex'), v('I', 'x'), v('L', 'x'), s.Ix, L.Lx, Nex, 'Lx'),
          { simbolo: v('x', '0'), valor: s.x0, unidade: 'cm', rotulo: 'centro de torção, do centroide para fora da alma' },
          {
            simbolo: pot(v('r', '0'), 2),
            formula: x(pot(v('r', 'x'), 2), ' + ', pot(v('r', 'y'), 2), ' + ', pot(v('x', '0'), 2)),
            numeros: x(pot(n(s.rx), 2), ' + ', pot(n(s.ry), 2), ' + ', pot(n(s.x0, 3), 2)),
            valor: r0q,
            unidade: 'cm²',
          },
          contaNez(s.Cw, s.J, L.Lt, r0q, Nez),
          Number.isFinite(Nex) && Number.isFinite(Nez)
            ? contaFlexoTorcao(v('N', 'exz'), v('N', 'ex'), v('x', '0'), Nex, Nez, s.x0, r0q, Nexz)
            : { simbolo: v('N', 'exz'), valor: Nexz, unidade: 'kN', texto: Number.isFinite(Nexz) ? undefined : 'travada', rotulo: Number.isFinite(Nexz) ? (Number.isFinite(Nex) ? 'torção travada: = Nex' : 'flexão em x travada: = Nez') : undefined },
          contaNe([v('N', 'ey'), v('N', 'exz')], Ne, modo),
        ],
        nota: 'Eixo x de simetria: índices trocados conforme o final de 5.3.5.2.',
      },
    ],
  };
}

// ─── Cantoneira ─────────────────────────────────────────────────────────────

/**
 * Os comprimentos de flambagem nos eixos principais. O eixo principal mais
 * perto de x leva Lx, o mais perto de y leva Ly; a 45° (abas iguais) os dois
 * levam o maior, a favor da segurança.
 */
export function comprimentosPrincipais(alfa: number, L: Comprimentos): { KLu: number; KLv: number; regra: string } {
  const a = Math.abs(((alfa * 180) / Math.PI) % 180);
  const perto = Math.min(a, 180 - a);
  if (perto < 45 - 1e-6) return { KLu: L.Lx, KLv: L.Ly, regra: 'u mais perto de x: Lu = Lx, Lv = Ly' };
  if (perto > 45 + 1e-6) return { KLu: L.Ly, KLv: L.Lx, regra: 'u mais perto de y: Lu = Ly, Lv = Lx' };
  const m = Math.max(L.Lx, L.Ly);
  return { KLu: m, KLv: m, regra: 'eixos a 45°: Lu = Lv = máx(Lx; Ly)' };
}

const graus = (rad: number) => (rad * 180) / Math.PI;

function passoPrincipais(s: SecaoL, KLu: number, KLv: number, regra: string): Passo {
  return {
    ref: '5.3.5.2; 5.3.5.3',
    titulo: 'Eixos principais de inércia',
    contas: [
      { simbolo: v('α'), valor: graus(s.alfa), casas: 2, unidade: '°', rotulo: 'eixo u a partir de x, anti-horário' },
      { simbolo: v('I', 'v'), formula: x(v('A', 'g'), ' ', pot(v('r', 'mín'), 2)), numeros: x(n(s.A), ' · ', pot(n(s.rv, 3), 2)), valor: s.Iv, unidade: 'cm⁴' },
      { simbolo: v('I', 'u'), formula: x(v('I', 'x'), ' + ', v('I', 'y'), ' − ', v('I', 'v')), numeros: x(n(s.Ix), ' + ', n(s.Iy), ' − ', n(s.Iv)), valor: s.Iu, unidade: 'cm⁴' },
      { simbolo: v('L', 'u'), valor: KLu, unidade: 'cm', rotulo: regra },
      { simbolo: v('L', 'v'), valor: KLv, unidade: 'cm' },
      { simbolo: v('u', '0'), formula: x(v('x', '0'), ' cos α + ', v('y', '0'), ' sen α'), numeros: x(n(s.x0, 3), ' · cos α + ', n(s.y0, 3), ' · sen α'), valor: s.u0, casas: 3, unidade: 'cm', rotulo: 'centro de torção no encontro das abas' },
      { simbolo: v('v', '0'), formula: x('−', v('x', '0'), ' sen α + ', v('y', '0'), ' cos α'), numeros: x('−', n(s.x0, 3), ' · sen α + ', n(s.y0, 3), ' · cos α'), valor: s.v0, casas: 3, unidade: 'cm' },
    ],
  };
}

/** Cantoneira comprimida pelo centroide: 5.3.5.2 (abas iguais) ou 5.3.5.3. */
export function flambagemDaCantoneira(s: SecaoL, L: Comprimentos): FlambagemGlobal {
  const { KLu, KLv, regra } = comprimentosPrincipais(s.alfa, L);
  const Neu = euler(s.Iu, KLu);
  const Nev = euler(s.Iv, KLv);
  const r0q = s.ru ** 2 + s.rv ** 2 + s.u0 ** 2 + s.v0 ** 2;
  // ⚠️ NA CANTONEIRA A TORÇÃO ENTRA SEMPRE, MESMO COM Lt = 0 (decisão dele,
  // 04/11/2026). Com Cw = 0, Nez = GJ/r0² não depende do comprimento: 1 cm
  // ou 10 m dão o mesmo, e só o zero ("travada") tirava a flexo-torção
  // inteira — até +36 % de Nc,Rd na L 5" x 5" - 6,35. Travar a torção de uma
  // cantoneira ao longo do comprimento todo é raro; o zero não vale aqui.
  const Nez = (G * s.J) / r0q;
  const contas: Conta[] = [
    contaEuler(v('N', 'eu'), v('I', 'u'), v('L', 'u'), s.Iu, KLu, Neu, 'Lu'),
    contaEuler(v('N', 'ev'), v('I', 'v'), v('L', 'v'), s.Iv, KLv, Nev, 'Lv'),
    {
      simbolo: pot(v('r', '0'), 2),
      formula: x(pot(v('r', 'u'), 2), ' + ', pot(v('r', 'v'), 2), ' + ', pot(v('u', '0'), 2), ' + ', pot(v('v', '0'), 2)),
      numeros: x(pot(n(s.ru, 3), 2), ' + ', pot(n(s.rv, 3), 2), ' + ', pot(n(s.u0, 3), 2), ' + ', pot(n(s.v0, 3), 2)),
      valor: r0q,
      unidade: 'cm²',
    },
    {
      simbolo: v('N', 'ez'),
      formula: fr(x(v('G'), ' ', v('J')), pot(v('r', '0'), 2)),
      numeros: fr(x(n(G), ' · ', n(s.J)), n(r0q)),
      valor: Nez,
      unidade: 'kN',
      rotulo: 'Cw = 0: não depende do comprimento',
    },
  ];
  let Ne: number;
  let modo: string;
  let ref: string;
  if (s.iguais) {
    // Simétrica em relação a u: o centro de torção está sobre u (v0 = 0) e
    // a flexão em u (deslocamento ao longo de v) é a que se acopla à torção.
    const Neuz = flexoTorcao(Neu, Nez, s.u0, r0q);
    Ne = Math.min(Nev, Neuz);
    modo = Ne === Nev ? 'flambagem por flexão em v (rmín)' : 'flambagem por flexo-torção (u com torção)';
    ref = '5.3.5.2';
    contas.push(
      Number.isFinite(Neu) && Number.isFinite(Nez)
        ? contaFlexoTorcao(v('N', 'euz'), v('N', 'eu'), v('u', '0'), Neu, Nez, s.u0, r0q, Neuz)
        : { simbolo: v('N', 'euz'), valor: Neuz, unidade: 'kN', texto: Number.isFinite(Neuz) ? undefined : 'travada' },
      contaNe([v('N', 'ev'), v('N', 'euz')], Ne, modo),
    );
  } else {
    Ne = raizDaCubica(Neu, Nev, Nez, s.u0, s.v0, r0q);
    modo = 'flambagem por flexo-torção (seção assimétrica)';
    ref = '5.3.5.3';
    contas.push({
      simbolo: v('N', 'e'),
      formula: x(
        par(x(v('N', 'e'), ' − ', v('N', 'eu'))), par(x(v('N', 'e'), ' − ', v('N', 'ev'))), par(x(v('N', 'e'), ' − ', v('N', 'ez'))),
        ' − ', pot(v('N', 'e'), 2), par(x(v('N', 'e'), ' − ', v('N', 'ev'))), pot(par(fr(v('u', '0'), v('r', '0'))), 2),
        ' − ', pot(v('N', 'e'), 2), par(x(v('N', 'e'), ' − ', v('N', 'eu'))), pot(par(fr(v('v', '0'), v('r', '0'))), 2), ' = 0',
      ),
      valor: Ne,
      unidade: 'kN',
      rotulo: 'menor raiz da cúbica',
    });
    // ⚠️ TRAVADA MAIS CURTO NUMA DIREÇÃO (Lx ≠ Ly, decisão dele, 04/11/2026):
    // a regra dos eixos principais dá o comprimento maior ao eixo principal
    // mais próximo, mas a barra pode flambar em torno do eixo da ABA que tem
    // o comprimento maior — inércia Ix ou Iy, acoplada à torção pela
    // coordenada do centro de torção perpendicular a ela. É um modo de
    // conferência (a norma não o escreve): fica o menor dos dois.
    if (L.Lx !== L.Ly) {
      const emX = L.Lx > L.Ly;
      const I = emX ? s.Ix : s.Iy;
      const Lm = emX ? L.Lx : L.Ly;
      const a = emX ? s.x0 : s.y0;
      const r0g = s.rx ** 2 + s.ry ** 2 + s.x0 ** 2 + s.y0 ** 2;
      const NezG = (G * s.J) / r0g;
      const Neg = euler(I, Lm);
      const Negz = flexoTorcao(Neg, NezG, a, r0g);
      const e = emX ? 'x' : 'y';
      contas.push(
        contaEuler(v('N', `e${e}`), v('I', e), v('L', e), I, Lm, Neg, `L${e}`),
        {
          simbolo: pot(v('r', '0'), 2),
          formula: x(pot(v('r', 'x'), 2), ' + ', pot(v('r', 'y'), 2), ' + ', pot(v('x', '0'), 2), ' + ', pot(v('y', '0'), 2)),
          numeros: x(pot(n(s.rx), 2), ' + ', pot(n(s.ry), 2), ' + ', pot(n(s.x0, 3), 2), ' + ', pot(n(s.y0, 3), 2)),
          valor: r0g,
          unidade: 'cm²',
          rotulo: 'nos eixos das abas',
        },
        Number.isFinite(Neg)
          ? contaFlexoTorcao(v('N', `e${e}z`), v('N', `e${e}`), v(emX ? 'x' : 'y', '0'), Neg, NezG, a, r0g, Negz)
          : { simbolo: v('N', `e${e}z`), valor: Negz, unidade: 'kN' },
      );
      if (Negz < Ne) {
        Ne = Negz;
        modo = `flambagem por flexo-torção (eixo ${e} da aba, L${e} maior)`;
      }
      contas.push(contaNe([x(v('N', 'e'), ' (cúbica)'), v('N', `e${e}z`)], Ne, modo));
    }
  }
  const esbeltez = Math.max(KLu > 0 ? KLu / s.ru : 0, KLv > 0 ? KLv / s.rv : 0);
  return {
    Ne,
    modo,
    Nex: NaN,
    Ney: NaN,
    Nez,
    r0q,
    principais: { Neu, Nev, KLu, KLv },
    esbeltez,
    contaEsbeltez: {
      simbolo: v('λ', 'máx'),
      formula: x('máx(', fr(v('L', 'u'), v('r', 'u')), '; ', fr(v('L', 'v'), v('r', 'v')), ')'),
      numeros: x('máx(', fr(n(KLu), n(s.ru, 3)), '; ', fr(n(KLv), n(s.rv, 3)), ')'),
      valor: esbeltez,
      casas: 0,
    },
    avisos: [],
    passos: [
      passoPrincipais(s, KLu, KLv, regra),
      { ref, titulo: `Força axial de flambagem elástica — ${s.iguais ? 'monossimétrica, eixo u de simetria' : 'seção assimétrica'}`, contas },
    ],
  };
}

/**
 * Cantoneira de treliça ligada por uma aba (5.3.5.4): o efeito da
 * excentricidade entra por um comprimento equivalente, e a flambagem é só a
 * por flexão em torno do eixo paralelo à aba ligada.
 *
 * ⚠️ IMPRESSÃO: no corpo da norma, as duas alíneas do 5.3.5.4.3 saem "≤ 75".
 * A Errata 1 (fev/2025, página 51) corrige a b) para "> 75" — é a que vale.
 */
export function flambagemDaCantoneiraDeTrelica(s: SecaoL, L: Comprimentos, lig: LigacaoPorUmaAba, fy: number): FlambagemGlobal {
  const Lx1 = L.Lx;
  // O eixo x1 passa pelo centroide e é paralelo à aba ligada: a aba maior é
  // vertical (y) no desenho, então ligada pela maior → o eixo vertical (Iy).
  const pelaMaior = lig.aba === 'maior' || s.iguais;
  const Ix1 = pelaMaior ? s.Iy : s.Ix;
  const rx1 = pelaMaior ? s.ry : s.rx;
  const plana = lig.trelica === 'plana';
  const esb = Lx1 / rx1;
  const [limite, k0, k1, k0b, k1b] = plana ? [80, 72, 0.75, 32, 1.25] : [75, 60, 0.8, 45, 1];
  const baixo = esb <= limite;
  let Lx1eq = baixo ? k0 * rx1 + k1 * Lx1 : k0b * rx1 + k1b * Lx1;
  const contas: Conta[] = [
    { simbolo: v('L', 'x1'), valor: Lx1, unidade: 'cm', rotulo: 'entre os pontos de trabalho' },
    { simbolo: v('r', 'x1'), valor: rx1, casas: 3, unidade: 'cm', rotulo: `eixo paralelo à aba ${pelaMaior ? (s.iguais ? 'ligada' : 'maior, a ligada') : 'menor, a ligada'}` },
    { simbolo: fr(v('L', 'x1'), v('r', 'x1')), numeros: fr(n(Lx1), n(rx1, 3)), valor: esb, casas: 1, rotulo: `${baixo ? '≤' : '>'} ${limite}` },
    {
      simbolo: v('L', 'x1,eq'),
      formula: x(n(baixo ? k0 : k0b), ' ', v('r', 'x1'), ' + ', n(baixo ? k1 : k1b, 2), ' ', v('L', 'x1')),
      numeros: x(n(baixo ? k0 : k0b), ' · ', n(rx1, 3), ' + ', n(baixo ? k1 : k1b, 2), ' · ', n(Lx1)),
      valor: Lx1eq,
      unidade: 'cm',
    },
  ];
  const razaoAbas = s.b / s.bmenor;
  if (!s.iguais && !pelaMaior) {
    // Desigual ligada pela menor: dois pisos (fim de 5.3.5.4.2 e 5.3.5.4.3).
    const kAum = plana ? 4 : 6;
    const kMin = plana ? 0.95 : 0.82;
    const aumentado = Lx1eq + kAum * (razaoAbas ** 2 - 1) * rx1;
    const piso = (kMin * Lx1 * rx1) / s.rv;
    const antes = Lx1eq;
    Lx1eq = Math.max(aumentado, piso);
    contas.push(
      {
        simbolo: x(v('L', 'x1,eq'), ' + ', n(kAum), ' ', par(x(pot(par(fr(v('b', 'e'), v('b', 's'))), 2), ' − 1')), ' ', v('r', 'x1')),
        numeros: x(n(antes), ' + ', n(kAum), ' · ', par(x(pot(par(fr(n(s.b * 10, 1), n(s.bmenor * 10, 1))), 2), ' − 1')), ' · ', n(rx1, 3)),
        valor: aumentado,
        unidade: 'cm',
      },
      { simbolo: x(n(kMin, 2), ' ', v('L', 'x1'), ' ', fr(v('r', 'x1'), v('r', 'mín'))), numeros: x(n(kMin, 2), ' · ', n(Lx1), ' · ', fr(n(rx1, 3), n(s.rv, 3))), valor: piso, unidade: 'cm' },
      { simbolo: v('L', 'x1,eq'), formula: x('máx(…)'), valor: Lx1eq, unidade: 'cm', rotulo: 'ligada pela aba menor' },
    );
  }
  const Nex1 = euler(Ix1, Lx1eq);
  const esbEq = Lx1eq / rx1;
  const btLim = 0.71 * Math.sqrt(E / fy);
  const bt = s.b / s.t;
  const condD = esbEq <= 200;
  const condE = razaoAbas <= 1.7;
  const condF = bt <= btLim;
  contas.push(
    { simbolo: fr(v('L', 'x1,eq'), v('r', 'x1')), numeros: fr(n(Lx1eq), n(rx1, 3)), valor: esbEq, casas: 1, rotulo: condD ? '≤ 200 — condição d)' : '> 200 — condição d) não atendida' },
    { simbolo: fr(v('b', 'maior'), v('b', 'menor')), valor: razaoAbas, casas: 2, rotulo: condE ? '≤ 1,7 — condição e)' : '> 1,7 — condição e) não atendida' },
    { simbolo: x(v('b'), '/', v('t')), numeros: fr(n(s.b), n(s.t)), valor: bt, casas: 2, rotulo: `${condF ? '≤' : '>'} 0,71√(E/fy) = ${String(Math.round(btLim * 100) / 100).replace('.', ',')}${condF ? '' : ' — flexo-torção também (5.3.5.4.4)'}` },
    contaEuler(v('N', 'ex1'), v('I', 'x1'), v('L', 'x1,eq'), Ix1, Lx1eq, Nex1, 'Lx1,eq'),
  );
  const aplicavel = condD && condE;
  const passos: Passo[] = [{ ref: plana ? '5.3.5.4.1; 5.3.5.4.2' : '5.3.5.4.1; 5.3.5.4.3', titulo: `Cantoneira de treliça ${plana ? 'plana' : 'espacial'} ligada por uma aba — comprimento equivalente`, contas }];
  const avisos: string[] = [];
  let Ne = Nex1;
  let modo = 'flambagem por flexão em x1 (comprimento equivalente)';
  let Nez = NaN;
  let r0q = NaN;
  if (!condF || !aplicavel) {
    // b/t acima do limite (5.3.5.4.4): também a flexo-torção, com a barra
    // inteira (L em todos os eixos). Fora das condições d) e e), esta é a
    // única conta que sobra — e a excentricidade fica para o engenheiro.
    const geral = flambagemDaCantoneira(s, { ...L, Lx: Lx1, Ly: Lx1, Lt: Lx1 });
    passos.push(...geral.passos);
    Nez = geral.Nez;
    r0q = geral.r0q;
    if (aplicavel) {
      Ne = Math.min(Nex1, geral.Ne);
      if (Ne === geral.Ne) modo = geral.modo;
      passos.push({ ref: '5.3.5.4.4', titulo: 'Força axial de flambagem adotada', contas: [contaNe([v('N', 'ex1'), x(v('N', 'e'), ' (flexo-torção)')], Ne, modo)] });
    } else {
      Ne = geral.Ne;
      modo = geral.modo;
      avisos.push(`Fora das condições ${condD ? '' : 'd)'}${!condD && !condE ? ' e ' : ''}${condE ? '' : 'e)'} de 5.3.5.4.1: a barra é de força axial e momentos fletores (5.3.5.4.5) — o momento da excentricidade não está nesta conta.`);
    }
  }
  return {
    Ne,
    modo,
    Nex: NaN,
    Ney: NaN,
    Nez,
    r0q,
    trelica: { Lx1, rx1, Lx1eq, Nex1, aplicavel },
    esbeltez: Lx1 / s.rv,
    contaEsbeltez: {
      simbolo: v('λ', 'máx'),
      formula: fr(v('L', 'x1'), v('r', 'mín')),
      numeros: fr(n(Lx1), n(s.rv, 3)),
      valor: Lx1 / s.rv,
      casas: 0,
    },
    passos,
    avisos,
  };
}
