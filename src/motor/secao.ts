// ═══════════════════════════════════════════════════════════════════════════
//  motor/secao.ts — a bitola do catálogo em centímetro, e as constantes
// ---------------------------------------------------------------------------
//  ⚠️ A ÚNICA CONVERSÃO DE UNIDADE DO MOTOR MORA AQUI. O catálogo traz a chapa
//  em milímetro (como a Gerdau imprime); toda conta corre em kN e cm. Nenhum
//  outro arquivo do motor divide por 10 — quem precisar de chapa em mm (o
//  desenho, a memória) lê do perfil, não da seção.
// ═══════════════════════════════════════════════════════════════════════════

import type { PerfilI } from './tipos';

/** Módulo de elasticidade do aço, kN/cm² (NBR 8800:2024, 4.5.2.9). */
export const E = 20000;
/** Módulo de elasticidade transversal, kN/cm² (4.5.2.9). */
export const G = 7700;
/** Coeficiente de ponderação da resistência ao escoamento e à instabilidade (Tabela 3). */
export const GAMA_A1 = 1.1;

/** A seção em cm, pronta para a conta. */
export interface SecaoI {
  nome: string;
  d: number;
  bf: number;
  tw: number;
  tf: number;
  /** Altura plana da alma — o "h" da norma no perfil laminado. */
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
}

export function secaoEmCm(p: PerfilI): SecaoI {
  return {
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
  };
}
