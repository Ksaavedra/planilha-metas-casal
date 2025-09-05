# Script para testar a conexão com MySQL
# Autor: Kelly
# Data: 2025-08-30

param(
    [string]$DbHost = "localhost",
    [int]$Port = 3306,
    [string]$User = "root",
    [string]$Database = "planilha_organizacao"
)

Write-Host "=== Teste de Conexão MySQL ===" -ForegroundColor Green
Write-Host ""

# 1) Conexão básica
Write-Host "1. Testando conexão básica..." -ForegroundColor Yellow
& mysql -h $DbHost -P $Port -u $User -p -e "SELECT 1;" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Falha na conexão básica" -ForegroundColor Red; exit 1 }
Write-Host "✓ Conexão básica OK" -ForegroundColor Green

# 2) Verificar se o banco existe
Write-Host "2. Verificando se o banco '$Database' existe..." -ForegroundColor Yellow
& mysql -h $DbHost -P $Port -u $User -p -e "USE $Database; SELECT 1;" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Banco '$Database' não existe (rode setup:mysql)" -ForegroundColor Red; exit 1 }
Write-Host "✓ Banco existe" -ForegroundColor Green

# 3) Verificar tabelas
Write-Host "3. Verificando tabelas..." -ForegroundColor Yellow
$tables = & mysql -N -h $DbHost -P $Port -u $User -p $Database -e "SHOW TABLES;"
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Erro ao listar tabelas" -ForegroundColor Red; exit 1 }

Write-Host "✓ Tabelas encontradas:" -ForegroundColor Green
$tables | ForEach-Object { Write-Host "  - $_" -ForegroundColor Cyan }

# 4) Verificar seeds
Write-Host "4. Verificando dados de seed..." -ForegroundColor Yellow
$mesesCount = & mysql -N -h $DbHost -P $Port -u $User -p $Database -e "SELECT COUNT(*) FROM meses;"
$conjugesCount = & mysql -N -h $DbHost -P $Port -u $User -p $Database -e "SELECT COUNT(*) FROM conjuge;"
$categoriasCount = & mysql -N -h $DbHost -P $Port -u $User -p $Database -e "SELECT COUNT(*) FROM categoria;"

Write-Host "Meses: $mesesCount (esperado 12)" -ForegroundColor Cyan
Write-Host "Cônjuges: $conjugesCount (esperado 3)" -ForegroundColor Cyan
Write-Host "Categorias: $categoriasCount (>50)" -ForegroundColor Cyan

# 5) Verificar views
Write-Host "5. Verificando views..." -ForegroundColor Yellow
$views = & mysql -N -h $DbHost -P $Port -u $User -p $Database -e "SHOW FULL TABLES WHERE Table_type = 'VIEW';"
$views | ForEach-Object { Write-Host "  - $_" -ForegroundColor Magenta }

Write-Host ""
Write-Host "=== Teste concluído! ===" -ForegroundColor Green
Write-Host "Se tudo passou, já pode rodar a API com: npm run dev:mysql" -ForegroundColor Yellow
