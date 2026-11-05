// ═══════════════════════════════════════════════════════════════════════════
//  ui/configuracao.ts — o projetista, guardado no navegador
// ---------------------------------------------------------------------------
//  Nome, título ("Engenheiro Civil") e CREA de quem assina. Moram aqui, num
//  lugar só, e a memória de cálculo os lê para o carimbo e para o bloco de
//  assinatura — antes eram dois campos do carimbo da memória ("responsável
//  técnico" e "registro"), que se perdiam a cada obra nova.
//
//  O tema da tela mora em `estilo/preferenciasDaInterface.ts`; o painel da
//  engrenagem (`PainelConfiguracao.tsx`) mostra os dois.
//
//  ⚠️ PROJETISTA EM BRANCO: a memória sai com o espaço em branco para assinar.
// ═══════════════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from 'react';
import type { Projetista } from '../relatorio/projetista';

const CHAVE = 'calculadora-nbr8800:projetista';

export const PROJETISTA_VAZIO: Projetista = { nome: '', titulo: '', crea: '' };

// `&projetista={...}` no endereço vale só para o print sem janela (não grava),
// como o `&tema=` do main.tsx.
function textoDoProjetista(): string | null {
  const doEndereco = typeof location === 'undefined' ? null : /[#&]projetista=([^&]*)/.exec(location.hash)?.[1];
  return doEndereco ? decodeURIComponent(doEndereco) : localStorage.getItem(CHAVE);
}

export function lerProjetista(): Projetista {
  try {
    const bruto = JSON.parse(textoDoProjetista() ?? 'null') as Record<string, unknown> | null;
    const p = { ...PROJETISTA_VAZIO };
    if (bruto) for (const k of Object.keys(p) as (keyof Projetista)[]) if (typeof bruto[k] === 'string') p[k] = bruto[k];
    return p;
  } catch {
    return { ...PROJETISTA_VAZIO };
  }
}

// Quem mostra o projetista (a janela da memória, o PDF exportado da tela)
// relê quando ele muda — o painel da engrenagem e a memória podem estar
// abertos ao mesmo tempo.
let atual: Projetista | null = null;
const ouvintes = new Set<() => void>();

export function guardarProjetista(p: Projetista): void {
  atual = { ...p };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    /* navegador sem armazenamento: só não lembra */
  }
  for (const f of ouvintes) f();
}

/** O projetista atual, e um novo render quando ele muda. */
export function useProjetista(): Projetista {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f);
      return () => ouvintes.delete(f);
    },
    () => (atual ??= lerProjetista()),
  );
}
