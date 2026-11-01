// ═══════════════════════════════════════════════════════════════════════════
//  visualizacao/modais/JanelaDidatica.tsx — a janela do (?) dos comprimentos
// ---------------------------------------------------------------------------
//  Uma janela, cinco abas (Lx, Ly, Lt, Cb, a): o palco à esquerda, os números
//  da barra que está na tela à direita. Sem texto corrido — a animação diz o
//  que o comprimento é, os rótulos dizem onde ele mora, e os números são os
//  da verificação aberta.
//
//  Carrega sob demanda (App.tsx): o three.js só vem quando a janela abre.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ResultadoDaVerificacao } from '../../motor';
import { num, numExato } from '../../relatorio/formatos';
import { CenaFlambagem3D } from '../CenaFlambagem3D';
import { cbDoDiagrama, DiagramaCb, type FormaDoDiagrama } from './DiagramaCb';
import { PainelCisalhamento } from './PainelCisalhamento';

export type ChaveDaAjuda = 'Lx' | 'Ly' | 'Lt' | 'Cb' | 'a';

interface Props {
  chave: ChaveDaAjuda;
  trocar: (c: ChaveDaAjuda) => void;
  fechar: () => void;
  resultado: ResultadoDaVerificacao;
  usarCb: (Cb: number) => void;
}

const ABAS: ChaveDaAjuda[] = ['Lx', 'Ly', 'Lt', 'Cb', 'a'];
const TITULO: Record<ChaveDaAjuda, string> = {
  Lx: 'Flambagem por flexão em torno de X',
  Ly: 'Flambagem por flexão em torno de Y',
  Lt: 'Flambagem lateral com torção',
  Cb: 'Fator de momento não uniforme',
  a: 'Enrijecedores transversais da alma',
};

function Dado({ rotulo, valor, unidade }: { rotulo: ReactNode; valor: string; unidade?: string }) {
  return (
    <div className="cad-linha">
      <label>
        <span>{rotulo}</span>
      </label>
      <div className="cad-valor">
        <span className="valor-derivado">{valor}</span>
        <span className="unidade">{unidade ?? ''}</span>
      </div>
    </div>
  );
}

// Num span só: dentro de botão ou rótulo flex, letra e índice soltos viram
// dois itens separados pelo vão ("C  b").
const s = (b: string, i: string) => (
  <span>
    <i>{b}</i>
    <sub>{i}</sub>
  </span>
);

function Seg<T extends string | number | boolean>({ opcoes, valor, mudar }: { opcoes: Array<[T, string]>; valor: T; mudar: (v: T) => void }) {
  return (
    <div className="seg">
      {opcoes.map(([v, r]) => (
        <button key={String(v)} type="button" className={v === valor ? 'on' : ''} onClick={() => mudar(v)}>
          {r}
        </button>
      ))}
    </div>
  );
}

export default function JanelaDidatica({ chave, trocar, fechar, resultado, usarCb }: Props) {
  const r = resultado;
  const L = r.entrada.comprimentos;
  const p = r.entrada.perfil;
  const [ondasPilar, setOndasPilar] = useState<1 | 2>(1);
  const [ondasViga, setOndasViga] = useState<0 | 1 | 2>(1);
  const [forma, setForma] = useState<FormaDoDiagrama>('distribuida');
  const [psi, setPsi] = useState(0);
  const [comEnrij, setComEnrij] = useState(L.a > 0);
  const cb = useMemo(() => cbDoDiagrama(forma, psi), [forma, psi]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [fechar]);

  const h = r.secao.h;
  const aSobreH = comEnrij ? (L.a > 0 ? L.a / h : 1.5) : undefined;

  let palco: ReactNode;
  let controles: ReactNode = null;
  let dados: ReactNode;
  if (chave === 'Lx' || chave === 'Ly') {
    const eixo = chave === 'Lx' ? 'x' : 'y';
    const rr = eixo === 'x' ? r.secao.rx : r.secao.ry;
    const LL = eixo === 'x' ? L.Lx : L.Ly;
    palco = <CenaFlambagem3D key={chave} perfil={p} modo={eixo} ondas={ondasPilar} rotulo={chave} />;
    controles = (
      <Seg
        opcoes={[
          [1, 'Sem contenção'],
          [2, 'Contenção no meio'],
        ]}
        valor={ondasPilar}
        mudar={setOndasPilar}
      />
    );
    dados = (
      <>
        <Dado rotulo={s('L', eixo)} valor={numExato(LL, 1)} unidade="cm" />
        <Dado rotulo={s('r', eixo)} valor={numExato(rr, 2)} unidade="cm" />
        <Dado rotulo={<>λ = {s('L', eixo)}/{s('r', eixo)}</>} valor={LL > 0 ? num(LL / rr, 1) : '—'} />
        <Dado rotulo={s('N', `e${eixo}`)} valor={num(eixo === 'x' ? r.compressao.Nex : r.compressao.Ney, 1)} unidade="kN" />
        <Dado rotulo={s('N', 'e')} valor={num(r.compressao.Ne, 1)} unidade="kN" />
      </>
    );
  } else if (chave === 'Lt') {
    const f = r.flexaoX.flt;
    palco = <CenaFlambagem3D key={chave} perfil={p} modo="flt" ondas={ondasViga} rotulo="Lb" />;
    controles = (
      <Seg
        opcoes={[
          [1, 'Contenção nas pontas'],
          [2, 'Contenção no meio'],
          [0, 'Contínua (laje)'],
        ]}
        valor={ondasViga}
        mudar={setOndasViga}
      />
    );
    dados = (
      <>
        <Dado rotulo={<>{s('L', 't')} = {s('L', 'b')}</>} valor={numExato(L.Lt, 1)} unidade="cm" />
        <Dado rotulo={s('C', 'b')} valor={numExato(L.Cb, 3)} />
        <Dado rotulo={s('M', 'cr')} valor={num(f.Mcr, 0)} unidade="kN·cm" />
        <Dado rotulo={<>λ = {s('L', 'b')}/{s('r', 'y')}</>} valor={num(f.classico.lambda, 1)} />
        <Dado rotulo={s('λ', 'LT')} valor={num(f.alternativo.lambdaLT, 3)} />
        <Dado rotulo={<>{s('M', 'Rk')} clássico</>} valor={num(f.classico.Mrk, 0)} unidade="kN·cm" />
        <Dado rotulo={<>{s('M', 'Rk')} χ<sub>FLT</sub></>} valor={num(f.alternativo.Mrk, 0)} unidade="kN·cm" />
        <Dado rotulo={s('N', 'ez')} valor={num(r.compressao.Nez, 1)} unidade="kN" />
      </>
    );
  } else if (chave === 'Cb') {
    palco = (
      <div className="palco-cb">
        <DiagramaCb forma={forma} psi={psi} />
        <div className="formula-cb">
          {s('C', 'b')} =
          <span className="frac">
            <span>12,5 · {num(cb.Mmax, 2)}</span>
            <span>
              2,5 · {num(cb.Mmax, 2)} + 3 · {num(cb.MA, 2)} + 4 · {num(cb.MB, 2)} + 3 · {num(cb.MC, 2)}
            </span>
          </span>
          · {s('R', 'm')} = <b>{num(cb.Cb, 3)}</b>
        </div>
      </div>
    );
    controles = (
      <Seg
        opcoes={[
          ['distribuida', 'Distribuída'],
          ['concentrada', 'Concentrada no meio'],
          ['pontas', 'Momentos nas pontas'],
        ]}
        valor={forma}
        mudar={setForma}
      />
    );
    dados = (
      <>
        {forma === 'pontas' && (
          <div className="cad-linha">
            <label>
              <span>
                ψ = {s('M', '2')}/{s('M', '1')}
              </span>
            </label>
            <div className="cad-valor">
              <input type="range" min={-1} max={1} step={0.05} value={psi} onChange={(e) => setPsi(Number(e.target.value))} />
              <span className="unidade mono">{num(psi, 2)}</span>
            </div>
          </div>
        )}
        <Dado rotulo={s('R', 'm')} valor="1,00" />
        <Dado rotulo={s('C', 'b')} valor={num(cb.Cb, 3)} />
        <Dado rotulo={<>{s('C', 'b')} na verificação</>} valor={numExato(L.Cb, 3)} />
        <div className="acoes">
          <button type="button" className="btn-primario" onClick={() => usarCb(Math.round(cb.Cb * 1000) / 1000)}>
            Usar {s('C', 'b')} = {num(cb.Cb, 3)}
          </button>
        </div>
      </>
    );
  } else {
    const c = r.cortanteY.chapa;
    palco = <PainelCisalhamento aSobreH={aSobreH} />;
    controles = (
      <Seg
        opcoes={[
          [false, 'Sem enrijecedores'],
          [true, 'Com enrijecedores'],
        ]}
        valor={comEnrij}
        mudar={setComEnrij}
      />
    );
    dados = (
      <>
        <Dado rotulo={<i>h = d'</i>} valor={numExato(h * 10, 1)} unidade="mm" />
        <Dado rotulo={s('t', 'w')} valor={numExato(p.tw, 1)} unidade="mm" />
        <Dado rotulo={<i>a</i>} valor={L.a > 0 ? numExato(L.a, 1) : '—'} unidade="cm" />
        {/* Os números são os da VERIFICAÇÃO (a da entrada). Sem enrijecedor na
            entrada, o desenho "com enrijecedores" usa a/h = 1,5 só para mostrar. */}
        <Dado rotulo={<i>a/h</i>} valor={L.a > 0 ? num(L.a / h, 2) : '—'} />
        <Dado rotulo={s('k', 'v')} valor={num(c.kv, 2)} />
        <Dado rotulo={<>λ = h/{s('t', 'w')}</>} valor={num(c.lambda, 2)} />
        <Dado rotulo={s('λ', 'p')} valor={num(c.lambdaP, 2)} />
        <Dado rotulo={s('V', 'y,Rd')} valor={num(c.VRd, 1)} unidade="kN" />
      </>
    );
  }

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal-caixa janela-didatica" role="dialog" aria-label={TITULO[chave]}>
        <div className="modal-cabeca">
          <h3>{TITULO[chave]}</h3>
          <Seg opcoes={ABAS.map((a) => [a, a] as [ChaveDaAjuda, string])} valor={chave} mudar={trocar} />
          <button type="button" className="btn-icone" onClick={fechar} aria-label="Fechar" title="Fechar (Esc)">
            ✕
          </button>
        </div>
        <div className="didatica-abas">{controles}</div>
        <div className="didatica-corpo">
          <div className="didatica-palco">{palco}</div>
          <div className="didatica-lado">
            <fieldset className="cad-bloco">
              <legend>{p.nome}</legend>
              {dados}
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}
