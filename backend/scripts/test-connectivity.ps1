# Script para testar conectividade Lambda + RDS
# Uso: .\test-connectivity.ps1

param(
    [string]$ApiUrl = ""
)

# Cores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Verificar se AWS CLI está instalado
try {
    $null = Get-Command aws -ErrorAction Stop
} catch {
    Write-Error "AWS CLI não está instalado."
    exit 1
}

Write-Status "🔍 Testando conectividade Lambda + RDS..."

# 1. Verificar se Lambda está deployado
Write-Status "1. Verificando Lambda deployado..."
try {
    $LambdaInfo = aws lambda get-function --function-name planilha-organizacao-api-prod-api --query 'Configuration.[FunctionName,Runtime,State]' --output table 2>$null
    if ($LambdaInfo) {
        Write-Success "Lambda encontrado ✓"
        Write-Host $LambdaInfo
    } else {
        Write-Warning "Lambda não encontrado. Execute: npm run deploy:prod"
    }
} catch {
    Write-Warning "Lambda não encontrado. Execute: npm run deploy:prod"
}

# 2. Verificar Security Groups
Write-Status "2. Verificando Security Groups..."
if (Test-Path ".env.security-groups") {
    $SecurityGroups = Get-Content ".env.security-groups"
    Write-Success "Arquivo .env.security-groups encontrado ✓"
    $SecurityGroups | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warning "Arquivo .env.security-groups não encontrado. Execute: .\setup-security-groups.ps1"
}

# 3. Verificar RDS
Write-Status "3. Verificando instância RDS..."
try {
    $RdsInfo = aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,DBInstanceStatus]' --output table
    Write-Success "RDS encontrado ✓"
    Write-Host $RdsInfo
} catch {
    Write-Error "Erro ao verificar RDS"
}

# 4. Testar API se URL foi fornecida
if (-not [string]::IsNullOrEmpty($ApiUrl)) {
    Write-Status "4. Testando API: $ApiUrl"
    try {
        $Response = Invoke-RestMethod -Uri "$ApiUrl/dev/health" -Method Get -TimeoutSec 30
        Write-Success "API funcionando ✓"
        Write-Host ($Response | ConvertTo-Json -Depth 3)
    } catch {
        Write-Error "Erro ao testar API: $($_.Exception.Message)"
    }
} else {
    Write-Status "4. Para testar a API, forneça a URL: .\test-connectivity.ps1 -ApiUrl 'https://your-api-gateway-url'"
}

# 5. Verificar logs do Lambda
Write-Status "5. Verificando logs do Lambda..."
try {
    $LogGroups = aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/planilha-organizacao-api" --query 'logGroups[*].logGroupName' --output text
    if ($LogGroups) {
        Write-Success "Log groups encontrados ✓"
        $LogGroups -split "`t" | ForEach-Object { Write-Host "  $_" }
        
        # Mostrar últimos logs
        Write-Status "Últimos logs do Lambda:"
        $LastLogs = aws logs tail "/aws/lambda/planilha-organizacao-api-prod-api" --since 1h --output text
        if ($LastLogs) {
            Write-Host $LastLogs
        } else {
            Write-Warning "Nenhum log encontrado nas últimas horas"
        }
    } else {
        Write-Warning "Log groups não encontrados"
    }
} catch {
    Write-Warning "Erro ao verificar logs"
}

# 6. Verificar métricas
Write-Status "6. Verificando métricas do Lambda..."
try {
    $Metrics = aws cloudwatch get-metric-statistics `
        --namespace AWS/Lambda `
        --metric-name Errors `
        --dimensions Name=FunctionName,Value=planilha-organizacao-api-prod-api `
        --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ") `
        --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ") `
        --period 300 `
        --statistics Sum `
        --query 'Datapoints[*].[Timestamp,Sum]' `
        --output table 2>$null
    
    if ($Metrics) {
        Write-Success "Métricas encontradas ✓"
        Write-Host $Metrics
    } else {
        Write-Warning "Nenhuma métrica encontrada"
    }
} catch {
    Write-Warning "Erro ao verificar métricas"
}

Write-Host ""
Write-Status "✅ Teste de conectividade concluído!"
Write-Host ""
Write-Host "📝 Próximos passos se houver problemas:"
Write-Host "  1. Verifique os Security Groups"
Write-Host "  2. Confirme que o Lambda está na VPC correta"
Write-Host "  3. Verifique os logs do Lambda"
Write-Host "  4. Teste a conectividade de rede"
Write-Host ""
