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
//
//  AÇOS DE CHAPA (04/11/2026, com o perfil soldado): os "Chapas e barras" da
//  Tabela A.2 e as chapas grossas da Tabela A.1 (NBR 6648, 5000 e 5008). As
//  chapas finas (NBR 6649/6650, 5004, 5920/5921) ficaram de fora: são de
//  perfil formado a frio, não de soldado. USI-CIVIL e similares são nomes
//  comerciais e não estão nas tabelas da norma.
//  ⚠️ NA CHAPA O fy CAI COM A ESPESSURA: cada faixa da tabela é um aço da
//  lista, com tMin/tMax, e o motor confere a chapa mais grossa contra a faixa.
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

/** Os aços de chapa, para o perfil soldado (Tabela A.2 "Chapas e barras" e Tabela A.1). */
export const ACOS_DE_CHAPA: readonly Aco[] = [
  // Tabela A.2: fu do A36 é "400 a 550" — o mínimo garantido entra na conta.
  { nome: 'ASTM A36 chapa', fy: 25, fu: 40, tipo: 'estrutural', produto: 'chapa', tMax: 200 },
  { nome: 'ASTM A572 GR42 chapa', fy: 29, fu: 41.5, tipo: 'estrutural', produto: 'chapa', tMax: 150 },
  { nome: 'ASTM A572 GR50 chapa', fy: 34.5, fu: 45, tipo: 'estrutural', produto: 'chapa', tMax: 100 },
  { nome: 'ASTM A572 GR55 chapa', fy: 38, fu: 48.5, tipo: 'estrutural', produto: 'chapa', tMax: 50 },
  { nome: 'ASTM A572 GR60 chapa', fy: 41.5, fu: 52, tipo: 'estrutural', produto: 'chapa', tMax: 31.5 },
  { nome: 'ASTM A572 GR65 chapa', fy: 45, fu: 55, tipo: 'estrutural', produto: 'chapa', tMax: 31.5 },
  { nome: 'ASTM A242 chapa até 19 mm', fy: 34.5, fu: 48, tipo: 'patinavel', produto: 'chapa', tMax: 19 },
  { nome: 'ASTM A242 chapa 19 a 37,5 mm', fy: 31.5, fu: 46, tipo: 'patinavel', produto: 'chapa', tMin: 19, tMax: 37.5 },
  { nome: 'ASTM A242 chapa 37,5 a 100 mm', fy: 29, fu: 43.5, tipo: 'patinavel', produto: 'chapa', tMin: 37.5, tMax: 100 },
  { nome: 'ASTM A588 chapa até 100 mm', fy: 34.5, fu: 48, tipo: 'patinavel', produto: 'chapa', tMax: 100 },
  { nome: 'ASTM A588 chapa 100 a 125 mm', fy: 31.5, fu: 46, tipo: 'patinavel', produto: 'chapa', tMin: 100, tMax: 125 },
  { nome: 'ASTM A588 chapa 125 a 200 mm', fy: 29, fu: 43.5, tipo: 'patinavel', produto: 'chapa', tMin: 125, tMax: 200 },
  // Tabela A.1: chapas grossas das normas brasileiras (sem faixa de espessura na tabela).
  { nome: 'NBR 6648 CG-26', fy: 25.5, fu: 41, tipo: 'estrutural', produto: 'chapa' },
  { nome: 'NBR 6648 CG-28', fy: 27.5, fu: 44, tipo: 'estrutural', produto: 'chapa' },
  { nome: 'NBR 5000 G-30', fy: 30, fu: 41.5, tipo: 'estrutural', produto: 'chapa' },
  { nome: 'NBR 5000 G-35', fy: 34.5, fu: 45, tipo: 'estrutural', produto: 'chapa' },
  { nome: 'NBR 5000 G-42', fy: 41.5, fu: 52, tipo: 'estrutural', produto: 'chapa' },
  { nome: 'NBR 5000 G-45', fy: 45, fu: 55, tipo: 'estrutural', produto: 'chapa' },
  { nome: 'NBR 5008 CGR 400', fy: 25, fu: 38, tipo: 'patinavel', produto: 'chapa' },
  { nome: 'NBR 5008 CGR 500', fy: 37, fu: 49, tipo: 'patinavel', produto: 'chapa', nota: 'Tabela A.1: CGR 500 e CGR 500A, fy = 370 MPa, fu = 490 MPa.' },
];

/** O aço de chapa com que o perfil soldado abre. */
export const ACO_DE_CHAPA_DE_PARTIDA = 'ASTM A572 GR50 chapa';

/** O aço que a planilha abre selecionado. */
export const ACO_DE_PARTIDA = 'ASTM A572 GR50';

const POR_NOME = new Map([...ACOS, ...ACOS_DE_CHAPA].map((a) => [a.nome, a]));

/** O aço pelo nome exato da lista. */
export function acoPeloNome(nome: string): Aco | undefined {
  return POR_NOME.get(nome);
}
