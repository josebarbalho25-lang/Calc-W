// ═══════════════════════════════════════════════════════════════════════════
//  motor/index.ts — a porta do motor: entra a seção com os esforços, sai a
//  verificação inteira pela NBR 8800:2024, com a memória passo a passo
// ---------------------------------------------------------------------------
//  É ESTA a função que o A-PORT vai chamar, barra a barra. Nada aqui sabe de
//  tela: quem chama monta a `EntradaDaVerificacao` (o perfil do catálogo, o
//  aço, os esforços de uma seção e os comprimentos da barra) e lê o resultado.
// ═══════════════════════════════════════════════════════════════════════════

import { cortanteDaCantoneira, flexaoDaCantoneira, momentosPrincipais, passoDosMomentos } from './cantoneira';
import { problemaDasChapas } from './catalogos/soldados';
import { verificarCombinados, type ResultadoCombinado } from './combinados';
import { verificarCompressao, type ResultadoCompressao } from './compressao';
import { verificarCortanteX, verificarCortanteY, type ResultadoCortante } from './cortante';
import { verificarFlexaoX, verificarFlexaoY, type ResultadoFlexaoX, type ResultadoFlexaoY } from './flexao';
import { verificarFlexaoXU, verificarFlexaoYU } from './flexaoU';
import { piorVerificacao, type Situacao, type Verificacao } from './memoria';
import { secaoEmCm, type Secao } from './secao';
import { verificarTracao, type ResultadoTracao } from './tracao';
import type { EntradaDaVerificacao } from './tipos';

export interface ResultadoDaVerificacao {
  entrada: EntradaDaVerificacao;
  secao: Secao;
  tracao: ResultadoTracao;
  compressao: ResultadoCompressao;
  /**
   * Flexão, cortante e interação: no I e no U, sempre. Na cantoneira ainda
   * não existem (ver `cantoneira.ts`) — a lista leva só o cartão pendente,
   * e só quando o esforço foi digitado.
   */
  flexaoX?: ResultadoFlexaoX;
  flexaoY?: ResultadoFlexaoY;
  cortanteY?: ResultadoCortante;
  cortanteX?: ResultadoCortante;
  combinada?: ResultadoCombinado;
  /** As verificações, na ordem da memória e da tela (sete no I e no U). */
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
  if (e.ligacao && e.perfil.familia !== 'L') throw new EntradaInvalida('ligação por uma aba só existe na cantoneira');
  validarSoldado(e);
  if (e.ligacao && !(L.Lx > 0)) throw new EntradaInvalida('cantoneira de treliça: o comprimento entre pontos de trabalho (Lx) tem de ser > 0');
}

const mmBr = (t: number) => `${String(t).replace('.', ',')} mm`;

/**
 * Perfil soldado leva aço de CHAPA, e laminado leva aço de PERFIL: as
 * Tabelas A.1 e A.2 separam os dois, e na chapa o fy cai com a espessura (o
 * A572 Gr60 de chapa só existe até 31,5 mm). A faixa é conferida pela chapa
 * MAIS GROSSA do perfil — a de fy mais baixo, o lado da segurança quando as
 * chapas caem em faixas diferentes.
 */
function validarSoldado(e: EntradaDaVerificacao): void {
  const p = e.perfil;
  const soldado = p.familia === 'I' && p.soldado ? p.soldado : undefined;
  const deChapa = e.aco.produto === 'chapa';
  if (!soldado) {
    if (deChapa) throw new EntradaInvalida(`${e.aco.nome} é aço de chapa: perfil laminado leva aço de perfil`);
    return;
  }
  const problema = problemaDasChapas(soldado);
  if (problema) throw new EntradaInvalida(problema);
  if (!deChapa) throw new EntradaInvalida(`${e.aco.nome} é aço de perfil laminado: perfil soldado leva aço de chapa`);
  const t = Math.max(soldado.tw, soldado.mesaSuperior.tf, soldado.mesaInferior.tf);
  if (e.aco.tMax !== undefined && t > e.aco.tMax)
    throw new EntradaInvalida(`chapa de ${mmBr(t)} acima da faixa do ${e.aco.nome} (até ${mmBr(e.aco.tMax)})`);
  if (e.aco.tMin !== undefined && t <= e.aco.tMin)
    throw new EntradaInvalida(`chapa mais grossa de ${mmBr(t)}: o ${e.aco.nome} é da faixa acima de ${mmBr(e.aco.tMin)}`);
}

export function verificar(entrada: EntradaDaVerificacao): ResultadoDaVerificacao {
  validar(entrada);
  const { perfil, aco, esforcos: f, comprimentos: L, ligacao } = entrada;
  const s = secaoEmCm(perfil);

  const tracao = verificarTracao(s, aco, L, Math.max(-f.N, 0), ligacao);
  const compressao = verificarCompressao(s, aco, L, Math.max(f.N, 0), ligacao);

  let flexaoX: ResultadoFlexaoX | undefined;
  let flexaoY: ResultadoFlexaoY | undefined;
  let cortanteY: ResultadoCortante | undefined;
  let cortanteX: ResultadoCortante | undefined;
  let combinada: ResultadoCombinado | undefined;
  let lista: Verificacao[];
  if (s.familia === 'L') {
    // Cantoneira: flexão e cortante pelo AISC 360-22 (F10, G3), nos eixos
    // principais; cada cartão só entra quando o esforço existe.
    const { Mu, Mv } = momentosPrincipais(s.alfa, f.Mx, f.My);
    // Na de treliça o comprimento é um só (Lx, entre os pontos de trabalho).
    const Lb = ligacao ? L.Lx : L.Lt;
    const fu = Mu !== 0 ? flexaoDaCantoneira(s, aco.fy, 'u', Mu, Lb, L.Cb) : undefined;
    const fv = Mv !== 0 ? flexaoDaCantoneira(s, aco.fy, 'v', Mv, Lb, L.Cb) : undefined;
    // O 5.3.5.4.1-c exclui ação transversal na cantoneira de treliça: com
    // momento ou cortante, o comprimento equivalente não vale mais.
    if (ligacao && (f.Mx || f.My || f.Vx || f.Vy) && f.N > 0) {
      const vc = compressao.verificacao;
      vc.avisos.push('Cantoneira de treliça com momento ou cortante: fora da condição c) de 5.3.5.4.1 — tratar como força axial e momentos (5.3.5.4.5), com a Barra pelo centroide.');
      vc.situacao = vc.situacao === 'naoAtende' ? 'naoAtende' : 'avaliar';
    }
    const giro = passoDosMomentos(s.alfa, f.Mx, f.My);
    if (fu) fu.verificacao.passos.unshift(giro);
    else if (fv) fv.verificacao.passos.unshift(giro);
    const vx = f.Vx !== 0 ? cortanteDaCantoneira(s, aco.fy, 'x', f.Vx) : undefined;
    const vy = f.Vy !== 0 ? cortanteDaCantoneira(s, aco.fy, 'y', f.Vy) : undefined;
    const comMomento = Boolean(fu || fv);
    if (comMomento) {
      combinada = verificarCombinados(f.N, tracao.NtRd, compressao.NcRd, Mu, fu?.MRd ?? Infinity, Mv, fv?.MRd ?? Infinity, ['u', 'v']);
      // Sem o βw a interação não tem um dos resistentes: fica sem número.
      if (Number.isNaN(combinada.valor)) combinada.verificacao = { ...combinada.verificacao, razao: NaN, situacao: 'avaliar', governa: 'falta o Mu,Rd' };
    }
    lista = [tracao.verificacao, compressao.verificacao, ...[fu, fv, vy, vx, combinada].filter((r) => r !== undefined).map((r) => r.verificacao)];
  } else {
    flexaoX = s.familia === 'U' ? verificarFlexaoXU(s, aco, L, f.Mx) : verificarFlexaoX(s, aco, L, f.Mx, entrada.curvatura);
    flexaoY = s.familia === 'U' ? verificarFlexaoYU(s, aco, f.My) : verificarFlexaoY(s, aco, f.My);
    cortanteY = verificarCortanteY(s, aco, L.a, f.Vy);
    cortanteX = verificarCortanteX(s, aco, f.Vx);
    combinada = verificarCombinados(f.N, tracao.NtRd, compressao.NcRd, f.Mx, flexaoX.MRd, f.My, flexaoY.MRd);
    // Alma esbelta (Anexo E) deixa a flexão em X sem resistente: a interação
    // também fica sem número, e "avaliar" como ela.
    if (Number.isNaN(combinada.valor)) {
      // Sem Mx,Rd: ou a viga não é admitida (E.5.3-b) — reprova —, ou é a
      // alma esbelta do laminado, que fica para avaliar.
      const naoAdmitida = flexaoX.verificacao.situacao === 'naoAtende';
      combinada.verificacao = {
        ...combinada.verificacao,
        razao: NaN,
        situacao: naoAdmitida ? 'naoAtende' : 'avaliar',
        governa: naoAdmitida ? 'viga não admitida (E.5.3-b)' : 'falta o Mx,Rd (Anexo E)',
      };
    }
    lista = [tracao, compressao, flexaoX, flexaoY, cortanteY, cortanteX, combinada].map((r) => r.verificacao);
  }
  // O índice máximo é o da verificação que governa (`piorVerificacao`): a
  // alma esbelta (NaN, não atende) segue pesando como reprovação; o cartão
  // "avaliar" sem número da cantoneira não esconde uma razão que reprova.
  const pior = piorVerificacao(lista);
  const finitas = lista.filter((vf) => Number.isFinite(vf.razao)).map((vf) => vf.razao);
  const razaoMaxima = pior.situacao === 'naoAtende' && Number.isNaN(pior.razao) ? NaN : finitas.length ? Math.max(...finitas) : NaN;
  const situacao: Situacao = lista.some((vf) => vf.situacao === 'naoAtende')
    ? 'naoAtende'
    : lista.some((vf) => vf.situacao === 'avaliar')
      ? 'avaliar'
      : 'atende';

  return { entrada, secao: s, tracao, compressao, flexaoX, flexaoY, cortanteY, cortanteX, combinada, lista, razaoMaxima, situacao };
}

export type { EntradaDaVerificacao } from './tipos';
