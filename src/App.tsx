// ═══════════════════════════════════════════════════════════════════════════
//  App.tsx — a calculadora: entradas à esquerda, seção e aproveitamento à
//  direita, a memória e as janelas dos comprimentos por cima
// ---------------------------------------------------------------------------
//  O motor roda a cada mudança — é conta de milissegundo, não precisa de
//  botão "calcular". A janela 3D carrega só quando abre: o three.js é a
//  metade do peso do programa, e quem só confere perfil não precisa dele.
// ═══════════════════════════════════════════════════════════════════════════

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { verificar } from './motor';
import { acoPeloNome } from './motor/catalogos/acos';
import { perfilPeloNome } from './motor/catalogos/perfisW';
import { MemoriaCalculo } from './relatorio/MemoriaCalculo';
import { exportarPdf, imprimirNoServidor } from './relatorio/exportarPdf';
import { nomeDoPdf, paginaDaMemoria } from './relatorio/paginaDaMemoria';
import { num } from './relatorio/formatos';
import { Contencao } from './ui/Contencao';
import { guardarEntrada, lerEntrada, lerIdentificacao, type Identificacao } from './ui/guardarEntrada';
import { PainelEntradas, type EstadoDaEntrada } from './ui/PainelEntradas';
import { PainelResultados } from './ui/PainelResultados';
import type { ChaveDaAjuda } from './visualizacao/modais/JanelaDidatica';

/**
 * ⚠️ A JANELA 3D É CARREGADA DE NOVO A CADA FALHA. O `lazy` guarda a promessa
 * do primeiro carregamento: se ela falhou uma vez (servidor reiniciando, rede),
 * todo (?) seguinte falhava igual até recarregar a página. Com a tentativa na
 * chave, a próxima abertura tenta de novo.
 */
function carregarJanela() {
  return lazy(() => import('./visualizacao/modais/JanelaDidatica'));
}

const PALAVRA = { atende: 'Atende', avaliar: 'Avaliar', naoAtende: 'Não atende' } as const;

export function App() {
  const [entrada, setEntrada] = useState<EstadoDaEntrada>(lerEntrada);
  const [identificacao, setIdentificacao] = useState<Identificacao>(lerIdentificacao);
  const [ajuda, setAjuda] = useState<ChaveDaAjuda | null>(null);
  const [memoria, setMemoria] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [recado, setRecado] = useState<{ texto: string; erro: boolean } | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const JanelaDidatica = useMemo(carregarJanela, [tentativa]);

  useEffect(() => guardarEntrada(entrada), [entrada]);

  const resultado = useMemo(
    () =>
      verificar({
        perfil: perfilPeloNome(entrada.perfil)!,
        aco: acoPeloNome(entrada.aco)!,
        esforcos: entrada.esforcos,
        comprimentos: entrada.comprimentos,
      }),
    [entrada],
  );

  const pior = resultado.lista.reduce((a, b) => (b.razao > a.razao || Number.isNaN(b.razao) ? b : a));

  async function exportar() {
    setExportando(true);
    setRecado(null);
    const html = paginaDaMemoria(resultado, identificacao);
    const r = await exportarPdf(() => imprimirNoServidor(html), nomeDoPdf(resultado, identificacao));
    setExportando(false);
    if (!r.ok) setRecado({ texto: r.erro, erro: true });
    else if (r.gravado) setRecado({ texto: 'PDF gravado', erro: false });
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="marca-app">NBR 8800</span>
        <div className="titulo">
          <h1>Calculadora de perfis</h1>
          <span className="sub">
            {entrada.perfil} · {entrada.aco}
          </span>
        </div>
        <div className="direita">
          <span className={`pilula situacao-geral ${resultado.situacao}`}>{PALAVRA[resultado.situacao]}</span>
          <span className="razao-geral mono">{num(resultado.razaoMaxima, 3)}</span>
        </div>
      </header>

      <main className="colunas">
        <aside className="coluna-esquerda">
          <PainelEntradas estado={entrada} mudar={setEntrada} abrirAjuda={setAjuda} />
        </aside>
        <section className="coluna-direita">
          <PainelResultados
            resultado={resultado}
            abrirMemoria={() => setMemoria(true)}
            exportarPdf={exportar}
            exportando={exportando}
            recado={recado}
          />
        </section>
      </main>

      <footer className="statusbar">
        <span className="campo-estado">ABNT NBR 8800:2024</span>
        <span className="campo-estado">
          <i>E</i> <span className="valor">20 000</span> kN/cm²
        </span>
        <span className="campo-estado">
          γ<sub>a1</sub> <span className="valor">1,10</span>
        </span>
        <div className="direita">
          <span className={`campo-estado${pior.situacao === 'naoAtende' ? ' alarme' : ''}`}>
            {pior.titulo} <span className="valor">{num(pior.razao, 3)}</span>
            {pior.governa ? ` · ${pior.governa}` : ''}
          </span>
        </div>
      </footer>

      {memoria && (
        <Contencao aoFalhar={() => setMemoria(false)}>
          <MemoriaCalculo
            resultado={resultado}
            identificacao={identificacao}
            mudarIdentificacao={setIdentificacao}
            fechar={() => setMemoria(false)}
          />
        </Contencao>
      )}
      {ajuda && (
        <Contencao
          aoFalhar={() => {
            setAjuda(null);
            setTentativa((t) => t + 1);
            setRecado({ texto: 'a janela não abriu', erro: true });
          }}
        >
          <Suspense fallback={null}>
            <JanelaDidatica
              chave={ajuda}
              trocar={setAjuda}
              fechar={() => setAjuda(null)}
              resultado={resultado}
              usarCb={(Cb) => setEntrada((e) => ({ ...e, comprimentos: { ...e.comprimentos, Cb } }))}
            />
          </Suspense>
        </Contencao>
      )}
    </div>
  );
}
