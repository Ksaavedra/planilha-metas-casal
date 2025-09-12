# Script para deploy otimizado usando Docker
# Este script usa Docker para fazer o build no ambiente Linux

Write-Host "🐳 Deploy Lambda otimizado com Docker..." -ForegroundColor Green
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
Write-Host "🐳 Fazendo build com Docker..." -ForegroundColor Cyan

# Criar Dockerfile otimizado para Lambda
$DockerfileContent = @"
FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remover arquivos desnecessários
RUN rm -rf node_modules/.cache
RUN rm -rf node_modules/@prisma/engines
RUN rm -rf prisma/migrations
RUN rm -rf *.md
RUN rm -rf scripts
RUN rm -rf *.ps1
RUN rm -rf *.sh

# Criar pacote final
RUN zip -r lambda-package.zip . -x "*.git*" "*.docker*" "Dockerfile*"

CMD ["cat", "lambda-package.zip"]
"@

$DockerfileContent | Out-File -FilePath "Dockerfile.lambda" -Encoding UTF8

Write-Host "✅ Dockerfile criado" -ForegroundColor Green

# Fazer build com Docker
Write-Host "🔧 Fazendo build com Docker..." -ForegroundColor Cyan
docker build -f Dockerfile.lambda -t lambda-builder .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build Docker concluído!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no build Docker" -ForegroundColor Red
    exit 1
}

# Extrair pacote
Write-Host "📦 Extraindo pacote..." -ForegroundColor Cyan
docker run --rm lambda-builder > lambda-package.zip

if (Test-Path "lambda-package.zip") {
    $Size = (Get-Item "lambda-package.zip").Length / 1MB
    Write-Host "✅ Pacote criado: $([math]::Round($Size, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao criar pacote" -ForegroundColor Red
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
    Write-Host "1. Teste a API com: curl -X GET https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod/health" -ForegroundColor White
    Write-Host "2. Configure o frontend para usar a nova URL da API" -ForegroundColor White
    Write-Host "3. Teste todas as funcionalidades" -ForegroundColor White
} else {
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
}

# Limpar arquivos temporários
Remove-Item -Path "Dockerfile.lambda" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "lambda-package.zip" -Force -ErrorAction SilentlyContinue
