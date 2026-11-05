// ═══════════════════════════════════════════════════════════════════════════
//  visualizacao/pecas3D.tsx — o que as cenas 3D das janelas têm em comum
// ---------------------------------------------------------------------------
//  A cor do tema lida na hora, o contorno do I na escala da cena e o rótulo
//  preso a um ponto. A cena da flambagem (comprimentos) e a dos esforços
//  desenham o MESMO perfil do mesmo jeito.
// ═══════════════════════════════════════════════════════════════════════════

import { Html } from '@react-three/drei';
import { useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import type { Perfil } from '../motor/tipos';
import { contornoDoPerfil } from './contornoDoPerfil';

/** A cor de um token do tema, lida na hora (o WebGL não lê CSS). */
export function cor(token: string, reserva: string): THREE.Color {
  const v = getComputedStyle(document.body).getPropertyValue(token).trim();
  return new THREE.Color(v || reserva);
}

/** A mesma cor, como texto "#rrggbb" (o `Line` do drei pede assim). */
export function corHex(token: string, reserva: string): string {
  return `#${cor(token, reserva).getHexString()}`;
}

/**
 * O contorno do perfil na escala da cena — o mesmo do desenho 2D
 * (`contornoDoPerfil.ts`), com a origem no centroide: a alma em y, as mesas
 * em x, como na tela. `altura` é a altura da seção na cena; `d`, `bf` e `tf`
 * voltam na escala (na cantoneira: as duas abas e a espessura).
 */
export function formaDoPerfil(
  p: Perfil,
  altura: number,
): { forma: THREE.Shape; d: number; bf: number; tf: number; ytopo: number; ybase: number; tfBase: number } {
  const c = contornoDoPerfil(p);
  const k = altura / (c.caixa.ymax - c.caixa.ymin);
  // ⚠️ ORIGEM NO CENTROIDE, como no desenho 2D: os eixos X e Y do corte e as
  // setas dos esforços são desenhados na origem. Centrada pela caixa, no U e
  // na cantoneira os eixos cruzavam no vazio, fora do aço (achado da revisão
  // de 04/11/2026).
  const mx = 0;
  const my = 0;
  const s = new THREE.Shape();
  c.pontos.forEach(([x, y], i) => (i ? s.lineTo((x - mx) * k, (y - my) * k) : s.moveTo((x - mx) * k, (y - my) * k)));
  s.closePath();
  const tf = p.familia === 'L' ? p.t * k : p.tf * k;
  // ⚠️ A SEÇÃO NÃO É SIMÉTRICA EM ALTURA em todo perfil: no I de mesas
  // diferentes o centroide sobe para a mesa maior (achado da revisão de
  // 04/11/2026 — a laje flutuava e o apoio entrava na mesa). Quem posiciona
  // coisa em cima ou embaixo usa ytopo e ybase, não ±d/2.
  const tfBase = p.familia === 'I' && p.soldado ? p.soldado.mesaInferior.tf * k : tf;
  return { forma: s, d: altura, bf: (c.caixa.xmax - c.caixa.xmin) * k, tf, ytopo: c.caixa.ymax * k, ybase: c.caixa.ymin * k, tfBase };
}

/** true a partir do quadro seguinte à montagem — ver `Rotulo`. */
function useDepoisDaMontagem(): boolean {
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setPronto(true));
    return () => cancelAnimationFrame(quadro);
  }, []);
  return pronto;
}

/**
 * Rótulo preso a um ponto da cena: texto simples ou com índice (filhos).
 *
 * ⚠️ O `Html` DO DREI SÓ ENTRA DEPOIS DO PRIMEIRO QUADRO. Montado junto com o
 * Canvas, no modo estrito (o React monta, desmonta e remonta em
 * desenvolvimento), a raiz que o `Html` cria por dentro morria na desmontagem
 * ("synchronously unmount a root while React was already rendering") e só o
 * último rótulo da cena aparecia. Os que entravam depois — ao trocar de
 * contenção — apareciam sempre: daí esperar um quadro.
 */
export function Rotulo({ posicao, texto, classe = '', children }: { posicao: THREE.Vector3; texto?: string; classe?: string; children?: ReactNode }) {
  const pronto = useDepoisDaMontagem();
  if (!pronto) return null;
  return (
    <Html position={posicao} center>
      <span className={`rotulo-3d ${classe}`}>{children ?? texto}</span>
    </Html>
  );
}
