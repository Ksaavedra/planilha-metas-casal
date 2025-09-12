# Script para deploy usando Webpack (solução sem Docker)
# Este script otimiza o pacote usando Webpack

Write-Host "📦 Deploy Lambda com Webpack (Solução Otimizada)" -ForegroundColor Green
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
Write-Host "🔧 Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client gerado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Fazendo build com Webpack..." -ForegroundColor Cyan
npx webpack --mode production

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build Webpack concluído!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build Webpack" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Fazendo deploy para produção..." -ForegroundColor Cyan

# Fazer deploy
npx serverless deploy --stage prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 API Endpoints:" -ForegroundColor Blue
    Write-Host "  Health: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -ForegroundColor White
    Write-Host "  Auth: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/auth" -ForegroundColor White
    Write-Host "  Metas: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/metas" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Testando API..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10  # Aguardar inicialização
    try {
        $Response = Invoke-RestMethod -Uri "https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -Method GET
        Write-Host "✅ API funcionando: $($Response.message)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  API pode estar inicializando... Tente novamente em alguns segundos" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Blue
    Write-Host "1. Configure o frontend para usar a nova URL da API" -ForegroundColor White
    Write-Host "2. Teste todas as funcionalidades" -ForegroundColor White
    Write-Host "3. Configure o domínio personalizado (opcional)" -ForegroundColor White
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
}

# Limpar arquivos temporários
Write-Host ""
Write-Host "🧹 Limpando arquivos temporários..." -ForegroundColor Cyan
Remove-Item -Path ".webpack" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Limpeza concluída" -ForegroundColor Green
