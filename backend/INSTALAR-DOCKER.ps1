# Script para instalar Docker Desktop no Windows
# Execute como Administrador

Write-Host "🐳 Instalando Docker Desktop..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Verificar se já está instalado
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Host "✅ Docker já está instalado: $dockerVersion" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "📦 Docker não encontrado, instalando..." -ForegroundColor Yellow
}

# Instalar Docker Desktop via winget
Write-Host "📦 Instalando Docker Desktop via winget..." -ForegroundColor Cyan
try {
    winget install Docker.DockerDesktop
    Write-Host "✅ Docker Desktop instalado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar Docker Desktop via winget" -ForegroundColor Red
    Write-Host "Tentando instalação manual..." -ForegroundColor Yellow
    
    # Download manual
    $downloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    Write-Host "📥 Baixando Docker Desktop..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    
    Write-Host "🚀 Executando instalador..." -ForegroundColor Cyan
    Start-Process -FilePath $installerPath -ArgumentList "install", "--quiet" -Wait
    
    Write-Host "✅ Docker Desktop instalado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Blue
Write-Host "1. ✅ Reinicie o computador" -ForegroundColor White
Write-Host "2. ✅ Inicie o Docker Desktop" -ForegroundColor White
Write-Host "3. ✅ Execute: .\BUILD-COM-DOCKER.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Docker Desktop instalado com sucesso!" -ForegroundColor Green

