# Script para fazer deploy usando o build do Docker
# Este script usa o build que já foi feito com Docker

Write-Host "🚀 Deploy Lambda com Build Docker..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
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
Write-Host "🔍 Verificando se o build Docker existe..." -ForegroundColor Cyan

# Verificar se o arquivo lambda.js foi criado pelo Docker
if (Test-Path "dist/src/lambda.js") {
    Write-Host "✅ Build Docker encontrado!" -ForegroundColor Green
} else {
    Write-Host "❌ Build Docker não encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: .\BUILD-COM-DOCKER.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Fazendo deploy para produção..." -ForegroundColor Cyan
npx serverless deploy --stage prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Blue
    Write-Host "1. ✅ Teste a API com: .\scripts\test-connectivity.ps1" -ForegroundColor White
    Write-Host "2. ✅ Configure o frontend para usar a nova URL da API" -ForegroundColor White
    Write-Host "3. ✅ Teste todas as funcionalidades" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 URL da API: https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
}
