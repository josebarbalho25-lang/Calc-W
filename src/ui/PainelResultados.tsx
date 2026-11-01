// ═══════════════════════════════════════════════════════════════════════════
//  ui/PainelResultados.tsx — a coluna da direita: a seção cotada com as
//  propriedades, o quadro de aproveitamento e os dois botões da memória
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { ResultadoDaVerificacao } from '../motor';
import type { ChaveDaVerificacao } from '../motor/memoria';
import { num, numExato } from '../relatorio/formatos';
import { raioDeConcordancia } from '../visualizacao/geometriaDaSecao';
import { SecaoPerfil2D } from '../visualizacao/SecaoPerfil2D';
import { CardVerificacao } from './CardVerificacao';

interface Props {
  resultado: ResultadoDaVerificacao;
  abrirMemoria: () => void;
  exportarPdf: () => void;
  exportando: boolean;
  recado: { texto: string; erro: boolean } | null;
}

function Prop({ rotulo, indice, valor, unidade }: { rotulo: string; indice?: string; valor: string; unidade: string }) {
  return (
    <div className="prop">
      <span className="prop-rotulo">
        <i>{rotulo}</i>
        {indice && <sub>{indice}</sub>}
      </span>
      <span className="prop-valor">{valor}</span>
      <span className="prop-un">{unidade}</span>
    </div>
  );
}

export function PainelResultados({ resultado, abrirMemoria, exportarPdf, exportando, recado }: Props) {
  const [aberta, setAberta] = useState<ChaveDaVerificacao | null>(null);
  const p = resultado.entrada.perfil;
  const n = (v: number) => numExato(v, 2);

  return (
    <div className="painel-resultados">
      <fieldset className="cad-bloco bloco-secao">
        <legend>Seção</legend>
        <div className="secao-e-props">
          <div className="secao-desenho">
            <SecaoPerfil2D perfil={p} />
          </div>
          <div className="props">
            <Prop rotulo="d" valor={n(p.d)} unidade="mm" />
            <Prop rotulo="b" indice="f" valor={n(p.bf)} unidade="mm" />
            <Prop rotulo="t" indice="w" valor={n(p.tw)} unidade="mm" />
            <Prop rotulo="t" indice="f" valor={n(p.tf)} unidade="mm" />
            <Prop rotulo="d'" valor={n(p.dLinha)} unidade="mm" />
            <Prop rotulo="r" valor={numExato(raioDeConcordancia(p), 1)} unidade="mm" />
            <Prop rotulo="A" indice="g" valor={n(p.A)} unidade="cm²" />
            <Prop rotulo="m" valor={n(p.massa)} unidade="kg/m" />
            <Prop rotulo="I" indice="x" valor={num(p.Ix, 0)} unidade="cm⁴" />
            <Prop rotulo="I" indice="y" valor={num(p.Iy, 0)} unidade="cm⁴" />
            <Prop rotulo="W" indice="x" valor={n(p.Wx)} unidade="cm³" />
            <Prop rotulo="W" indice="y" valor={n(p.Wy)} unidade="cm³" />
            <Prop rotulo="Z" indice="x" valor={n(p.Zx)} unidade="cm³" />
            <Prop rotulo="Z" indice="y" valor={n(p.Zy)} unidade="cm³" />
            <Prop rotulo="r" indice="x" valor={n(p.rx)} unidade="cm" />
            <Prop rotulo="r" indice="y" valor={n(p.ry)} unidade="cm" />
            <Prop rotulo="J" valor={n(p.J)} unidade="cm⁴" />
            <Prop rotulo="C" indice="w" valor={num(p.Cw, 0)} unidade="cm⁶" />
          </div>
        </div>
      </fieldset>

      <fieldset className="cad-bloco bloco-aprov">
        <legend>Aproveitamento</legend>
        <div className="aprov-cabeca">
          <span />
          <span />
          <span className="aprov-col">S<sub>d</sub>/R<sub>d</sub></span>
          <span className="aprov-col">S<sub>d</sub> / R<sub>d</sub></span>
          <span className="aprov-col esq">Governa</span>
        </div>
        {resultado.lista.map((v) => (
          <CardVerificacao key={v.chave} v={v} aberta={aberta === v.chave} alternar={() => setAberta((a) => (a === v.chave ? null : v.chave))} />
        ))}
      </fieldset>

      <div className="acoes">
        <button type="button" className="btn-fantasma" onClick={abrirMemoria}>
          Memória de cálculo completa
        </button>
        <button type="button" className="btn-primario" onClick={exportarPdf} disabled={exportando}>
          {exportando ? 'Gerando PDF…' : 'Exportar relatório PDF'}
        </button>
        {recado && <span className={`recado${recado.erro ? ' erro' : ''}`}>{recado.texto}</span>}
      </div>
    </div>
  );
}
