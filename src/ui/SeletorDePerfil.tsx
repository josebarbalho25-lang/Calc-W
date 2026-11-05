// ═══════════════════════════════════════════════════════════════════════════
//  ui/SeletorDePerfil.tsx — a bitola, escolhida digitando
// ---------------------------------------------------------------------------
//  Como se procura bitola: "310" acha todos os W 310, "38,7" acha pela massa,
//  "hp" acha os de pilar, "u203" os U de 8", "l3x3" as cantoneiras de 3". A
//  regra de busca é a do A-PORT (`secoes/catalogoDePerfis.ts`): minúscula,
//  vírgula vira ponto, espaço some dos dois lados — `w310x38,7`,
//  `W 310 x 38.7` e `w 310 X 38,7` são a mesma. Aspas e traço também somem:
//  `L 3" x 3" - 6,35` se acha digitando `l3x3`.
//
//  Setas sobem e descem, Enter escolhe, Esc fecha sem mudar.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useRef, useState } from 'react';
import { CATALOGO } from '../motor/catalogos';
import type { Perfil } from '../motor/tipos';
import { num } from '../relatorio/formatos';

function normalizar(t: string): string {
  return t.toLowerCase().replace(/,/g, '.').replace(/["\-\s]+/g, '');
}

/**
 * Família por família (W e HP, I, U, cantoneira, e os soldados CS, CVS e
 * VS); dentro dela, pela altura nominal e depois pela massa — W 150 … W 610,
 * leve antes. A cantoneira fica na ordem do catálogo (polegada, já crescente).
 */
const ORDEM_FAMILIA = { I: 0, U: 2, L: 3 } as const;
const ORDEM_SERIE: Partial<Record<string, number>> = { I: 1, CS: 4, CVS: 5, VS: 6, PS: 7 };
const ordemDe = (p: Perfil) => (p.familia === 'I' ? (ORDEM_SERIE[p.serie] ?? 0) : ORDEM_FAMILIA[p.familia]);
const ORDENADOS: readonly Perfil[] = CATALOGO.map((p, i) => [p, i] as const)
  .sort(([a, ia], [b, ib]) => {
    if (ordemDe(a) !== ordemDe(b)) return ordemDe(a) - ordemDe(b);
    if (a.familia === 'L') return ia - ib;
    const serie = (p: Perfil) => Number(/\d+/.exec(p.nome)?.[0] ?? 0);
    return serie(a) - serie(b) || a.massa - b.massa;
  })
  .map(([p]) => p);

/** As medidas que aparecem ao lado do nome na lista. */
function medidas(p: Perfil): string {
  if (p.familia === 'L') return `${num(p.b, 1)} × ${num(p.bmenor, 1)} × ${num(p.t, 2)}`;
  return `${num(p.d, 0)} × ${num(p.bf, 0)}`;
}

interface Props {
  valor: string;
  aoEscolher: (nome: string) => void;
}

export function SeletorDePerfil({ valor, aoEscolher }: Props) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [marcado, setMarcado] = useState(0);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  const achados = useMemo(() => {
    const alvo = normalizar(texto);
    if (!alvo) return ORDENADOS;
    // Quem COMEÇA pelo que foi digitado vem antes: "vs500" acha os VS 500
    // primeiro, e só depois os CVS 500 (que também contêm "vs500").
    const achados = ORDENADOS.filter((p) => normalizar(p.nome).includes(alvo));
    return [...achados.filter((p) => normalizar(p.nome).startsWith(alvo)), ...achados.filter((p) => !normalizar(p.nome).startsWith(alvo))];
  }, [texto]);

  // ⚠️ ESCOLHER TIRA O FOCO DO CAMPO. O clique na lista não tira (o
  // mousedown é barrado para a lista não sumir antes do clique), e o campo
  // ficava focado e fechado com o `marcado` da lista FILTRADA: um Enter depois
  // escolhia outra bitola, calado. Sem o foco, o Enter não faz nada e o
  // próximo clique no campo reabre a lista do zero.
  function escolher(p: Perfil | undefined) {
    if (p) aoEscolher(p.nome);
    setAberto(false);
    setTexto('');
    campo.current?.blur();
  }

  function rolarAte(i: number) {
    lista.current?.children[i]?.scrollIntoView({ block: 'nearest' });
  }

  return (
    <div className="seletor-perfil">
      <input
        ref={campo}
        className="campo texto"
        value={aberto ? texto : valor}
        placeholder={valor}
        onFocus={() => {
          setAberto(true);
          setTexto('');
          const i = ORDENADOS.findIndex((p) => p.nome === valor);
          setMarcado(Math.max(0, i));
          requestAnimationFrame(() => rolarAte(Math.max(0, i)));
        }}
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        onChange={(e) => {
          setTexto(e.target.value);
          setMarcado(0);
        }}
        onKeyDown={(e) => {
          if (!aberto) return;
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const i = Math.min(achados.length - 1, Math.max(0, marcado + (e.key === 'ArrowDown' ? 1 : -1)));
            setMarcado(i);
            rolarAte(i);
          } else if (e.key === 'Enter') {
            escolher(achados[marcado]);
          } else if (e.key === 'Escape') {
            setAberto(false);
            e.currentTarget.blur();
          }
        }}
      />
      {aberto && (
        <div className="seletor-lista" ref={lista} role="listbox">
          {achados.map((p, i) => (
            <div
              key={p.nome}
              role="option"
              aria-selected={p.nome === valor}
              className={`seletor-item${i === marcado ? ' marcado' : ''}${p.nome === valor ? ' atual' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(p);
              }}
              onMouseEnter={() => setMarcado(i)}
            >
              <span className="nome">{p.nome}</span>
              <span className="dims">{medidas(p)}</span>
            </div>
          ))}
          {achados.length === 0 && <div className="seletor-vazio">—</div>}
        </div>
      )}
    </div>
  );
}
