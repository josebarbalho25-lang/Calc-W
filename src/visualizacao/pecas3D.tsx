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
import type { PerfilI } from '../motor/tipos';
import { raioDeConcordancia } from './geometriaDaSecao';

/** A cor de um token do tema, lida na hora (o WebGL não lê CSS). */
export function cor(token: string, reserva: string): THREE.Color {
  const v = getComputedStyle(document.body).getPropertyValue(token).trim();
  return new THREE.Color(v || reserva);
}

/** A mesma cor, como texto "#rrggbb" (o `Line` do drei pede assim). */
export function corHex(token: string, reserva: string): string {
  return `#${cor(token, reserva).getHexString()}`;
}

/** O contorno do I na escala da cena, com os raios de concordância. A alma
 *  fica em y, as mesas em x — X e Y da seção, como no desenho 2D. */
export function formaDoI(p: PerfilI, altura: number): { forma: THREE.Shape; d: number; bf: number; tf: number } {
  const k = altura / p.d;
  const B = (p.bf * k) / 2;
  const D = (p.d * k) / 2;
  const tw = (p.tw * k) / 2;
  const tf = p.tf * k;
  const r = Math.max(raioDeConcordancia(p) * k, 0.0001);
  const s = new THREE.Shape();
  s.moveTo(-B, -D);
  s.lineTo(B, -D);
  s.lineTo(B, -D + tf);
  s.lineTo(tw + r, -D + tf);
  s.absarc(tw + r, -D + tf + r, r, -Math.PI / 2, Math.PI, true);
  s.lineTo(tw, D - tf - r);
  s.absarc(tw + r, D - tf - r, r, Math.PI, Math.PI / 2, true);
  s.lineTo(B, D - tf);
  s.lineTo(B, D);
  s.lineTo(-B, D);
  s.lineTo(-B, D - tf);
  s.lineTo(-tw - r, D - tf);
  s.absarc(-tw - r, D - tf - r, r, Math.PI / 2, 0, true);
  s.lineTo(-tw, -D + tf + r);
  s.absarc(-tw - r, -D + tf + r, r, 0, -Math.PI / 2, true);
  s.lineTo(-B, -D + tf);
  s.closePath();
  return { forma: s, d: 2 * D, bf: 2 * B, tf };
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
