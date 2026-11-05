# ═══════════════════════════════════════════════════════════════════════════
#  scripts/prints.ps1 — os prints para ele, tirados pelo Edge sem janela
# ---------------------------------------------------------------------------
#  Cada caso abre a calculadora com a entrada no endereço (#entrada=..., lida
#  por ui/guardarEntrada.ts) e grava a tela em PNG, em escala 1,5 — nítido para
#  ele medir lado a lado com o SAP, o TQS e o Revit.
#
#  Precisa do servidor de pé (a bancada, porta 5182). O Edge roda com perfil
#  próprio, numa pasta temporária: não toca no Edge dele nem no que ele tem
#  aberto, e fecha sozinho ao gravar.
#
#  Uso:  powershell -File scripts\prints.ps1 -Casos scripts\prints-familias.json -Pasta prints\familias
# ═══════════════════════════════════════════════════════════════════════════
param(
  [Parameter(Mandatory = $true)][string]$Casos,
  [Parameter(Mandatory = $true)][string]$Pasta,
  [int]$Porta = 5182,
  [int]$Largura = 1400,
  [int]$Altura = 820,
  [int]$Espera = 15000
)

$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$perfil = Join-Path $env:TEMP 'calculadora-nbr8800-prints'
New-Item -ItemType Directory -Force $Pasta | Out-Null
$lista = Get-Content -Raw -Encoding utf8 $Casos | ConvertFrom-Json

foreach ($caso in $lista) {
  $json = $caso.entrada | ConvertTo-Json -Compress -Depth 5
  $url = "http://localhost:$Porta/#entrada=" + [uri]::EscapeDataString($json)
  if ($caso.caso) { $url += "&caso=" + $caso.caso }
  if ($caso.janela) { $url += "&janela=" + $caso.janela }
  # A janela da memória com a página em HTML: o Edge sem janela não desenha o PDF.
  if ($caso.janela -eq 'memoria') { $url += "&previa=html" }
  if ($caso.tema) { $url += "&tema=" + $caso.tema }
  if ($caso.projetista) { $url += "&projetista=" + [uri]::EscapeDataString(($caso.projetista | ConvertTo-Json -Compress)) }
  # Um caso pode pedir a tela mais alta (o soldado de mesas diferentes, com a
  # linha da curvatura, não cabe nos 820 de sempre).
  $alturaDoCaso = if ($caso.altura) { [int]$caso.altura } else { $Altura }
  $arquivo = Join-Path (Resolve-Path $Pasta) ($caso.nome + '.png')
  & $edge --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$perfil" `
    --window-size="$Largura,$alturaDoCaso" --force-device-scale-factor=1.5 --force-prefers-reduced-motion `
    --virtual-time-budget=$Espera --screenshot="$arquivo" $url 2>$null | Out-Null
  if (Test-Path $arquivo) { Write-Output "ok  $arquivo" } else { Write-Output "FALHOU  $($caso.nome)" }
}
