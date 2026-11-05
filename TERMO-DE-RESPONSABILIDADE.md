# Termo de responsabilidade e de uso

**PLS Calc — perfis de aço laminados e soldados, ABNT NBR 8800:2024**

Ao instalar, abrir ou usar este programa, você declara que leu e aceita este termo.

## 1. Software experimental

Este é um **software experimental, de apoio à verificação** de barras de perfis de aço
laminados e soldados aos estados-limites últimos da ABNT NBR 8800:2024. Ele é uma
ferramenta de auxílio ao cálculo e **não substitui o projeto estrutural nem o julgamento
de um engenheiro habilitado**.

## 2. Responsabilidade final do engenheiro responsável

**A responsabilidade final por qualquer verificação, dimensionamento, memória de cálculo
ou projeto feito com o auxílio deste programa é exclusivamente do engenheiro responsável**,
legalmente habilitado, que o utiliza e assina o trabalho. Cabe a ele:

- conferir todos os dados de entrada — perfil ou chapas, aço, esforços solicitantes de
  cálculo, comprimentos de flambagem, fator Cb, curvatura e, na cantoneira de treliça, as
  condições declaradas;
- conferir os resultados e a memória de cálculo contra a norma vigente;
- verificar tudo o que este programa não verifica (item 4).

## 3. Sem garantia

O programa é fornecido **no estado em que se encontra**, gratuitamente, **sem garantia de
qualquer natureza**, expressa ou implícita — inclusive de exatidão dos resultados,
ausência de erros ou adequação a um fim específico. O autor não responde por danos de
qualquer espécie, diretos ou indiretos, decorrentes do uso ou da impossibilidade de uso do
programa ou de seus resultados.

## 4. O que o programa NÃO verifica

- As ligações, incluindo as soldas entre as chapas do perfil soldado.
- A ruptura da seção líquida e os furos na seção (dependem da ligação).
- Os efeitos locais de forças concentradas na alma e os enrijecedores.
- A viga mista, as barras compostas, os tubos e as seções caixão.
- Estados-limites de serviço (flechas, vibração).
- A análise estrutural e a estabilidade global: os esforços de entrada devem vir de uma
  análise adequada, com os efeitos de segunda ordem e as imperfeições quando aplicáveis.
- Situação de incêndio e fadiga.

## 5. Hipóteses adotadas

- Os esforços de entrada são os solicitantes de cálculo, já majorados.
- Os comprimentos de flambagem e o fator Cb são informados pelo usuário. Comprimento zero
  significa barra travada continuamente naquela direção. O Cb é o do item 5.4.2.3 sem o
  Rm; na curvatura reversa do perfil soldado de mesas diferentes, o programa aplica o Rm.
- No perfil soldado de mesas diferentes, momento fletor positivo em x comprime a mesa
  superior; com curvatura reversa, as duas mesas são verificadas contra o mesmo momento.
- Na cantoneira, a flexão e a força cortante seguem o AISC 360-22 (F10 e G3), que a
  NBR 8800:2024 não traz para cantoneira simples; a memória de cálculo diz isso.
- As propriedades do perfil soldado são calculadas pelas chapas, sem raio de concordância.

## 6. Normas e dados

- A norma ABNT NBR 8800:2024 **não acompanha este programa** e deve ser consultada na sua
  edição oficial. O programa apenas cita os itens e as expressões da norma.
- As dimensões dos perfis laminados seguem catálogos de fabricantes, e as dos perfis
  soldados CS, CVS e VS, a ABNT NBR 5884. Confira com o catálogo vigente do seu
  fornecedor.

## 7. Direitos e citação

O programa é de **José Barbalho** e é distribuído sob a licença MIT (arquivo `LICENSE`):
pode ser usado, copiado, modificado e redistribuído gratuitamente, **desde que o nome do
autor seja citado** — a nota de autoria e a licença devem acompanhar qualquer cópia ou
trabalho derivado do código.
