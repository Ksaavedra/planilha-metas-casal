# Script para deploy simplificado (solução rápida)
# Este script remove complexidades temporariamente para fazer a API funcionar

Write-Host "🚀 Deploy Simplificado - Solução Rápida" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Carregar variáveis de ambiente do arquivo .env.production
Write-Host "📋 Carregando variáveis de ambiente..." -ForegroundColor Cyan
$EnvContent = Get-Content .env.production

foreach ($Line in $EnvContent) {
    if ($Line -match "^([^#][^=]+)=(.*)$") {
        $Key = $Matches[1].Trim()
        $Value = $Matches[2].Trim()
        
        # Remover aspas se existirem
        if ($Value.StartsWith('"') -and $Value.EndsWith('"')) {
            $Value = $Value.Substring(1, $Value.Length - 2)
        }
        
        # Definir variável de ambiente
        [Environment]::SetEnvironmentVariable($Key, $Value, "Process")
        Write-Host "  ✅ $Key = $($Value.Substring(0, [Math]::Min(20, $Value.Length)))..." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔧 Gerando Prisma Client simplificado..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client gerado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚡ Fazendo deploy simplificado..." -ForegroundColor Cyan
Write-Host "Simplificações aplicadas:" -ForegroundColor Yellow
Write-Host "  - Rate limiting desabilitado temporariamente" -ForegroundColor White
Write-Host "  - Prisma sem binary targets específicos" -ForegroundColor White
Write-Host "  - ESBuild otimizado" -ForegroundColor White

# Fazer deploy
npx serverless deploy --stage prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deploy simplificado concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 API Endpoints:" -ForegroundColor Blue
    Write-Host "  Health: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -ForegroundColor White
    Write-Host "  Auth: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/auth" -ForegroundColor White
    Write-Host "  Metas: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/metas" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Testando API..." -ForegroundColor Cyan
    Start-Sleep -Seconds 30  # Aguardar inicialização
    
    $MaxAttempts = 5
    $Attempt = 1
    $Success = $false
    
    do {
        Write-Host "Tentativa $Attempt de $MaxAttempts..." -ForegroundColor Yellow
        try {
            $Response = Invoke-RestMethod -Uri "https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -Method GET -TimeoutSec 15
            Write-Host "✅ API funcionando: $($Response.message)" -ForegroundColor Green
            $Success = $true
        } catch {
            Write-Host "⚠️  Tentativa $Attempt falhou: $($_.Exception.Message)" -ForegroundColor Yellow
            $Attempt++
            if ($Attempt -le $MaxAttempts) {
                Start-Sleep -Seconds 15
            }
        }
    } while (-not $Success -and $Attempt -le $MaxAttempts)
    
    if ($Success) {
        Write-Host ""
        Write-Host "🎯 API FUNCIONANDO PERFEITAMENTE!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Teste outros endpoints:" -ForegroundColor Blue
        Write-Host "  curl -X GET https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -ForegroundColor White
        Write-Host "  curl -X POST https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/auth/login" -ForegroundColor White
        Write-Host ""
        Write-Host "🚀 Sua API está pronta para uso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API pode estar inicializando... Tente novamente em alguns minutos" -ForegroundColor Yellow
        Write-Host "   URL: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Blue
    Write-Host "1. ✅ Configure o frontend para usar a nova URL da API" -ForegroundColor White
    Write-Host "2. ✅ Teste todas as funcionalidades" -ForegroundColor White
    Write-Host "3. ✅ Reative rate limiting quando necessário" -ForegroundColor White
    Write-Host "4. ✅ Configure domínio personalizado (opcional)" -ForegroundColor White
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
}
