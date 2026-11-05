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
import { propriedadesDoPerfil } from './propriedadesDoPerfil';

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
      ver('x', 'g', 'distância do centroide à face externa da alma (U) ou da aba vertical (cantoneira)', 'cm'),
      ver('y', 'g', 'distância do centroide à face externa da aba horizontal da cantoneira; no I de mesas diferentes, à face de baixo da mesa inferior', 'cm'),
      ver('x', '0', 'coordenada do centro de cisalhamento a partir do centroide, na direção do eixo x', 'cm'),
      ver('y', '0', 'coordenada do centro de cisalhamento a partir do centroide, na direção do eixo y', 'cm'),
      ver('b', 'maior', 'largura da aba maior da cantoneira', 'cm'),
      ver('b', 'menor', 'largura da aba menor da cantoneira', 'cm'),
      ver('α', undefined, 'ângulo do eixo principal u com o eixo x, no sentido anti-horário', '°'),
      ver('I', 'u', 'momento de inércia em relação ao eixo principal u (o de maior inércia)', 'cm⁴'),
      ver('I', 'v', 'momento de inércia em relação ao eixo principal v (o de menor inércia)', 'cm⁴'),
      ver('r', 'u', 'raio de giração em relação ao eixo principal u', 'cm'),
      ver('r', 'v', 'raio de giração em relação ao eixo principal v', 'cm'),
      ver('r', 'mín', 'raio de giração mínimo da cantoneira (eixo principal v)', 'cm'),
      ver('u', '0', 'coordenada do centro de cisalhamento a partir do centroide, na direção do eixo principal u', 'cm'),
      ver('v', '0', 'coordenada do centro de cisalhamento a partir do centroide, na direção do eixo principal v', 'cm'),
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
      ver('L', 'u', 'comprimento destravado associado à flexão em relação ao eixo principal u', 'cm'),
      ver('L', 'v', 'comprimento destravado associado à flexão em relação ao eixo principal v', 'cm'),
      ver('L', 'x1', 'comprimento da cantoneira entre os pontos de trabalho nos eixos das cordas da treliça', 'cm'),
      ver('L', 'b', `comprimento destravado da flambagem lateral com torção; aqui igual a ${v('L', 'z')}`, 'cm'),
      ver('C', 'b', 'fator de modificação para diagrama de momento fletor não uniforme'),
      ver('a', undefined, 'distância entre enrijecedores transversais da alma', 'cm'),
    ],
  },
  {
    titulo: 'Tração e compressão',
    verbetes: [
      ver('N', 't,Rd', 'força axial de tração resistente de cálculo', 'kN'),
      ver('C', 't', 'coeficiente de redução da área líquida (5.2.5)'),
      ver('A', 'n', 'área líquida da seção na furação da ligação', 'cm²'),
      { chave: '|mín', simbolo: `(${v('C', 't')} ${v('A', 'n')})<sub>mín</sub>`, texto: 'menor área líquida efetiva que a ligação por uma aba tem de dar para a ruptura da seção líquida', unidade: 'cm²' },
      ver('γ', 'a2', 'coeficiente de ponderação da resistência à ruptura (Tabela 3)'),
      ver('N', 'eyz', `força axial de flambagem elástica por flexo-torção: flexão em y acoplada à torção pelo ${v('y', '0')} (cantoneira de abas desiguais; I de mesas diferentes)`, 'kN'),
      ver('λ', 'máx', `maior índice de esbeltez da barra (na cantoneira, nos eixos principais)`),
      ver('N', 'ex', 'força axial de flambagem elástica por flexão em relação ao eixo x', 'kN'),
      ver('N', 'ey', 'força axial de flambagem elástica por flexão em relação ao eixo y', 'kN'),
      ver('N', 'ez', 'força axial de flambagem elástica por torção', 'kN'),
      ver('N', 'exz', `força axial de flambagem elástica por flexo-torção: flexão em x acoplada à torção pelo ${v('x', '0')} (seção U; na cantoneira de abas desiguais, em torno do eixo x da aba)`, 'kN'),
      ver('N', 'eu', 'força axial de flambagem elástica por flexão em relação ao eixo principal u', 'kN'),
      ver('N', 'ev', 'força axial de flambagem elástica por flexão em relação ao eixo principal v', 'kN'),
      ver('N', 'euz', `força axial de flambagem elástica por flexo-torção (flexão em u acoplada à torção pelo ${v('u', '0')}), cantoneira de abas iguais`, 'kN'),
      ver('r', 'x1', 'raio de giração em relação ao eixo pelo centroide paralelo à aba ligada', 'cm'),
      ver('I', 'x1', 'momento de inércia em relação ao eixo pelo centroide paralelo à aba ligada', 'cm⁴'),
      ver('L', 'x1,eq', 'comprimento destravado equivalente da cantoneira ligada por uma aba (5.3.5.4)', 'cm'),
      ver('N', 'ex1', `força axial de flambagem elástica da cantoneira ligada por uma aba, com ${v('L', 'x1,eq')}`, 'kN'),
      ver('b', 'e', 'largura da aba maior da cantoneira (5.3.5.4)', 'cm'),
      ver('b', 's', 'largura da aba menor da cantoneira (5.3.5.4)', 'cm'),
      ver('N', 'e', `força axial de flambagem elástica, a menor entre ${v('N', 'ex')}, ${v('N', 'ey')} e ${v('N', 'ez')}`, 'kN'),
      ver('λ', '0', 'índice de esbeltez reduzido'),
      ver('χ', undefined, 'fator de redução associado à resistência à compressão'),
      ver('b', undefined, `largura do elemento comprimido: ${v('b', 'f')}/2 na mesa de I, ${v('b', 'f')} na de U, ${v('h')} na alma, a largura da aba na cantoneira`, 'cm'),
      ver('t', undefined, `espessura do elemento comprimido: ${v('t', 'f')} na mesa, ${v('t', 'w')} na alma, a da chapa na cantoneira`, 'cm'),
      { chave: '|lim', simbolo: `(${v('b')}/${v('t')})<sub>lim</sub>`, texto: 'relação entre largura e espessura limite do elemento (Tabela 4)' },
      ver('c', '1', 'coeficiente para o cálculo da largura efetiva (Tabela 5)'),
      ver('c', '2', 'coeficiente para o cálculo da largura efetiva (Tabela 5)'),
      ver('k', 'c', `coeficiente da mesa de perfil soldado, 4/√(${v('h')}/${v('t', 'w')}), entre 0,35 e 0,76 (Tabela 4, nota a)`),
      ver('σ', 'el', 'tensão de flambagem local elástica do elemento', 'kN/cm²'),
      ver('b', 'ef', 'largura efetiva do elemento', 'cm'),
      ver('b', 'm', `largura de cada metade de mesa, ${v('b', 'f')}/2`, 'cm'),
      ver('b', 'ef,m', 'largura efetiva de cada metade de mesa', 'cm'),
      ver('b', 'ef,a', 'largura efetiva da alma', 'cm'),
      ver('b', 'ef,maior', 'largura efetiva da aba maior da cantoneira', 'cm'),
      ver('b', 'ef,menor', 'largura efetiva da aba menor da cantoneira', 'cm'),
      ver('A', 'ef', 'área efetiva da seção', 'cm²'),
      ver('N', 'c,Rd', 'força axial de compressão resistente de cálculo', 'kN'),
    ],
  },
  {
    titulo: 'Flexão',
    verbetes: [
      ver('M', 'pl', 'momento fletor de plastificação', 'kN·cm'),
      ver('λ', undefined, `parâmetro de esbeltez: ${v('b', 'f')}/(2${v('t', 'f')}) na FLM e no cortante em x do I (${v('b', 'f')}/${v('t', 'f')} no U), ${v('h')}/${v('t', 'w')} na FLA e no cortante em y, ${v('L', 'b')}/${v('r', 'y')} na FLT`),
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
      ver('h', 'ef', 'largura efetiva da alma comprimida do U fletido em torno de y (5.3.4.2 com χ = 1)', 'cm'),
      ver('W', 'ef', 'módulo de resistência elástico mínimo da seção com a alma de largura efetiva (D.2.8-d)', 'cm³'),
      ver('x', 'g,ef', 'posição do centroide da seção efetiva, a partir da face externa da alma', 'cm'),
      ver('I', 'y,ef', 'momento de inércia em torno de y da seção efetiva', 'cm⁴'),
    ],
  },
  {
    titulo: 'Cantoneira simples — AISC 360-22 (F10, G3)',
    verbetes: [
      ver('M', 'u,Sd', 'momento fletor solicitante de cálculo em torno do eixo principal u (positivo comprime o lado v > 0)', 'kN·cm'),
      ver('M', 'v,Sd', 'momento fletor solicitante de cálculo em torno do eixo principal v (positivo comprime o lado u > 0)', 'kN·cm'),
      ver('M', 'u,Rd', 'momento fletor resistente de cálculo em torno do eixo principal u', 'kN·cm'),
      ver('M', 'v,Rd', 'momento fletor resistente de cálculo em torno do eixo principal v', 'kN·cm'),
      ver('c', 'máx', 'distância do eixo de flexão ao canto mais distante da seção', 'cm'),
      ver('M', 'y', 'momento fletor de início de escoamento em torno do eixo de flexão', 'kN·cm'),
      ver('M', 'n', 'momento fletor resistente nominal do AISC 360-22', 'kN·cm'),
      ver('r', 'z', `raio de giração em relação ao eixo principal de menor inércia (o ${v('r', 'mín')})`, 'cm'),
      ver('β', 'w', 'propriedade da cantoneira em relação ao eixo principal de maior inércia (F10-4); zero nas de abas iguais', 'cm'),
      ver('S', 'c', 'módulo de resistência elástico até a ponta comprimida da aba', 'cm³'),
      ver('c', 'ponta', 'distância do eixo de flexão à ponta comprimida da aba', 'cm'),
      ver('F', 'cr', 'tensão crítica de flambagem local da aba esbelta (F10-8)', 'kN/cm²'),
      ver('C', 'v2', 'coeficiente de flambagem por cisalhamento da alma (G2.2)'),
      ver('V', 'n', 'força cortante resistente nominal do AISC 360-22', 'kN'),
      ver('V', 'x,Rd', 'força cortante resistente de cálculo na direção x', 'kN'),
      ver('V', 'y,Rd', 'força cortante resistente de cálculo na direção y', 'kN'),
    ],
  },
  {
    titulo: 'Perfil soldado: mesas diferentes e alma esbelta',
    verbetes: [
      ver('b', 'fs', 'largura da mesa superior', 'cm'),
      ver('t', 'fs', 'espessura da mesa superior', 'cm'),
      ver('b', 'fi', 'largura da mesa inferior', 'cm'),
      ver('t', 'fi', 'espessura da mesa inferior', 'cm'),
      ver('b', 'ms', 'metade da largura da mesa superior', 'cm'),
      ver('b', 'mi', 'metade da largura da mesa inferior', 'cm'),
      ver('b', 'ef,ms', 'largura efetiva de cada metade da mesa superior', 'cm'),
      ver('b', 'ef,mi', 'largura efetiva de cada metade da mesa inferior', 'cm'),
      ver('b', 'fc', 'largura da mesa comprimida', 'cm'),
      ver('t', 'fc', 'espessura da mesa comprimida', 'cm'),
      ver('A', 'fc', 'área da mesa comprimida', 'cm²'),
      ver('W', undefined, 'módulo de resistência elástico mínimo da seção, em torno do eixo de flexão', 'cm³'),
      ver('W', 'c', 'módulo de resistência elástico do lado comprimido', 'cm³'),
      ver('W', 't', 'módulo de resistência elástico do lado tracionado', 'cm³'),
      ver('W', 'xc', 'módulo de resistência elástico do lado comprimido, em torno de x', 'cm³'),
      ver('W', 'xt', 'módulo de resistência elástico do lado tracionado, em torno de x', 'cm³'),
      ver('h', 'c', 'duas vezes a distância do centroide à face interna da mesa comprimida', 'cm'),
      ver('h', 'p', 'duas vezes a distância da linha neutra plástica à face interna da mesa comprimida', 'cm'),
      ver('I', 'yTc', 'momento de inércia, em torno do plano da alma, da seção T formada pela mesa comprimida e a parte comprimida da alma', 'cm⁴'),
      ver('A', 'Tc', 'área da seção T formada pela mesa comprimida e a parte comprimida da alma', 'cm²'),
      ver('r', 'yTc', 'raio de giração da seção T formada pela mesa comprimida e a parte comprimida da alma', 'cm'),
      ver('α', 'y', `relação ${v('I', 'yTc')}/${v('I', 'y')} (D.2.8-i)`),
      ver('β', '2', 'parâmetro da flambagem lateral com torção da seção monossimétrica (D.2.8-b)'),
      ver('β', '3', 'parâmetro da flambagem lateral com torção da seção monossimétrica (D.2.8-b)', 'cm'),
      ver('R', 'm', 'parâmetro de monossimetria do Cb, na curvatura reversa (5.4.2.3)'),
      ver('I', 'y,m', 'momento de inércia, em torno do eixo de simetria, da mesa de menor momento de inércia', 'cm⁴'),
      ver('r', 'yc', 'raio de giração, em torno do plano da alma, da mesa comprimida com um terço da altura comprimida da alma (Anexo E)', 'cm'),
      ver('a', 'r', `relação ${v('h', 'c')} ${v('t', 'w')}/${v('A', 'fc')}, até 10 (Anexo E)`),
      ver('k', 'pg', 'fator de redução do momento resistente pela alma esbelta (Anexo E)'),
      ver('λ', 'y', 'parâmetro de esbeltez correspondente ao escoamento, no Anexo E'),
    ],
  },
  {
    titulo: 'Cortante e esforços combinados',
    verbetes: [
      ver('k', 'v', 'coeficiente de flambagem por cisalhamento'),
      ver('A', 'w', `área de cisalhamento: ${v('d')} ${v('t', 'w')} para força em y; para força em x, 2 ${v('b', 'f')} ${v('t', 'f')} (mesas diferentes: ${v('b', 'fs')} ${v('t', 'fs')} + ${v('b', 'fi')} ${v('t', 'fi')})`, 'cm²'),
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

/**
 * Chaves que aparecem em mais de um grupo. Com chave repetida o glossário
 * imprime os dois verbetes (achado da revisão de 04/11/2026: o Neyz do I
 * monossimétrico entrava na memória da cantoneira) — o selo exige zero.
 */
export function chavesRepetidas(): string[] {
  const vistas = new Set<string>();
  const repetidas = new Set<string>();
  for (const g of GRUPOS) for (const vb of g.verbetes) (vistas.has(vb.chave) ? repetidas : vistas).add(vb.chave);
  return [...repetidas];
}

// As premissas e os títulos dos passos escrevem estes sempre, fora das contas
// — mais as propriedades da tabela da seção e os comprimentos, que mudam com
// a família (a cantoneira não tem mesa, nem Cb).
const SEMPRE = ['E|', 'G|', 'γ|a1', 'σ|r', 'f|y', 'f|u', 'N|Sd', 'M|x,Sd', 'M|y,Sd', 'V|x,Sd', 'V|y,Sd', 'c|1', 'c|2', 'Sd/Rd'];

function sempre(r: ResultadoDaVerificacao): string[] {
  const p = r.entrada.perfil;
  const props = propriedadesDoPerfil(p).map((q) => (q.linha ? `${q.simbolo}'|` : `${q.simbolo}|${q.indice ?? ''}`));
  const comp = p.familia === 'L' ? (r.entrada.ligacao ? ['L|x1'] : ['L|x', 'L|y', 'L|z']) : ['L|x', 'L|y', 'L|z', 'L|b', 'C|b', 'h|'];
  // As notas da tabela da seção escrevem estes também.
  const notas = p.familia === 'L' ? ['C|w'] : p.familia === 'U' ? ['b|', 'h|'] : p.soldado ? ['h|', 'σ|r'] : p.serie === 'I' ? [] : ['r|'];
  return [...SEMPRE, ...props, ...comp, ...notas];
}

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
  const usados = new Set(sempre(r));
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
