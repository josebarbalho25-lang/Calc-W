# Calculadora NBR 8800 — perfis W e HP

Verificação de perfis I laminados de aço (séries W e HP, catálogo Gerdau) aos
estados-limites últimos da **ABNT NBR 8800:2024**:

- tração (5.2) e compressão (5.3, área efetiva);
- flexão em torno de X e de Y (5.4.2 e Anexo D: FLM, FLA e FLT);
- força cortante nas duas direções (5.4.3);
- força axial com momentos (5.5.1.2).

Mostra o corte do perfil cotado, o índice de utilização de cada verificação, janelas
animadas para os comprimentos destravados (Lx, Ly, Lt, Cb e enrijecedores) e gera a
**memória de cálculo em PDF**, passo a passo, com o item da norma ao lado de cada conta.

> ⚠️ **Software experimental, de apoio à verificação. A responsabilidade final é do
> engenheiro responsável.** Leia o [termo de responsabilidade](TERMO-DE-RESPONSABILIDADE.md)
> antes de usar.

## O que precisa

- Windows 10 ou 11, com o Microsoft Edge (já vem com o Windows — é ele que imprime o PDF).
- [Node.js](https://nodejs.org), versão LTS (20.19 ou mais nova).
- Internet na primeira vez, para baixar as bibliotecas.

## Como usar

1. Baixe esta pasta: botão verde **Code → Download ZIP**, e descompacte.
2. Dê dois cliques em **`ABRIR.bat`**.
3. Na primeira vez ele pede o aceite do termo e instala as bibliotecas (alguns minutos).
   Depois, a calculadora abre no navegador, em http://localhost:5180.

Para fechar, feche a janela preta do `ABRIR.bat`.

## Unidades

Esforços em kN e kN·cm; comprimentos em cm. **N positivo comprime**, negativo traciona.
Comprimento zero = barra travada continuamente naquela direção.

---

© 2026 José Barbalho. Uso gratuito, nos termos do [termo de responsabilidade](TERMO-DE-RESPONSABILIDADE.md).
