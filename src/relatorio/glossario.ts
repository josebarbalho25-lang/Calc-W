// ═══════════════════════════════════════════════════════════════════════════
//  relatorio/glossario.ts — o que quer dizer cada letra da memória
// ---------------------------------------------------------------------------
//  O glossário lista os símbolos que ESTA memória escreve: os das premissas,
//  que estão sempre lá, e os que as contas usaram — colhidos das próprias
//  fórmulas do motor, não de uma lista à parte. Memória de pilar travado não
//  explica χFLT; a de perfil com largura efetiva explica σel.
//
//  ⚠️ SÍMBOLO NOVO NO MOTOR PEDE VERBETE AQUI. O selo `glossario.test.ts`
//  roda o catálogo inteiro em vários cenários e falha se alguma conta
//  escrever uma letra que o glossário não explica — a memória assinada não
//  pode ter incógnita sem nome.
//
//  Os textos seguem a Seção 3 (Simbologia) e as definições da NBR 8800:2024.
// ═══════════════════════════════════════════════════════════════════════════

import type { ResultadoDaVerificacao } from '../motor';
import type { Expr } from '../motor/memoria';
import { nota, passo, secao, v } from './pecas';

interface Verbete {
  /** "nome|índice", o mesmo par que o motor escreve em v(nome, índice). */
  chave: string;
  simbolo: string;
  texto: string;
  unidade?: string;
}

const ver = (nome: string, ind: string | undefined, texto: string, unidade?: string): Verbete => ({
  chave: `${nome}|${ind ?? ''}`,
  simbolo: v(nome, ind),
  texto,
  unidade,
});

const GRUPOS: ReadonlyArray<{ titulo: string; verbetes: Verbete[] }> = [
  {
    titulo: 'Seção transversal',
    verbetes: [
      ver('d', undefined, 'altura total da seção', 'cm'),
      ver('b', 'f', 'largura da mesa', 'cm'),
      ver('t', 'f', 'espessura da mesa', 'cm'),
      ver('t', 'w', 'espessura da alma', 'cm'),
      { chave: "d'|", simbolo: `${v('d')}'`, texto: 'altura da parte plana da alma, do catálogo', unidade: 'mm' },
      ver('h', undefined, `altura da alma para a esbeltez do perfil laminado, igual a ${v('d')}'`, 'cm'),
      ver('r', undefined, `raio de concordância entre mesa e alma, ${v('r')} = (${v('d')} − 2${v('t', 'f')} − ${v('d')}')/2`, 'mm'),
      ver('A', 'g', 'área bruta da seção', 'cm²'),
      ver('m', undefined, 'massa por metro', 'kg/m'),
      ver('I', 'x', 'momento de inércia em relação ao eixo x (eixo de maior inércia)', 'cm⁴'),
      ver('I', 'y', 'momento de inércia em relação ao eixo y (eixo de menor inércia)', 'cm⁴'),
      ver('W', 'x', 'módulo de resistência elástico em relação ao eixo x', 'cm³'),
      ver('W', 'y', 'módulo de resistência elástico em relação ao eixo y', 'cm³'),
      ver('Z', 'x', 'módulo de resistência plástico em relação ao eixo x', 'cm³'),
      ver('Z', 'y', 'módulo de resistência plástico em relação ao eixo y', 'cm³'),
      ver('r', 'x', 'raio de giração em relação ao eixo x', 'cm'),
      ver('r', 'y', 'raio de giração em relação ao eixo y', 'cm'),
      ver('r', '0', 'raio de giração polar em relação ao centro de cisalhamento', 'cm'),
      ver('J', undefined, 'constante de torção', 'cm⁴'),
      ver('C', 'w', 'constante de empenamento', 'cm⁶'),
    ],
  },
  {
    titulo: 'Material e coeficientes',
    verbetes: [
      ver('f', 'y', 'resistência ao escoamento do aço', 'kN/cm²'),
      ver('f', 'u', 'resistência à ruptura do aço', 'kN/cm²'),
      ver('E', undefined, 'módulo de elasticidade do aço', 'kN/cm²'),
      ver('G', undefined, 'módulo de elasticidade transversal do aço', 'kN/cm²'),
      ver('γ', 'a1', 'coeficiente de ponderação da resistência ao escoamento, à flambagem e à instabilidade'),
      ver('σ', 'r', `tensão residual, 0,30 ${v('f', 'y')}`, 'kN/cm²'),
    ],
  },
  {
    titulo: 'Esforços e comprimentos',
    verbetes: [
      ver('N', 'Sd', 'força axial solicitante de cálculo (positiva comprime, negativa traciona)', 'kN'),
      ver('N', 't,Sd', 'força axial de tração solicitante de cálculo', 'kN'),
      ver('N', 'c,Sd', 'força axial de compressão solicitante de cálculo', 'kN'),
      ver('M', 'x,Sd', 'momento fletor solicitante de cálculo em torno do eixo x', 'kN·cm'),
      ver('M', 'y,Sd', 'momento fletor solicitante de cálculo em torno do eixo y', 'kN·cm'),
      ver('V', 'x,Sd', 'força cortante solicitante de cálculo na direção x (paralela às mesas)', 'kN'),
      ver('V', 'y,Sd', 'força cortante solicitante de cálculo na direção y (paralela à alma)', 'kN'),
      ver('V', 'Sd', 'força cortante solicitante de cálculo, na direção verificada', 'kN'),
      ver('L', 'x', 'comprimento destravado associado à flexão em relação ao eixo x', 'cm'),
      ver('L', 'y', 'comprimento destravado associado à flexão em relação ao eixo y', 'cm'),
      ver('L', 'z', 'comprimento destravado associado à torção', 'cm'),
      ver('L', 'b', `comprimento destravado da flambagem lateral com torção; aqui igual a ${v('L', 'z')}`, 'cm'),
      ver('C', 'b', 'fator de modificação para diagrama de momento fletor não uniforme'),
      ver('a', undefined, 'distância entre enrijecedores transversais da alma', 'cm'),
    ],
  },
  {
    titulo: 'Tração e compressão',
    verbetes: [
      ver('N', 't,Rd', 'força axial de tração resistente de cálculo', 'kN'),
      ver('λ', 'máx', `maior índice de esbeltez da barra, entre ${v('L', 'x')}/${v('r', 'x')} e ${v('L', 'y')}/${v('r', 'y')}`),
      ver('N', 'ex', 'força axial de flambagem elástica por flexão em relação ao eixo x', 'kN'),
      ver('N', 'ey', 'força axial de flambagem elástica por flexão em relação ao eixo y', 'kN'),
      ver('N', 'ez', 'força axial de flambagem elástica por torção', 'kN'),
      ver('N', 'e', `força axial de flambagem elástica, a menor entre ${v('N', 'ex')}, ${v('N', 'ey')} e ${v('N', 'ez')}`, 'kN'),
      ver('λ', '0', 'índice de esbeltez reduzido'),
      ver('χ', undefined, 'fator de redução associado à resistência à compressão'),
      ver('b', undefined, `largura do elemento comprimido: ${v('b', 'f')}/2 na mesa, ${v('h')} na alma`, 'cm'),
      ver('t', undefined, `espessura do elemento comprimido: ${v('t', 'f')} na mesa, ${v('t', 'w')} na alma`, 'cm'),
      { chave: '|lim', simbolo: `(${v('b')}/${v('t')})<sub>lim</sub>`, texto: 'relação entre largura e espessura limite do elemento (Tabela 4)' },
      ver('c', '1', 'coeficiente para o cálculo da largura efetiva (Tabela 5)'),
      ver('c', '2', 'coeficiente para o cálculo da largura efetiva (Tabela 5)'),
      ver('σ', 'el', 'tensão de flambagem local elástica do elemento', 'kN/cm²'),
      ver('b', 'ef', 'largura efetiva do elemento', 'cm'),
      ver('b', 'm', `largura de cada metade de mesa, ${v('b', 'f')}/2`, 'cm'),
      ver('b', 'ef,m', 'largura efetiva de cada metade de mesa', 'cm'),
      ver('b', 'ef,a', 'largura efetiva da alma', 'cm'),
      ver('A', 'ef', 'área efetiva da seção', 'cm²'),
      ver('N', 'c,Rd', 'força axial de compressão resistente de cálculo', 'kN'),
    ],
  },
  {
    titulo: 'Flexão',
    verbetes: [
      ver('M', 'pl', 'momento fletor de plastificação', 'kN·cm'),
      ver('λ', undefined, `parâmetro de esbeltez: ${v('b', 'f')}/(2${v('t', 'f')}) na FLM e no cortante em x, ${v('h')}/${v('t', 'w')} na FLA e no cortante em y, ${v('L', 'b')}/${v('r', 'y')} na FLT`),
      ver('λ', 'p', 'parâmetro de esbeltez correspondente à plastificação'),
      ver('λ', 'r', 'parâmetro de esbeltez correspondente ao início do escoamento'),
      ver('M', 'r', 'momento fletor correspondente ao início do escoamento, com a tensão residual', 'kN·cm'),
      ver('M', 'cr', 'momento fletor de flambagem elástica', 'kN·cm'),
      ver('β', '1', 'parâmetro da flambagem lateral com torção de seções I (D.2.8)', 'cm⁻¹'),
      ver('λ', 'LT', `esbeltez da flambagem lateral com torção pelo caminho alternativo, √(${v('M', 'pl')}/${v('M', 'cr')})`),
      ver('χ', 'FLT', 'fator de redução da flambagem lateral com torção pelo caminho alternativo'),
      ver('M', 'Rk', 'momento fletor resistente característico do estado-limite', 'kN·cm'),
      ver('M', 'Rk,FLT', 'momento fletor resistente característico adotado para a FLT, o maior dos dois caminhos', 'kN·cm'),
      ver('M', 'x,Rd', 'momento fletor resistente de cálculo em torno do eixo x', 'kN·cm'),
      ver('M', 'y,Rd', 'momento fletor resistente de cálculo em torno do eixo y', 'kN·cm'),
    ],
  },
  {
    titulo: 'Cortante e esforços combinados',
    verbetes: [
      ver('k', 'v', 'coeficiente de flambagem por cisalhamento'),
      ver('A', 'w', `área de cisalhamento: ${v('d')} ${v('t', 'w')} para força em y, 2 ${v('b', 'f')} ${v('t', 'f')} para força em x`, 'cm²'),
      ver('V', 'pl', 'força cortante de plastificação', 'kN'),
      ver('V', 'Rd', 'força cortante resistente de cálculo', 'kN'),
      ver('N', 'Rd', `força axial resistente de cálculo, de tração ou de compressão conforme o sinal de ${v('N', 'Sd')}`, 'kN'),
      {
        chave: 'Sd/Rd',
        simbolo: `${v('S', 'd')}/${v('R', 'd')}`,
        texto: 'índice de utilização: solicitante de cálculo sobre resistente de cálculo (atende até 1,0)',
      },
    ],
  },
];

const VERBETES = new Map(GRUPOS.flatMap((g) => g.verbetes.map((vb) => [vb.chave, vb] as const)));

// As premissas e os títulos dos passos escrevem estes sempre, fora das contas.
const SEMPRE = [
  'd|', 'b|f', 't|w', 't|f', "d'|", 'r|', 'A|g', 'm|', 'I|x', 'I|y', 'W|x', 'W|y', 'Z|x', 'Z|y', 'r|x', 'r|y', 'J|', 'C|w', 'h|',
  'E|', 'G|', 'γ|a1', 'σ|r', 'f|y', 'f|u',
  'N|Sd', 'M|x,Sd', 'M|y,Sd', 'V|x,Sd', 'V|y,Sd', 'L|x', 'L|y', 'L|z', 'L|b', 'C|b',
  'c|1', 'c|2', 'Sd/Rd',
];

function colher(e: Expr | undefined, em: Set<string>): void {
  if (!e) return;
  switch (e.t) {
    case 'v':
      em.add(`${e.nome}|${e.ind ?? ''}`);
      return;
    case 'fr':
      colher(e.num, em);
      colher(e.den, em);
      return;
    case 'rz':
    case 'par':
      colher(e.x, em);
      return;
    case 'pot':
      colher(e.base, em);
      colher(e.exp, em);
      return;
    case 'seq':
      for (const p of e.partes) colher(p, em);
      return;
  }
}

/** Os símbolos que a memória deste resultado escreve, como "nome|índice". */
export function simbolosDaMemoria(r: ResultadoDaVerificacao): Set<string> {
  const usados = new Set(SEMPRE);
  if (r.entrada.comprimentos.a > 0) usados.add('a|');
  for (const vf of r.lista)
    for (const p of vf.passos)
      for (const c of p.contas) {
        colher(c.simbolo, usados);
        colher(c.formula, usados);
        colher(c.numeros, usados);
      }
  return usados;
}

/** O que a memória escreve e o glossário não explica (o selo cobra vazio). */
export function semVerbete(r: ResultadoDaVerificacao): string[] {
  return [...simbolosDaMemoria(r)].filter((k) => !VERBETES.has(k));
}

export function capituloGlossario(r: ResultadoDaVerificacao, n: number): string {
  const usados = simbolosDaMemoria(r);
  const grupos = GRUPOS.map((g) => ({ titulo: g.titulo, verbetes: g.verbetes.filter((vb) => usados.has(vb.chave)) })).filter((g) => g.verbetes.length);
  const corpo =
    nota('Unidades das contas: kN, cm e kN/cm². As dimensões de chapa estão em mm na tabela da seção e em cm nas contas.') +
    grupos
      .map((g, i) =>
        passo({
          n: `${n}.${i + 1}`,
          titulo: g.titulo,
          corpo:
            `<table class="glossario"><tbody>` +
            g.verbetes.map((vb) => `<tr><td>${vb.simbolo}</td><td>${vb.texto}</td><td>${vb.unidade ?? ''}</td></tr>`).join('') +
            `</tbody></table>`,
        }),
      )
      .join('');
  // Página nova, como anexo: depois da assinatura, o título não fica sozinho
  // no pé da página das conclusões.
  return secao(n, 'Glossário', corpo, 'anexo');
}
