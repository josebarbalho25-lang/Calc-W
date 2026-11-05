// ═══════════════════════════════════════════════════════════════════════════
//  relatorio/projetista.ts — quem assina a memória
// ---------------------------------------------------------------------------
//  Arquivo à parte porque a capa (`paginaDaMemoria.ts`) e as conclusões
//  (`capitulos.ts`) leem o mesmo projetista, e a capa já importa as
//  conclusões — morar numa delas faria as duas se importarem.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quem assina: vem do painel da engrenagem (`ui/configuracao.ts`), guardado
 * no navegador — não do carimbo, que muda de obra em obra. Em branco, a
 * memória sai com o espaço para assinar à mão.
 */
export interface Projetista {
  nome: string;
  /** "Engenheiro Civil". */
  titulo: string;
  crea: string;
}

/** "CREA 123456/D", sem dobrar a sigla se ela já veio digitada. */
export function creaPorExtenso(crea: string): string {
  const c = crea.trim();
  return !c ? '' : /^crea\b/i.test(c) ? c : `CREA ${c}`;
}
