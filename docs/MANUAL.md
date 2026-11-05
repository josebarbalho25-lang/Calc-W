# PLS Calc — Manual do usuário

Perfis de aço laminados e soldados, pela ABNT NBR 8800:2024. Versão 0.1.0, novembro de 2026.

## O que a calculadora verifica e o que fica de fora

A PLS Calc (Perfil Laminado e Soldado, pela NBR 8800:2024) verifica uma barra isolada de perfil laminado ou soldado sob os esforços solicitantes de cálculo que o engenheiro informa: força normal, momentos fletores nos dois eixos e forças cortantes nos dois eixos, todos de uma mesma seção. Ela não faz análise estrutural. Os esforços vêm do modelo do engenheiro (SAP2000, TQS, A-PORT ou outro), já majorados e já com os efeitos de segunda ordem que a análise tiver considerado, e a calculadora devolve as resistências de cálculo, o índice de aproveitamento de cada estado-limite e a memória de cálculo completa.

### Perfis

Quatro famílias de perfis laminados, escolhidas de um catálogo:

- **I de abas paralelas, séries W e HP** (107 bitolas), da Tabela de Bitolas da Gerdau, revisão de novembro de 2018. É o mesmo catálogo do A-PORT.
- **I padrão americano, de abas inclinadas** (38 bitolas, de 3" a 20"), da Tabela A6.2 das Tabelas de Perfis Nacionais da UFPR.
- **U padrão americano, de abas inclinadas** (31 bitolas, de 3" a 15"), da Tabela A6.3 da mesma fonte, pelo catálogo do A-PORT.
- **Cantoneiras de abas iguais** (52 bitolas, catálogo Gerdau e Tabelas A6.4 e A6.5) e **de abas desiguais** (32 bitolas, Tabela A6.6).

E o perfil I soldado, de dois modos:

- **Do catálogo da ABNT NBR 5884**: as séries CS (coluna soldada, 100 bitolas), CVS (coluna e viga soldada, 82 bitolas) e VS (viga soldada, 90 bitolas), transcritas das Tabelas A8.1 a A8.3 da UFPR.
- **Por chapas**: o perfil soldado de chapas quaisquer, que a calculadora chama de PS, com a altura, a espessura da alma e as duas mesas digitadas. As mesas podem ser iguais ou diferentes; com mesas diferentes, a seção tem um eixo de simetria só, o plano da alma.

Nos perfis de abas inclinadas, a espessura da mesa do catálogo é a espessura média. As propriedades que as tabelas brasileiras não publicam (a constante de torção e os módulos plásticos de algumas bitolas, a constante de empenamento e a posição do centro de torção) foram obtidas como descreve o capítulo 7, e a origem de cada uma aparece na memória de cálculo. No perfil soldado, do catálogo ou por chapas, todas as propriedades são calculadas pelas chapas, sem raio de concordância.

### Aços

O perfil laminado leva aço de perfil, e o soldado, aço de chapa, porque a norma dá resistências diferentes para os dois produtos.

- **Aços de perfil**: ASTM A36, A572 graus 42, 50 e 60, A992, A588, A242 nos três grupos de espessura e ABNT MR250, com as resistências das Tabelas A.1 e A.2 da norma.
- **Aços de chapa**: os "chapas e barras" da Tabela A.2 (ASTM A36, A572 graus 42 a 65, A242 e A588) e as chapas grossas da Tabela A.1 (ABNT NBR 6648, graus CG-26 e CG-28; ABNT NBR 5000, graus G-30 a G-45; ABNT NBR 5008, graus CGR 400 e CGR 500). Na chapa, a resistência ao escoamento cai com a espessura, e cada faixa da tabela é um aço da lista; a calculadora confere a chapa mais grossa do perfil contra a faixa escolhida.

ASTM é a American Society for Testing and Materials, que especifica esses aços. O módulo de elasticidade é 20 000 kN/cm² e o módulo de elasticidade transversal, 7 700 kN/cm².

### Estados-limites verificados

| Verificação | Item da norma |
| --- | --- |
| Tração: escoamento da seção bruta | 5.2.2-a |
| Compressão: flambagem por flexão, por torção ou por flexo-torção, com a área efetiva da flambagem local | 5.3 |
| Flexão em torno de X e de Y: flambagem local da mesa (FLM), flambagem local da alma (FLA) e flambagem lateral com torção (FLT) | 5.4.2 e Anexo D |
| Viga soldada de alma esbelta: escoamento da mesa tracionada, FLT e FLM | Anexo E |
| Força cortante nas duas direções | 5.4.3 |
| Força axial com momentos fletores | 5.5.1.2 |
| Cantoneira simples: momento fletor e força cortante | AISC 360-22, F10 e G3 |

### A norma e a edição

A norma é a ABNT NBR 8800:2024, com a Errata 1 de fevereiro de 2025. Nenhuma fórmula vem de outra edição. A única exceção é a cantoneira simples sob momento fletor ou força cortante: a NBR 8800:2024 não traz essas resistências (o item 5.4.1.1 não lista a cantoneira simples, e o 5.4.3.4 trata só da dupla cantoneira em T). Para esse caso, a resistência nominal vem da especificação AISC 360-22, do American Institute of Steel Construction, e é dividida pelo coeficiente de ponderação γ<sub>a1</sub> da NBR; a memória de cálculo diz isso em cada passo.

### O que fica de fora nesta versão

Ficam de fora: a ruptura da seção líquida efetiva na tração (depende da furação e da ligação, que a seção sozinha não conhece); as ligações, inclusive as soldas entre as chapas do perfil soldado; os estados-limites de serviço; a força cortante nas duas direções simultaneamente (5.5.2.3); os tubos, as seções caixão e a dupla cantoneira em T. Nas cantoneiras de abas desiguais, a flambagem lateral com torção em torno do eixo de maior inércia depende de uma propriedade (β<sub>w</sub>) que está no Comentário do AISC 360-22; até ele entrar, essa verificação aparece como "Avaliar".

## Como instalar e abrir

A PLS Calc pode ser instalada como um programa do Windows, pelo instalador, ou aberta no navegador a partir do código, pelo GitHub. As contas e a memória de cálculo são as mesmas nos dois caminhos.

### Com o instalador

O instalador, `PLS Calc Setup 0.1.0.exe`, é baixado do site proestruturas3d.com.br ou da página do projeto no GitHub (github.com/josebarbalho25-lang/PLS-Calc). Ele funciona no Windows 10 ou 11 e não precisa de internet depois de baixado.

1. Dê dois cliques no instalador. Como ele não tem assinatura digital, o Windows pode mostrar o aviso "O Windows protegeu o computador"; clique em "Mais informações" e depois em "Executar assim mesmo".
2. A primeira tela mostra o termo de responsabilidade, que precisa ser aceito para seguir.
3. A instalação é por usuário, na pasta do próprio usuário, e não pede senha de administrador. Ela cria atalhos no menu Iniciar e na área de trabalho.

O programa abre numa janela própria, sem servidor e sem navegador. O PDF da memória sai pelo próprio programa, e a caixa "Salvar como" é a do Windows. A desinstalação, pelo "Adicionar ou remover programas" do Windows, apaga também o que o programa guarda (a última entrada, o tema e o projetista). A PLS Calc e a PFF Calc, a calculadora irmã de perfis formados a frio, convivem instaladas na mesma máquina.

### Sem o instalador, pelo GitHub

A calculadora também roda no navegador, servida pela própria máquina. São necessários o Windows 10 ou 11, o Microsoft Edge (que já vem com o Windows e é quem imprime o PDF) e o Node.js na versão LTS, 20.19 ou mais recente, baixado em nodejs.org.

1. Baixe o código do GitHub (github.com/josebarbalho25-lang/PLS-Calc), copie a pasta para o computador e dê dois cliques em `ABRIR.bat`.
2. Na primeira vez, o arquivo mostra o resumo do termo de responsabilidade e pede o aceite. Em seguida instala as bibliotecas, o que precisa de internet e leva alguns minutos.
3. O navegador abre sozinho em `http://localhost:5180`. A janela preta que fica aberta é o servidor da calculadora: enquanto ela estiver aberta, a calculadora funciona. Para encerrar, basta fechá-la.

Nos dois caminhos, a última entrada fica guardada, e a calculadora reabre no ponto em que parou. O tema da tela (escuro, claro ou papel) troca pela engrenagem do canto superior direito e também fica guardado.

### Termo de responsabilidade

A calculadora é uma ferramenta de apoio ao projeto, distribuída sem garantia de qualquer natureza. A responsabilidade pela concepção estrutural, pela obtenção dos esforços, pela escolha das hipóteses e pela verificação final é do engenheiro que assina o projeto. A memória de cálculo mostra cada fórmula com os números substituídos justamente para que o engenheiro confira o resultado antes de assiná-lo. O texto completo está no arquivo `TERMO-DE-RESPONSABILIDADE.md`, na pasta da calculadora, e é o mesmo da tela de aceite do instalador.

## A tela, campo por campo

![A tela principal: entradas à esquerda; seção, propriedades e aproveitamento à direita](imagens/tela-W.png)

A coluna da esquerda reúne as entradas. A da direita mostra a seção desenhada em escala e cotada, a lista de propriedades geométricas e o quadro de aproveitamento, em que cada linha abre as contas daquela verificação. A barra superior mostra o nome do perfil e do aço, a situação geral e o maior índice de aproveitamento; a barra de estado, embaixo, mostra a verificação que governa e, à direita, o endereço do site do autor, que abre no navegador.

### Configuração (a engrenagem)

A engrenagem do canto superior direito abre um painel pequeno com duas partes:

- **Tema**: escuro, claro ou papel. A troca vale para a tela inteira, inclusive o desenho e as janelas animadas; a memória de cálculo em PDF não muda.
- **Projetista**: nome, título (por exemplo, "Engenheiro Civil") e número do CREA, o Conselho Regional de Engenharia e Agronomia. Os três vão para o carimbo da capa e para o bloco de assinatura da memória de cálculo.

Tudo fica guardado na máquina e grava na hora, sem botão de salvar. O painel fecha com Esc ou com um clique fora dele.

![O painel da engrenagem: tema e projetista](imagens/configuracao.png)

![O tema escuro, o de fábrica. As outras telas deste manual estão no tema papel, mais leve para imprimir.](imagens/tema-escuro.png)

### Perfil

O bloco do perfil tem duas abas: **Catálogo** e **Chapas**.

No catálogo, o campo do perfil é uma busca. Digitar "310" mostra todos os W 310; "38,7" procura pela massa; "hp" mostra os perfis de pilar; "u203" mostra os U de 8"; "l3x3" mostra as cantoneiras de 3"; "vs500" mostra primeiro os VS 500 e depois os CVS 500. A busca ignora maiúsculas, espaços, aspas e traços, e aceita vírgula ou ponto decimal. As setas percorrem a lista, Enter escolhe e Esc fecha sem mudar.

Em chapas, entram a altura total d, a espessura da alma t<sub>w</sub> e as mesas, todas em milímetros. Com "Mesas: Iguais", basta uma largura b<sub>f</sub> e uma espessura t<sub>f</sub>; com "Mesas: Diferentes", entram a mesa superior (b<sub>fs</sub>, t<sub>fs</sub>) e a inferior (b<sub>fi</sub>, t<sub>fi</sub>). O nome do perfil se monta sozinho, como "PS 600 x 250/150 x 16/12,5 x 8" (altura, larguras, espessuras das mesas e da alma). As chapas digitadas ficam guardadas mesmo quando se volta ao catálogo.

No U, na cantoneira e no I de mesas diferentes, o desenho mostra também o centroide (G) e o centro de torção (CT), porque nessas seções os dois não coincidem e é a distância entre eles que acopla a flexão à torção na compressão. Na cantoneira aparecem ainda os eixos principais de inércia: u, o de maior inércia, e v, o de menor, que é o do raio de giração mínimo.

![Perfil soldado de mesas diferentes, por chapas: o centroide sobe para a mesa maior, e o centro de torção fica perto dela](imagens/tela-soldado.png)

![U 203,2 x 17,1: o centro de torção fica do lado de fora da alma](imagens/tela-U.png)

### Aço

A lista de aços mostra, ao lado, a resistência ao escoamento (f<sub>y</sub>) e a resistência à ruptura (f<sub>u</sub>), em kN/cm². No perfil laminado ela traz os aços de perfil; no soldado, os de chapa, com as faixas de espessura que não servem para as chapas do perfil apagadas. A calculadora guarda as duas escolhas, a do laminado e a do soldado, e cada família volta com o seu aço.

### Barra (só na cantoneira)

Na cantoneira aparece um bloco a mais, com três escolhas:

- **Comprimida pelo centroide.** A força normal passa pelo centroide, e a flambagem global sai dos itens 5.3.5.2 (abas iguais) ou 5.3.5.3 (abas desiguais), nos eixos principais.
- **Treliça plana, ligada por uma aba** e **treliça espacial, ligada por uma aba.** É o caso do item 5.3.5.4: a excentricidade da ligação entra por um comprimento equivalente. Escolher essa opção é declarar as condições a), b) e c) do item 5.3.5.4.1 (carga aplicada pela mesma aba nas duas extremidades, ligação por solda ou por pelo menos dois parafusos, nenhuma ação transversal intermediária). As condições d), e) e f) a calculadora confere sozinha. Na cantoneira de abas desiguais, escolhe-se também qual aba está ligada.

![Cantoneira de abas desiguais de treliça espacial, ligada pela aba menor](imagens/tela-L-trelica.png)

### Esforços solicitantes de cálculo

Os esforços são os de cálculo, já majorados, de uma única seção da barra.

- **N<sub>Sd</sub>**, em kN. **Positivo comprime, negativo traciona**, a mesma convenção do A-PORT.
- **M<sub>x,Sd</sub>**, em kN·cm, momento em torno do eixo X, que é o eixo de maior inércia, perpendicular à alma. É o momento do plano da alma.
- **M<sub>y,Sd</sub>**, em kN·cm, momento em torno do eixo Y, o de menor inércia, paralelo à alma. É o momento do plano das mesas.
- **V<sub>x,Sd</sub>**, em kN, força cortante na direção X, paralela às mesas.
- **V<sub>y,Sd</sub>**, em kN, força cortante na direção Y, paralela à alma.

No perfil I de mesas iguais o sinal dos momentos não muda a verificação. No **I de mesas diferentes**, o sinal de M<sub>x</sub> diz qual mesa está comprimida: **M<sub>x</sub> positivo comprime a mesa superior**, e negativo, a inferior. No U, o sinal de M<sub>y</sub> importa: M<sub>y</sub> positivo comprime as pontas das mesas, e o estado-limite é a flambagem local da mesa; M<sub>y</sub> negativo comprime a alma, e o estado-limite é a flambagem local da alma (D.2.8-c). Na cantoneira, M<sub>x</sub> e M<sub>y</sub> são informados nos eixos das abas (x paralelo à aba menor, deitada; y paralelo à aba maior, de pé) e a calculadora os gira para os eixos principais; M<sub>x</sub> positivo comprime o lado de cima, e M<sub>y</sub> positivo comprime o lado direito.

### Comprimentos destravados

Todos os comprimentos são em centímetros.

- **L<sub>x</sub>** e **L<sub>y</sub>**: comprimentos destravados associados à flambagem por flexão em torno de X e de Y. A edição de 2024 não usa mais o coeficiente K: o comprimento é o trecho entre contenções (5.3.5.1), e o efeito global da estrutura deslocável vem da análise de segunda ordem (4.10). Na cantoneira, L<sub>x</sub> e L<sub>y</sub> vão para o eixo principal mais próximo; nas de abas iguais, cujos eixos principais ficam a 45°, os dois eixos recebem o maior dos dois comprimentos.
- **L<sub>t</sub>**: comprimento destravado à torção. É o L<sub>z</sub> da compressão e também o L<sub>b</sub> da flambagem lateral com torção.
- **C<sub>b</sub>**: fator de modificação para diagrama de momento fletor não uniforme (5.4.2.3), igual ou maior que 1,0, **sem o parâmetro de monossimetria R<sub>m</sub>**. A janela do (?) calcula o C<sub>b</sub> a partir do diagrama.
- **Curvatura** (só no I de mesas diferentes): **simples**, quando o momento não troca de sinal no trecho destravado, ou **reversa**, quando troca. Na curvatura reversa as duas mesas ficam comprimidas em algum ponto do trecho, e a calculadora verifica as duas contra o mesmo M<sub>x</sub> (D.2.8-j), com o C<sub>b</sub> multiplicado pelo R<sub>m</sub> do item 5.4.2.3.
- **a**: distância entre enrijecedores transversais da alma, usada no cortante (5.4.3.1) e no limite de esbeltez da alma da viga soldada (E.5.3). Não aparece na cantoneira.
- **L<sub>x1</sub>** (só na cantoneira de treliça): comprimento da cantoneira entre os pontos de trabalho nos eixos das cordas. Na cantoneira de treliça os outros comprimentos não aparecem.

**O zero de cada campo.** Zero em L<sub>x</sub>, L<sub>y</sub> ou L<sub>t</sub> quer dizer barra travada continuamente naquela direção, e a flambagem correspondente não acontece. Zero em a quer dizer sem enrijecedores. Há uma exceção: na cantoneira, a flambagem por torção não depende do comprimento (a constante de empenamento é desprezada), e por isso o zero em L<sub>t</sub> não retira a flexo-torção; ele só retira a flambagem lateral com torção da flexão. O L<sub>x1</sub> da cantoneira de treliça não aceita zero.

Um campo com número que não faz sentido acende em vermelho e volta ao valor anterior: comprimento negativo, C<sub>b</sub> menor que 1, ou um número ambíguo como "12.500" (que pode ser doze mil e quinhentos ou doze e meio). "12,5", "12.5" e "1.234,5" são aceitos.

## Como cada verificação é feita

Cada verificação é uma linha do quadro de aproveitamento. A conta inteira, com a fórmula, os números substituídos e o item da norma, abre ao clicar na linha e vai para a memória de cálculo.

### Tração (5.2)

A força de tração resistente de cálculo é a do escoamento da seção bruta, N<sub>t,Rd</sub> = A<sub>g</sub>·f<sub>y</sub>/γ<sub>a1</sub>. A ruptura da seção líquida efetiva (5.2.2-b) depende dos furos e da ligação e não é verificada; a memória diz isso. A esbeltez acima de 300 (5.2.8.1) acende "Avaliar", porque o limite é uma recomendação.

Na cantoneira declarada como ligada por uma aba e tracionada, a verificação sai "Avaliar", porque nessa ligação a ruptura da seção líquida quase sempre governa. A memória mostra o produto mínimo C<sub>t</sub>·A<sub>n</sub> que a ligação precisa ter: (C<sub>t</sub>·A<sub>n</sub>)<sub>mín</sub> = N<sub>t,Sd</sub>·γ<sub>a2</sub>/f<sub>u</sub>, com γ<sub>a2</sub> = 1,35.

### Compressão (5.3)

A força axial resistente é N<sub>c,Rd</sub> = χ·A<sub>ef</sub>·f<sub>y</sub>/γ<sub>a1</sub> (5.3.2). O fator χ sai do índice de esbeltez reduzido λ<sub>0</sub>, calculado com a área bruta (5.3.3), e a flambagem local entra pela área efetiva da edição de 2024 (5.3.4), em que a largura efetiva de cada chapa depende do próprio χ. As chapas são as da Tabela 4:

- **Perfil I laminado**: as quatro meias mesas (grupo 4) e a alma (grupo 2).
- **Perfil I soldado**: as meias mesas no **grupo 5**, com (b/t)<sub>lim</sub> = 0,64·√(E/(f<sub>y</sub>/k<sub>c</sub>)) e k<sub>c</sub> = 4/√(h/t<sub>w</sub>), entre 0,35 e 0,76 (nota a da Tabela 4). O k<sub>c</sub> desconta a menor rigidez com que a alma fina do soldado segura a borda da mesa. Com mesas diferentes, cada mesa é uma chapa, com as suas duas metades. A alma fica no grupo 2, com h igual à distância entre as faces internas das mesas.
- **U**: as duas mesas inteiras (grupo 4) e a alma (grupo 2).
- **Cantoneira**: as duas abas (grupo 3).

A largura efetiva nunca é tomada maior que a largura da chapa.

A força axial de flambagem elástica N<sub>e</sub> depende da família:

- **Perfil I** (dupla simetria): o menor entre a flambagem por flexão em X, por flexão em Y e por torção (5.3.5.1).
- **Perfil I soldado de mesas diferentes** (simétrico em relação a Y): o menor entre a flambagem por flexão em X e a flexo-torção, que acopla a flexão em Y à torção pela distância y<sub>0</sub> entre o centroide e o centro de torção (5.3.5.2). O centro de torção fica entre as mesas, mais perto da mais rígida.
- **U** (simétrico em relação a X): o menor entre a flambagem por flexão em Y e a flexo-torção, que acopla a flexão em X à torção pela distância x<sub>0</sub> entre o centroide e o centro de torção (5.3.5.2, com a troca de índices do final do item).
- **Cantoneira de abas iguais** (simétrica em relação ao eixo principal u): o menor entre a flambagem por flexão em v e a flexo-torção em u (5.3.5.2, nos eixos principais).
- **Cantoneira de abas desiguais** (sem simetria): a menor raiz da equação cúbica do 5.3.5.3, nos eixos principais. Quando L<sub>x</sub> e L<sub>y</sub> são diferentes, a calculadora confere também a flexão em torno do eixo da aba que tem o comprimento maior, acoplada à torção, e fica com o menor dos dois.
- **Cantoneira de treliça ligada por uma aba**: o comprimento equivalente L<sub>x1,eq</sub> do 5.3.5.4.2 (treliça plana) ou do 5.3.5.4.3 (treliça espacial), com os pisos para a desigual ligada pela aba menor. Quando a relação entre largura e espessura da aba passa de 0,71√(E/f<sub>y</sub>), a flexo-torção também é verificada (5.3.5.4.4) e vale o menor. Fora das condições d) ou e), a barra deixa de ser tratada pelo comprimento equivalente: a conta segue pelo centroide e a verificação sai "Avaliar", porque o momento da excentricidade fica por conta do engenheiro (5.3.5.4.5).

A esbeltez acima de 200 (5.3.7.1) acende "Avaliar".

### Flexão (5.4.2 e Anexo D)

O momento resistente de cálculo é o menor entre os estados-limites aplicáveis e o teto de 1,50·W·f<sub>y</sub>/γ<sub>a1</sub> do item 5.4.2.2, em que W é o módulo resistente elástico mínimo da seção.

- **Perfil I e U em torno de X**: flambagem local da mesa comprimida (FLM), flambagem local da alma (FLA) e flambagem lateral com torção (FLT), pela Tabela D.1. No U, a relação largura-espessura da mesa é tomada com a largura total da mesa (D.2.8-h), a constante de empenamento é a da fórmula própria do U (D.2.8-a), e vale a premissa do item 5.4.1.2: a carga transversal passa pelo centro de torção, ou a torção está impedida.
- **Perfil I soldado**: a FLM é a de perfil soldado do D.2.8-f, nos dois eixos: λ<sub>r</sub> = 0,95·√(E/((f<sub>y</sub> − σ<sub>r</sub>)/k<sub>c</sub>)) e M<sub>cr</sub> = 0,90·E·k<sub>c</sub>·W<sub>c</sub>/λ², com a tensão residual σ<sub>r</sub> = 0,30·f<sub>y</sub> (D.2.8-e). Em mesa esbelta ela dá menos que a fórmula de laminado.
- **Perfil I em torno de Y**: só a flambagem local da mesa; com mesas diferentes, a da mesa de relação largura-espessura maior.
- **U em torno de Y**: pelo sinal do momento. Com as pontas das mesas comprimidas, a flambagem local da mesa; com a alma comprimida, a flambagem local da alma do D.2.8-c e -d, com o módulo resistente efetivo da alma.

**A flambagem lateral com torção é calculada pelos dois caminhos do item D.2.1** (o clássico, com λ entre λ<sub>p</sub> e λ<sub>r</sub>, e o alternativo, com o fator χ<sub>FLT</sub>), **e vale o maior**. A memória mostra os dois. O C<sub>b</sub> da edição de 2024 entra só no λ<sub>r</sub> e no momento crítico, e não mais multiplicando o trecho inelástico.

Na **cantoneira simples**, a flexão segue o capítulo F10 do AISC 360-22, sempre nos eixos principais: o escoamento (F10-1), a flambagem lateral com torção em torno do eixo u (F10-2 a F10-4, com C<sub>b</sub> limitado a 1,5) e a flambagem local da aba cuja ponta está comprimida (F10-6 a F10-8). L<sub>t</sub> igual a zero retira a flambagem lateral com torção. Na cantoneira de abas desiguais, a flambagem lateral com torção em torno de u aparece como "Avaliar" até a fórmula do β<sub>w</sub> entrar na calculadora.

![Cantoneira de 3" com momento: a flexão em u e em v pelo AISC 360-22](imagens/tela-L-flexao.png)

### Perfil soldado de mesas diferentes (Tabela D.1, D.2.8-b, -i e -j)

Com mesas diferentes, quase tudo depende de qual mesa está comprimida, e a calculadora monta a seção vista por ela: os módulos resistentes do lado comprimido (W<sub>c</sub>) e do tracionado (W<sub>t</sub>); h<sub>c</sub>, duas vezes a distância do centroide à face interna da mesa comprimida; h<sub>p</sub>, o mesmo a partir da linha neutra plástica; e a seção T formada pela mesa comprimida e pela parte comprimida da alma, com o raio de giração r<sub>yTc</sub> e a relação α<sub>y</sub> = I<sub>yTc</sub>/I<sub>y</sub>. Pela linha da Tabela D.1 das seções I com um eixo de simetria:

- **FLT**: λ = L<sub>b</sub>/r<sub>yTc</sub>, com λ<sub>r</sub> e M<sub>cr</sub> do D.2.8-b, que levam os parâmetros β<sub>1</sub>, β<sub>2</sub> e β<sub>3</sub> e a constante de empenamento da seção monossimétrica. O momento do início do escoamento é M<sub>r</sub> = (f<sub>y</sub> − σ<sub>r</sub>)·W<sub>c</sub>, sem passar de f<sub>y</sub>·W<sub>t</sub> (D.2.8-e). Os dois caminhos do D.2.1 valem também aqui.
- **FLM**: a da mesa comprimida, com W<sub>c</sub>.
- **FLA**: λ = h<sub>c</sub>/t<sub>w</sub>, com λ<sub>p</sub> = (h<sub>c</sub>/h<sub>p</sub>)·√(E/f<sub>y</sub>)/(0,54·M<sub>pl</sub>/M<sub>r</sub> − 0,09)², limitado a λ<sub>r</sub>.

Fora dos limites do D.2.8-i (0,1 ≤ α<sub>y</sub> ≤ 0,9, e a mesa menor com a alma somando mais área que a mesa maior), a conta sai, mas a verificação fica "Avaliar", porque a Tabela D.1 não cobre a seção. Na curvatura simples, o sinal de M<sub>x</sub> escolhe a mesa; na reversa, as duas mesas são verificadas contra o mesmo M<sub>x</sub>, com o C<sub>b</sub> multiplicado por R<sub>m</sub> = 0,5 + 2·(I<sub>y,m</sub>/I<sub>y</sub>)², em que I<sub>y,m</sub> é a inércia da mesa menor, e vale a pior das duas (D.2.8-j).

![Mesas diferentes com curvatura reversa: as duas mesas verificadas, e a menor governa](imagens/tela-soldado-reversa.png)

### Viga soldada de alma esbelta (Anexo E)

Quando a esbeltez da alma passa de 5,70·√(E/f<sub>y</sub>) (λ da flambagem local da alma: h/t<sub>w</sub>, ou h<sub>c</sub>/t<sub>w</sub> com mesas diferentes), a viga é de alma esbelta, e o momento resistente sai do Anexo E: o menor entre o escoamento da mesa tracionada (E.6.1), a flambagem lateral com torção (E.6.2, com λ = L<sub>b</sub>/r<sub>yc</sub>, em que r<sub>yc</sub> é o raio de giração da mesa comprimida com um terço da altura comprimida da alma) e a flambagem local da mesa comprimida (E.6.3). Os dois últimos levam o fator k<sub>pg</sub>, que reduz o momento pela flambagem da alma esbelta:

k<sub>pg</sub> = 1 − a<sub>r</sub>/(1200 + 300·a<sub>r</sub>)·(h<sub>c</sub>/t<sub>w</sub> − 5,70·√(E/f<sub>y</sub>)) ≤ 1,0, com a<sub>r</sub> = h<sub>c</sub>·t<sub>w</sub>/A<sub>fc</sub> ≤ 10.

O item E.5.3 limita a esbeltez da alma: h/t<sub>w</sub> não pode passar de 260, nem de 11,7·√(E/f<sub>y</sub>) com enrijecedores transversais a cada a ≤ 1,5·h, nem de 0,42·E/f<sub>y</sub> sem enrijecedores ou com a/h > 1,5. Acima disso, a norma não admite a viga: a flexão sai "Não atende" e sem número, e a interação também. Esse limite vale para a seção inteira, qualquer que seja o anexo que calcula o momento.

![Viga soldada de alma esbelta pelo Anexo E](imagens/tela-anexo-E.png)

### Força cortante (5.4.3)

- **Na direção Y**, paralela à alma, resiste a alma (5.4.3.1): a área de cisalhamento é d·t<sub>w</sub> e a esbeltez é h/t<sub>w</sub>, com h igual à altura plana da alma no laminado e à distância entre as faces internas das mesas no soldado. O coeficiente k<sub>v</sub> vale 5,34 sem enrijecedores ou com a/h maior que 3, e 5 + 5/(a/h)² nos demais casos.
- **Na direção X**, paralela às mesas, resistem as duas mesas (5.4.3.5), com k<sub>v</sub> = 1,2: a esbeltez usa metade da largura da mesa no perfil I e a largura total no U. Com mesas diferentes, a área é a soma das duas mesas, e a esbeltez, a da mesa de relação largura-espessura maior.
- **Na cantoneira**, resiste a aba paralela à força (AISC 360-22, G3), com k<sub>v</sub> = 1,2.

O coeficiente γ<sub>a1</sub> entra uma única vez, sobre a força cortante de plastificação.

### Esforços combinados (5.5.1.2)

A interação usa a resistência axial que se aplica (de tração ou de compressão, conforme o sinal de N) e os dois momentos em valor absoluto, pelas alíneas a) e b) do item 5.5.1.2. Na cantoneira, os momentos entram nos eixos principais u e v, porque é assim que o item 5.3.5.4.5 manda tratar a cantoneira com força transversal.

### Decisões onde a norma é omissa ou admite mais de uma leitura

- **A força cortante leva o γ<sub>a1</sub> uma única vez, e a flexão em Y respeita o teto de 1,50·W·f<sub>y</sub>** (5.4.2.2), mesmo onde planilhas de uso corrente fazem diferente.
- **Flambagem lateral com torção pelos dois caminhos do D.2.1, valendo o maior**, também na seção monossimétrica.
- **Os comprimentos já são destravados**, sem o coeficiente K, como no texto de 2024.
- **A largura efetiva nunca passa da largura da chapa.** Logo acima do limite, as constantes arredondadas da Tabela 5 dariam uma largura efetiva até 0,16 % maior que a chapa.
- **No item 5.3.5.4.3, alínea b)**, vale a Errata 1: "maior que 75", e não "menor ou igual a 75", como saiu impresso.
- **Cantoneira**: eixos principais pelo raio de giração mínimo publicado; centro de torção no encontro das linhas médias das abas; constante de empenamento desprezada; flexo-torção sempre presente; momento e cortante pelo AISC 360-22, divididos pelo γ<sub>a1</sub> da NBR.
- **Propriedades estimadas**: a constante de torção e os módulos plásticos que nenhuma tabela publica foram estimados a partir do perfil americano mais parecido, como descreve o capítulo 7.
- **Perfil soldado**: a constante de torção é J = Σ b·t³/3, com as mesas inteiras e a alma entre as faces internas das mesas, sem a correção das pontas livres das mesas. É a convenção das tabelas da NBR 5884 (diferença média de −0,01 % nos 272 perfis) e do exemplo do manual "Uso Fácil"; com a correção, o J sairia 3,4 % menor. Na mesa de soldado, b é a metade da largura da mesa (D.2.8-h e figura do grupo 5).
- **O C<sub>b</sub> de entrada é sem o R<sub>m</sub>**: na curvatura reversa do perfil de mesas diferentes, a calculadora multiplica pelo R<sub>m</sub> e mostra a conta. Um C<sub>b</sub> digitado já com o R<sub>m</sub> teria o R<sub>m</sub> aplicado duas vezes.
- **Viga de alma esbelta**: o Anexo E é escolhido pela esbeltez da flambagem local da alma da Tabela D.1 (h<sub>c</sub>/t<sub>w</sub>); o limite de h/t<sub>w</sub> do E.5.3 vale para a seção inteira; a tensão residual do Anexo E é a mesma 0,30·f<sub>y</sub> do D.2.8-e; e, sem enrijecedores, a/h é tomado como infinito. Na fronteira entre os anexos, o momento resistente cai alguns por cento, porque o Anexo E não usa a constante de torção na flambagem lateral com torção; a queda é da própria norma.

### O que quer dizer "Avaliar"

"Atende" e "Não atende" saem da razão entre o solicitante e o resistente. "Avaliar" quer dizer que a conta precisa do olho do engenheiro: um limite que é recomendação (a esbeltez), uma condição que a calculadora não pode conferir (a ligação por uma aba sob tração), uma seção fora dos limites de aplicação da norma (o D.2.8-i) ou uma resistência que ela ainda não calcula. O aviso que explica o motivo aparece na própria verificação e na memória.

## As janelas do (?)

Cada esforço e cada comprimento tem um botão (?) que abre uma janela animada, com os números da verificação aberta ao lado. As abas no alto da janela trocam entre os esforços (N, M<sub>x</sub>, M<sub>y</sub>, V<sub>x</sub>, V<sub>y</sub>) ou entre os comprimentos (L<sub>x</sub>, L<sub>y</sub>, L<sub>t</sub>, C<sub>b</sub>, a).

![A janela de M<sub>x</sub>: o plano da alma aceso e o momento girando em torno de X](imagens/janela-Mx.png)

![A janela do C<sub>b</sub>: o diagrama com as seções A, B e C](imagens/janela-Cb.png)

- **Esforços (N, M<sub>x</sub>, M<sub>y</sub>, V<sub>x</sub>, V<sub>y</sub>).** Um pedaço do perfil em balanço, com a face do corte na ponta, os eixos X e Y desenhados no corte e a seta do esforço animada. M<sub>x</sub> e V<sub>y</sub> agem no plano da alma; M<sub>y</sub> e V<sub>x</sub>, no plano das mesas.
- **L<sub>x</sub> e L<sub>y</sub>.** O pilar flambando em torno do eixo correspondente, sem contenção ou com uma contenção no meio, para mostrar o que é o comprimento destravado.
- **L<sub>t</sub>.** A viga em flambagem lateral com torção, com contenção nas pontas, contenção no meio ou contenção contínua (laje), e os números da flambagem lateral com torção pelos dois caminhos. No perfil de mesas diferentes, acende a mesa que a calculadora verificou como comprimida, e o C<sub>b</sub> mostrado é o usado na conta, já com o R<sub>m</sub> na curvatura reversa; na viga de alma esbelta, mostra o raio de giração r<sub>yc</sub> do Anexo E.
- **C<sub>b</sub>.** O diagrama de momento do trecho destravado com as seções A, B e C da fórmula, para carga distribuída, carga concentrada no meio, momentos nas extremidades (com a relação ψ entre eles) e balanço. O botão "Usar C<sub>b</sub>" leva o valor calculado, sem o R<sub>m</sub>, para a entrada. Na curvatura reversa do perfil de mesas diferentes, a janela mostra também o R<sub>m</sub> da verificação.
- **a.** A alma com e sem enrijecedores transversais, e os números do cortante na direção Y.

Na cantoneira, a janela de L<sub>x</sub> mostra os números dos eixos principais (os comprimentos, as esbeltezes e as forças de flambagem em u e em v) ou, na de treliça, o comprimento equivalente.

## A memória de cálculo e o PDF

O botão "Memória de cálculo completa" abre a memória na tela, e "Exportar relatório PDF" grava o arquivo: no navegador, impresso pelo Edge; no programa instalado, pelo próprio programa. Os campos do carimbo (obra, cliente, elemento, documento, revisão e empresa) ficam guardados na máquina e entram no cabeçalho, na capa e no nome do arquivo. Quem assina não fica no carimbo: o nome, o título e o CREA vêm do projetista da engrenagem, num lugar só para todas as obras, e entram no carimbo da capa e no bloco de assinatura das conclusões. Com o projetista em branco, a memória sai com o espaço em branco para a assinatura à mão.

![A memória de cálculo na tela](imagens/memoria.png)

A memória segue o molde do relatório do A-PORT, em folha A4:

1. a capa, com o resumo dos resultados, a situação geral e o carimbo;
2. as premissas: norma e coeficientes, aço, a seção desenhada com a tabela de propriedades e a origem das que não são publicadas, os esforços, os comprimentos e, no perfil de mesas diferentes, a curvatura;
3. um capítulo por verificação, com o item da norma à esquerda e, à direita, cada conta escrita três vezes: a fórmula com as letras, a fórmula com os números e o resultado;
4. as conclusões, com o que não foi verificado e a assinatura;
5. o glossário, só com os símbolos que aquela memória escreve.

A conta e o texto da memória saem da mesma linha de cálculo: não existe uma memória refeita à parte, e o número impresso é o mesmo que a tela mostra.

## Como a calculadora foi conferida

A calculadora foi conferida contra fontes independentes dela, que aqui chamamos de oráculos: exemplos resolvidos publicados, contas refeitas às cegas a partir da norma e uma conta à mão com as fórmulas do AISC 360-22. Cada tabela abaixo traz o perfil, a grandeza, o valor da calculadora, o valor do oráculo, a diferença em porcentagem e, quando ela passa de 0,5 %, a causa. Todas essas comparações estão gravadas como testes automáticos: uma mudança no programa que altere um desses números é recusada.

### Exemplos resolvidos do manual "Uso Fácil"

O exemplo 6.7 do manual "Uso Fácil — ABNT NBR 8800" (revisão 3) verifica uma viga W 410 x 38,8 em ASTM A572 grau 50, com L<sub>b</sub> = 300 cm e C<sub>b</sub> = 1,14, pela flambagem lateral com torção no caminho clássico. Unidades em kN·cm.

| Perfil | Grandeza | Calculadora | Oráculo | Diferença | Causa |
| --- | --- | --- | --- | --- | --- |
| W 410 x 38,8 | λ (L<sub>b</sub>/r<sub>y</sub>) | 106,01 | 106,01 | 0,00 % | |
| W 410 x 38,8 | λ<sub>p</sub> | 42,38 | 42,38 | 0,00 % | |
| W 410 x 38,8 | λ<sub>r</sub> | 130,28 | 130,83 | −0,42 % | |
| W 410 x 38,8 | M<sub>pl</sub> | 25 419,6 | 25 419,6 | 0,00 % | |
| W 410 x 38,8 | M<sub>r</sub> | 15 468 | 15 468 | 0,00 % | |
| W 410 x 38,8 | M<sub>Rd</sub> (FLT, caminho clássico) | 16 560 | 16 602 | −0,25 % | |

A diferença no λ<sub>r</sub> é do próprio manual: com os números que ele escreve (β<sub>1</sub> = 0,066, C<sub>w</sub> = 153 190 cm⁶ e C<sub>b</sub> = 1,14), a fórmula do item D.2.8-a dá 130,47, e com o β<sub>1</sub> sem arredondar, 130,28, que é o valor da calculadora. A calculadora fica 0,25 % abaixo do manual no momento resistente, do lado seguro.

O exemplo 6.3 do mesmo manual verifica à compressão um perfil soldado CVS 500 x 123 (d = 500 mm, mesas de 350 x 16 mm, alma de 9,5 mm) em aço de f<sub>y</sub> = 34,5 kN/cm², engastado na base, com 120 cm de comprimento de flambagem nos três modos. É o único exemplo publicado de perfil soldado pela edição de 2024 encontrado, e passa pelo grupo 5 da Tabela 4. As propriedades da calculadora saem das chapas; as do manual, da tabela. Forças em kN.

| Perfil | Grandeza | Calculadora | Oráculo | Diferença | Causa |
| --- | --- | --- | --- | --- | --- |
| CVS 500 x 123 | A<sub>g</sub> (cm²) | 156,46 | 156,5 | −0,03 % | |
| CVS 500 x 123 | I<sub>x</sub> (cm⁴) | 73 730 | 73 730 | 0,00 % | |
| CVS 500 x 123 | Z<sub>x</sub> (cm³) | 3 230,6 | 3 231 | −0,01 % | |
| CVS 500 x 123 | J (cm⁴) | 108,95 | 109 | −0,05 % | |
| CVS 500 x 123 | C<sub>w</sub> (cm⁶) | 6 697 776 | 6 695 817 | +0,03 % | |
| CVS 500 x 123 | k<sub>c</sub> | 0,570 | 0,57 | 0,00 % | |
| CVS 500 x 123 | (b/t)<sub>lim</sub> da mesa, grupo 5 | 11,63 | 11,63 | 0,00 % | |
| CVS 500 x 123 | largura efetiva da alma (mm) | 371,9 | 372 | −0,03 % | |
| CVS 500 x 123 | A<sub>ef</sub> (cm²) | 147,33 | 147,3 | +0,02 % | |
| CVS 500 x 123 | N<sub>c,Rd</sub> | 4 554,75 | 4 554,73 | 0,00 % | |

### Conferência independente às cegas

Seis casos das famílias laminadas foram refeitos por uma conta independente, lida só nas páginas da norma, sem acesso ao programa. A conta independente tirou o raio de giração de √(I/A); a calculadora usa o raio de giração publicado no catálogo. Essa é a causa das pequenas diferenças. Forças em kN e momentos em kN·cm.

| Perfil | Grandeza | Calculadora | Oráculo | Diferença | Causa |
| --- | --- | --- | --- | --- | --- |
| U 203,2 x 17,1, A572 GR50, L = 300 cm | N<sub>c,Rd</sub> | 96,00 | 96,00 | 0,00 % | |
| U 203,2 x 17,1 | M<sub>x,Rd</sub> (FLT) | 2 258,9 | 2 259 | 0,00 % | |
| U 203,2 x 17,1 | M<sub>y,Rd</sub> (pontas e alma comprimidas) | 602,2 | 602,2 | 0,00 % | |
| U 203,2 x 17,1 | V<sub>y,Rd</sub> | 213,75 | 213,8 | −0,02 % | |
| U 203,2 x 17,1 | V<sub>x,Rd</sub> | 213,87 | 213,9 | −0,01 % | |
| U 381,0 x 50,4, A572 GR50, L<sub>x</sub> = 400, L<sub>y</sub> = 100, L<sub>t</sub> = 400 cm | N<sub>e</sub> (flexo-torção) | 1 915,0 | 1 919 | −0,21 % | |
| U 381,0 x 50,4 | N<sub>c,Rd</sub> | 1 240,9 | 1 242 | −0,09 % | |
| U 381,0 x 50,4 | M<sub>x,Rd</sub> | 12 332 | 12 330 | +0,02 % | |
| I 203,2 x 30,5, A36, L = 300 cm | N<sub>c,Rd</sub> | 290,10 | 290,1 | 0,00 % | |
| I 203,2 x 30,5 | M<sub>x,Rd</sub> (FLT) | 5 278,8 | 5 278 | +0,02 % | |
| I 203,2 x 30,5 | M<sub>y,Rd</sub> | 1 090,9 | 1 091 | −0,01 % | |
| L 3" x 3" - 6,35, A36, pelo centroide, L = 150 cm | N<sub>c,Rd</sub> | 124,26 | 124,3 | −0,03 % | |
| L 3" x 3" - 6,35, treliça plana, L<sub>x1</sub> = 150 cm | N<sub>c,Rd</sub> | 96,25 | 97,80 | −1,58 % | O catálogo dá r<sub>x</sub> = 2,36 cm, e √(I<sub>x</sub>/A) dá 2,32 cm. Com o r<sub>x</sub> do catálogo, a própria conta independente chega a 96,25. |
| L 4" x 3" - 9,52, A36, pelo centroide, L = 150 cm | N<sub>c,Rd</sub> (equação cúbica) | 228,41 | 228,5 | −0,04 % | |
| L 4" x 3" - 9,52, treliça espacial, aba menor, L<sub>x1</sub> = 200 cm | N<sub>c,Rd</sub> | 181,82 | 182,0 | −0,10 % | |
| L 4" x 4" - 6,35, A36, pelo centroide, L = 100 cm | A<sub>ef</sub> | 12,12 | 12,12 | 0,00 % | |
| L 4" x 4" - 6,35 | N<sub>c,Rd</sub> | 196,64 | 196,6 | +0,02 % | |

As leituras da norma em que a conta independente e a calculadora concordaram, sem combinar antes, estão no capítulo 4: a troca de índices do item 5.3.5.2 no U, a largura das chapas da Tabela 4, o W mínimo no teto de 5.4.2.2, a flambagem local da alma em torno de Y só no U, o centro de torção da cantoneira no encontro das abas e a Errata 1 no item 5.3.5.4.3.

### Perfil soldado: conferências às cegas

O perfil soldado foi conferido às cegas em duas etapas, cada uma por uma conta independente lida só nas páginas da norma, sem acesso ao programa. A conta independente calculou as propriedades pelas chapas, como a calculadora, e por isso os números coincidem até a última casa. Valores de cálculo, já divididos por γ<sub>a1</sub>; aço de f<sub>y</sub> = 34,5 kN/cm², salvo o CS 300 x 62, de f<sub>y</sub> = 25 kN/cm². Forças em kN e momentos em kN·cm.

Na primeira etapa, perfis de mesas iguais: o grupo 5 da compressão e a flambagem local da mesa de soldado.

| Perfil | Grandeza | Calculadora | Oráculo | Diferença | Causa |
| --- | --- | --- | --- | --- | --- |
| VS 500 x 61, L<sub>x</sub> = 600, L<sub>y</sub> = L<sub>t</sub> = 300 cm | N<sub>c,Rd</sub> | 1 591,8 | 1 591,8 | 0,00 % | |
| VS 500 x 61 | M<sub>x,Rd</sub> (FLM) | 40 357 | 40 357 | 0,00 % | |
| VS 500 x 61 | M<sub>y,Rd</sub> | 7 267,9 | 7 267,9 | 0,00 % | |
| VS 500 x 61 | V<sub>y,Rd</sub> | 472,32 | 472,3 | 0,00 % | |
| VS 500 x 61 | V<sub>x,Rd</sub> | 893,86 | 893,9 | 0,00 % | |
| VS 500 x 61 | interação 5.5.1.2 | 0,503 | 0,503 | 0,00 % | |
| CS 300 x 62, L = 400 cm | N<sub>c,Rd</sub> | 1 542,9 | 1 542,9 | 0,00 % | |
| CS 300 x 62 | M<sub>x,Rd</sub> (FLM) | 19 801 | 19 801 | 0,00 % | |
| CS 300 x 62 | M<sub>y,Rd</sub> | 8 114,8 | 8 114,8 | 0,00 % | |
| PS 400 x 300 x 6,3 x 6,3, L = 200 cm, C<sub>b</sub> = 1,14 | N<sub>c,Rd</sub> | 1 153,1 | 1 153,1 | 0,00 % | |
| PS 400 x 300 x 6,3 x 6,3 | M<sub>x,Rd</sub> (FLM elástica) | 13 032 | 13 032 | 0,00 % | |
| PS 400 x 300 x 6,3 x 6,3 | M<sub>y,Rd</sub> | 2 783,6 | 2 783,6 | 0,00 % | |
| PS 400 x 300 x 6,3 x 6,3 | V<sub>y,Rd</sub> | 471,98 | 472,0 | 0,00 % | |

Na segunda etapa, mesas diferentes, curvatura reversa e alma esbelta.

| Perfil | Grandeza | Calculadora | Oráculo | Diferença | Causa |
| --- | --- | --- | --- | --- | --- |
| PS 600 x 250/150 x 16/12,5 x 8, L = 400 cm, C<sub>b</sub> = 1,0 | M<sub>x,Rd</sub>, mesa superior comprimida (FLT) | 63 640 | 63 640 | 0,00 % | |
| PS 600 x 250/150 x 16/12,5 x 8 | M<sub>x,Rd</sub>, mesa inferior comprimida (FLT elástica) | 31 342 | 31 342 | 0,00 % | |
| PS 600 x 250/150 x 16/12,5 x 8 | M<sub>x,Rd</sub>, curvatura reversa (R<sub>m</sub> = 0,5416) | 16 975 | 16 975 | 0,00 % | |
| PS 600 x 250/150 x 16/12,5 x 8 | N<sub>c,Rd</sub> (flexo-torção em y) | 1 187,2 | 1 187,2 | 0,00 % | |
| PS 1200 x 300 x 16 x 6,3, C<sub>b</sub> = 1,0 | M<sub>x,Rd</sub>, L<sub>t</sub> = 300 cm (E.6.2) | 197 700 | 197 700 | 0,00 % | |
| PS 1200 x 300 x 16 x 6,3 | M<sub>x,Rd</sub>, L<sub>t</sub> = 900 cm (E.6.2 elástica) | 88 554 | 88 554 | 0,00 % | |
| PS 1200 x 300 x 16 x 4,75 (h/t<sub>w</sub> = 245,9) | admissão pelo E.5.3, sem enrijecedores | não atende | não admite | igual | |
| PS 1200 x 300 x 16 x 4,75 | admissão pelo E.5.3, enrijecedores a cada 150 cm | atende | admite | igual | |
| PS 1400 x 400/250 x 19/12,5 x 6,3, L<sub>t</sub> = 500 cm | M<sub>x,Rd</sub>, mesa superior comprimida (E.6.1) | 219 103 | 219 103 | 0,00 % | |
| PS 1400 x 400/250 x 19/12,5 x 6,3 | M<sub>x,Rd</sub>, mesa inferior comprimida (E.6.2) | 125 554 | 125 554 | 0,00 % | |

Nos pontos em que a norma admite duas leituras, a conta independente e a calculadora escolheram o mesmo, sem combinar antes: a metade da largura da mesa no grupo 5; o C<sub>b</sub> só no λ<sub>r</sub> e no momento crítico, também no Anexo E; o R<sub>m</sub> pela mesa de menor inércia sozinha; cada mesa com as suas próprias grandezas na curvatura reversa; o W mínimo no momento do início do escoamento da flambagem local da alma; a seção T do r<sub>yTc</sub> com metade de h<sub>c</sub> de alma e a do r<sub>yc</sub> com um sexto; a tensão residual de 0,30·f<sub>y</sub> também no Anexo E; e o limite do E.5.3 tomado com h/t<sub>w</sub>, e não com h<sub>c</sub>/t<sub>w</sub>.

### Cantoneira simples pelo AISC 360-22

A flexão e o cortante da cantoneira simples foram refeitos à mão, fora do programa, com as fórmulas do capítulo F10 e da seção G3 lidas na página do AISC 360-22. Cantoneira L 3" x 3" - 6,35 em ASTM A36, M<sub>x</sub> = 5 000 kN·cm, V<sub>y</sub> = 20 kN, L<sub>t</sub> = 150 cm e C<sub>b</sub> = 1,0. Momentos em kN·cm e forças em kN.

| Perfil | Grandeza | Calculadora | Oráculo | Diferença | Causa |
| --- | --- | --- | --- | --- | --- |
| L 3" x 3" - 6,35 | M<sub>u,Rd</sub> (FLT em u, F10-2) | 435,32 | 435,32 | 0,00 % | |
| L 3" x 3" - 6,35 | M<sub>v,Rd</sub> (escoamento, F10-1) | 236,56 | 236,56 | 0,00 % | |
| L 3" x 3" - 6,35 | V<sub>y,Rd</sub> (G3-1) | 65,98 | 65,98 | 0,00 % | |

Esta conta à mão confere a transcrição das fórmulas, mas não substitui um exemplo resolvido publicado pelo AISC, que ainda não foi comparado.

### SAP2000 pelo AISC 360-16

Uma viga em balanço W 200 x 26,6 de uma obra real foi verificada no SAP2000 v26 pelo AISC 360-16 (método dos estados-limites, análise direta), na seção do engaste. A calculadora foi rodada com a mesma entrada do SAP2000: aço com f<sub>y</sub> = 345 MPa, L<sub>x</sub> = L<sub>y</sub> = L<sub>t</sub> = 63,2 cm e C<sub>b</sub> = 1,147. Comparam-se as resistências de cálculo item por item: forças em kN e momentos em kN·cm.

| Perfil | Grandeza | Calculadora | Oráculo | Diferença | Causa |
| --- | --- | --- | --- | --- | --- |
| W 200 x 26,6 | N<sub>c,Rd</sub> × φP<sub>nc</sub> | 1 040,6 | 1 005,4 | +3,5 % | Coeficiente 1/1,10 da NBR contra φ = 0,90 do AISC (+1,0 %) e área bruta da tabela Gerdau, 34,2 cm², contra 33,38 cm² da tabela americana do SAP2000 (+2,5 %). |
| W 200 x 26,6 | M<sub>x,Rd</sub> × φM<sub>n33</sub> (plastificação) | 8 854,0 | 8 511,5 | +4,0 % | Coeficiente (+1,0 %) e Z<sub>x</sub> da Gerdau, 282,3 cm³, contra 274,3 cm³ do SAP2000 (+2,9 %). |
| W 200 x 26,6 | M<sub>y,Rd</sub> × φM<sub>n22</sub> | 2 333,5 | 2 354,7 | −0,9 % | A NBR limita o momento a 1,50·W·f<sub>y</sub>/γ<sub>a1</sub> (5.4.2.2), e esse teto governa; o SAP2000 usou φ·F<sub>y</sub>·Z<sub>y</sub>. |
| W 200 x 26,6 | V<sub>y,Rd</sub> × φV<sub>n2</sub> | 225,93 | 223,50 | +1,1 % | Coeficiente (+1,0 %); a área de cisalhamento é a mesma, d·t<sub>w</sub> = 12,01 cm². O SAP2000 usou φ<sub>v</sub> = 0,90, mas a seção G2.1(a) do AISC permite 1,00 neste perfil; com 1,00, o AISC daria 248,3 kN. |
| W 200 x 26,6 | V<sub>x,Rd</sub> × φV<sub>n3</sub> | 420,47 | 415,95 | +1,1 % | Coeficiente (+1,0 %); a mesma área, 2·b<sub>f</sub>·t<sub>f</sub> = 22,34 cm². |

O índice de interação de 1,338 que o SAP2000 mostra não se compara com os índices da calculadora, porque as cargas são outras: o SAP2000 usou as combinações automáticas dele (no engaste, a combinação DSTL8), e a verificação pela NBR usou as combinações da NBR 8681 e da NBR 6120, que dão o momento solicitante de 7 920,6 kN·cm. A ressalva mais importante, porém, é o comprimento destravado. Os 63,2 cm do SAP2000 contam as terças como travamento, e elas estão na mesa de cima, que no engaste do balanço está tracionada; a mesa comprimida é a de baixo, e as terças não a seguram (ver a pergunta sobre as terças no capítulo 8). Com o L<sub>b</sub> de 63,2 cm, a calculadora dá índice 0,90 na flexão; com o balanço inteiro (L<sub>t</sub> = 360 cm e C<sub>b</sub> = 1,0), o momento resistente cai para 6 157 kN·cm, o índice da flexão vai a 1,286 e o da interação, a 1,291.

### Revisões independentes

Duas revisões independentes, uma contra o texto da norma e outra do programa, com um juiz separando defeito real de falso alarme, foram feitas em 1º e em 4 de novembro de 2026, sobre as famílias laminadas. A revisão da norma não achou fórmula errada. Os defeitos reais foram corrigidos, e cada um ganhou um teste que o prende.

O perfil soldado de mesas diferentes e a viga de alma esbelta passaram por outra rodada, com as mesmas duas lentes e um juiz. Os nove achados foram confirmados como defeitos reais, e todos foram corrigidos e presos por teste. Um deles era contra a segurança: o limite de esbeltez da alma do E.5.3 só era conferido quando a conta caía no Anexo E, e uma viga de mesa comprimida pesada, com h/t<sub>w</sub> acima de 260, podia cair no Anexo D e sair "Atende" sem ser admitida pela norma. O caso é raro, e o limite passou a valer para a seção inteira. Os outros oito eram de tela e de memória: valores negativos de h<sub>c</sub> e h<sub>p</sub> quando a linha neutra plástica cai dentro da mesa, a cena em três dimensões que supunha as mesas iguais, um verbete repetido no glossário e textos de rótulo.

### Catálogos

As propriedades dos perfis laminados foram transcritas das tabelas e conferidas por r = √(I/A), W = I/c e massa = 0,785·A. A constante de torção e os módulos plásticos que as tabelas brasileiras não publicam vêm do banco de perfis do AISC quando a peça é a mesma. Quando não é, são estimados a partir do perfil americano mais parecido; refazendo essa estimativa para cada perfil do banco do AISC, deixando o próprio perfil de fora, o erro na constante de torção ficou entre −5 % e +3,5 %. A constante de empenamento sai da fórmula da norma (D.2.8-a), que difere menos de 3 % do valor do AISC. A constante de empenamento e a posição do centro de torção do U foram conferidas por uma segunda conta, por integração da linha média.

Os 272 perfis soldados da NBR 5884 foram transcritos das imagens das Tabelas A8.1 a A8.3 e conferidos contra a conta pelas chapas: a área, as inércias, os módulos resistentes elásticos e o módulo plástico em X batem dentro de 1 %, e a constante de torção dentro de 3 %, porque a tabela a arredonda para o inteiro. A conferência achou cinco erros de impressão no livro (uma massa, dois raios de giração, um módulo resistente e uma relação entre a altura e a espessura da alma), que ficaram anotados ao lado de cada perfil; a calculadora não os usa, porque calcula pelas chapas.

### O que nenhum oráculo cobriu

- Nenhum exemplo resolvido publicado de flexão de perfil soldado, de seção monossimétrica ou de viga de alma esbelta pela edição de 2024 foi encontrado; essas partes foram conferidas pelas contas às cegas das duas etapas. O único exemplo publicado de soldado, o do manual "Uso Fácil", é de compressão.
- As faixas de espessura dos aços de chapa foram transcritas das Tabelas A.1 e A.2 da norma, sem outra fonte para comparar.

- A flambagem lateral com torção da cantoneira de abas desiguais em torno do eixo u, que ainda não é calculada.
- A flambagem local da aba da cantoneira nos trechos não compacto e esbelto (F10-6 a F10-8), e o cortante com C<sub>v2</sub> menor que 1: a conta à mão só passou pelo trecho compacto.
- O modo de conferência da cantoneira de abas desiguais com L<sub>x</sub> diferente de L<sub>y</sub>, que a norma não escreve (é uma decisão de projeto, registrada no capítulo 4).
- A cantoneira de treliça tracionada, cuja ruptura da seção líquida depende da ligação e não é calculada.
- A flambagem local da alma do U fletido em torno de Y com largura efetiva reduzida, que só aparece em dois perfis em aço A572 grau 60.
- Os perfis com propriedades estimadas (J e Z), cujo erro é o medido acima, e não um valor publicado.
- Nenhum exemplo resolvido publicado de perfil U, de I padrão americano ou de cantoneira pela NBR 8800:2024 foi encontrado; essas famílias foram conferidas pela conta independente às cegas.
- A comparação com o SAP2000 cobre só resistências em que a peça não flamba (a plastificação na flexão em X, porque o L<sub>b</sub> de 63,2 cm é curto); a flambagem lateral com torção no trecho inelástico e no elástico só foi conferida contra o exemplo do manual "Uso Fácil" e a conta às cegas.

## Perguntas frequentes

### Como passo os esforços do SAP2000 para a calculadora?

Os eixos locais do SAP2000 têm outros nomes. O momento M3 (em torno do eixo local 3, o "Major") é o M<sub>x</sub> daqui, e a força cortante V2 é o V<sub>y</sub>: os dois agem no plano da alma. O M2 é o M<sub>y</sub>, e o V3 é o V<sub>x</sub>: os dois agem no plano das mesas. O sinal da força normal é o oposto: no SAP2000 a compressão sai negativa (P < 0), e aqui a compressão é positiva. Por isso, numa envoltória, a maior compressão é o **mínimo** de P, e entra aqui com o sinal trocado.

Na envoltória do momento e da cortante, vale o **maior em valor absoluto** entre o máximo e o mínimo. A armadilha mais comum é tomar o máximo positivo: numa viga em balanço, por exemplo, o máximo positivo de M3 era 4 843 kN·cm, mas o que governava era o mínimo, −7 920,6 kN·cm, no engaste. A calculadora usa o valor absoluto dos momentos na interação, mas o sinal do M<sub>y</sub> no U e dos momentos na cantoneira muda o estado-limite, e para esses o sinal tem de ser o da combinação.

Tirar o pior de cada esforço da envoltória (o maior N, o maior M<sub>x</sub>, o maior M<sub>y</sub>, cada um de uma combinação diferente) mistura combinações e fica a favor da segurança. Para afinar a verificação, use os esforços simultâneos de uma mesma combinação, uma combinação de cada vez. Os botões (?) dos esforços mostram, em animação, em que plano cada esforço age, e servem para conferir a passagem.

### Como verifico um balanço?

Pela edição de 2024, o comprimento destravado do balanço é medido da contenção até a ponta livre (4.10.6.1), sem o coeficiente K; L<sub>x</sub>, L<sub>y</sub> e L<sub>t</sub> recebem esse comprimento, e o efeito global vem da análise de segunda ordem. O C<sub>b</sub> é 1,0 quando o empenamento está impedido no apoio e a ponta é livre (5.4.2.3-b); a janela do C<sub>b</sub> tem a forma "Balanço", que dá exatamente 1,0. A forma "momentos nas pontas" com ψ = 0 desenha o mesmo triângulo, mas dá 1,67, porque representa um trecho travado nas duas extremidades e não um balanço. Carga aplicada acima da semialtura, ou outra condição de contenção, pede análise de estabilidade (5.4.2.5).

### As terças travam a viga do pórtico?

Como contenção de translação, as terças travam só a mesa em que estão presas, que normalmente é a de cima. A norma pede a contenção de translação junto da mesa comprimida (4.12.3.2). Quando o momento comprime a mesa de baixo (a sucção do vento, a região dos apoios de uma viga contínua ou o engaste de um balanço), quem flamba é a mesa de baixo, e as terças não a seguram. Nesse caso, o L<sub>t</sub> é a distância entre os travamentos da mesa de baixo, e não o espaçamento das terças.

A terça pode, porém, funcionar como **contenção de torção**, que a norma aceita em qualquer altura da seção (4.12.3.5), desde que a ligação tenha o momento resistente M<sub>br</sub> e a rigidez S<sub>Tb</sub> do item 4.12.3.6. Essa rigidez inclui a distorção da alma: se a rigidez à distorção da alma, S<sub>sec</sub>, for menor que a rigidez pedida, S<sub>T</sub>, a contenção não é efetiva. Em alma fina, essa conta costuma reprovar, e a saída é um par de enrijecedores sob a ligação da terça ou uma mão-francesa até a mesa de baixo. A calculadora não faz essa conta; ela é do engenheiro.

No balanço, a regra se inverte na ponta: a contenção da extremidade livre tem de estar junto da **mesa tracionada** (4.12.3.2), e essa a terça faz. O que ela não faz é travar a mesa comprimida no engaste.

Programas de verificação que contam as terças como travamento por padrão superestimam a resistência nessas situações. Numa viga em balanço W 200 x 26,6 de 3,60 m, o SAP2000 (L<sub>b</sub> = 63,2 cm) e outro programa de dimensionamento (L<sub>b</sub> = 121,5 cm, pela opção de travar os pontos onde chegam terças, que vem ligada de fábrica) contaram as terças como travamento. Com o balanço inteiro como comprimento destravado, o índice de aproveitamento da flexão passou de 0,90 para 1,29 (capítulo 7).

### Como verifico uma viga soldada de mesas diferentes nos apoios de uma viga contínua?

Perto dos apoios o momento troca de sinal, e a mesa comprimida troca junto: no vão comprime a de cima, sobre o apoio, a de baixo. Se o trecho destravado contém a troca de sinal, escolha a curvatura reversa: a calculadora verifica as duas mesas contra o maior momento do trecho, em valor absoluto, com o C<sub>b</sub> multiplicado pelo R<sub>m</sub>. Se o momento não troca de sinal no trecho, use a curvatura simples e entre com o momento com o seu sinal: positivo comprime a mesa superior. O C<sub>b</sub> digitado é sempre o do diagrama, sem o R<sub>m</sub>.

### Por que o J do perfil soldado difere do de outro programa?

A calculadora usa J = Σ b·t³/3, sem a correção das pontas livres das mesas, que é a convenção das tabelas da NBR 5884. Programas que aplicam a correção, ou que medem a alma até o meio das mesas, dão um J alguns por cento diferente. O J entra na flambagem por torção e na flambagem lateral com torção; nos perfis do catálogo, a diferença para a tabela publicada fica abaixo de 3 %, e a memória mostra a fórmula usada.

### Por que o resultado é diferente da planilha que eu uso?

As causas mais comuns são três: a força cortante dividida duas vezes pelo γ<sub>a1</sub>, o teto de 1,50·W·f<sub>y</sub> ausente na flexão em Y e a flambagem lateral com torção calculada só pelo caminho alternativo do D.2.1. A calculadora segue a norma nos três casos. A memória mostra cada passo para a comparação.

### Por que a cantoneira com momento usa o AISC?

Porque a NBR 8800:2024 não traz o momento fletor nem a força cortante resistentes da cantoneira simples. O AISC 360-22 é a norma em que a NBR se apoia nesse assunto, e a resistência dele é dividida pelo γ<sub>a1</sub> = 1,10 da NBR. A memória deixa escrito, em cada passo, que a fórmula é de fora da NBR.

### Por que a cantoneira comprimida dá menos que a conta só com o raio de giração mínimo?

Porque a cantoneira também flamba por flexo-torção: o centro de torção fica no encontro das abas, longe do centroide, e a flexão em torno do eixo de maior inércia se acopla à torção. Nas cantoneiras de abas finas, esse modo governa. A memória mostra os dois modos e diz qual governou.

### O que significa o aviso de entrada recusada na barra de estado?

Que a combinação digitada não tem conta (por exemplo, uma cantoneira de treliça sem o comprimento entre os pontos de trabalho). A tela continua mostrando o último resultado válido até a entrada ser corrigida.

Dúvidas, críticas ou sugestões: encaminhar e-mail para contato@proestruturas3d.com.br
