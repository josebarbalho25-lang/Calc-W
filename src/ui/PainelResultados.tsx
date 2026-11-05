// ═══════════════════════════════════════════════════════════════════════════
//  ui/PainelResultados.tsx — a coluna da direita: a seção cotada com as
//  propriedades, o quadro de aproveitamento e os dois botões da memória
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { ResultadoDaVerificacao } from '../motor';
import type { ChaveDaVerificacao } from '../motor/memoria';
import { propriedadesDoPerfil } from '../relatorio/propriedadesDoPerfil';
import { SecaoPerfil2D } from '../visualizacao/SecaoPerfil2D';
import { CardVerificacao } from './CardVerificacao';

interface Props {
  resultado: ResultadoDaVerificacao;
  abrirMemoria: () => void;
  exportarPdf: () => void;
  exportando: boolean;
  recado: { texto: string; erro: boolean } | null;
}

function Prop({ rotulo, indice, linha, valor, unidade }: { rotulo: string; indice?: string; linha?: boolean; valor: string; unidade: string }) {
  return (
    <div className="prop">
      <span className="prop-rotulo">
        {/* O apóstrofo do d' vai DENTRO do itálico: fora dele, colado no d
            inclinado, sumia na tela (ele pegou no print do tema claro). */}
        <i>
          {rotulo}
          {linha && '′'}
        </i>
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

  return (
    <div className="painel-resultados">
      <fieldset className="cad-bloco bloco-secao">
        <legend>Seção</legend>
        <div className="secao-e-props">
          <div className="secao-desenho">
            <SecaoPerfil2D perfil={p} />
          </div>
          <div className="props">
            {propriedadesDoPerfil(p).map((q, i) => (
              <Prop key={i} rotulo={q.simbolo} indice={q.indice} linha={q.linha} valor={q.valor} unidade={q.unidade} />
            ))}
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
