// ═══════════════════════════════════════════════════════════════════════════
//  motor/index.ts — a porta do motor: entra a seção com os esforços, sai a
//  verificação inteira pela NBR 8800:2024, com a memória passo a passo
// ---------------------------------------------------------------------------
//  É ESTA a função que o A-PORT vai chamar, barra a barra. Nada aqui sabe de
//  tela: quem chama monta a `EntradaDaVerificacao` (o perfil do catálogo, o
//  aço, os esforços de uma seção e os comprimentos da barra) e lê o resultado.
// ═══════════════════════════════════════════════════════════════════════════

import { verificarCombinados, type ResultadoCombinado } from './combinados';
import { verificarCompressao, type ResultadoCompressao } from './compressao';
import { verificarCortanteX, verificarCortanteY, type ResultadoCortante } from './cortante';
import { verificarFlexaoX, verificarFlexaoY, type ResultadoFlexaoX, type ResultadoFlexaoY } from './flexao';
import type { Situacao, Verificacao } from './memoria';
import { secaoEmCm, type SecaoI } from './secao';
import { verificarTracao, type ResultadoTracao } from './tracao';
import type { EntradaDaVerificacao } from './tipos';

export interface ResultadoDaVerificacao {
  entrada: EntradaDaVerificacao;
  secao: SecaoI;
  tracao: ResultadoTracao;
  compressao: ResultadoCompressao;
  flexaoX: ResultadoFlexaoX;
  flexaoY: ResultadoFlexaoY;
  cortanteY: ResultadoCortante;
  cortanteX: ResultadoCortante;
  combinada: ResultadoCombinado;
  /** As sete, na ordem da memória e da tela. */
  lista: Verificacao[];
  /** A pior razão Sd/Rd entre as sete. */
  razaoMaxima: number;
  situacao: Situacao;
}

/** A entrada que o motor recusa — a frase diz qual campo e por quê. */
export class EntradaInvalida extends Error {}

/**
 * ⚠️ O MOTOR RECUSA ENTRADA ESTRANHA EM VEZ DE CALCULAR COM ELA. Comprimento
 * NaN ou negativo caía no "L > 0 ? … : travada" e a barra virava travada: um
 * W 410 x 38,8 com L = 500 que NÃO ATENDE (interação 2,37) passava a ATENDER
 * (0,60) — achado da revisão de 01/11/2026. A tela já barra isso no campo; a
 * trava aqui é para quem chamar o motor direto, como o A-PORT vai chamar.
 */
function validar(e: EntradaDaVerificacao): void {
  const L = e.comprimentos;
  for (const k of ['Lx', 'Ly', 'Lt', 'a'] as const) {
    if (!Number.isFinite(L[k]) || L[k] < 0) throw new EntradaInvalida(`${k} = ${L[k]}: comprimento tem de ser um número ≥ 0`);
  }
  if (!Number.isFinite(L.Cb) || L.Cb < 1) throw new EntradaInvalida(`Cb = ${L.Cb}: tem de ser um número ≥ 1`);
  for (const [k, valor] of Object.entries(e.esforcos)) {
    if (!Number.isFinite(valor)) throw new EntradaInvalida(`${k} = ${valor}: esforço tem de ser um número`);
  }
  if (!(e.aco.fy > 0 && e.aco.fu > 0)) throw new EntradaInvalida(`aço ${e.aco.nome} sem fy ou fu`);
}

export function verificar(entrada: EntradaDaVerificacao): ResultadoDaVerificacao {
  validar(entrada);
  const { perfil, aco, esforcos: f, comprimentos: L } = entrada;
  const s = secaoEmCm(perfil);

  const tracao = verificarTracao(s, aco, L, Math.max(-f.N, 0));
  const compressao = verificarCompressao(s, aco, L, Math.max(f.N, 0));
  const flexaoX = verificarFlexaoX(s, aco, L, f.Mx);
  const flexaoY = verificarFlexaoY(s, aco, f.My);
  const cortanteY = verificarCortanteY(s, aco, L.a, f.Vy);
  const cortanteX = verificarCortanteX(s, aco, f.Vx);
  const combinada = verificarCombinados(f.N, tracao.NtRd, compressao.NcRd, f.Mx, flexaoX.MRd, f.My, flexaoY.MRd);

  const lista = [tracao, compressao, flexaoX, flexaoY, cortanteY, cortanteX, combinada].map((r) => r.verificacao);
  // NaN (alma esbelta) tem de pesar como reprovação, não sumir do máximo.
  const razaoMaxima = lista.some((vf) => Number.isNaN(vf.razao)) ? NaN : Math.max(...lista.map((vf) => vf.razao));
  const situacao: Situacao = lista.some((vf) => vf.situacao === 'naoAtende')
    ? 'naoAtende'
    : lista.some((vf) => vf.situacao === 'avaliar')
      ? 'avaliar'
      : 'atende';

  return { entrada, secao: s, tracao, compressao, flexaoX, flexaoY, cortanteY, cortanteX, combinada, lista, razaoMaxima, situacao };
}

export type { EntradaDaVerificacao } from './tipos';
