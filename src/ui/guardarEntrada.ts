// ═══════════════════════════════════════════════════════════════════════════
//  ui/guardarEntrada.ts — a última entrada e a identificação da memória
//  ficam no navegador, para a calculadora reabrir onde parou
// ---------------------------------------------------------------------------
//  ⚠️ O QUE VEM DO NAVEGADOR É CONFERIDO ANTES DE ENTRAR. Uma versão velha
//  pode ter guardado um perfil ou aço que saiu do catálogo (os SAE saíram em
//  01/11/2026): aí vale o de partida, nunca um nome que o motor não acha.
// ═══════════════════════════════════════════════════════════════════════════

import { acoPeloNome, ACO_DE_PARTIDA } from '../motor/catalogos/acos';
import { perfilPeloNome } from '../motor/catalogos/perfisW';
import type { EstadoDaEntrada } from './PainelEntradas';

const CHAVE = 'calculadora-nbr8800:entrada';
const CHAVE_ID = 'calculadora-nbr8800:identificacao';

export const ENTRADA_DE_PARTIDA: EstadoDaEntrada = {
  perfil: 'W 250 x 38,5',
  aco: ACO_DE_PARTIDA,
  esforcos: { N: 0, Mx: 0, My: 0, Vx: 0, Vy: 0 },
  comprimentos: { Lx: 100, Ly: 100, Lt: 100, Cb: 1, a: 0 },
};

function numero(v: unknown, padrao: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : padrao;
}

export function lerEntrada(): EstadoDaEntrada {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Partial<EstadoDaEntrada> | null;
    if (!bruto) return ENTRADA_DE_PARTIDA;
    const p = ENTRADA_DE_PARTIDA;
    const f = (bruto.esforcos ?? {}) as Partial<EstadoDaEntrada['esforcos']>;
    const L = (bruto.comprimentos ?? {}) as Partial<EstadoDaEntrada['comprimentos']>;
    return {
      perfil: typeof bruto.perfil === 'string' && perfilPeloNome(bruto.perfil) ? bruto.perfil : p.perfil,
      aco: typeof bruto.aco === 'string' && acoPeloNome(bruto.aco) ? bruto.aco : p.aco,
      esforcos: {
        N: numero(f.N, 0),
        Mx: numero(f.Mx, 0),
        My: numero(f.My, 0),
        Vx: numero(f.Vx, 0),
        Vy: numero(f.Vy, 0),
      },
      comprimentos: {
        Lx: Math.max(0, numero(L.Lx, p.comprimentos.Lx)),
        Ly: Math.max(0, numero(L.Ly, p.comprimentos.Ly)),
        Lt: Math.max(0, numero(L.Lt, p.comprimentos.Lt)),
        Cb: Math.max(1, numero(L.Cb, 1)),
        a: Math.max(0, numero(L.a, 0)),
      },
    };
  } catch {
    return ENTRADA_DE_PARTIDA;
  }
}

export function guardarEntrada(e: EstadoDaEntrada): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e));
  } catch {
    /* navegador sem armazenamento: só não lembra */
  }
}

/** O que vai no carimbo da memória. Tudo texto livre. */
export interface Identificacao {
  obra: string;
  cliente: string;
  elemento: string;
  documento: string;
  revisao: string;
  empresa: string;
  responsavel: string;
  registro: string;
}

export const IDENTIFICACAO_VAZIA: Identificacao = {
  obra: '',
  cliente: '',
  elemento: '',
  documento: '',
  revisao: '00',
  empresa: '',
  responsavel: '',
  registro: '',
};

export function lerIdentificacao(): Identificacao {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_ID) ?? 'null') as Record<string, unknown> | null;
    const id = { ...IDENTIFICACAO_VAZIA };
    if (bruto) for (const k of Object.keys(id) as (keyof Identificacao)[]) if (typeof bruto[k] === 'string') id[k] = bruto[k];
    return id;
  } catch {
    return { ...IDENTIFICACAO_VAZIA };
  }
}

export function guardarIdentificacao(id: Identificacao): void {
  try {
    localStorage.setItem(CHAVE_ID, JSON.stringify(id));
  } catch {
    /* idem */
  }
}
