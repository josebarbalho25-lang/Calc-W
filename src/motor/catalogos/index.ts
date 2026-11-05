// ═══════════════════════════════════════════════════════════════════════════
//  motor/catalogos/index.ts — o catálogo inteiro, todas as famílias
// ---------------------------------------------------------------------------
//  W e HP (Gerdau), I padrão americano (Tabela A6.2), U (Tabela A6.3, pelo
//  catálogo do A-PORT), cantoneiras (idem) e os soldados CS, CVS e VS da NBR
//  5884 (Tabelas A8). A tela procura num catálogo só; os nomes não se repetem
//  entre famílias (W, HP, I, U, L, CS, CVS e VS puxam a sigla).
// ═══════════════════════════════════════════════════════════════════════════

import type { Perfil } from '../tipos';
import { CANTONEIRAS } from './cantoneiras';
import { PERFIS_I_PADRAO } from './perfisIPadrao';
import { PERFIS_SOLDADOS } from './perfisSoldados';
import { PERFIS_U } from './perfisU';
import { PERFIS_I } from './perfisW';

export const CATALOGO: readonly Perfil[] = [...PERFIS_I, ...PERFIS_I_PADRAO, ...PERFIS_U, ...CANTONEIRAS, ...PERFIS_SOLDADOS];

const POR_NOME = new Map(CATALOGO.map((p) => [p.nome, p]));

/** Qualquer bitola pelo nome exato ("U 203,2 x 17,1", 'L 3" x 3" - 6,35'). */
export function perfilDoCatalogo(nome: string): Perfil | undefined {
  return POR_NOME.get(nome);
}
