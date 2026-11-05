// ═══════════════════════════════════════════════════════════════════════════
//  relatorio/manualDoUsuario.ts — o manual (docs/MANUAL.md) em página A4, no
//  visual da memória de cálculo
// ---------------------------------------------------------------------------
//  O manual é escrito em Markdown (fácil de ler no GitHub e de corrigir) e
//  impresso com o MESMO estilo da memória (`estiloRelatorio.ts`): a capa, as
//  seções numeradas com o título serifado, as tabelas. O Markdown usado é o
//  pouco que o manual precisa — títulos #, ## e ###, parágrafos, listas com
//  "-" e "1.", tabelas, figuras `![legenda](imagens/x.png)`, **negrito**,
//  *itálico* e `código` — e o conversor é este, curto, sem biblioteca.
//
//  ⚠️ O QUE O CONVERSOR NÃO ENTENDE NÃO PASSA CALADO: o selo
//  (`manualDoUsuario.test.ts`) reprova se sobrar asterisco, crase ou
//  colchete de figura no texto convertido, ou se uma figura não existir.
// ═══════════════════════════════════════════════════════════════════════════

import { estiloDaMemoria } from './estiloRelatorio';
import { esc } from './formatos';
import { VERSAO } from './paginaDaMemoria';

/** Negrito, itálico e código dentro de uma linha (o texto já vem escapado). */
function emLinha(t: string): string {
  // O índice rebaixado (<sub>) é o único HTML que o Markdown do manual usa:
  // o GitHub mostra igual, e a página fica com o símbolo da memória.
  return esc(t)
    .replace(/&lt;(\/?)(sub|sup)&gt;/g, '<$1$2>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export interface Figura {
  legenda: string;
  arquivo: string;
}

export interface ManualConvertido {
  titulo: string;
  subtitulo: string;
  capitulos: string[];
  corpo: string;
  figuras: Figura[];
  /** "# Anexo A — …": sem capa, seções pela letra. */
  anexo: boolean;
}

/**
 * Converte o Markdown do manual. `urlDaImagem` diz onde a página acha cada
 * figura (o caminho no disco, na impressão pelo Edge).
 */
export function converterManual(md: string, urlDaImagem: (arquivo: string) => string = (a) => a): ManualConvertido {
  const linhas = md.replace(/\r\n/g, '\n').split('\n');
  let titulo = '';
  let subtitulo = '';
  const capitulos: string[] = [];
  const figuras: Figura[] = [];
  const saida: string[] = [];
  let n = 0;
  let m = 0;
  let aberta = false;
  let lista: 'ul' | 'ol' | null = null;
  let tabela: string[][] | null = null;

  const fecharLista = () => {
    if (lista) saida.push(`</${lista}>`);
    lista = null;
  };
  const fecharTabela = () => {
    if (!tabela) return;
    const [cab, , ...corpo] = tabela;
    saida.push(
      `<table class="manual-tab"><thead><tr>${cab.map((c) => `<th class="txt">${emLinha(c)}</th>`).join('')}</tr></thead><tbody>` +
        corpo.map((l) => `<tr>${l.map((c) => `<td class="txt">${emLinha(c)}</td>`).join('')}</tr>`).join('') +
        '</tbody></table>',
    );
    tabela = null;
  };
  const fecharBlocos = () => {
    fecharLista();
    fecharTabela();
  };

  // No anexo ("# Anexo A — …") as seções levam a letra, não o número.
  let letra: string | null = null;
  const numero = () => letra ?? String(n);
  for (const bruta of linhas) {
    const l = bruta.trimEnd();
    if (l.startsWith('|')) {
      fecharLista();
      tabela ??= [];
      tabela.push(l.slice(1, -1).split('|').map((c) => c.trim()));
      continue;
    }
    fecharTabela();
    if (!l.trim()) {
      fecharLista();
      continue;
    }
    if (l.startsWith('# ')) {
      titulo = l.slice(2).trim();
      letra = /^Anexo ([A-Z])\b/.exec(titulo)?.[1] ?? null;
      continue;
    }
    if (l.startsWith('## ')) {
      fecharBlocos();
      if (aberta) saida.push('</section>');
      n += 1;
      m = 0;
      const t = l.slice(3).trim();
      capitulos.push(t);
      saida.push(`<section class="secao manual-secao"><h2><span class="n">${numero()}</span><span>${emLinha(t)}</span></h2>`);
      aberta = true;
      continue;
    }
    if (l.startsWith('### ')) {
      fecharBlocos();
      m += 1;
      saida.push(`<h3 class="manual-sub"><span class="n">${numero()}.${m}</span>${emLinha(l.slice(4).trim())}</h3>`);
      continue;
    }
    const fig = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(l);
    if (fig) {
      fecharBlocos();
      figuras.push({ legenda: fig[1], arquivo: fig[2] });
      saida.push(`<figure class="manual-fig"><img src="${esc(urlDaImagem(fig[2]))}" alt=""><figcaption>${emLinha(fig[1])}</figcaption></figure>`);
      continue;
    }
    const item = /^(-|\d+\.)\s+(.*)$/.exec(l);
    if (item) {
      const tipo = item[1] === '-' ? 'ul' : 'ol';
      if (lista !== tipo) {
        fecharLista();
        saida.push(`<${tipo} class="manual-lista">`);
        lista = tipo;
      }
      saida.push(`<li>${emLinha(item[2])}</li>`);
      continue;
    }
    fecharLista();
    // O primeiro parágrafo antes de qualquer capítulo é o subtítulo da capa.
    if (n === 0) {
      subtitulo = l.trim();
      continue;
    }
    saida.push(`<p>${emLinha(l.trim())}</p>`);
  }
  fecharBlocos();
  if (aberta) saida.push('</section>');
  return { titulo, subtitulo, capitulos, corpo: saida.join('\n'), figuras, anexo: letra !== null };
}

const ESTILO_DO_MANUAL = `<style>
.capa-logo { margin-top: auto; display: flex; justify-content: flex-end; margin-bottom: 3mm; }
.capa-logo img { height: 13mm; width: auto; }
.capa-logo + .carimbo { margin-top: 0; }
.manual-secao { break-before: page; margin-top: 0; }
.manual-anexo { font: 300 24pt/1.1 "Serif Display", serif; margin: 0 0 3mm; }
.manual-secao > p, .manual-lista { max-width: 158mm; }
p, li { text-align: justify; hyphens: auto; }
.manual-sub { display: grid; grid-template-columns: 9mm 1fr; font: 600 10.4pt/1.3 "Sans"; margin: 6mm 0 2.4mm; break-after: avoid; }
.manual-sub .n { color: var(--ciano); font-weight: 400; }
.manual-lista { margin: 0 0 3mm; padding-left: 5mm; }
.manual-lista li { margin: 0 0 1.4mm; }
.manual-tab { margin: 1mm 0 4mm; }
.manual-tab td.txt, .manual-tab th.txt { white-space: normal; padding-right: 3mm; }
.manual-fig { margin: 3mm 0 5mm; break-inside: avoid; }
/* Altura limitada: uma figura alta empurrada para a página seguinte deixava
   meia página em branco no meio do capítulo. */
.manual-fig img { display: block; max-width: 100%; max-height: 74mm; margin: 0 auto; border: 0.4pt solid var(--traco); }
.manual-fig figcaption { text-align: center; }
.manual-fig figcaption { font-size: 7.6pt; color: var(--grafite); margin-top: 1.4mm; }
code { font: 8.4pt Consolas, monospace; background: var(--velado); padding: 0 0.8mm; }
strong { font-weight: 600; }
em { font-family: "Serif", serif; }
</style>`;

/** A página inteira do manual, pronta para o Edge imprimir. */
export function paginaDoManual(md: string, urlDaImagem: (arquivo: string) => string, data: string): string {
  const c = converterManual(md, urlDaImagem);
  const metade = Math.ceil(c.capitulos.length / 2);
  const celulas: string[] = [];
  for (let i = 0; i < metade; i++) {
    for (const j of [i, i + metade]) celulas.push(j < c.capitulos.length ? `<span><span class="n">${j + 1}</span>${esc(c.capitulos[j])}</span>` : '<span></span>');
  }
  const [nome, resto] = c.titulo.split(' — ');
  const capa =
    `<section class="capa">` +
    `<div class="capa-topo"><span class="marca">PLS Calc · NBR 8800</span><span>${esc(resto ?? 'Manual do usuário')}</span></div>` +
    `<h1>${esc(nome)}</h1>` +
    `<p class="subtitulo">${emLinha(c.subtitulo)}</p>` +
    `<div class="indice-titulo">Conteúdo</div><div class="indice">${celulas.join('')}</div>` +
    // A logo do autor, discreta, junto do quadro de autor, versão e data —
    // só na capa do manual (pedido dele, 04/11/2026); a memória sai sem logo.
    `<div class="capa-logo"><img src="${esc(urlDaImagem('../public/logo-autor.png'))}" alt=""></div>` +
    `<div class="carimbo">` +
    `<div><span class="rot">Autor</span><span class="forte">José Barbalho</span></div>` +
    `<div><span class="rot">Versão</span>PLS Calc ${VERSAO}</div>` +
    `<div><span class="rot">Data</span>${esc(data)}</div>` +
    `</div></section>`;
  // O anexo não tem capa: abre com o título e o aviso de uso interno.
  const abertura = c.anexo ? `<h1 class="manual-anexo">${esc(c.titulo)}</h1><p class="nevoa">${emLinha(c.subtitulo)}</p>` : capa;
  const corpo = c.anexo ? c.corpo.replace('<section class="secao manual-secao">', '<section class="secao">') : c.corpo;
  return (
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    `<title>${esc(c.titulo)}</title>` +
    estiloDaMemoria({ obra: 'PLS Calc · NBR 8800', documento: c.anexo ? 'Manual do usuário — anexo' : 'Manual do usuário', revisao: VERSAO, versao: VERSAO, rodape: `PLS Calc ${VERSAO} · NBR 8800`, rodapeMeio: 'proestruturas3d.com.br', rotuloRevisao: 'versão' }) +
    ESTILO_DO_MANUAL +
    `</head><body>${abertura}${corpo}</body></html>`
  );
}
