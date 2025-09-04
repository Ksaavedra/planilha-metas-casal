# Script para configurar o banco MySQL
# Autor: Kelly
# Data: 2025-08-30

param(
  [string]$DbHost = "localhost",
  [int]$Port = 3306,
  [string]$User = "root",
  [string]$Database = "planilha_organizacao"
)

Write-Host "=== Configuração do Banco MySQL ===" -ForegroundColor Green
Write-Host ""

# 1) Verificar se o MySQL está disponível
Write-Host "Verificando conexão com MySQL..." -ForegroundColor Yellow
try {
    & mysql -h $DbHost -P $Port -u $User -p -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Falha na conexão" }
    Write-Host "✓ Conexão com MySQL estabelecida" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao conectar com MySQL: $_" -ForegroundColor Red
    exit 1
}

# 2) Criar banco de dados se não existir
Write-Host "Criando banco de dados '$Database'..." -ForegroundColor Yellow
$createDb = "CREATE DATABASE IF NOT EXISTS $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
& mysql -h $DbHost -P $Port -u $User -p -e $createDb
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Erro ao criar banco de dados" -ForegroundColor Red; exit 1 }
Write-Host "✓ Banco de dados criado/verificado" -ForegroundColor Green

# 3) Importar schema
Write-Host "Importando schema..." -ForegroundColor Yellow
$schemaFile = Join-Path $PSScriptRoot "..\prisma\schema_financas.sql"
if (-not (Test-Path $schemaFile)) {
    Write-Host "✗ Arquivo de schema não encontrado: $schemaFile" -ForegroundColor Red
    exit 1
}

Get-Content $schemaFile | & mysql -h $DbHost -P $Port -u $User -p $Database
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Erro ao importar schema" -ForegroundColor Red; exit 1 }
Write-Host "✓ Schema importado com sucesso" -ForegroundColor Green

# 4) Verificar tabelas criadas
Write-Host "Verificando tabelas criadas..." -ForegroundColor Yellow
& mysql -h $DbHost -P $Port -u $User -p $Database -e "SHOW TABLES;"
Write-Host ""
Write-Host "=== Configuração concluída! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure a variável de ambiente DATABASE_URL_MYSQL" -ForegroundColor White
Write-Host "2. Execute: npm run prisma:generate:mysql" -ForegroundColor White
Write-Host "3. Execute: npm run dev:mysql" -ForegroundColor White
Write-Host ""
Write-Host "Exemplo de DATABASE_URL_MYSQL:" -ForegroundColor Cyan
Write-Host "mysql://$User@$DbHost`:$Port/$Database" -ForegroundColor White
