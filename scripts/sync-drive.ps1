# Birja — ishchi nusxadan (C:\Users\user\Birja) Google Drive nusxasiga sync.
# Ishga tushirish:  powershell -ExecutionPolicy Bypass -File scripts\sync-drive.ps1
#
# node_modules / dist / .vite ko'chirilmaydi (Drive ularni ko'tara olmaydi).
# .git ko'chiriladi — Drive nusxasi ham to'liq git tarixiga ega bo'ladi.

$ErrorActionPreference = 'Stop'
$src = 'C:\Users\user\Birja'
$dst = 'G:\Мой диск\Birja'

if (-not (Test-Path -LiteralPath $dst)) {
  New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

robocopy $src $dst /MIR /XD node_modules dist .vite /XF .dev.log .npm-install.log `
  /R:2 /W:2 /NFL /NDL /NJH /NJS /NP

$code = $LASTEXITCODE
if ($code -lt 8) {
  Write-Host "OK — Drive nusxasi yangilandi ($dst)" -ForegroundColor Green
  exit 0
} else {
  Write-Host "ROBOCOPY xato: $code" -ForegroundColor Red
  exit $code
}
