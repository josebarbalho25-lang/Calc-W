@echo off
cd /d "%~dp0"
title PLS Calc - NBR 8800

rem A calculadora roda no navegador, servida pelo Vite na porta 5180 (a 5173
rem e do A-PORT, a 5190 da PFF Calc). O mesmo servidor imprime o
rem PDF da memoria pelo Edge. Sem acento neste arquivo: o console do Windows
rem troca acento por lixo. O mesmo termo aparece no instalador.

where node >nul 2>nul
if errorlevel 1 goto sem_node

if exist ".termo-aceito" goto bibliotecas
echo.
echo  ================================================================
echo   PLS CALC - NBR 8800 - TERMO DE RESPONSABILIDADE
echo  ================================================================
echo.
echo   Software experimental, de apoio a verificacao de perfis de aco
echo   laminados e soldados pela ABNT NBR 8800:2024.
echo.
echo   A responsabilidade final por qualquer verificacao ou projeto
echo   feito com o auxilio deste programa e do engenheiro responsavel.
echo.
echo   Sem garantia de qualquer natureza. Texto completo:
echo   TERMO-DE-RESPONSABILIDADE.md, nesta pasta.
echo  ================================================================
echo.
choice /c SN /m " Voce leu e aceita o termo"
if errorlevel 2 exit /b 1
> ".termo-aceito" echo Termo aceito em %date% %time%

:bibliotecas
if exist "node_modules" goto abrir
echo.
echo  Primeira vez: instalando as bibliotecas. Precisa de internet e leva alguns minutos...
call npm install --no-audit --no-fund
if errorlevel 1 goto falha_instalacao

:abrir
echo.
echo  Calculadora em http://localhost:5180 - para fechar, feche esta janela.
echo.
start "" http://localhost:5180
call npm run dev
goto :eof

:sem_node
echo.
echo  Nao achei o Node.js nesta maquina.
echo  Instale a versao LTS em https://nodejs.org e abra este arquivo de novo.
echo.
start "" https://nodejs.org
pause
exit /b 1

:falha_instalacao
echo.
echo  A instalacao das bibliotecas falhou. Confira a internet e tente de novo.
pause
exit /b 1
