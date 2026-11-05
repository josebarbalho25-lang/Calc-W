// ═══════════════════════════════════════════════════════════════════════════
//  estilo/preferenciasDaInterface.ts — o tema da tela, lembrado no navegador
// ---------------------------------------------------------------------------
//  Os três temas do A-PORT, com os mesmos nomes e os mesmos tokens
//  (`tokens.css`): escuro ("dark"), claro ("modern") e papel ("paper"). A
//  troca é a do A-PORT (`estilo/preferenciasDaInterface.ts`), reduzida ao
//  tema; aqui ela mora no painel da engrenagem (`ui/PainelConfiguracao.tsx`),
//  ao lado do projetista.
//
//  ⚠️ É PREFERÊNCIA DA MÁQUINA, não da entrada: não vai junto com o perfil
//  guardado nem pelo `#entrada=` dos prints.
//
//  ⚠️ O 3D NÃO OBSERVA VARIÁVEL DE CSS. O desenho 2D e os diagramas são SVG
//  com classe, e repintam sozinhos; a cena 3D lê a cor do token UMA vez
//  (`cor()` em `pecas3D.tsx`). Quem tem cena usa `useTema()` como chave do
//  Canvas — a cena se monta de novo com as cores do tema novo, e a janela
//  em volta (a aba, a opção escolhida) fica como estava.
//
//  ⚠️ A MEMÓRIA EM PDF NÃO MUDA: o papel tem a paleta dele (`estiloRelatorio`).
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';

const CHAVE = 'calculadora-nbr8800:tema';

export const TEMAS = ['dark', 'modern', 'paper'] as const;
export type Tema = (typeof TEMAS)[number];

/** O nome que aparece no painel da engrenagem. */
export const NOME_DO_TEMA: Record<Tema, string> = { dark: 'Escuro', modern: 'Claro', paper: 'Papel' };

function ehTema(v: unknown): v is Tema {
  return typeof v === 'string' && (TEMAS as readonly string[]).includes(v);
}

export function lerTema(): Tema {
  try {
    const v = localStorage.getItem(CHAVE);
    return ehTema(v) ? v : 'dark';
  } catch {
    return 'dark';
  }
}

/** Escreve o tema no corpo — o único ponto que toca o atributo. */
export function aplicarTema(t: Tema): void {
  document.body.dataset.theme = t;
}

/** O tema escolhido no painel da engrenagem, gravado e aplicado. */
export function escolherTema(t: Tema): void {
  try {
    localStorage.setItem(CHAVE, t);
  } catch {
    /* sem armazenamento: só não lembra na próxima vez */
  }
  aplicarTema(t);
}

/** O tema atual, e um novo render quando ele muda (observa body[data-theme]). */
export function useTema(): Tema {
  const ler = (): Tema => (ehTema(document.body.dataset.theme) ? document.body.dataset.theme : 'dark');
  const [tema, setTema] = useState<Tema>(ler);
  useEffect(() => {
    const obs = new MutationObserver(() => setTema(ler()));
    obs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return tema;
}
