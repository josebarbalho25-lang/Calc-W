// ═══════════════════════════════════════════════════════════════════════════
//  visualizacao/contornoDoPerfil.ts — o contorno de qualquer perfil do
//  catálogo, em milímetro, com a origem no centroide (x para a direita, y
//  para cima)
// ---------------------------------------------------------------------------
//  Uma geometria só para o desenho 2D (tela e memória) e para a barra das
//  janelas 3D: o U e a cantoneira não podem sair de um jeito na tela e de
//  outro na janela.
//
//  ⚠️ A MESA INCLINADA (I padrão americano e U) É DESENHADA COM A RAMPA DA
//  NORMA DE LAMINAÇÃO, 1:6 (16,67 %): o tf do catálogo é a espessura MÉDIA, no
//  meio da parte livre da mesa. O raio de concordância sai do "c" da tabela
//  (da face externa da mesa ao pé do raio na alma): r = c − espessura da mesa
//  junto da alma. Na cantoneira o raio não é publicado; o desenho usa r = t,
//  só para o canto não sair vivo — nenhuma conta usa esse raio.
//
//  ⚠️ O CENTROIDE É O DO CATÁLOGO (xg, yg), não o do desenho: o desenho
//  ignora o raio da ponta e arredonda a rampa, e um centroide recalculado
//  daqui sairia uns décimos de milímetro fora do número que a conta usa.
// ═══════════════════════════════════════════════════════════════════════════

import { geometriaDoSoldado } from '../motor/catalogos/soldados';
import type { Cantoneira, Perfil, PerfilI, PerfilU } from '../motor/tipos';

export type Ponto = [number, number];

export interface ContornoDoPerfil {
  /** O contorno, fechado, no sentido anti-horário. */
  pontos: Ponto[];
  caixa: { xmin: number; xmax: number; ymin: number; ymax: number };
  /** Centro de torção, quando não coincide com o centroide (U, cantoneira). */
  CT?: Ponto;
  /** Ângulo do eixo principal u com x, rad (só na cantoneira). */
  alfa?: number;
}

const RAMPA = 1 / 6;

/**
 * O arco que concorda duas retas no canto P: u1 aponta de P para trás, ao
 * longo da reta de chegada; u2, de P para a frente, ao longo da de saída.
 * Devolve os pontos do arco, da tangência na chegada à da saída.
 */
function filete(P: Ponto, u1: Ponto, u2: Ponto, r: number, passos = 10): Ponto[] {
  if (r <= 0) return [P];
  const cos = u1[0] * u2[0] + u1[1] * u2[1];
  const theta = Math.acos(Math.max(-1, Math.min(1, cos)));
  const d = r / Math.tan(theta / 2);
  const T1: Ponto = [P[0] + u1[0] * d, P[1] + u1[1] * d];
  const T2: Ponto = [P[0] + u2[0] * d, P[1] + u2[1] * d];
  // Centro: na bissetriz, a r/sen(θ/2) do canto.
  const bx = u1[0] + u2[0];
  const by = u1[1] + u2[1];
  const nb = Math.hypot(bx, by);
  const dc = r / Math.sin(theta / 2);
  const C: Ponto = [P[0] + (bx / nb) * dc, P[1] + (by / nb) * dc];
  const a1 = Math.atan2(T1[1] - C[1], T1[0] - C[0]);
  let a2 = Math.atan2(T2[1] - C[1], T2[0] - C[0]);
  // O caminho curto entre as duas tangências.
  while (a2 - a1 > Math.PI) a2 -= 2 * Math.PI;
  while (a2 - a1 < -Math.PI) a2 += 2 * Math.PI;
  const out: Ponto[] = [];
  for (let i = 0; i <= passos; i++) {
    const a = a1 + ((a2 - a1) * i) / passos;
    out.push([C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]);
  }
  return out;
}

const unit = (a: Ponto, b: Ponto): Ponto => {
  const n = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [(b[0] - a[0]) / n, (b[1] - a[1]) / n];
};

/** Polígono com cantos concordados: cada vértice com o seu raio (0 = vivo). */
function concordar(vertices: Array<[Ponto, number]>): Ponto[] {
  const out: Ponto[] = [];
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const [P, r] = vertices[i];
    if (r <= 0) {
      out.push(P);
      continue;
    }
    const antes = vertices[(i - 1 + n) % n][0];
    const depois = vertices[(i + 1) % n][0];
    out.push(...filete(P, unit(P, antes), unit(P, depois), r));
  }
  return out;
}

function caixaDe(pontos: Ponto[]) {
  const xs = pontos.map((p) => p[0]);
  const ys = pontos.map((p) => p[1]);
  return { xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys), ymax: Math.max(...ys) };
}

/**
 * I soldado de mesas diferentes: três retângulos, sem raio, com a origem no
 * centroide (que sobe para a mesa maior) e o centro de torção marcado.
 */
function contornoDoIMonossimetrico(p: PerfilI): ContornoDoPerfil {
  const c = p.soldado!;
  const g = geometriaDoSoldado(c);
  const yb = -g.yc * 10; // face de baixo, mm, a partir do centroide
  const yt = yb + c.d;
  const S = c.mesaSuperior;
  const I = c.mesaInferior;
  const w = c.tw / 2;
  const pontos: Ponto[] = [
    [-I.bf / 2, yb],
    [I.bf / 2, yb],
    [I.bf / 2, yb + I.tf],
    [w, yb + I.tf],
    [w, yt - S.tf],
    [S.bf / 2, yt - S.tf],
    [S.bf / 2, yt],
    [-S.bf / 2, yt],
    [-S.bf / 2, yt - S.tf],
    [-w, yt - S.tf],
    [-w, yb + I.tf],
    [-I.bf / 2, yb + I.tf],
  ];
  return { pontos, caixa: caixaDe(pontos), CT: [0, g.y0 * 10] };
}

/** I de abas paralelas (W, HP) ou inclinadas (padrão americano). */
function contornoDoI(p: PerfilI): ContornoDoPerfil {
  if (p.soldado && (p.soldado.mesaSuperior.bf !== p.soldado.mesaInferior.bf || p.soldado.mesaSuperior.tf !== p.soldado.mesaInferior.tf))
    return contornoDoIMonossimetrico(p);
  const B = p.bf / 2;
  const D = p.d / 2;
  const w = p.tw / 2;
  const c = (p.d - p.dLinha) / 2;
  // Espessura da mesa na ponta e junto da alma.
  const inclinada = p.serie === 'I';
  const meia = (p.bf - p.tw) / 4; // do meio da parte livre à ponta (ou à alma)
  const tPonta = inclinada ? p.tf - RAMPA * meia : p.tf;
  const tAlma = inclinada ? p.tf + RAMPA * meia : p.tf;
  const r = Math.max(c - tAlma, 0);
  // Quadrante de cima à direita, de x = 0 na face de cima até a alma embaixo;
  // os outros três por espelho.
  const quarto: Array<[Ponto, number]> = [
    [[B, D], 0],
    [[B, D - tPonta], 0],
    [[w, D - tAlma], r],
  ];
  const v: Array<[Ponto, number]> = [
    ...quarto,
    ...[...quarto].reverse().map(([[x, y], rr]): [Ponto, number] => [[x, -y], rr]),
    ...quarto.map(([[x, y], rr]): [Ponto, number] => [[-x, -y], rr]),
    ...[...quarto].reverse().map(([[x, y], rr]): [Ponto, number] => [[-x, y], rr]),
  ];
  // Anti-horário: girar a ordem (o de cima vai da direita para a esquerda).
  const pontos = concordar(v.reverse());
  return { pontos, caixa: caixaDe(pontos) };
}

/** U com a alma à esquerda e as mesas para a direita. */
function contornoDoU(p: PerfilU): ContornoDoPerfil {
  const xa = -p.xg * 10; // face externa da alma
  const D = p.d / 2;
  const livre = p.bf - p.tw;
  const tPonta = p.tf - RAMPA * (livre / 2);
  const tAlma = p.tf + RAMPA * (livre / 2);
  const c = (p.d - p.dLinha) / 2;
  const r = Math.max(c - tAlma, 0);
  const xi = xa + p.tw;
  const xp = xa + p.bf;
  const v: Array<[Ponto, number]> = [
    [[xa, -D], 0],
    [[xp, -D], 0],
    [[xp, -D + tPonta], 0],
    [[xi, -D + tAlma], r],
    [[xi, D - tAlma], r],
    [[xp, D - tPonta], 0],
    [[xp, D], 0],
    [[xa, D], 0],
  ];
  const pontos = concordar(v);
  return { pontos, caixa: caixaDe(pontos), CT: [xa + p.xg * 10 - p.x0 * 10, 0] };
}

/** Cantoneira: vértice embaixo à esquerda, aba maior subindo. */
function contornoDaCantoneira(p: Cantoneira): ContornoDoPerfil {
  const x0 = -p.xg * 10;
  const y0 = -p.yg * 10;
  const t = p.t;
  const v: Array<[Ponto, number]> = [
    [[x0, y0], 0],
    [[x0 + p.bmenor, y0], 0],
    [[x0 + p.bmenor, y0 + t], 0],
    [[x0 + t, y0 + t], t],
    [[x0 + t, y0 + p.b], 0],
    [[x0, y0 + p.b], 0],
  ];
  const pontos = concordar(v);
  return { pontos, caixa: caixaDe(pontos), CT: [x0 + t / 2, y0 + t / 2], alfa: p.alfa };
}

export function contornoDoPerfil(p: Perfil): ContornoDoPerfil {
  if (p.familia === 'U') return contornoDoU(p);
  if (p.familia === 'L') return contornoDaCantoneira(p);
  return contornoDoI(p);
}
