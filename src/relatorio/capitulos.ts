// ═══════════════════════════════════════════════════════════════════════════
//  relatorio/capitulos.ts — os capítulos da memória: premissas, uma seção por
//  verificação e as conclusões
// ---------------------------------------------------------------------------
//  Cada verificação vira um capítulo com os PASSOS que o motor devolveu, na
//  ordem em que a conta foi feita: o item da norma na coluna da esquerda, a
//  fórmula, a substituição e o resultado à direita. Nada é recalculado aqui —
//  o número da página é o da conta (ver `motor/memoria.ts`).
// ═══════════════════════════════════════════════════════════════════════════

import type { ResultadoDaVerificacao } from '../motor';
import { piorVerificacao, type Verificacao } from '../motor/memoria';
import { E, G, GAMA_A1 } from '../motor/secao';
import { desenhoDoPerfil } from '../visualizacao/geometriaDaSecao';
import { propriedadesDoPerfil } from './propriedadesDoPerfil';
import { contaHtml, contasHtml } from './expr';
import { esc, num, numExato } from './formatos';
import { creaPorExtenso, type Projetista } from './projetista';
import { kv, nota, passo, secao, situacao, tabela, v } from './pecas';

const NORMA = 'NBR 8800:2024';

/** O corte da seção como SVG em texto, da mesma geometria da tela. */
export function svgDaSecao(r: ResultadoDaVerificacao): string {
  const g = desenhoDoPerfil(r.entrada.perfil);
  const eixo = (c: string) => c === 'eixo' || c === 'eixo-principal';
  const linha = (l: (typeof g.linhas)[number]) => `<line class="sec-${l.classe}" x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}"/>`;
  const eixos = g.linhas.filter((l) => eixo(l.classe)).map(linha).join('');
  const linhas = g.linhas.filter((l) => !eixo(l.classe)).map(linha).join('');
  // G (círculo com dois quadrantes cheios) e CT (círculo com cruz), como na tela.
  const marcas = (g.marcas ?? [])
    .map((m) =>
      m.tipo === 'centroide'
        ? `<g class="sec-centroide"><circle cx="${m.x}" cy="${m.y}" r="5"/><path d="M ${m.x - 5} ${m.y} A 5 5 0 0 1 ${m.x} ${m.y - 5} L ${m.x} ${m.y} Z M ${m.x + 5} ${m.y} A 5 5 0 0 1 ${m.x} ${m.y + 5} L ${m.x} ${m.y} Z"/></g>`
        : `<g class="sec-torcao"><circle cx="${m.x}" cy="${m.y}" r="4"/><line x1="${m.x - 7}" y1="${m.y}" x2="${m.x + 7}" y2="${m.y}"/><line x1="${m.x}" y1="${m.y - 7}" x2="${m.x}" y2="${m.y + 7}"/></g>`,
    )
    .join('');
  const textos = g.textos
    .map((t) => {
      const rot = t.rot ? ` transform="rotate(${t.rot} ${t.x} ${t.y})"` : '';
      const indice = t.indice ? `<tspan class="indice" dy="3">${esc(t.indice)}</tspan>` : '';
      const valor = t.valor ? `<tspan dy="${t.indice ? -3 : 0}"> = ${esc(t.valor)}</tspan>` : '';
      return `<text class="sec-texto-${t.classe}" x="${t.x}" y="${t.y}" text-anchor="${t.ancora}"${rot}><tspan class="simbolo">${esc(t.texto)}</tspan>${indice}${valor}</text>`;
    })
    .join('');
  return `<svg class="secao-perfil" viewBox="0 0 ${g.largura} ${g.altura}" xmlns="http://www.w3.org/2000/svg">${eixos}<path class="sec-corpo" d="${g.contorno}"/>${linhas}${marcas}${textos}</svg>`;
}

export function capituloPremissas(r: ResultadoDaVerificacao, n: number): string {
  const p = r.entrada.perfil;
  const aco = r.entrada.aco;
  const f = r.entrada.esforcos;
  const props: Array<[string, string, string]> = propriedadesDoPerfil(p).map((q) => [`${v(q.simbolo, q.indice)}${q.linha ? "'" : ''}`, q.valor, q.unidade]);
  // Duas colunas de propriedades lado a lado: a tabela fica da altura do desenho.
  const metade = Math.ceil(props.length / 2);
  const linhasProps = Array.from({ length: metade }, (_, i) => {
    const a = props[i]!;
    const b = props[i + metade];
    return { celulas: [a[0], `${a[1]} <span class="nevoa">${a[2]}</span>`, b ? b[0] : '', b ? `${b[1]} <span class="nevoa">${b[2]}</span>` : ''] };
  });
  const tabProps = tabela([{ cab: 'Grandeza', txt: true }, { cab: 'Valor' }, { cab: 'Grandeza', txt: true }, { cab: 'Valor' }], linhasProps, 'props-tab');

  const N = f.N;
  const corpo =
    passo({
      n: `${n}.1`,
      ref: `${NORMA}, 4.5.2.9 e Tabela 3`,
      titulo: 'Norma e coeficientes',
      corpo: kv([
        ['Norma', 'ABNT NBR 8800:2024, com a Errata 1:2025'],
        ['Módulo de elasticidade', `${v('E')} = ${num(E, 0)} kN/cm²`],
        ['Módulo de elasticidade transversal', `${v('G')} = ${num(G, 0)} kN/cm²`],
        ['Coeficiente de ponderação', `${v('γ', 'a1')} = ${num(GAMA_A1, 2)}`],
        ['Tensão residual', `${v('σ', 'r')} = 0,30 ${v('f', 'y')} (D.2.8-e)`],
      ]),
    }) +
    passo({
      n: `${n}.2`,
      ref: `${NORMA}, Anexo A`,
      titulo: 'Material',
      corpo: kv([
        ['Aço', esc(aco.nome)],
        ['Resistência ao escoamento', `${v('f', 'y')} = ${numExato(aco.fy, 2)} kN/cm²`],
        ['Resistência à ruptura', `${v('f', 'u')} = ${numExato(aco.fu, 2)} kN/cm²`],
      ]),
    }) +
    passo({
      n: `${n}.3`,
      ref: fonteDoPerfil(p),
      titulo: `Seção transversal — ${esc(p.nome)}`,
      corpo: `<div class="secao-e-props"><figure>${svgDaSecao(r)}</figure>${tabProps}</div>` + notaDoPerfil(p),
    }) +
    passo({
      n: `${n}.4`,
      titulo: 'Esforços solicitantes de cálculo',
      corpo: kv([
        ['Força normal', `${v('N', 'Sd')} = ${num(N, 2)} kN ${N > 0 ? '(compressão)' : N < 0 ? '(tração)' : ''}`],
        ['Momento fletor em torno de x', `${v('M', 'x,Sd')} = ${num(f.Mx, 1)} kN·cm`],
        ['Momento fletor em torno de y', `${v('M', 'y,Sd')} = ${num(f.My, 1)} kN·cm`],
        ['Força cortante em x', `${v('V', 'x,Sd')} = ${num(f.Vx, 2)} kN`],
        ['Força cortante em y', `${v('V', 'y,Sd')} = ${num(f.Vy, 2)} kN`],
      ]),
    }) +
    passo({
      n: `${n}.5`,
      ref: p.familia === 'L' ? `${NORMA}, 5.3.5` : `${NORMA}, 5.3.5 e 5.4.2.3`,
      titulo: 'Comprimentos e fatores',
      corpo: kv(comprimentosDaMemoria(r)),
    });
  return secao(n, 'Premissas e dados de entrada', corpo);
}

function monossimetrico(r: ResultadoDaVerificacao): boolean {
  const c = r.entrada.perfil.familia === 'I' ? r.entrada.perfil.soldado : undefined;
  return Boolean(c && (c.mesaSuperior.bf !== c.mesaInferior.bf || c.mesaSuperior.tf !== c.mesaInferior.tf));
}

/** De onde vêm os números da tabela da seção. */
function fonteDoPerfil(p: ResultadoDaVerificacao['entrada']['perfil']): string {
  if (p.familia === 'U') return 'Tabela A6.3 (UFPR), catálogo do A-PORT';
  if (p.familia === 'L') return p.b === p.bmenor ? 'Catálogo Gerdau e Tabelas A6.4/A6.5 (UFPR), catálogo do A-PORT' : 'Tabela A6.6 (UFPR), catálogo do A-PORT';
  if (p.soldado) return p.serie === 'PS' ? 'Perfil soldado, propriedades calculadas pelas chapas' : 'NBR 5884 (Tabelas A8.1 a A8.3, UFPR), propriedades calculadas pelas chapas';
  return p.serie === 'I' ? 'Tabela A6.2 (UFPR)' : 'Catálogo Gerdau, 11/2018';
}

/** O que a tabela da seção não diz sozinha: o que foi deduzido, e de onde. */
function notaDoPerfil(p: ResultadoDaVerificacao['entrada']['perfil']): string {
  const h = `Altura da alma para a esbeltez do perfil laminado: ${v('h')} = ${v('d')}'.`;
  if (p.familia === 'L')
    return nota(`Eixos principais: ${v('I', 'v')} = ${v('A', 'g')} ${v('r', 'mín')}², ${v('I', 'u')} = ${v('I', 'x')} + ${v('I', 'y')} − ${v('I', 'v')}. Centro de torção no encontro das linhas médias das abas. ${v('C', 'w')} desprezado.`);
  if (p.familia === 'U')
    return nota(`${h} ${v('C', 'w')} pela fórmula do D.2.8-a para seções U. Centro de torção pela teoria de paredes finas, na mesma linha média: ${v('x', '0')} = ${v('x', 'g')} − ${v('t', 'w')}/2 + 3${v('b')}'²${v('t', 'f')}/(6${v('b')}'${v('t', 'f')} + ${v('h')}'${v('t', 'w')}). ${esc(origens(p.origem))}`);
  if (p.soldado && (p.soldado.mesaSuperior.bf !== p.soldado.mesaInferior.bf || p.soldado.mesaSuperior.tf !== p.soldado.mesaInferior.tf))
    return nota(
      `Perfil soldado de mesas diferentes, sem raio de concordância: ${v('h')} = ${v('d')}' = ${v('d')} − ${v('t', 'fs')} − ${v('t', 'fi')}. ` +
        `Propriedades pelas chapas, em retângulos; ${v('y', 'g')} do centroide a partir da face de baixo, ${v('Z', 'x')} pela linha neutra plástica. ` +
        `Centro de torção entre as mesas, a ${v('y', '0')} do centroide (positivo para a mesa superior). ${v('J')} = Σ ${v('b')}·${v('t')}³/3, sem a correção das pontas livres. ` +
        `${v('C', 'w')} pela fórmula do D.2.8-b. Tensão residual ${v('σ', 'r')} = 0,30 ${v('f', 'y')} (D.2.8-e).`,
    );
  if (p.soldado)
    return nota(
      `Perfil soldado, sem raio de concordância: ${v('h')} = ${v('d')}' = ${v('d')} − 2${v('t', 'f')}. ` +
        `Propriedades pelas chapas, em retângulos. ${v('J')} = Σ ${v('b')}·${v('t')}³/3, com as mesas inteiras e a alma entre as faces internas das mesas, sem a correção das pontas livres. ` +
        `${v('C', 'w')} pela fórmula do D.2.8-a para seções I. Tensão residual ${v('σ', 'r')} = 0,30 ${v('f', 'y')} (D.2.8-e).`,
    );
  if (p.serie === 'I') return nota(`Mesa inclinada: ${v('t', 'f')} é a espessura média. ${h} ${v('C', 'w')} pela fórmula do D.2.8-a para seções I. ${esc(origens(p.origem ?? {}))}`);
  return nota(`Raio de concordância deduzido: ${v('r')} = (${v('d')} − 2${v('t', 'f')} − ${v('d')}')/2. ${h}`);
}

/** J, Zx e Zy que a tabela brasileira não publica: AISC da mesma peça ou estimados. */
function origens(o: Partial<Record<string, string>>): string {
  const partes = (['J', 'Zx', 'Zy'] as const).filter((k) => o[k] && o[k] !== 'Tabela A6.2').map((k) => `${k}: ${o[k]}`);
  return partes.length ? `${partes.join('; ')}.` : '';
}

/** Os comprimentos que a conta usou, conforme a família e o caso da cantoneira. */
function comprimentosDaMemoria(r: ResultadoDaVerificacao): Array<[string, string]> {
  const L = r.entrada.comprimentos;
  const lig = r.entrada.ligacao;
  if (r.entrada.perfil.familia === 'L' && lig)
    return [
      ['Barra', `treliça ${lig.trelica}, ligada pela aba ${r.entrada.perfil.b === r.entrada.perfil.bmenor ? '' : `${lig.aba} `}(5.3.5.4)`.replace(' (', ' (')],
      ['Entre os pontos de trabalho', `${v('L', 'x1')} = ${numExato(L.Lx, 1)} cm`],
    ];
  const base: Array<[string, string]> = [
    ['Flambagem por flexão em x', `${v('L', 'x')} = ${numExato(L.Lx, 1)} cm`],
    ['Flambagem por flexão em y', `${v('L', 'y')} = ${numExato(L.Ly, 1)} cm`],
  ];
  if (r.entrada.perfil.familia === 'L') return [['Barra', 'comprimida pelo centroide'], ...base, ['Torção', `${v('L', 'z')} = ${numExato(L.Lt, 1)} cm`]];
  return [
    ...base,
    ['Torção e FLT', `${v('L', 'z')} = ${v('L', 'b')} = ${numExato(L.Lt, 1)} cm`],
    ['Fator de momento não uniforme', `${v('C', 'b')} = ${numExato(L.Cb, 3)}`],
    ['Enrijecedores transversais', L.a > 0 ? `${v('a')} = ${numExato(L.a, 1)} cm` : 'sem enrijecedores'],
    ...(monossimetrico(r)
      ? ([
          [
            'Curvatura no trecho destravado',
            r.entrada.curvatura === 'reversa'
              ? 'reversa: as duas mesas verificadas (D.2.8-j)'
              : `simples: ${v('M', 'x,Sd')} ${r.entrada.esforcos.Mx >= 0 ? 'positivo comprime a mesa superior' : 'negativo comprime a mesa inferior'}`,
          ],
        ] as Array<[string, string]>)
      : []),
  ];
}

/** Um capítulo por verificação: os passos do motor, e a linha final Sd ≤ Rd. */
export function capituloDaVerificacao(vf: Verificacao, n: number): string {
  const corpo =
    vf.passos
      .map((p, i) =>
        passo({
          n: `${n}.${i + 1}`,
          ref: `${NORMA}, ${esc(p.ref)}`,
          titulo: esc(p.titulo),
          corpo: contasHtml(p),
        }),
      )
      .join('') +
    passo({
      n: `${n}.${vf.passos.length + 1}`,
      titulo: 'Situação',
      corpo:
        (vf.avisos.length ? vf.avisos.map((a) => nota(esc(a))).join('') : '') +
        `<div class="verif">${contaHtml({ simbolo: { t: 'txt', s: 'Sd/Rd' }, valor: vf.razao, casas: 3 })}${situacao(vf.situacao)}${vf.governa ? `<span class="nevoa">${esc(vf.governa)}</span>` : ''}</div>`,
    });
  return secao(n, `${esc(vf.titulo)} <span class="nevoa" style="font-size:10pt">— ${NORMA}, ${esc(vf.item)}</span>`, corpo);
}

/** A tabela do resumo, usada na capa e nas conclusões. */
export function tabelaResumo(r: ResultadoDaVerificacao): string {
  const casas = (u: string) => (u === 'kN·cm' ? 1 : 2);
  // A mesma regra da barra de estado da tela, para as duas marcarem a mesma linha.
  const pior = piorVerificacao(r.lista);
  return tabela(
    [{ cab: 'Verificação', txt: true }, { cab: 'Item' }, { cab: 'S<sub>d</sub>' }, { cab: 'R<sub>d</sub>' }, { cab: 'S<sub>d</sub>/R<sub>d</sub>' }, { cab: 'Governa', txt: true }, { cab: 'Situação', txt: true }],
    r.lista.map((vf) => ({
      classe: vf === pior ? 'governa' : undefined,
      celulas: [
        esc(vf.titulo),
        esc(vf.item),
        vf.chave === 'combinada' ? '—' : `${num(vf.sd, casas(vf.unidade))} <span class="nevoa">${esc(vf.unidade)}</span>`,
        vf.chave === 'combinada' ? '1,0' : `${num(vf.rd, casas(vf.unidade))} <span class="nevoa">${esc(vf.unidade)}</span>`,
        num(vf.razao, 3),
        esc(vf.governa ?? ''),
        situacao(vf.situacao),
      ],
    })),
  );
}

export function capituloConclusoes(r: ResultadoDaVerificacao, n: number, p: Projetista): string {
  // Sem projetista, a linha fica em branco para a assinatura à mão e o rótulo
  // embaixo diz de quem é — como saía antes da configuração.
  const credenciais = [p.titulo.trim(), creaPorExtenso(p.crea)].filter(Boolean).map(esc).join(' · ');
  const palavra = r.situacao === 'atende' ? 'atende' : r.situacao === 'avaliar' ? 'atende, com ressalvas,' : 'não atende';
  const corpo =
    `<div class="fecho">` +
    `<p>O perfil ${esc(r.entrada.perfil.nome)} em ${esc(r.entrada.aco.nome)} ${palavra} aos estados-limites últimos verificados pela ABNT ${NORMA}, com índice de utilização máximo ${num(r.razaoMaxima, 3)}.</p>` +
    tabelaResumo(r) +
    nota('Não verificados aqui: ruptura da seção líquida (depende da ligação), estados-limites de serviço, efeitos locais de forças concentradas e a estabilidade global da estrutura, que fornece os esforços.') +
    `<div class="assinatura"><span class="forte">${esc(p.nome.trim()) || '&nbsp;'}</span>${credenciais || 'Responsável técnico'}</div>` +
    `</div>`;
  return secao(n, 'Conclusões', corpo);
}
