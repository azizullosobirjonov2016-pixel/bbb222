# Birja - sync source from working copy (C:\Users\user\Birja) to the
# Google Drive copy. node_modules / dist / .vite are NOT copied
# (Google Drive cannot handle them). .git IS copied.
#
# Run:  powershell -ExecutionPolicy Bypass -File scripts\sync-drive.ps1
#
# ASCII-only on purpose: Windows PowerShell 5.1 misreads a UTF-8 .ps1
# that contains Cyrillic. The Drive folder name ("My Drive" localized)
# is located at runtime instead of being typed.

$ErrorActionPreference = 'Stop'
$src = 'C:\Users\user\Birja'

# G:\ has exactly one visible, non-system top folder = the localized "My Drive".
$myDrive = Get-ChildItem 'G:\' -Directory -Force |
  Where-Object { $_.Name[0] -ne '.' -and $_.Name[0] -ne '$' } |
  Select-Object -First 1
if (-not $myDrive) { Write-Host 'Google Drive (G:\) not found' -ForegroundColor Red; exit 1 }

$dst = Join-Path $myDrive.FullName 'Birja-loyiha'
if (-not (Test-Path -LiteralPath $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }

robocopy $src $dst /MIR /XD node_modules dist .vite /XF .dev.log .npm-install.log /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
$code = $LASTEXITCODE

if ($code -lt 8) {
  Write-Host ('OK - Drive copy updated: ' + $dst) -ForegroundColor Green
  exit 0
}
Write-Host ('ROBOCOPY error: ' + $code) -ForegroundColor Red
exit $code
