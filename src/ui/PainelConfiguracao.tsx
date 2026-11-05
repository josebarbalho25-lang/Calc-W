// ═══════════════════════════════════════════════════════════════════════════
//  ui/PainelConfiguracao.tsx — a engrenagem do canto superior direito e o
//  painel pequeno que ela abre: tema e projetista
// ---------------------------------------------------------------------------
//  Só rótulo, valor e controle. Tudo grava na hora, no navegador: não há
//  "salvar" para esquecer de apertar. O projetista alimenta o carimbo e a
//  assinatura da memória (`relatorio/projetista.ts`).
//
//  O mesmo desenho na irmã 14762 — as duas calculadoras têm de ficar iguais.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { escolherTema, NOME_DO_TEMA, TEMAS, useTema } from '../estilo/preferenciasDaInterface';
import type { Projetista } from '../relatorio/projetista';
import { guardarProjetista, useProjetista } from './configuracao';

const CAMPOS: Array<[keyof Projetista, string]> = [
  ['nome', 'Nome'],
  ['titulo', 'Título'],
  ['crea', 'CREA'],
];

function Engrenagem() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 00.32 1.77l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.6 1.6 0 00-1.77-.32 1.6 1.6 0 00-.97 1.47V21a2 2 0 11-4 0v-.1A1.6 1.6 0 009.1 19.4a1.6 1.6 0 00-1.77.32l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.6 1.6 0 004.82 15a1.6 1.6 0 00-1.47-.97H3a2 2 0 110-4h.1A1.6 1.6 0 004.6 9.1a1.6 1.6 0 00-.32-1.77l-.06-.06a2 2 0 112.83-2.83l.06.06A1.6 1.6 0 009 4.82h.08A1.6 1.6 0 0010 3.35V3a2 2 0 114 0v.1a1.6 1.6 0 00.97 1.47 1.6 1.6 0 001.77-.32l.06-.06a2 2 0 112.83 2.83l-.06.06A1.6 1.6 0 0019.18 9v.08a1.6 1.6 0 001.47.97H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5.95z" />
    </svg>
  );
}

export function PainelConfiguracao({ abertoDeInicio = false }: { abertoDeInicio?: boolean }) {
  const [aberto, setAberto] = useState(abertoDeInicio);
  const tema = useTema();
  const projetista = useProjetista();
  const caixa = useRef<HTMLDivElement>(null);

  // Fecha no Esc e no clique fora — o botão é parte da caixa, para o clique
  // nele não fechar e reabrir no mesmo gesto.
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    const fora = (e: MouseEvent) => caixa.current && !caixa.current.contains(e.target as Node) && setAberto(false);
    window.addEventListener('keydown', tecla);
    window.addEventListener('mousedown', fora);
    return () => {
      window.removeEventListener('keydown', tecla);
      window.removeEventListener('mousedown', fora);
    };
  }, [aberto]);

  return (
    <div className="configuracao" ref={caixa}>
      <button
        type="button"
        className={`btn-engrenagem${aberto ? ' ativo' : ''}`}
        onClick={() => setAberto((a) => !a)}
        title="Configuração"
        aria-label="Configuração"
        aria-expanded={aberto}
      >
        <Engrenagem />
      </button>
      {aberto && (
        <div className="painel-configuracao" role="dialog" aria-label="Configuração">
          <fieldset className="cad-bloco">
            <legend>Tema</legend>
            <div className="segmentado" role="radiogroup" aria-label="Tema">
              {TEMAS.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={tema === t} className={tema === t ? 'ativo' : ''} onClick={() => escolherTema(t)}>
                  {NOME_DO_TEMA[t]}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="cad-bloco">
            <legend>Projetista</legend>
            {CAMPOS.map(([k, rotulo]) => (
              <div className="cad-linha linha-texto" key={k}>
                <label htmlFor={`projetista-${k}`}>{rotulo}</label>
                <input
                  id={`projetista-${k}`}
                  className="campo texto"
                  value={projetista[k]}
                  onChange={(e) => guardarProjetista({ ...projetista, [k]: e.target.value })}
                />
              </div>
            ))}
          </fieldset>
        </div>
      )}
    </div>
  );
}
