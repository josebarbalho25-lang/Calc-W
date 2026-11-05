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

import { comprimentosPrincipais } from './flambagemGlobal';
import { fr, n, par, situacaoPelaRazao, v, x, type Conta, type Verificacao } from './memoria';
import { GAMA_A1, GAMA_A2, type Secao } from './secao';
import type { Aco, Comprimentos, LigacaoPorUmaAba } from './tipos';

/** Limite recomendado da esbeltez de barra tracionada (5.2.8.1). */
export const ESBELTEZ_RECOMENDADA_TRACAO = 300;

export interface ResultadoTracao {
  NtSd: number;
  NtRd: number;
  /** A maior relação L/r, nos dois eixos. */
  esbeltez: number;
  verificacao: Verificacao;
}

/**
 * O maior L/r da barra. Na cantoneira, nos eixos principais (o rmín é o do
 * eixo v); na de treliça ligada por uma aba, a barra inteira sobre o rmín.
 */
function esbeltezDaBarra(s: Secao, L: Comprimentos, ligacao?: LigacaoPorUmaAba): Conta {
  if (s.familia === 'L' && ligacao) {
    const valor = L.Lx / s.rv;
    return { simbolo: v('λ', 'máx'), formula: fr(v('L', 'x1'), v('r', 'mín')), numeros: fr(n(L.Lx), n(s.rv, 3)), valor, casas: 0 };
  }
  if (s.familia === 'L') {
    const { KLu, KLv } = comprimentosPrincipais(s.alfa, L);
    const valor = Math.max(KLu > 0 ? KLu / s.ru : 0, KLv > 0 ? KLv / s.rv : 0);
    return {
      simbolo: v('λ', 'máx'),
      formula: x('máx(', fr(v('L', 'u'), v('r', 'u')), '; ', fr(v('L', 'v'), v('r', 'v')), ')'),
      numeros: x('máx(', fr(n(KLu), n(s.ru, 3)), '; ', fr(n(KLv), n(s.rv, 3)), ')'),
      valor,
      casas: 0,
    };
  }
  const valor = Math.max(L.Lx > 0 ? L.Lx / s.rx : 0, L.Ly > 0 ? L.Ly / s.ry : 0);
  return {
    simbolo: v('λ', 'máx'),
    formula: x('máx(', fr(v('L', 'x'), v('r', 'x')), '; ', fr(v('L', 'y'), v('r', 'y')), ')'),
    numeros: x('máx(', fr(n(L.Lx), n(s.rx)), '; ', fr(n(L.Ly), n(s.ry)), ')'),
    valor,
    casas: 0,
  };
}

export function verificarTracao(s: Secao, aco: Aco, L: Comprimentos, NtSd: number, ligacao?: LigacaoPorUmaAba): ResultadoTracao {
  const NtRd = (s.A * aco.fy) / GAMA_A1;
  const razao = NtSd / NtRd;
  const contaEsb = esbeltezDaBarra(s, L, ligacao);
  const esbeltez = contaEsb.valor ?? 0;
  const avisos =
    NtSd > 0 && esbeltez > ESBELTEZ_RECOMENDADA_TRACAO
      ? [`Esbeltez ${esbeltez.toFixed(0)} acima de ${ESBELTEZ_RECOMENDADA_TRACAO} (5.2.8.1).`]
      : [];
  // ⚠️ CANTONEIRA LIGADA POR UMA ABA E TRACIONADA SAI "AVALIAR" (decisão
  // dele, 04/11/2026). A ruptura da seção líquida efetiva (5.2.2-b, com o Ct
  // de 5.2.5) depende da furação e quase sempre governa nessa ligação — uns
  // 35 % abaixo do escoamento na L 3" x 3" - 6,35 com dois parafusos de 5/8".
  // A conta não sabe a ligação; a memória diz o que ela tem de dar.
  const umaAba = s.familia === 'L' && ligacao !== undefined && NtSd > 0;
  const CtAnMin = (NtSd * GAMA_A2) / aco.fu;
  if (umaAba) avisos.push(`Cantoneira ligada por uma aba: conferir a ruptura da seção líquida na ligação — Ct·An ≥ ${CtAnMin.toFixed(2).replace('.', ',')} cm² (5.2.2-b).`);
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
        ...(umaAba
          ? [
              {
                ref: '5.2.2-b; 5.2.5',
                titulo: 'Ruptura da seção líquida — o que a ligação por uma aba tem de dar',
                contas: [
                  {
                    simbolo: x(par(x(v('C', 't'), ' ', v('A', 'n'))), v('', 'mín')),
                    formula: fr(x(v('N', 't,Sd'), ' ', v('γ', 'a2')), v('f', 'u')),
                    numeros: fr(x(n(NtSd), ' · ', n(GAMA_A2, 2)), n(aco.fu)),
                    valor: CtAnMin,
                    unidade: 'cm²',
                    rotulo: 'Ct de 5.2.5, An da furação',
                  },
                ],
                nota: 'Na cantoneira ligada por uma aba a ruptura da seção líquida costuma governar; a calculadora não conhece a ligação, por isso a verificação fica para avaliar.',
              },
            ]
          : []),
        {
          ref: '5.2.1.2; 5.2.8.1',
          titulo: 'Verificação',
          contas: [
            { ...contaEsb, rotulo: esbeltez <= ESBELTEZ_RECOMENDADA_TRACAO ? '≤ 300 (5.2.8.1)' : '> 300 (5.2.8.1)' },
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
