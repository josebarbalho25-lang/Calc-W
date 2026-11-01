// ═══════════════════════════════════════════════════════════════════════════
//  motor/tracao.ts — força axial de tração resistente (NBR 8800:2024, 5.2)
// ---------------------------------------------------------------------------
//  Só o escoamento da seção bruta (5.2.2-a). A ruptura da seção líquida
//  efetiva (5.2.2-b) depende dos furos e da ligação na ponta da barra — coisa
//  que a seção sozinha não sabe. Fica dito na memória, para ninguém ler o
//  "atende" como se a ligação estivesse verificada.
//
//  A esbeltez da barra tracionada (5.2.8.1) é RECOMENDAÇÃO, como a de 200 da
//  comprimida: acima de 300 a verificação sai "avaliar", não reprovada.
// ═══════════════════════════════════════════════════════════════════════════

import { fr, n, situacaoPelaRazao, v, x, type Verificacao } from './memoria';
import { GAMA_A1, type SecaoI } from './secao';
import type { Aco, Comprimentos } from './tipos';

/** Limite recomendado da esbeltez de barra tracionada (5.2.8.1). */
export const ESBELTEZ_RECOMENDADA_TRACAO = 300;

export interface ResultadoTracao {
  NtSd: number;
  NtRd: number;
  /** A maior relação L/r, nos dois eixos. */
  esbeltez: number;
  verificacao: Verificacao;
}

export function verificarTracao(s: SecaoI, aco: Aco, L: Comprimentos, NtSd: number): ResultadoTracao {
  const NtRd = (s.A * aco.fy) / GAMA_A1;
  const razao = NtSd / NtRd;
  const esbeltez = Math.max(L.Lx > 0 ? L.Lx / s.rx : 0, L.Ly > 0 ? L.Ly / s.ry : 0);
  const avisos =
    NtSd > 0 && esbeltez > ESBELTEZ_RECOMENDADA_TRACAO
      ? [`Esbeltez ${esbeltez.toFixed(0)} acima de ${ESBELTEZ_RECOMENDADA_TRACAO} (5.2.8.1).`]
      : [];
  return {
    NtSd,
    NtRd,
    esbeltez,
    verificacao: {
      chave: 'tracao',
      titulo: 'Tração',
      item: '5.2',
      sd: NtSd,
      rd: NtRd,
      unidade: 'kN',
      razao,
      situacao: situacaoPelaRazao(razao, avisos),
      governa: 'escoamento da seção bruta',
      avisos,
      passos: [
        {
          ref: '5.2.2-a',
          titulo: 'Escoamento da seção bruta',
          contas: [
            {
              simbolo: v('N', 't,Rd'),
              formula: fr(x(v('A', 'g'), ' ', v('f', 'y')), v('γ', 'a1')),
              numeros: fr(x(n(s.A), ' · ', n(aco.fy)), n(GAMA_A1, 2)),
              valor: NtRd,
              unidade: 'kN',
            },
          ],
          nota: 'A ruptura da seção líquida efetiva (5.2.2-b) depende da ligação e não é verificada aqui.',
        },
        {
          ref: '5.2.1.2; 5.2.8.1',
          titulo: 'Verificação',
          contas: [
            {
              simbolo: v('λ', 'máx'),
              formula: x('máx(', fr(v('L', 'x'), v('r', 'x')), '; ', fr(v('L', 'y'), v('r', 'y')), ')'),
              numeros: x('máx(', fr(n(L.Lx), n(s.rx)), '; ', fr(n(L.Ly), n(s.ry)), ')'),
              valor: esbeltez,
              casas: 0,
              rotulo: esbeltez <= ESBELTEZ_RECOMENDADA_TRACAO ? '≤ 300 (5.2.8.1)' : '> 300 (5.2.8.1)',
            },
            {
              simbolo: fr(v('N', 't,Sd'), v('N', 't,Rd')),
              numeros: fr(n(NtSd), n(NtRd)),
              valor: razao,
              casas: 3,
              rotulo: razao <= 1 ? '≤ 1,0' : '> 1,0',
            },
          ],
        },
      ],
    },
  };
}
