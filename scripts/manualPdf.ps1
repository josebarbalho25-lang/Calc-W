# ═══════════════════════════════════════════════════════════════════════════
#  scripts/manualPdf.ps1 — o manual (docs/MANUAL.md) em PDF A4, no visual da
#  memória de cálculo, impresso pelo Edge sem janela
# ---------------------------------------------------------------------------
#  1. o selo do manual grava a página (src/relatorio/manualDoUsuario.test.ts,
#     com MANUAL_HTML apontando para um arquivo temporário);
#  2. o Edge imprime a página em docs/MANUAL.pdf, como imprime a memória, e
#     o anexo da planilha de referência em docs/ANEXO-PLANILHA.pdf — que NÃO
#     vai para a versão pública (scripts/montarPublico.ps1 o deixa de fora).
#
#  Uso:  powershell -File scripts\manualPdf.ps1
# ═══════════════════════════════════════════════════════════════════════════
$raiz = Split-Path -Parent $PSScriptRoot
$html = Join-Path $env:TEMP 'calculadora-nbr8800-manual.html'
$pdf = Join-Path $raiz 'docs\MANUAL.pdf'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$perfil = Join-Path $env:TEMP 'calculadora-nbr8800-manual-edge'

Push-Location $raiz
$env:MANUAL_HTML = $html
npx vitest run src/relatorio/manualDoUsuario.test.ts | Out-Null
Remove-Item Env:\MANUAL_HTML
Pop-Location
if (-not (Test-Path $html)) { Write-Output 'FALHOU: a página do manual não foi gravada'; exit 1 }

$pares = @(@($html, $pdf), @(($html -replace '\.html$', '-anexo.html'), (Join-Path $raiz 'docs\ANEXO-PLANILHA.pdf')))
foreach ($p in $pares) {
  & $edge --headless=new --disable-gpu --user-data-dir="$perfil" --no-pdf-header-footer `
    --virtual-time-budget=15000 --print-to-pdf="$($p[1])" ([uri]$p[0]).AbsoluteUri 2>$null | Out-Null
  if (Test-Path $p[1]) { Write-Output "ok  $($p[1])" } else { Write-Output "FALHOU: o Edge não gravou $($p[1])" }
}
