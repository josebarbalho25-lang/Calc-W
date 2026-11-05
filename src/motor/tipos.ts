// ═══════════════════════════════════════════════════════════════════════════
//  motor/tipos.ts — o que o motor de verificação conhece
// ---------------------------------------------------------------------------
//  O motor é conta pura: não importa nada de tela, nada de React, nada do
//  navegador. É isso que deixa ele entrar no A-PORT depois sem trazer a
//  calculadora junto — o A-PORT passa a bitola e os esforços da barra, recebe
//  o resultado e a memória, e desenha do jeito dele.
//
//  ⚠️ AS UNIDADES DO CATÁLOGO SÃO AS PUBLICADAS, não as da conta. Chapa (d, bf,
//  tw, tf, h, d') em MILÍMETRO; propriedade da seção em CENTÍMETRO. É assim que
//  a Gerdau imprime e que a planilha de referência usa, e é assim que a
//  memória de cálculo mostra — então a tabela fica conferível número a número
//  contra o papel. A conversão para a conta acontece UMA vez, na entrada do
//  motor; converter em dois lugares é o jeito de a seção sair dez vezes menor.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Série do perfil I. Laminados: W e HP têm abas paralelas (HP é o de pilar);
 * I é o padrão americano, de abas inclinadas — o tf dele é a espessura MÉDIA.
 * Soldados (NBR 5884): CS (coluna), CVS (viga e coluna), VS (viga) e PS, o
 * soldado de chapas quaisquer, digitadas na tela.
 */
export type SeriePerfilI = 'W' | 'HP' | 'I' | 'CS' | 'CVS' | 'VS' | 'PS';

/** Uma mesa do perfil soldado, mm. */
export interface MesaDoSoldado {
  bf: number;
  tf: number;
}

/**
 * As chapas de um perfil I soldado, mm: a alma e as DUAS mesas, cada uma com
 * a sua largura e espessura.
 *
 * ⚠️ AS DUAS MESAS JÁ VÊM SEPARADAS, mesmo com a primeira etapa só aceitando
 * mesas iguais. A seção monossimétrica (D.2.8-b, -i, -j) é a segunda etapa:
 * quando ela vier, a entrada, o catálogo e as propriedades já estão no
 * formato dela, e só o motor ganha os ramos novos.
 */
export interface ChapasDoSoldado {
  /** Altura total, mm. */
  d: number;
  tw: number;
  /** Mesa de cima (+y) e de baixo. */
  mesaSuperior: MesaDoSoldado;
  mesaInferior: MesaDoSoldado;
}

/** De onde saiu uma propriedade que a tabela brasileira não publica. */
export type Origem = Partial<Record<'J' | 'Zx' | 'Zy' | 'Cw' | 'x0', string>>;

/** Uma bitola de perfil I laminado, como o catálogo publica. */
export interface PerfilI {
  familia: 'I';
  /** Como o catálogo o chama: "W 250 x 38,5". */
  nome: string;
  serie: SeriePerfilI;
  /** Massa linear do nome, kg/m. */
  massa: number;

  /** Altura total, mm. */
  d: number;
  /** Largura da mesa, mm. */
  bf: number;
  /** Espessura da alma, mm. */
  tw: number;
  /** Espessura da mesa, mm. */
  tf: number;
  /** Distância entre as faces internas das mesas, mm (d − 2tf, arredondada). */
  h: number;
  /**
   * Altura PLANA da alma, mm — entre os pés dos raios de concordância.
   *
   * ⚠️ É ESTE o "h" que a NBR 8800 manda usar no perfil laminado, na esbeltez
   * da alma (FLA, cortante e flambagem local da alma comprimida), e não o
   * `h` de cima. O raio de concordância não flamba: ele trava a borda da alma.
   */
  dLinha: number;

  /** Área bruta, cm². */
  A: number;
  /** Eixo X-X é o de MAIOR inércia (perpendicular à alma). */
  Ix: number; // cm⁴
  Wx: number; // cm³
  rx: number; // cm
  Zx: number; // cm³
  Iy: number; // cm⁴
  Wy: number; // cm³
  ry: number; // cm
  Zy: number; // cm³
  /** Raio de giração da mesa comprimida + 1/6 da alma, cm. Só informativo (W e HP). */
  rT?: number;
  /** Constante de torção (o "It" do catálogo brasileiro), cm⁴. */
  J: number;
  /** Constante de empenamento, cm⁶. */
  Cw: number;
  /** Só no padrão americano: de onde saíram J, Zx, Zy e Cw. */
  origem?: Origem;
  /**
   * Só no perfil SOLDADO: as chapas. A presença dele é o que diz que o perfil
   * é soldado — a mesa entra no grupo 5 da Tabela 4 (com kc), a FLM usa a
   * fórmula de soldado do D.2.8-f e a alma não tem raio de concordância.
   */
  soldado?: ChapasDoSoldado;

  /**
   * Marcado pela conferência do catálogo. Nos três casos de hoje a geometria
   * é boa e só a massa do NOME não fecha com a área — ver `duvida`.
   */
  confianca?: 'duvidoso';
  duvida?: string;
}

/**
 * Uma bitola de perfil U laminado (padrão americano, mesas inclinadas).
 *
 * ⚠️ DESENHO E SINAIS: alma vertical à esquerda, mesas para a direita (+x).
 * X é o eixo de simetria e o de maior inércia. O centro de torção fica do
 * lado de FORA da alma, a x0 do centroide — é ele que acopla a flambagem por
 * flexão em X com a torção (5.3.5.2).
 */
export interface PerfilU {
  familia: 'U';
  nome: string;
  massa: number;
  /** Altura, largura da mesa, espessuras: mm. tf é a espessura MÉDIA da mesa. */
  d: number;
  bf: number;
  tw: number;
  tf: number;
  /** Parte plana da alma, mm (d − 2c da Tabela A6.3). */
  dLinha: number;
  A: number;
  Ix: number;
  Wx: number;
  rx: number;
  Zx: number;
  Iy: number;
  /** Módulo resistente em Y do lado das pontas das mesas — o mínimo, cm³. */
  Wy: number;
  /** Módulo resistente em Y do lado da alma (Iy/xg), cm³. */
  WyAlma: number;
  ry: number;
  Zy: number;
  /** Do centroide à face externa da alma, cm. */
  xg: number;
  /** Do centroide ao centro de torção, cm (do lado da alma). */
  x0: number;
  J: number;
  Cw: number;
  origem: Origem;
  confianca?: 'duvidoso';
  duvida?: string;
}

/**
 * Uma bitola de cantoneira laminada, de abas iguais ou desiguais.
 *
 * ⚠️ DESENHO E EIXOS: vértice embaixo à esquerda, aba maior (b) subindo ao
 * longo de y, aba menor (bmenor) deitada ao longo de x — então Ix ≥ Iy, como
 * as tabelas publicam. Os eixos principais são u (maior inércia) e v (menor,
 * o do rmin); `alfa` é o ângulo de u com x, em radiano.
 */
export interface Cantoneira {
  familia: 'L';
  nome: string;
  massa: number;
  /** Aba maior, aba menor, espessura: mm. Nas de abas iguais, bmenor = b. */
  b: number;
  bmenor: number;
  t: number;
  A: number;
  Ix: number;
  Wx: number;
  rx: number;
  Iy: number;
  Wy: number;
  ry: number;
  /** Do centroide às faces externas da aba maior (xg) e da menor (yg), cm. */
  xg: number;
  yg: number;
  rmin: number;
  Iu: number;
  Iv: number;
  Ixy: number;
  alfa: number;
  /** Do centroide ao centro de torção (encontro das linhas médias), eixos x e y, cm. */
  x0: number;
  y0: number;
  J: number;
  Cw: number;
  origem: Origem;
  confianca?: 'duvidoso';
  duvida?: string;
}

export type Perfil = PerfilI | PerfilU | Cantoneira;

/**
 * Cantoneira simples de treliça ligada pelas pontas por UMA aba (5.3.5.4).
 * Escolher este caso é declarar as condições a), b) e c) do 5.3.5.4.1 —
 * carga pela mesma aba nas duas pontas, solda ou dois parafusos, nada
 * transversal no meio. As outras três a conta confere.
 */
export interface LigacaoPorUmaAba {
  /** Qual aba está presa à chapa de nó. */
  aba: 'maior' | 'menor';
  /** Treliça plana (5.3.5.4.2) ou espacial (5.3.5.4.3). */
  trelica: 'plana' | 'espacial';
}

/**
 * Os esforços solicitantes de cálculo numa seção, como o pórtico entrega.
 *
 * ⚠️ N POSITIVO COMPRIME — a convenção do A-PORT (decisão dele, 24/09/2026).
 * A planilha tinha dois campos (NtSd e NcSd); aqui é um só, com sinal, porque
 * é assim que o esforço sai da barra no pórtico.
 */
export interface Esforcos {
  /** Força normal, kN (+ comprime, − traciona). */
  N: number;
  /** Momento em torno do eixo X (forte), kN·cm. O sinal não importa. */
  Mx: number;
  /** Momento em torno do eixo Y (fraco), kN·cm. */
  My: number;
  /** Cortante na direção X (paralela às mesas), kN. */
  Vx: number;
  /** Cortante na direção Y (paralela à alma), kN. */
  Vy: number;
}

/**
 * Os comprimentos da barra, em cm. Zero quer dizer TRAVADA CONTINUAMENTE
 * naquela direção: a flambagem correspondente não acontece.
 */
export interface Comprimentos {
  /** Comprimento de flambagem por flexão em torno de X (K·L), cm. */
  Lx: number;
  /** Comprimento de flambagem por flexão em torno de Y, cm. */
  Ly: number;
  /**
   * Comprimento destravado à torção, cm: entra na flambagem por torção da
   * compressão (Lz) e na FLT da flexão (Lb) — como na planilha.
   */
  Lt: number;
  /** Fator de modificação para diagrama de momento não uniforme (≥ 1). */
  Cb: number;
  /** Distância entre enrijecedores transversais da alma, cm. Zero = sem enrijecedor. */
  a: number;
}

/**
 * Curvatura da barra no trecho destravado. Só pesa no I de mesas diferentes:
 * na simples, o sinal do Mx diz qual mesa está comprimida (Mx > 0 comprime a
 * de cima); na reversa, as duas mesas são verificadas (D.2.8-j).
 */
export type Curvatura = 'simples' | 'reversa';

/** Tudo o que a verificação de uma seção precisa. */
export interface EntradaDaVerificacao {
  perfil: Perfil;
  aco: Aco;
  esforcos: Esforcos;
  comprimentos: Comprimentos;
  /**
   * Só na cantoneira: presente quando ela é barra de treliça ligada por uma
   * aba (5.3.5.4). Aí Lx é o comprimento entre os pontos de trabalho.
   */
  ligacao?: LigacaoPorUmaAba;
  /** Só no I de mesas diferentes (sem o campo: simples). */
  curvatura?: Curvatura;
}

/** Como a planilha de referência agrupa os aços (coluna "Observações"). */
export type TipoDeAco = 'estrutural' | 'patinavel';

/**
 * Perfil laminado leva aço de PERFIL; perfil soldado leva aço de CHAPA
 * (Tabelas A.1 e A.2 separam os dois, com fy e fu às vezes diferentes).
 */
export type ProdutoDoAco = 'perfil' | 'chapa';

/** Um aço da lista de materiais. Tensões em kN/cm² (1 kN/cm² = 10 MPa). */
export interface Aco {
  nome: string;
  fy: number;
  fu: number;
  tipo: TipoDeAco;
  /** Sem o campo, é aço de perfil (a lista antiga inteira). */
  produto?: ProdutoDoAco;
  /** Só na chapa: a maior espessura que a faixa da tabela cobre, mm. */
  tMax?: number;
  /** Só na chapa: a menor espessura da faixa (exclusiva), mm. */
  tMin?: number;
  /** Quando o valor foi corrigido em relação à planilha, ou tem ressalva. */
  nota?: string;
}
