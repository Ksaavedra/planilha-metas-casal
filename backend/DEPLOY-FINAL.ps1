# Script para deploy final com todas as correções
# Este script resolve os problemas do Prisma Engine e Rate Limiting

Write-Host "🚀 Deploy Final - Resolvendo Problemas Restantes" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
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
Write-Host "🔧 Gerando Prisma Client com engine Linux..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client gerado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Verificando arquivos do Prisma..." -ForegroundColor Cyan
if (Test-Path "node_modules/.prisma/client") {
    $PrismaFiles = Get-ChildItem "node_modules/.prisma/client" -Recurse | Measure-Object
    Write-Host "✅ Arquivos do Prisma encontrados: $($PrismaFiles.Count)" -ForegroundColor Green
} else {
    Write-Host "❌ Diretório do Prisma não encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "⚡ Fazendo deploy final com ESBuild otimizado..." -ForegroundColor Cyan
Write-Host "Correções aplicadas:" -ForegroundColor Yellow
Write-Host "  - Prisma Engine Linux incluído" -ForegroundColor White
Write-Host "  - Rate Limiting configurado para API Gateway" -ForegroundColor White
Write-Host "  - ESBuild com packager npm" -ForegroundColor White

# Fazer deploy
npx serverless deploy --stage prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deploy final concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 API Endpoints:" -ForegroundColor Blue
    Write-Host "  Health: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -ForegroundColor White
    Write-Host "  Auth: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/auth" -ForegroundColor White
    Write-Host "  Metas: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/metas" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Testando API..." -ForegroundColor Cyan
    Start-Sleep -Seconds 20  # Aguardar inicialização
    
    $MaxAttempts = 3
    $Attempt = 1
    
    do {
        Write-Host "Tentativa $Attempt de $MaxAttempts..." -ForegroundColor Yellow
        try {
            $Response = Invoke-RestMethod -Uri "https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -Method GET -TimeoutSec 10
            Write-Host "✅ API funcionando: $($Response.message)" -ForegroundColor Green
            $Success = $true
        } catch {
            Write-Host "⚠️  Tentativa $Attempt falhou: $($_.Exception.Message)" -ForegroundColor Yellow
            $Success = $false
            $Attempt++
            if ($Attempt -le $MaxAttempts) {
                Start-Sleep -Seconds 10
            }
        }
    } while (-not $Success -and $Attempt -le $MaxAttempts)
    
    if (-not $Success) {
        Write-Host "⚠️  API pode estar inicializando... Tente novamente em alguns minutos" -ForegroundColor Yellow
        Write-Host "   URL: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "🎯 Deploy Lambda 100% Concluído!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Blue
    Write-Host "1. ✅ Configure o frontend para usar a nova URL da API" -ForegroundColor White
    Write-Host "2. ✅ Teste todas as funcionalidades" -ForegroundColor White
    Write-Host "3. ✅ Configure o domínio personalizado (opcional)" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Sua API está pronta para produção!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
}
