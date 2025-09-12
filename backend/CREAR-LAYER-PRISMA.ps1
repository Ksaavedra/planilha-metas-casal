# Script para criar Lambda Layer com Prisma Client
# Esta solução resolve o problema de tamanho do pacote

Write-Host "🔧 Criando Lambda Layer com Prisma Client..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Criar diretório para o layer
Write-Host "📁 Criando estrutura do layer..." -ForegroundColor Cyan
$layerDir = "prisma-layer"
if (Test-Path $layerDir) {
    Remove-Item -Recurse -Force $layerDir
}
New-Item -ItemType Directory -Path $layerDir -Force
New-Item -ItemType Directory -Path "$layerDir/nodejs" -Force

# Instalar apenas Prisma Client no layer
Write-Host "📦 Instalando Prisma Client no layer..." -ForegroundColor Cyan
Set-Location "$layerDir/nodejs"

# Criar package.json para o layer
$layerPackageJson = @{
    name = "prisma-layer"
    version = "1.0.0"
    dependencies = @{
        "@prisma/client" = "^6.15.0"
    }
} | ConvertTo-Json -Depth 3

$layerPackageJson | Out-File -FilePath "package.json" -Encoding UTF8

# Instalar dependências
npm install --production

# Voltar ao diretório original
Set-Location "../.."

# Copiar schema Prisma para o layer
Write-Host "📋 Copiando schema Prisma..." -ForegroundColor Cyan
Copy-Item "prisma/schema.prisma" "$layerDir/nodejs/"

# Gerar Prisma Client no layer
Write-Host "🔧 Gerando Prisma Client no layer..." -ForegroundColor Cyan
Set-Location "$layerDir/nodejs"
npx prisma generate
Set-Location "../.."

# Criar arquivo ZIP do layer
Write-Host "📦 Criando arquivo ZIP do layer..." -ForegroundColor Cyan
Compress-Archive -Path "$layerDir/nodejs/*" -DestinationPath "prisma-layer.zip" -Force

Write-Host ""
Write-Host "✅ Lambda Layer criado com sucesso!" -ForegroundColor Green
Write-Host "📁 Arquivo: prisma-layer.zip" -ForegroundColor Cyan
Write-Host "📏 Tamanho: $((Get-Item 'prisma-layer.zip').Length / 1MB) MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Blue
Write-Host "1. ✅ Execute: .\DEPLOY-COM-LAYERS.ps1" -ForegroundColor White
Write-Host "2. ✅ Teste a API" -ForegroundColor White
Write-Host "3. ✅ Configure o frontend" -ForegroundColor White
