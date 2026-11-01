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

/** Série do perfil laminado de abas paralelas. HP é o perfil de pilar. */
export type SeriePerfilI = 'W' | 'HP';

/** Uma bitola de perfil I laminado, como o catálogo publica. */
export interface PerfilI {
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
  /** Raio de giração da mesa comprimida + 1/6 da alma, cm. Só informativo. */
  rT: number;
  /** Constante de torção (o "It" do catálogo brasileiro), cm⁴. */
  J: number;
  /** Constante de empenamento, cm⁶. */
  Cw: number;

  /**
   * Marcado pela conferência do catálogo. Nos três casos de hoje a geometria
   * é boa e só a massa do NOME não fecha com a área — ver `duvida`.
   */
  confianca?: 'duvidoso';
  duvida?: string;
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

/** Tudo o que a verificação de uma seção precisa. */
export interface EntradaDaVerificacao {
  perfil: PerfilI;
  aco: Aco;
  esforcos: Esforcos;
  comprimentos: Comprimentos;
}

/** Como a planilha de referência agrupa os aços (coluna "Observações"). */
export type TipoDeAco = 'estrutural' | 'patinavel';

/** Um aço da lista de materiais. Tensões em kN/cm² (1 kN/cm² = 10 MPa). */
export interface Aco {
  nome: string;
  fy: number;
  fu: number;
  tipo: TipoDeAco;
  /** Quando o valor foi corrigido em relação à planilha, ou tem ressalva. */
  nota?: string;
}
