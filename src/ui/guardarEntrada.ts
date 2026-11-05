// ═══════════════════════════════════════════════════════════════════════════
//  ui/guardarEntrada.ts — a última entrada e a identificação da memória
//  ficam no navegador, para a calculadora reabrir onde parou
// ---------------------------------------------------------------------------
//  ⚠️ O QUE VEM DO NAVEGADOR É CONFERIDO ANTES DE ENTRAR. Uma versão velha
//  pode ter guardado um perfil ou aço que saiu do catálogo (os SAE saíram em
//  01/11/2026): aí vale o de partida, nunca um nome que o motor não acha.
// ═══════════════════════════════════════════════════════════════════════════

import { acoPeloNome, ACO_DE_CHAPA_DE_PARTIDA, ACO_DE_PARTIDA } from '../motor/catalogos/acos';
import { perfilDoCatalogo } from '../motor/catalogos';
import { chapasIguais, perfilSoldado } from '../motor/catalogos/soldados';
import type { Aco, ChapasDoSoldado, Perfil } from '../motor/tipos';
import type { EstadoDaEntrada } from './PainelEntradas';

const CHAVE = 'calculadora-nbr8800:entrada';
const CHAVE_ID = 'calculadora-nbr8800:identificacao';

export const ENTRADA_DE_PARTIDA: EstadoDaEntrada = {
  perfil: 'W 250 x 38,5',
  aco: ACO_DE_PARTIDA,
  esforcos: { N: 0, Mx: 0, My: 0, Vx: 0, Vy: 0 },
  comprimentos: { Lx: 100, Ly: 100, Lt: 100, Cb: 1, a: 0 },
  ligacao: null,
  porChapas: false,
  chapas: chapasIguais(500, 250, 16, 8),
  acoChapa: ACO_DE_CHAPA_DE_PARTIDA,
  mesasDiferentes: false,
  curvatura: 'simples',
};

/**
 * O perfil da entrada: o do catálogo pelo nome, ou o soldado montado pelas
 * chapas digitadas. Chapas que não fecham (alma sem altura) montam um perfil
 * que o motor recusa — a barra de estado diz por quê.
 */
export function perfilDaEntrada(e: EstadoDaEntrada): Perfil {
  // Mesas "iguais" com chapas guardadas diferentes (versão velha, endereço
  // de print): vale a de cima nas duas, como a tela mostra.
  if (e.porChapas) return perfilSoldado(e.mesasDiferentes ? e.chapas : { ...e.chapas, mesaInferior: { ...e.chapas.mesaSuperior } });
  return perfilDoCatalogo(e.perfil) ?? perfilDoCatalogo(ENTRADA_DE_PARTIDA.perfil)!;
}

/** Perfil soldado leva aço de chapa; laminado, aço de perfil — cada um guarda o seu. */
export function ehSoldado(p: Perfil): boolean {
  return p.familia === 'I' && Boolean(p.soldado);
}

export function acoDaEntrada(e: EstadoDaEntrada, p: Perfil): Aco {
  return ehSoldado(p) ? (acoPeloNome(e.acoChapa) ?? acoPeloNome(ACO_DE_CHAPA_DE_PARTIDA)!) : (acoPeloNome(e.aco) ?? acoPeloNome(ACO_DE_PARTIDA)!);
}

/** As chapas guardadas, se forem números positivos; senão, as de partida. */
function chapas(v: unknown): ChapasDoSoldado {
  const p = ENTRADA_DE_PARTIDA.chapas;
  if (!v || typeof v !== 'object') return p;
  const o = v as Record<string, unknown>;
  const pos = (x: unknown, padrao: number) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : padrao);
  const mesa = (m: unknown, padrao: ChapasDoSoldado['mesaSuperior']) => {
    const q = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
    return { bf: pos(q.bf, padrao.bf), tf: pos(q.tf, padrao.tf) };
  };
  return { d: pos(o.d, p.d), tw: pos(o.tw, p.tw), mesaSuperior: mesa(o.mesaSuperior, p.mesaSuperior), mesaInferior: mesa(o.mesaInferior, p.mesaInferior) };
}

/** A ligação guardada, se for uma das que existem; senão, pelo centroide. */
function ligacao(v: unknown): EstadoDaEntrada['ligacao'] {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const aba = o.aba === 'maior' || o.aba === 'menor' ? o.aba : null;
  const trelica = o.trelica === 'plana' || o.trelica === 'espacial' ? o.trelica : null;
  return aba && trelica ? { aba, trelica } : null;
}

function numero(v: unknown, padrao: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : padrao;
}

/**
 * A entrada pelo endereço (`#entrada=` + JSON), antes da guardada — copiado
 * da irmã de formados a frio. É o que deixa tirar o print de um perfil
 * qualquer pelo Edge sem janela (`scripts/prints.ps1`). Passa pela mesma
 * conferência da guardada.
 */
function textoDaEntrada(): string | null {
  const marca = '#entrada=';
  const hash = typeof location === 'undefined' ? '' : location.hash;
  if (hash.startsWith(marca)) return decodeURIComponent(hash.slice(marca.length).split('&')[0]);
  return localStorage.getItem(CHAVE);
}

/** A janela que o print quer aberta (`&janela=My`, `&janela=memoria`). Só para os prints. */
export function janelaDoEndereco(): string | null {
  const achado = typeof location === 'undefined' ? null : /[#&]janela=(\w+)/.exec(location.hash);
  return achado?.[1] ?? null;
}

export function lerEntrada(): EstadoDaEntrada {
  try {
    const bruto = JSON.parse(textoDaEntrada() ?? 'null') as Partial<EstadoDaEntrada> | null;
    if (!bruto) return ENTRADA_DE_PARTIDA;
    const p = ENTRADA_DE_PARTIDA;
    const f = (bruto.esforcos ?? {}) as Partial<EstadoDaEntrada['esforcos']>;
    const L = (bruto.comprimentos ?? {}) as Partial<EstadoDaEntrada['comprimentos']>;
    return {
      perfil: typeof bruto.perfil === 'string' && perfilDoCatalogo(bruto.perfil) ? bruto.perfil : p.perfil,
      aco: typeof bruto.aco === 'string' && acoPeloNome(bruto.aco) && acoPeloNome(bruto.aco)!.produto !== 'chapa' ? bruto.aco : p.aco,
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
      ligacao: ligacao(bruto.ligacao),
      porChapas: bruto.porChapas === true,
      chapas: chapas(bruto.chapas),
      acoChapa: typeof bruto.acoChapa === 'string' && acoPeloNome(bruto.acoChapa)?.produto === 'chapa' ? bruto.acoChapa : p.acoChapa,
      mesasDiferentes: bruto.mesasDiferentes === true,
      curvatura: bruto.curvatura === 'reversa' ? 'reversa' : 'simples',
    };
  } catch {
    return ENTRADA_DE_PARTIDA;
  }
}

export function guardarEntrada(e: EstadoDaEntrada): void {
  // Aberta pelo endereço (print sem janela), não grava por cima da entrada
  // que ele deixou guardada.
  if (typeof location !== 'undefined' && location.hash.startsWith('#entrada=')) return;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(e));
  } catch {
    /* navegador sem armazenamento: só não lembra */
  }
}

/**
 * O que vai no carimbo da memória, de obra em obra. Tudo texto livre.
 * Quem assina (nome, título, CREA) não mora aqui: é do projetista, no painel
 * da engrenagem (`configuracao.ts`) — um lugar só, para não ter campo dobrado.
 */
export interface Identificacao {
  obra: string;
  cliente: string;
  elemento: string;
  documento: string;
  revisao: string;
  empresa: string;
}

export const IDENTIFICACAO_VAZIA: Identificacao = {
  obra: '',
  cliente: '',
  elemento: '',
  documento: '',
  revisao: '00',
  empresa: '',
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
