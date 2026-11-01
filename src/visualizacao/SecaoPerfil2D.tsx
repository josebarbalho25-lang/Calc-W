// ═══════════════════════════════════════════════════════════════════════════
//  visualizacao/SecaoPerfil2D.tsx — o corte do perfil na tela
// ---------------------------------------------------------------------------
//  Só desenha o que `geometriaDaSecao.ts` calculou; as cores vêm dos tokens
//  do tema pelas classes (.sec-*), em `calculadora.css`.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import type { PerfilI } from '../motor/tipos';
import { desenhoDaSecao } from './geometriaDaSecao';

export function SecaoPerfil2D({ perfil }: { perfil: PerfilI }) {
  const g = useMemo(() => desenhoDaSecao(perfil), [perfil]);
  return (
    <svg className="secao-perfil" viewBox={`0 0 ${g.largura} ${g.altura}`} role="img" aria-label={`Seção ${perfil.nome}`}>
      <path className="sec-corpo" d={g.contorno} />
      {g.linhas.map((l, i) => (
        <line key={i} className={`sec-${l.classe}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
      {g.textos.map((t, i) => (
        <text
          key={i}
          className={`sec-texto-${t.classe}`}
          x={t.x}
          y={t.y}
          textAnchor={t.ancora}
          transform={t.rot ? `rotate(${t.rot} ${t.x} ${t.y})` : undefined}
        >
          <tspan className="simbolo">{t.texto}</tspan>
          {t.indice && (
            <tspan className="indice" dy={3}>
              {t.indice}
            </tspan>
          )}
          {t.valor && <tspan dy={t.indice ? -3 : 0}>{` = ${t.valor}`}</tspan>}
        </text>
      ))}
    </svg>
  );
}
