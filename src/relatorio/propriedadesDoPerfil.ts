// ═══════════════════════════════════════════════════════════════════════════
//  relatorio/propriedadesDoPerfil.ts — a lista de propriedades de cada
//  família, para a tela e para a memória (a mesma lista nas duas)
// ---------------------------------------------------------------------------
//  Chapa em mm, propriedade em cm, como o catálogo publica. No U entram o xg
//  e o x0 (é o x0 que acopla a flexão em X com a torção); na cantoneira, os
//  eixos principais (Iu, Iv, α) — é neles que a compressão é feita.
// ═══════════════════════════════════════════════════════════════════════════

import { geometriaDoSoldado } from '../motor/catalogos/soldados';
import type { Perfil } from '../motor/tipos';
import { raioDeConcordancia } from '../visualizacao/geometriaDaSecao';
import { num, numExato } from './formatos';

export interface LinhaDePropriedade {
  simbolo: string;
  indice?: string;
  /** Um apóstrofo depois do símbolo (o d' da alma plana). */
  linha?: boolean;
  valor: string;
  unidade: string;
}

const d2 = (x: number) => numExato(x, 2);
const P = (simbolo: string, indice: string | undefined, valor: string, unidade: string, linha = false): LinhaDePropriedade => ({ simbolo, indice, valor, unidade, linha });

export function propriedadesDoPerfil(p: Perfil): LinhaDePropriedade[] {
  if (p.familia === 'L') {
    const iguais = p.b === p.bmenor;
    return [
      ...(iguais ? [P('b', undefined, d2(p.b), 'mm')] : [P('b', 'maior', d2(p.b), 'mm'), P('b', 'menor', d2(p.bmenor), 'mm')]),
      P('t', undefined, d2(p.t), 'mm'),
      P('A', 'g', d2(p.A), 'cm²'),
      P('m', undefined, d2(p.massa), 'kg/m'),
      P('I', 'x', num(p.Ix, 1), 'cm⁴'),
      P('I', 'y', num(p.Iy, 1), 'cm⁴'),
      P('W', 'x', d2(p.Wx), 'cm³'),
      P('W', 'y', d2(p.Wy), 'cm³'),
      P('r', 'x', d2(p.rx), 'cm'),
      P('r', 'y', d2(p.ry), 'cm'),
      P('x', 'g', d2(p.xg), 'cm'),
      P('y', 'g', d2(p.yg), 'cm'),
      P('I', 'u', num(p.Iu, 1), 'cm⁴'),
      P('I', 'v', num(p.Iv, 1), 'cm⁴'),
      P('r', 'mín', d2(p.rmin), 'cm'),
      P('α', undefined, numExato((p.alfa * 180) / Math.PI, 2), '°'),
      P('J', undefined, numExato(p.J, 3), 'cm⁴'),
    ];
  }
  const c = p.familia === 'I' ? p.soldado : undefined;
  const mono = c && (c.mesaSuperior.bf !== c.mesaInferior.bf || c.mesaSuperior.tf !== c.mesaInferior.tf);
  // Mesas diferentes: as duas mesas, e as cotas que a seção monossimétrica
  // pede — centroide e centro de torção (a partir da face de baixo e do centroide).
  const comuns = mono
    ? [
        P('d', undefined, d2(p.d), 'mm'),
        P('b', 'fs', d2(c.mesaSuperior.bf), 'mm'),
        P('t', 'fs', d2(c.mesaSuperior.tf), 'mm'),
        P('b', 'fi', d2(c.mesaInferior.bf), 'mm'),
        P('t', 'fi', d2(c.mesaInferior.tf), 'mm'),
        P('t', 'w', d2(p.tw), 'mm'),
        P('d', undefined, d2(p.dLinha), 'mm', true),
        P('y', 'g', d2(geometriaDoSoldado(c).yc), 'cm'),
        P('y', '0', d2(geometriaDoSoldado(c).y0), 'cm'),
      ]
    : [
        P('d', undefined, d2(p.d), 'mm'),
        P('b', 'f', d2(p.bf), 'mm'),
        P('t', 'w', d2(p.tw), 'mm'),
        P('t', 'f', d2(p.tf), 'mm'),
        P('d', undefined, d2(p.dLinha), 'mm', true),
      ];
  const fim = [
    P('A', 'g', d2(p.A), 'cm²'),
    P('m', undefined, d2(p.massa), 'kg/m'),
    P('I', 'x', num(p.Ix, 0), 'cm⁴'),
    P('I', 'y', num(p.Iy, 1), 'cm⁴'),
    P('W', 'x', d2(p.Wx), 'cm³'),
    P('W', 'y', d2(p.Wy), 'cm³'),
    P('Z', 'x', d2(p.Zx), 'cm³'),
    P('Z', 'y', d2(p.Zy), 'cm³'),
    P('r', 'x', d2(p.rx), 'cm'),
    P('r', 'y', d2(p.ry), 'cm'),
  ];
  if (p.familia === 'U') {
    return [...comuns, ...fim, P('x', 'g', d2(p.xg), 'cm'), P('x', '0', d2(p.x0), 'cm'), P('J', undefined, d2(p.J), 'cm⁴'), P('C', 'w', num(p.Cw, 0), 'cm⁶')];
  }
  // O raio do W e do HP sai da alma plana; no padrão americano a mesa é
  // inclinada e o raio não é publicado — não entra na lista.
  // O soldado não tem raio: a alma encontra a mesa em ângulo reto.
  const raio = p.serie === 'I' || p.soldado ? [] : [P('r', undefined, numExato(raioDeConcordancia(p), 1), 'mm')];
  return [...comuns, ...raio, ...fim, P('J', undefined, d2(p.J), 'cm⁴'), P('C', 'w', num(p.Cw, 0), 'cm⁶')];
}
