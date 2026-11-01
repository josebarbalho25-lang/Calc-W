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
import type { Verificacao } from '../motor/memoria';
import { E, G, GAMA_A1 } from '../motor/secao';
import { desenhoDaSecao, raioDeConcordancia } from '../visualizacao/geometriaDaSecao';
import { contaHtml, contasHtml } from './expr';
import { esc, num, numExato } from './formatos';
import { kv, nota, passo, secao, situacao, tabela, v } from './pecas';

const NORMA = 'NBR 8800:2024';

/** O corte da seção como SVG em texto, da mesma geometria da tela. */
export function svgDaSecao(r: ResultadoDaVerificacao): string {
  const g = desenhoDaSecao(r.entrada.perfil);
  const linhas = g.linhas.map((l) => `<line class="sec-${l.classe}" x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}"/>`).join('');
  const textos = g.textos
    .map((t) => {
      const rot = t.rot ? ` transform="rotate(${t.rot} ${t.x} ${t.y})"` : '';
      const indice = t.indice ? `<tspan class="indice" dy="3">${esc(t.indice)}</tspan>` : '';
      const valor = t.valor ? `<tspan dy="${t.indice ? -3 : 0}"> = ${esc(t.valor)}</tspan>` : '';
      return `<text class="sec-texto-${t.classe}" x="${t.x}" y="${t.y}" text-anchor="${t.ancora}"${rot}><tspan class="simbolo">${esc(t.texto)}</tspan>${indice}${valor}</text>`;
    })
    .join('');
  return `<svg class="secao-perfil" viewBox="0 0 ${g.largura} ${g.altura}" xmlns="http://www.w3.org/2000/svg"><path class="sec-corpo" d="${g.contorno}"/>${linhas}${textos}</svg>`;
}

export function capituloPremissas(r: ResultadoDaVerificacao, n: number): string {
  const p = r.entrada.perfil;
  const aco = r.entrada.aco;
  const f = r.entrada.esforcos;
  const L = r.entrada.comprimentos;
  const d2 = (x: number) => numExato(x, 2);
  const props: Array<[string, string, string]> = [
    [v('d'), d2(p.d), 'mm'],
    [v('b', 'f'), d2(p.bf), 'mm'],
    [v('t', 'w'), d2(p.tw), 'mm'],
    [v('t', 'f'), d2(p.tf), 'mm'],
    [`${v('d')}'`, d2(p.dLinha), 'mm'],
    [v('r'), numExato(raioDeConcordancia(p), 1), 'mm'],
    [v('A', 'g'), d2(p.A), 'cm²'],
    [v('m'), d2(p.massa), 'kg/m'],
    [v('I', 'x'), num(p.Ix, 0), 'cm⁴'],
    [v('I', 'y'), num(p.Iy, 0), 'cm⁴'],
    [v('W', 'x'), d2(p.Wx), 'cm³'],
    [v('W', 'y'), d2(p.Wy), 'cm³'],
    [v('Z', 'x'), d2(p.Zx), 'cm³'],
    [v('Z', 'y'), d2(p.Zy), 'cm³'],
    [v('r', 'x'), d2(p.rx), 'cm'],
    [v('r', 'y'), d2(p.ry), 'cm'],
    [v('J'), d2(p.J), 'cm⁴'],
    [v('C', 'w'), num(p.Cw, 0), 'cm⁶'],
  ];
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
      ref: 'Catálogo Gerdau, 11/2018',
      titulo: `Seção transversal — ${esc(p.nome)}`,
      corpo: `<div class="secao-e-props"><figure>${svgDaSecao(r)}</figure>${tabProps}</div>` + nota(`Raio de concordância deduzido: ${v('r')} = (${v('d')} − 2${v('t', 'f')} − ${v('d')}')/2. Altura da alma para a esbeltez do perfil laminado: ${v('h')} = ${v('d')}'.`),
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
      ref: `${NORMA}, 5.3.5 e 5.4.2.3`,
      titulo: 'Comprimentos e fatores',
      corpo: kv([
        ['Flambagem por flexão em x', `${v('L', 'x')} = ${numExato(L.Lx, 1)} cm`],
        ['Flambagem por flexão em y', `${v('L', 'y')} = ${numExato(L.Ly, 1)} cm`],
        ['Torção e FLT', `${v('L', 'z')} = ${v('L', 'b')} = ${numExato(L.Lt, 1)} cm`],
        ['Fator de momento não uniforme', `${v('C', 'b')} = ${numExato(L.Cb, 3)}`],
        ['Enrijecedores transversais', L.a > 0 ? `${v('a')} = ${numExato(L.a, 1)} cm` : 'sem enrijecedores'],
      ]),
    });
  return secao(n, 'Premissas e dados de entrada', corpo);
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
  // NaN (alma esbelta, fora do alcance) é o pior: a mesma regra da barra de
  // estado da tela, para as duas marcarem a mesma linha.
  const pior = r.lista.reduce((a, b) => (Number.isNaN(b.razao) || b.razao > a.razao ? b : a));
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

export function capituloConclusoes(r: ResultadoDaVerificacao, n: number, responsavel: string, registro: string): string {
  const palavra = r.situacao === 'atende' ? 'atende' : r.situacao === 'avaliar' ? 'atende, com ressalvas,' : 'não atende';
  const corpo =
    `<div class="fecho">` +
    `<p>O perfil ${esc(r.entrada.perfil.nome)} em ${esc(r.entrada.aco.nome)} ${palavra} aos estados-limites últimos verificados pela ABNT ${NORMA}, com índice de utilização máximo ${num(r.razaoMaxima, 3)}.</p>` +
    tabelaResumo(r) +
    nota('Não verificados aqui: ruptura da seção líquida (depende da ligação), estados-limites de serviço, efeitos locais de forças concentradas e a estabilidade global da estrutura, que fornece os esforços.') +
    `<div class="assinatura"><span class="forte">${esc(responsavel) || '&nbsp;'}</span>${esc(registro) || 'Responsável técnico'}</div>` +
    `</div>`;
  return secao(n, 'Conclusões', corpo);
}
