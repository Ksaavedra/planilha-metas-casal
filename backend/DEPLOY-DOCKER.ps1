# Script para deploy usando Docker (solução definitiva)
# Este script resolve os problemas do Prisma e otimiza o pacote

Write-Host "🐳 Deploy Lambda com Docker (Solução Definitiva)" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Verificar se Docker está instalado
try {
    $null = docker --version
    Write-Host "✅ Docker encontrado!" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado. Instale o Docker Desktop primeiro." -ForegroundColor Red
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

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
Write-Host "🐳 Fazendo build com Docker..." -ForegroundColor Cyan
Write-Host "Isso pode levar alguns minutos na primeira vez..." -ForegroundColor Yellow

# Fazer build com Docker
docker build -f Dockerfile.lambda -t lambda-builder .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build Docker concluído com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build Docker" -ForegroundColor Red
    exit 1
}

# Extrair pacote otimizado
Write-Host "📦 Extraindo pacote otimizado..." -ForegroundColor Cyan
docker run --rm lambda-builder > lambda-package.zip

if (Test-Path "lambda-package.zip") {
    $Size = (Get-Item "lambda-package.zip").Length / 1MB
    Write-Host "✅ Pacote criado: $([math]::Round($Size, 2)) MB" -ForegroundColor Green
    
    if ($Size -lt 50) {
        Write-Host "🎉 Pacote otimizado com sucesso! (menor que 50MB)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Pacote ainda grande, mas deve funcionar" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Erro ao criar pacote" -ForegroundColor Red
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
    try {
        $Response = Invoke-RestMethod -Uri "https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -Method GET
        Write-Host "✅ API funcionando: $($Response.message)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  API pode estar inicializando..." -ForegroundColor Yellow
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
Remove-Item -Path "lambda-package.zip" -Force -ErrorAction SilentlyContinue
docker rmi lambda-builder -f -ErrorAction SilentlyContinue
Write-Host "✅ Limpeza concluída" -ForegroundColor Green
