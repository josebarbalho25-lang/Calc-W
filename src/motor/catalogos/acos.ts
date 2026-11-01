// ═══════════════════════════════════════════════════════════════════════════
//  motor/catalogos/acos.ts — a lista de aços, fy e fu em kN/cm²
// ---------------------------------------------------------------------------
//  Só aço em que se lamina perfil — decisão dele (01/11/2026). Partiu da
//  lista de aços da planilha de referência, com os mesmos nomes e na mesma
//  ordem; saíram os de chapa e de perfil formado a frio (A570, ZAR, SAE,
//  COS-CIVIL, USI-SAC, COS-AR-COR, CSN-COR) e entrou o A992. Conferida contra
//  a Tabela A.1 (MR250) e a Tabela A.2 (os ASTM) da NBR 8800:2024.
//
//  ⚠️ UM VALOR DIFERE DA PLANILHA (o fu do A588), com a `nota` dizendo o que
//  ela tinha; uma segunda diferença sem anotação reprova o selo do catálogo.
//
//  ⚠️ O "G1, G2, G3" do A242 é o GRUPO DE PERFIL da Tabela A.2, pela
//  espessura da mesa (1: tf ≤ 37,5 mm; 2: até 50 mm; 3: acima). Todo perfil W
//  e HP do catálogo Gerdau tem mesa abaixo de 37,5 mm — é sempre o G1.
// ═══════════════════════════════════════════════════════════════════════════

import type { Aco } from '../tipos';

export const ACOS: readonly Aco[] = [
  { nome: 'ASTM A36', fy: 25, fu: 40, tipo: 'estrutural' },
  { nome: 'ASTM A572 GR42', fy: 29, fu: 41.5, tipo: 'estrutural' },
  { nome: 'ASTM A572 GR50', fy: 34.5, fu: 45, tipo: 'estrutural' },
  { nome: 'ASTM A572 GR60', fy: 41.5, fu: 52, tipo: 'estrutural' },
  {
    nome: 'ASTM A992',
    // A Tabela A.2 dá fy "345 a 450": o 345 é o mínimo garantido, e é ele que
    // entra na conta. O teto existe para a ligação e a rótula plástica — aço
    // mais forte que o previsto também muda onde a estrutura escoa primeiro.
    fy: 34.5,
    fu: 45,
    tipo: 'estrutural',
    nota: 'Não está na planilha. NBR 8800:2024, Tabela A.2: fy = 345 MPa (mínimo), fu = 450 MPa.',
  },
  {
    nome: 'ASTM A588',
    fy: 34.5,
    fu: 48.5,
    tipo: 'patinavel',
    // fu só entra na ruptura da seção líquida, que esta calculadora ainda não
    // verifica — não muda resultado hoje, mas mudaria no dia em que entrar.
    nota: 'Planilha: fu = 48,0 (valor de chapa). NBR 8800:2024, Tabela A.2, perfis: fu = 485 MPa.',
  },
  { nome: 'ASTM A242 G1', fy: 34.5, fu: 48.5, tipo: 'patinavel' },
  { nome: 'ASTM A242 G2', fy: 31.5, fu: 46, tipo: 'patinavel' },
  { nome: 'ASTM A242 G3', fy: 29, fu: 43.5, tipo: 'patinavel' },
  { nome: 'ABNT MR250', fy: 25, fu: 40, tipo: 'estrutural' },
];

/** O aço que a planilha abre selecionado. */
export const ACO_DE_PARTIDA = 'ASTM A572 GR50';

const POR_NOME = new Map(ACOS.map((a) => [a.nome, a]));

/** O aço pelo nome exato da lista. */
export function acoPeloNome(nome: string): Aco | undefined {
  return POR_NOME.get(nome);
}
