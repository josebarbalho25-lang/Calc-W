# Instalador da PLS Calc

`npm run instalador` gera `instalador/saida/PLS Calc Setup <versão>.exe`, que fica fora do git.

## O que sai

- Um instalador NSIS por usuário, que não pede administrador e instala em
  `%LOCALAPPDATA%\Programs\<nome>`.
- A tela de licença mostra o `TERMO-DE-RESPONSABILIDADE.md` da raiz, com aceite. 
- Atalhos no menu Iniciar e na área de trabalho.
- O desinstalador apaga também o que o programa guarda (última entrada, tema,
  projetista), em `%APPDATA%\<nome>`.
- O programa abre o build de produção do Vite numa janela própria (Electron), sem
  servidor, sem internet e sem Node na máquina do usuário.
- O PDF da memória sai pelo `printToPDF` do próprio programa, e a caixa "Salvar como" é
  a do Windows.
- Os links externos abrem no navegador padrão.
- Não há atualização automática.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `config.json` | nome, título da janela, descrição, appId, nome do pacote, ícone, termo, autor |
| `icone.ico` | o ícone do programa, do instalador e dos atalhos |
| `principal.cjs` | a janela, o endereço `app://calc/`, o PDF e os links externos |
| `ponte.cjs` | o que a página enxerga do programa (`window.programa`) |
| `construir.mjs` | build do Vite → montagem → termo em texto → electron-builder |

A página muda em dois lugares, e só quando `window.programa` existe (no navegador, nada
muda): `src/relatorio/exportarPdf.ts` imprime e grava o PDF pelo programa, e
`src/ui/barraDaJanela.ts` manda a cor e a altura dos botões do Windows, que ficam dentro
do cabeçalho (sem a barra de título branca).

## De onde veio

Copiado da PFF Calc (`calculadora-nbr14762/instalador/`), que tem o mesmo esqueleto. As
duas trocam só `config.json` (nome, título, `appId` e pacote PRÓPRIOS — iguais, um
programa instalaria por cima do outro) e `icone.ico` (`marcas\PLS-Calc.ico`). A ponte,
a janela e o construtor são os mesmos: uma correção num deles vale para os dois.

## Cuidados

- **Versão:** a versão é a do `package.json`. Mude lá antes de gerar.
- **Sem assinatura digital:** o instalador não tem certificado, e o Windows pode avisar
  "editor desconhecido" na primeira vez que for aberto depois de baixado.
- **Cópia do instalador:** o electron-builder guarda uma cópia do instalador (~120 MB)
  em `%LOCALAPPDATA%\<pacote>-updater`, para atualização automática. Como aqui não há
  atualização automática, o `por-usuario.nsh` gerado apaga essa pasta ao instalar e ao
  desinstalar.
