# Script para configurar banco RDS MySQL na AWS
# Autor: Kelly
# Data: 2025-08-30

param(
    [Parameter(Mandatory=$true)]
    [string]$Endpoint,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [string]$Database = "planilha_organizacao",
    [int]$Port = 3306
)

Write-Host "=== Configuração RDS MySQL AWS ===" -ForegroundColor Green
Write-Host ""

# Validar parâmetros
if (-not $Endpoint -or -not $Username -or -not $Password) {
    Write-Host "✗ Parâmetros obrigatórios:" -ForegroundColor Red
    Write-Host "  -Endpoint: Endpoint do RDS" -ForegroundColor Yellow
    Write-Host "  -Username: Usuário do banco" -ForegroundColor Yellow
    Write-Host "  -Password: Senha do banco" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplo:" -ForegroundColor Cyan
    Write-Host ".\setup-aws-rds.ps1 -Endpoint 'planilha-db.abc123.us-east-1.rds.amazonaws.com' -Username 'admin' -Password 'minhasenha'" -ForegroundColor White
    exit 1
}

Write-Host "Configuração:" -ForegroundColor Yellow
Write-Host "  Endpoint: $Endpoint" -ForegroundColor Cyan
Write-Host "  Username: $Username" -ForegroundColor Cyan
Write-Host "  Database: $Database" -ForegroundColor Cyan
Write-Host "  Port: $Port" -ForegroundColor Cyan
Write-Host ""

# 1) Testar conexão
Write-Host "1. Testando conexão com RDS..." -ForegroundColor Yellow
try {
    $testQuery = "SELECT 1 as test;"
    $testResult = mysql -h $Endpoint -P $Port -u $Username -p$Password -e $testQuery 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Conexão com RDS estabelecida" -ForegroundColor Green
    } else {
        Write-Host "✗ Falha na conexão com RDS" -ForegroundColor Red
        Write-Host "Verifique:" -ForegroundColor Yellow
        Write-Host "  - Endpoint correto" -ForegroundColor White
        Write-Host "  - Credenciais corretas" -ForegroundColor White
        Write-Host "  - Security Group permite conexão na porta 3306" -ForegroundColor White
        Write-Host "  - RDS está rodando" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "✗ Erro ao conectar: $_" -ForegroundColor Red
    exit 1
}

# 2) Criar banco se não existir
Write-Host "2. Verificando/criando banco '$Database'..." -ForegroundColor Yellow
$createDb = "CREATE DATABASE IF NOT EXISTS $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
try {
    mysql -h $Endpoint -P $Port -u $Username -p$Password -e $createDb
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Banco '$Database' verificado/criado" -ForegroundColor Green
    } else {
        Write-Host "✗ Erro ao criar banco" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Erro ao criar banco: $_" -ForegroundColor Red
    exit 1
}

# 3) Importar schema
Write-Host "3. Importando schema..." -ForegroundColor Yellow
$schemaFile = Join-Path $PSScriptRoot "..\prisma\schema_financas.sql"
if (Test-Path $schemaFile) {
    try {
        Get-Content $schemaFile | mysql -h $Endpoint -P $Port -u $Username -p$Password $Database
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Schema importado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "✗ Erro ao importar schema" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "✗ Erro ao importar schema: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Arquivo de schema não encontrado: $schemaFile" -ForegroundColor Red
    exit 1
}

# 4) Verificar tabelas
Write-Host "4. Verificando tabelas criadas..." -ForegroundColor Yellow
try {
    $tables = mysql -N -h $Endpoint -P $Port -u $Username -p$Password $Database -e "SHOW TABLES;"
    if ($LASTEXITCODE -eq 0) {
        $tableCount = ($tables | Measure-Object).Count
        Write-Host "✓ $tableCount tabelas criadas" -ForegroundColor Green
        
        # Listar tabelas principais
        $mainTables = @("meses", "conjuge", "categoria", "metaCasal", "receita", "despesa")
        foreach ($table in $mainTables) {
            if ($tables -contains $table) {
                Write-Host "  ✓ $table" -ForegroundColor Cyan
            } else {
                Write-Host "  ✗ $table (faltando)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✗ Erro ao verificar tabelas" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erro ao verificar tabelas: $_" -ForegroundColor Red
}

# 5) Verificar dados de seed
Write-Host "5. Verificando dados de seed..." -ForegroundColor Yellow
try {
    $mesesCount = mysql -N -h $Endpoint -P $Port -u $Username -p$Password $Database -e "SELECT COUNT(*) FROM meses;"
    $conjugesCount = mysql -N -h $Endpoint -P $Port -u $Username -p$Password $Database -e "SELECT COUNT(*) FROM conjuge;"
    $categoriasCount = mysql -N -h $Endpoint -P $Port -u $Username -p$Password $Database -e "SELECT COUNT(*) FROM categoria;"
    
    Write-Host "Meses: $mesesCount (esperado 12)" -ForegroundColor Cyan
    Write-Host "Cônjuges: $conjugesCount (esperado 3)" -ForegroundColor Cyan
    Write-Host "Categorias: $categoriasCount (>50)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Erro ao verificar dados: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Configuração RDS Concluída! ===" -ForegroundColor Green
Write-Host ""

# 6) Gerar arquivo .env
Write-Host "6. Gerando arquivo .env..." -ForegroundColor Yellow
$envContent = @"
# Configuração RDS MySQL AWS
DATABASE_URL_MYSQL="mysql://$Username`:$Password@$Endpoint`:$Port/$Database"

# Configuração do Servidor
PORT=3000
NODE_ENV=mysql
"@

$envFile = Join-Path $PSScriptRoot "..\.env"
$envContent | Out-File -FilePath $envFile -Encoding UTF8

Write-Host "✓ Arquivo .env criado em: $envFile" -ForegroundColor Green
Write-Host ""

Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Execute: npm run prisma:generate:mysql" -ForegroundColor White
Write-Host "2. Execute: npm run dev:mysql" -ForegroundColor White
Write-Host "3. Teste a API: curl http://localhost:3000/health" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "- Guarde a senha em local seguro" -ForegroundColor Yellow
Write-Host "- Para produção, configure Security Group restritivo" -ForegroundColor Yellow
Write-Host "- Monitore custos no AWS Cost Explorer" -ForegroundColor Yellow


