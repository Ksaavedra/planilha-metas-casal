# backend/scripts/backup-sqlite.ps1

$src = "prisma\dev.db"
$dstDir = "backups\sqlite"

# cria pasta se não existir
New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

# timestamp YYYYMMDD-HHmmss
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

# copia com nome novo
Copy-Item $src "$dstDir\dev-$stamp.db"

Write-Host "✅ Backup salvo em $dstDir\dev-$stamp.db"
