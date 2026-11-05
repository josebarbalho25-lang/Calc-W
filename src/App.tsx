// ═══════════════════════════════════════════════════════════════════════════
//  App.tsx — a calculadora: entradas à esquerda, seção e aproveitamento à
//  direita, a memória e as janelas dos comprimentos por cima
// ---------------------------------------------------------------------------
//  O motor roda a cada mudança — é conta de milissegundo, não precisa de
//  botão "calcular". A janela 3D carrega só quando abre: o three.js é a
//  metade do peso do programa, e quem só confere perfil não precisa dele.
// ═══════════════════════════════════════════════════════════════════════════

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { EntradaInvalida, verificar, type ResultadoDaVerificacao } from './motor';
import { piorVerificacao } from './motor/memoria';
import { MemoriaCalculo } from './relatorio/MemoriaCalculo';
import { exportarPdf, imprimirNoServidor } from './relatorio/exportarPdf';
import { nomeDoPdf, paginaDaMemoria } from './relatorio/paginaDaMemoria';
import { num } from './relatorio/formatos';
import { useBarraDaJanela } from './ui/barraDaJanela';
import { useProjetista } from './ui/configuracao';
import { Contencao } from './ui/Contencao';
import {
  acoDaEntrada,
  ENTRADA_DE_PARTIDA,
  guardarEntrada,
  janelaDoEndereco,
  lerEntrada,
  lerIdentificacao,
  perfilDaEntrada,
  type Identificacao,
} from './ui/guardarEntrada';
import { PainelConfiguracao } from './ui/PainelConfiguracao';
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

/** O site do autor, no rodapé da tela (a memória não leva). */
const SITE = 'proestruturas3d.com.br';

/**
 * Os dois logos, só na tela — a memória sai limpa, sem logo e sem link:
 *  · o da calculadora (a viga I), no alto à esquerda: o GLIFO sem fundo,
 *    desenhado pelo CSS como máscara (`public/logo-glifo.png`) e pintado pela
 *    cor do tema — branco no escuro, o azul da marca no claro e no papel. A
 *    aba do navegador segue com o ícone quadrado (`index.html`);
 *  · o do autor (a ponte), no rodapé, colado no link do site.
 * Os originais (PLS-Calc-*) moram na pasta das marcas, fora do repositório; aqui vão as cópias, para
 * o programa não depender de pasta de fora. Se a ponte faltar, a imagem some
 * (não fica o quadradinho de imagem quebrada).
 */
const LOGO_AUTOR = `${import.meta.env.BASE_URL}logo-autor.png`;

export function App() {
  const [entrada, setEntrada] = useState<EstadoDaEntrada>(lerEntrada);
  const [identificacao, setIdentificacao] = useState<Identificacao>(lerIdentificacao);
  const [ajuda, setAjuda] = useState<ChaveDaAjuda | null>(() => {
    const j = janelaDoEndereco();
    return j && j !== 'memoria' && j !== 'configuracao' ? (j as ChaveDaAjuda) : null;
  });
  const [memoria, setMemoria] = useState(() => janelaDoEndereco() === 'memoria');
  const [exportando, setExportando] = useState(false);
  const [recado, setRecado] = useState<{ texto: string; erro: boolean } | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const JanelaDidatica = useMemo(carregarJanela, [tentativa]);
  const projetista = useProjetista();
  useBarraDaJanela();
  const [comLogoAutor, setComLogoAutor] = useState(true);

  useEffect(() => guardarEntrada(entrada), [entrada]);

  // ⚠️ ENTRADA RECUSADA NÃO DERRUBA A TELA. O motor recusa o que não tem
  // conta (cantoneira de treliça com Lx = 0 — dá para chegar lá trocando a
  // Barra com Lx zerado); sem esta trava a tela inteira ficava em branco
  // (achado da revisão de 04/11/2026). Fica o último resultado bom e a barra
  // de estado diz o que foi recusado.
  const ultimoBom = useRef<ResultadoDaVerificacao | null>(null);
  const { resultado, recusa } = useMemo(() => {
    const perfil = perfilDaEntrada(entrada);
    const aco = acoDaEntrada(entrada, perfil);
    // A ligação por uma aba só existe na cantoneira; trocar de perfil não
    // apaga a escolha (voltar para a cantoneira a encontra de novo).
    const ligacao = perfil.familia === 'L' && entrada.ligacao ? entrada.ligacao : undefined;
    const L = entrada.comprimentos;
    try {
      const r = verificar({ perfil, aco, esforcos: entrada.esforcos, comprimentos: L, ligacao, curvatura: entrada.curvatura });
      ultimoBom.current = r;
      return { resultado: r, recusa: null };
    } catch (e) {
      if (!(e instanceof EntradaInvalida)) throw e;
      // Sem resultado bom ainda (a primeira tela): a barra de partida, que o
      // motor sempre aceita (as chapas digitadas podem ser o que foi recusado).
      const partida = perfilDaEntrada(ENTRADA_DE_PARTIDA);
      const r = ultimoBom.current ?? verificar({ perfil: partida, aco: acoDaEntrada(ENTRADA_DE_PARTIDA, partida), esforcos: entrada.esforcos, comprimentos: L });
      return { resultado: r, recusa: e.message };
    }
  }, [entrada]);

  const pior = piorVerificacao(resultado.lista);

  async function exportar() {
    setExportando(true);
    setRecado(null);
    const html = paginaDaMemoria(resultado, identificacao, projetista);
    const r = await exportarPdf(() => imprimirNoServidor(html), nomeDoPdf(resultado, identificacao));
    setExportando(false);
    if (!r.ok) setRecado({ texto: r.erro, erro: true });
    else if (r.gravado) setRecado({ texto: 'PDF gravado', erro: false });
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="logo-calculadora" aria-hidden="true" />
        {/* O nome dele (04/11/2026): PLS Calc = Perfil Laminado e Soldado. A
            irmã 14762 é a PFF Calc, no mesmo formato: [glifo] NBR · nome. */}
        <span className="marca-app">NBR 8800 · PLS Calc</span>
        <div className="titulo">
          <h1>Calculadora de perfis laminados e soldados</h1>
          <span className="sub">
            {resultado.entrada.perfil.nome} · {resultado.entrada.aco.nome}
          </span>
        </div>
        <div className="direita">
          <span className={`pilula situacao-geral ${resultado.situacao}`}>{PALAVRA[resultado.situacao]}</span>
          <span className="razao-geral mono">{num(resultado.razaoMaxima, 3)}</span>
          <PainelConfiguracao abertoDeInicio={janelaDoEndereco() === 'configuracao'} />
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
          {recusa && <span className="campo-estado alarme">{recusa}</span>}
          <span className={`campo-estado${pior.situacao === 'naoAtende' ? ' alarme' : ''}`}>
            {pior.titulo} <span className="valor">{num(pior.razao, 3)}</span>
            {pior.governa ? ` · ${pior.governa}` : ''}
          </span>
          <a className="campo-estado site" href={`https://${SITE}`} target="_blank" rel="noopener noreferrer">
            {comLogoAutor && <img className="logo-autor" src={LOGO_AUTOR} alt="" onError={() => setComLogoAutor(false)} />}
            {SITE}
          </a>
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
