// ═══════════════════════════════════════════════════════════════════════════
//  visualizacao/geometriaLaminados.ts — o corte do U e da cantoneira, em
//  escala, cotado, com o centroide (G), o centro de torção (CT) e, na
//  cantoneira, os eixos principais u e v
// ---------------------------------------------------------------------------
//  O mesmo contrato do desenho do I (`geometriaDaSecao.ts`): conta pura,
//  devolve contorno, linhas e textos na coordenada da caixa; a tela e a
//  memória desenham a MESMA coisa. As marcas de G e CT e os eixos principais
//  vieram da irmã de formados a frio, adaptados.
//
//  ⚠️ O CT É DESENHADO porque é dele que dependem a flexo-torção do U (o x0
//  acopla a flexão em X com a torção) e a da cantoneira.
//
//  ⚠️ ESCALA ÚNICA nos dois sentidos, e a caixa inclui o CT (no U ele fica do
//  lado de fora da alma).
// ═══════════════════════════════════════════════════════════════════════════

import type { Cantoneira, PerfilU } from '../motor/tipos';
import { numExato } from '../relatorio/formatos';
import { contornoDoPerfil, type Ponto } from './contornoDoPerfil';
import type { DesenhoDaSecao, Linha, Marca, Texto } from './geometriaDaSecao';

const mm = (v: number) => numExato(v, 1);

interface Folgas {
  esq: number;
  dir: number;
  cima: number;
  baixo: number;
}

/** Escala e origem: a caixa do perfil (com o CT) cabendo entre as folgas. */
function enquadrar(cx: { xmin: number; xmax: number; ymin: number; ymax: number }, largura: number, altura: number, f: Folgas) {
  const w = cx.xmax - cx.xmin;
  const h = cx.ymax - cx.ymin;
  const s = Math.min((largura - f.esq - f.dir) / w, (altura - f.cima - f.baixo) / h);
  const ox = f.esq + (largura - f.esq - f.dir - w * s) / 2 - cx.xmin * s;
  const oy = f.cima + (altura - f.cima - f.baixo - h * s) / 2 + cx.ymax * s;
  return { s, X: (x: number) => ox + x * s, Y: (y: number) => oy - y * s };
}

function caminho(pontos: Ponto[], X: (x: number) => number, Y: (y: number) => number): string {
  return pontos.map(([x, y], i) => `${i ? 'L' : 'M'} ${X(x).toFixed(2)} ${Y(y).toFixed(2)}`).join(' ') + ' Z';
}

function cotador(linhas: Linha[]) {
  const traco = (x: number, y: number) => linhas.push({ x1: x - 3, y1: y + 3, x2: x + 3, y2: y - 3, classe: 'traco' });
  return {
    traco,
    horizontal(x1: number, x2: number, y: number, deY: number) {
      linhas.push({ x1, y1: deY, x2: x1, y2: y + (y < deY ? -4 : 4), classe: 'chamada' });
      linhas.push({ x1: x2, y1: deY, x2, y2: y + (y < deY ? -4 : 4), classe: 'chamada' });
      linhas.push({ x1, y1: y, x2, y2: y, classe: 'cota' });
      traco(x1, y);
      traco(x2, y);
    },
    vertical(y1: number, y2: number, x: number, deX: number) {
      linhas.push({ x1: deX, y1, x2: x + (x > deX ? 4 : -4), y2: y1, classe: 'chamada' });
      linhas.push({ x1: deX, y1: y2, x2: x + (x > deX ? 4 : -4), y2, classe: 'chamada' });
      linhas.push({ x1: x, y1, x2: x, y2, classe: 'cota' });
      traco(x, y1);
      traco(x, y2);
    },
  };
}

export function desenhoDoU(p: PerfilU, largura = 380, altura = 300): DesenhoDaSecao {
  const c = contornoDoPerfil(p);
  const CT = c.CT!;
  const caixa = { ...c.caixa, xmin: Math.min(c.caixa.xmin, CT[0] - 4) };
  const { s, X, Y } = enquadrar(caixa, largura, altura, { esq: 30, dir: 64, cima: 38, baixo: 34 });
  const linhas: Linha[] = [];
  const textos: Texto[] = [];
  const k = cotador(linhas);
  const xa = -p.xg * 10;
  const xp = xa + p.bf;
  const xi = xa + p.tw;
  const D = p.d / 2;

  // bf, em cima.
  const yb = Y(D) - 18;
  k.horizontal(X(xa), X(xp), yb, Y(D) - 3);
  textos.push({ x: (X(xa) + X(xp)) / 2, y: yb - 6, texto: 'b', indice: 'f', valor: mm(p.bf), ancora: 'middle', classe: 'cota' });
  // d, à direita das pontas das mesas.
  const xd = X(xp) + 34;
  k.vertical(Y(D), Y(-D), xd, X(xp) + 3);
  textos.push({ x: xd + 12, y: Y(0), texto: 'd', valor: mm(p.d), ancora: 'middle', rot: -90, classe: 'cota' });
  // tf no meio da parte livre da mesa de cima (é a espessura média).
  const xm = X(xi + (p.bf - p.tw) / 2);
  linhas.push({ x1: xm, y1: Y(D) + 0.5, x2: xm, y2: Y(D - p.tf) + 10, classe: 'cota' });
  k.traco(xm, Y(D));
  k.traco(xm, Y(D - p.tf));
  textos.push({ x: xm + 6, y: Y(D - p.tf) + 14, texto: 't', indice: 'f', valor: mm(p.tf), ancora: 'start', classe: 'cota' });
  // tw atravessando a alma, abaixo do meio.
  const yw = Y(-D / 2);
  linhas.push({ x1: X(xa) - 12, y1: yw, x2: X(xi) + 14, y2: yw, classe: 'cota' });
  k.traco(X(xa), yw);
  k.traco(X(xi), yw);
  textos.push({ x: X(xi) + 18, y: yw + 4, texto: 't', indice: 'w', valor: mm(p.tw), ancora: 'start', classe: 'cota' });

  // Eixos: X (o de simetria) e Y, pelo centroide.
  const sobra = 14;
  linhas.push({ x1: X(caixa.xmin) - sobra, y1: Y(0), x2: X(xp) + sobra, y2: Y(0), classe: 'eixo' });
  linhas.push({ x1: X(0), y1: Y(D) - 6, x2: X(0), y2: Y(-D) + sobra, classe: 'eixo' });
  textos.push({ x: X(xp) + sobra + 4, y: Y(0) + 4, texto: 'X', valor: '', ancora: 'start', classe: 'eixo' });
  textos.push({ x: X(0), y: Y(-D) + sobra + 12, texto: 'Y', valor: '', ancora: 'middle', classe: 'eixo' });

  const marcas: Marca[] = [
    { x: X(0), y: Y(0), tipo: 'centroide' },
    { x: X(CT[0]), y: Y(CT[1]), tipo: 'torcao' },
  ];
  textos.push({ x: X(0) + 8, y: Y(0) - 8, texto: 'G', valor: '', ancora: 'start', classe: 'centro' });
  textos.push({ x: X(CT[0]), y: Y(0) - 10, texto: 'CT', valor: '', ancora: 'middle', classe: 'centro' });
  void s;
  return { largura, altura, contorno: caminho(c.pontos, X, Y), linhas, textos, r: 0, marcas };
}

export function desenhoDaCantoneira(p: Cantoneira, largura = 380, altura = 300): DesenhoDaSecao {
  const c = contornoDoPerfil(p);
  const CT = c.CT!;
  const { s, X, Y } = enquadrar(c.caixa, largura, altura, { esq: 64, dir: 54, cima: 30, baixo: 52 });
  const linhas: Linha[] = [];
  const textos: Texto[] = [];
  const k = cotador(linhas);
  const x0 = -p.xg * 10;
  const y0 = -p.yg * 10;
  const iguais = p.b === p.bmenor;

  // A aba maior (vertical), à esquerda.
  const xb = X(x0) - 22;
  k.vertical(Y(y0 + p.b), Y(y0), xb, X(x0) - 3);
  textos.push({ x: xb - 8, y: (Y(y0) + Y(y0 + p.b)) / 2, texto: 'b', indice: iguais ? undefined : 'maior', valor: mm(p.b), ancora: 'middle', rot: -90, classe: 'cota' });
  // A aba menor (deitada), embaixo.
  const yb = Y(y0) + 26;
  k.horizontal(X(x0), X(x0 + p.bmenor), yb, Y(y0) + 3);
  textos.push({ x: (X(x0) + X(x0 + p.bmenor)) / 2, y: yb + 16, texto: 'b', indice: iguais ? undefined : 'menor', valor: mm(p.bmenor), ancora: 'middle', classe: 'cota' });
  // t na ponta da aba vertical.
  const yt = Y(y0 + p.b) + 12;
  linhas.push({ x1: X(x0) - 10, y1: yt, x2: X(x0 + p.t) + 12, y2: yt, classe: 'cota' });
  k.traco(X(x0), yt);
  k.traco(X(x0 + p.t), yt);
  textos.push({ x: X(x0 + p.t) + 16, y: yt + 4, texto: 't', valor: numExato(p.t, 2), ancora: 'start', classe: 'cota' });

  // Eixos x e y pelo centroide, e os principais u e v.
  const alcance = Math.max(c.caixa.xmax, -c.caixa.xmin, c.caixa.ymax, -c.caixa.ymin);
  linhas.push({ x1: X(c.caixa.xmin) - 8, y1: Y(0), x2: X(c.caixa.xmax) + 10, y2: Y(0), classe: 'eixo' });
  linhas.push({ x1: X(0), y1: Y(c.caixa.ymax) - 6, x2: X(0), y2: Y(c.caixa.ymin) + 10, classe: 'eixo' });
  textos.push({ x: X(c.caixa.xmax) + 14, y: Y(0) + 4, texto: 'x', valor: '', ancora: 'start', classe: 'eixo' });
  textos.push({ x: X(0) + 6, y: Y(c.caixa.ymax) - 8, texto: 'y', valor: '', ancora: 'start', classe: 'eixo' });
  // Os principais param na caixa do perfil (mais uma folga pequena): soltos,
  // atravessavam as cotas das abas, que ficam do lado de fora.
  const folga = 6;
  const cabe = (ux: number, uy: number) => {
    const lim = [alcance];
    if (ux > 1e-9) lim.push((c.caixa.xmax + folga) / ux);
    if (ux < -1e-9) lim.push((c.caixa.xmin - folga) / ux);
    if (uy > 1e-9) lim.push((c.caixa.ymax + folga) / uy);
    if (uy < -1e-9) lim.push((c.caixa.ymin - folga) / uy);
    return Math.min(...lim);
  };
  const eixo = (ang: number, nome: string) => {
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const a = Math.min(cabe(ux, uy), cabe(-ux, -uy));
    linhas.push({ x1: X(-a * ux), y1: Y(-a * uy), x2: X(a * ux), y2: Y(a * uy), classe: 'eixo-principal' });
    textos.push({ x: X((a + 7 / s) * ux), y: Y((a + 7 / s) * uy) + 4, texto: nome, valor: '', ancora: 'middle', classe: 'eixo' });
  };
  eixo(p.alfa, 'u');
  eixo(p.alfa + Math.PI / 2, 'v');

  const marcas: Marca[] = [
    { x: X(0), y: Y(0), tipo: 'centroide' },
    { x: X(CT[0]), y: Y(CT[1]), tipo: 'torcao' },
  ];
  textos.push({ x: X(0) + 8, y: Y(0) - 8, texto: 'G', valor: '', ancora: 'start', classe: 'centro' });
  textos.push({ x: X(CT[0]) + 10, y: Y(CT[1]) - 8, texto: 'CT', valor: '', ancora: 'start', classe: 'centro' });
  return { largura, altura, contorno: caminho(c.pontos, X, Y), linhas, textos, r: 0, marcas };
}
