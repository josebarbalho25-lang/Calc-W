// ═══════════════════════════════════════════════════════════════════════════
//  motor/secao.ts — a bitola do catálogo em centímetro, e as constantes
// ---------------------------------------------------------------------------
//  ⚠️ A ÚNICA CONVERSÃO DE UNIDADE DO MOTOR MORA AQUI. O catálogo traz a chapa
//  em milímetro (como a Gerdau imprime); toda conta corre em kN e cm. Nenhum
//  outro arquivo do motor divide por 10 — quem precisar de chapa em mm (o
//  desenho, a memória) lê do perfil, não da seção.
// ═══════════════════════════════════════════════════════════════════════════

import { geometriaDoSoldado, type GeometriaDoSoldado } from './catalogos/soldados';
import type { Cantoneira, Perfil, PerfilI, PerfilU } from './tipos';

/** Módulo de elasticidade do aço, kN/cm² (NBR 8800:2024, 4.5.2.9). */
export const E = 20000;
/** Módulo de elasticidade transversal, kN/cm² (4.5.2.9). */
export const G = 7700;
/** Coeficiente de ponderação da resistência ao escoamento e à instabilidade (Tabela 3). */
export const GAMA_A1 = 1.1;
/** Coeficiente de ponderação da resistência à ruptura (Tabela 3, combinações normais). */
export const GAMA_A2 = 1.35;

/** A seção em cm, pronta para a conta. */
export interface SecaoI {
  familia: 'I';
  nome: string;
  d: number;
  bf: number;
  tw: number;
  tf: number;
  /**
   * Altura plana da alma — o "h" da norma. No laminado, entre os pés dos
   * raios de concordância; no soldado, entre as faces internas das mesas.
   */
  h: number;
  A: number;
  Ix: number;
  Wx: number;
  rx: number;
  Zx: number;
  Iy: number;
  Wy: number;
  ry: number;
  Zy: number;
  J: number;
  Cw: number;
  /**
   * Só no perfil SOLDADO: o kc da Tabela 4, nota a — entra no (b/t)lim da
   * mesa (grupo 5) e na FLM (D.2.8-f). `kcCalculado` é o 4/√(h/tw) antes do
   * corte em 0,35 e 0,76, para a memória mostrar qual limite pegou.
   */
  soldado?: { kc: number; kcCalculado: number };
  /**
   * Só no SOLDADO: as chapas e as cotas (centroide, linha neutra plástica,
   * centro de torção) — de onde saem hc, hp, Wc, Wt e ryTc da seção com as
   * mesas diferentes e da viga de alma esbelta (`ladoComprimido.ts`).
   */
  geo?: GeometriaDoSoldado;
  /** Mesas diferentes: um eixo de simetria só, o y (o plano médio da alma). */
  monossimetrico?: boolean;
}

/** kc = 4/√(h/tw), entre 0,35 e 0,76 (Tabela 4, nota a). */
export function coeficienteKc(h: number, tw: number): { kc: number; kcCalculado: number } {
  const kcCalculado = 4 / Math.sqrt(h / tw);
  return { kc: Math.min(0.76, Math.max(0.35, kcCalculado)), kcCalculado };
}

/** O U em cm. Mesmo jeito da seção I, mais o que a monossimetria pede. */
export interface SecaoU {
  familia: 'U';
  nome: string;
  d: number;
  bf: number;
  tw: number;
  tf: number;
  /** Parte plana da alma — o "h" da norma no laminado. */
  h: number;
  A: number;
  Ix: number;
  Wx: number;
  rx: number;
  Zx: number;
  Iy: number;
  /** Lado das pontas das mesas (o mínimo). */
  Wy: number;
  /** Lado da alma. */
  WyAlma: number;
  ry: number;
  Zy: number;
  xg: number;
  /** Do centroide ao centro de torção, ao longo de X (o eixo de simetria). */
  x0: number;
  J: number;
  Cw: number;
}

/** A cantoneira em cm, já com os eixos principais. */
export interface SecaoL {
  familia: 'L';
  nome: string;
  /** Aba maior, aba menor, espessura, cm. */
  b: number;
  bmenor: number;
  t: number;
  A: number;
  Ix: number;
  Iy: number;
  rx: number;
  ry: number;
  Iu: number;
  Iv: number;
  ru: number;
  rv: number;
  /** Ângulo do eixo u (maior inércia) com x, rad. */
  alfa: number;
  /** Do centroide às faces externas da aba maior (xg) e da menor (yg), cm. */
  xg: number;
  yg: number;
  /** Centro de torção a partir do centroide: eixos x, y e eixos u, v. */
  x0: number;
  y0: number;
  u0: number;
  v0: number;
  J: number;
  Cw: number;
  /** Abas iguais: a seção é simétrica em relação a u. */
  iguais: boolean;
}

export type Secao = SecaoI | SecaoU | SecaoL;

export function secaoEmCm(p: PerfilI): SecaoI;
export function secaoEmCm(p: PerfilU): SecaoU;
export function secaoEmCm(p: Cantoneira): SecaoL;
export function secaoEmCm(p: Perfil): Secao;
export function secaoEmCm(p: Perfil): Secao {
  if (p.familia === 'U') return secaoU(p);
  if (p.familia === 'L') return secaoL(p);
  return {
    familia: 'I',
    nome: p.nome,
    d: p.d / 10,
    bf: p.bf / 10,
    tw: p.tw / 10,
    tf: p.tf / 10,
    h: p.dLinha / 10,
    A: p.A,
    Ix: p.Ix,
    Wx: p.Wx,
    rx: p.rx,
    Zx: p.Zx,
    Iy: p.Iy,
    Wy: p.Wy,
    ry: p.ry,
    Zy: p.Zy,
    J: p.J,
    Cw: p.Cw,
    ...(p.soldado ? soldadoEmCm(p) : {}),
  };
}

function soldadoEmCm(p: PerfilI): Pick<SecaoI, 'soldado' | 'geo' | 'monossimetrico'> {
  const geo = geometriaDoSoldado(p.soldado!);
  return { soldado: coeficienteKc(p.dLinha, p.tw), geo, monossimetrico: !geo.iguais };
}

function secaoU(p: PerfilU): SecaoU {
  return {
    familia: 'U',
    nome: p.nome,
    d: p.d / 10,
    bf: p.bf / 10,
    tw: p.tw / 10,
    tf: p.tf / 10,
    h: p.dLinha / 10,
    A: p.A,
    Ix: p.Ix,
    Wx: p.Wx,
    rx: p.rx,
    Zx: p.Zx,
    Iy: p.Iy,
    Wy: p.Wy,
    WyAlma: p.WyAlma,
    ry: p.ry,
    Zy: p.Zy,
    xg: p.xg,
    x0: p.x0,
    J: p.J,
    Cw: p.Cw,
  };
}

function secaoL(p: Cantoneira): SecaoL {
  const c = Math.cos(p.alfa);
  const s = Math.sin(p.alfa);
  return {
    familia: 'L',
    nome: p.nome,
    b: p.b / 10,
    bmenor: p.bmenor / 10,
    t: p.t / 10,
    A: p.A,
    Ix: p.Ix,
    Iy: p.Iy,
    rx: p.rx,
    ry: p.ry,
    Iu: p.Iu,
    Iv: p.Iv,
    ru: Math.sqrt(p.Iu / p.A),
    rv: Math.sqrt(p.Iv / p.A),
    alfa: p.alfa,
    xg: p.xg,
    yg: p.yg,
    x0: p.x0,
    y0: p.y0,
    // O centro de torção nos eixos principais: o vetor (x0, y0) girado de α.
    u0: p.x0 * c + p.y0 * s,
    v0: -p.x0 * s + p.y0 * c,
    J: p.J,
    Cw: p.Cw,
    iguais: p.b === p.bmenor,
  };
}
