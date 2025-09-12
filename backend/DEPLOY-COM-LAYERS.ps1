# Script para fazer deploy com Lambda Layers
# Esta solução resolve o problema de tamanho do pacote

Write-Host "🚀 Deploy Lambda com Layers..." -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""

# Verificar se o layer existe
if (-not (Test-Path "prisma-layer.zip")) {
    Write-Host "❌ Layer não encontrado!" -ForegroundColor Red
    Write-Host "Execute primeiro: .\CREAR-LAYER-PRISMA.ps1" -ForegroundColor Yellow
    exit 1
}

# Carregar variáveis de ambiente
Write-Host "📋 Carregando variáveis de ambiente..." -ForegroundColor Cyan
$EnvContent = Get-Content .env.production

foreach ($Line in $EnvContent) {
    if ($Line -match "^([^#][^=]+)=(.*)$") {
        $Key = $Matches[1].Trim()
        $Value = $Matches[2].Trim()
        
        if ($Value.StartsWith('"') -and $Value.EndsWith('"')) {
            $Value = $Value.Substring(1, $Value.Length - 2)
        }
        
        [Environment]::SetEnvironmentVariable($Key, $Value, "Process")
        Write-Host "  ✅ $Key = $($Value.Substring(0, [Math]::Min(20, $Value.Length)))..." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔧 Criando Lambda Layer..." -ForegroundColor Cyan

# Criar layer no AWS
$layerName = "prisma-client-layer"
$layerDescription = "Prisma Client Layer for Planilha Organizacao"

try {
    $layerResult = aws lambda publish-layer-version `
        --layer-name $layerName `
        --description $layerDescription `
        --zip-file fileb://prisma-layer.zip `
        --compatible-runtimes nodejs18.x `
        --region sa-east-1
    
    if ($LASTEXITCODE -eq 0) {
        $layerArn = ($layerResult | ConvertFrom-Json).LayerArn
        $layerVersion = ($layerResult | ConvertFrom-Json).Version
        Write-Host "✅ Layer criado com sucesso!" -ForegroundColor Green
        Write-Host "📋 ARN: $layerArn" -ForegroundColor Cyan
        Write-Host "📋 Versão: $layerVersion" -ForegroundColor Cyan
        
        # Salvar ARN do layer
        $layerArn | Out-File -FilePath "layer-arn.txt" -Encoding UTF8
    } else {
        Write-Host "❌ Erro ao criar layer" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao criar layer: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Fazendo deploy do Lambda..." -ForegroundColor Cyan

# Deploy do Lambda
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
    Write-Host "📋 Layer ARN: $layerArn" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
}