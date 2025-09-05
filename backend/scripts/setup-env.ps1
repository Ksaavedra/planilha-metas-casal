# Script para configurar diferentes ambientes
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "production", "test")]
    [string]$Environment
)

Write-Host "🔧 Configurando ambiente: $Environment" -ForegroundColor Green

# Criar diretório de logs se não existir
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
    Write-Host "📁 Diretório de logs criado" -ForegroundColor Yellow
}

# Configurar variáveis de ambiente baseadas no ambiente escolhido
switch ($Environment) {
    "development" {
        $env:NODE_ENV = "development"
        $env:DATABASE_URL = "file:./dev.db"
        $env:JWT_SECRET = "dev-secret-key-change-in-production-2025"
        $env:JWT_EXPIRES_IN = "7d"
        $env:FRONTEND_URL = "http://localhost:4200"
        $env:LOG_LEVEL = "debug"
        $env:ENABLE_LOGGING = "true"
        $env:RATE_LIMIT_MAX_REQUESTS = "100"
        
        Write-Host "✅ Ambiente de desenvolvimento configurado" -ForegroundColor Green
        Write-Host "   - Porta: 3000" -ForegroundColor Cyan
        Write-Host "   - Banco: dev.db" -ForegroundColor Cyan
        Write-Host "   - Logs: debug" -ForegroundColor Cyan
        Write-Host "   - JWT: 7 dias" -ForegroundColor Cyan
    }
    
    "production" {
        $env:NODE_ENV = "production"
        $env:DATABASE_URL = "file:./prod.db"
        $env:JWT_SECRET = "production-secret-key-change-this-2025"
        $env:JWT_EXPIRES_IN = "1d"
        $env:FRONTEND_URL = "https://seu-dominio.com"
        $env:LOG_LEVEL = "warn"
        $env:ENABLE_LOGGING = "true"
        $env:RATE_LIMIT_MAX_REQUESTS = "50"
        
        Write-Host "✅ Ambiente de produção configurado" -ForegroundColor Green
        Write-Host "   - Porta: $env:PORT" -ForegroundColor Cyan
        Write-Host "   - Banco: prod.db" -ForegroundColor Cyan
        Write-Host "   - Logs: warn" -ForegroundColor Cyan
        Write-Host "   - JWT: 1 dia" -ForegroundColor Cyan
        Write-Host "   - Rate Limit: 50 req/15min" -ForegroundColor Cyan
    }
    
    "test" {
        $env:NODE_ENV = "test"
        $env:DATABASE_URL = "file:./test.db"
        $env:JWT_SECRET = "test-secret-key-2025"
        $env:JWT_EXPIRES_IN = "1h"
        $env:FRONTEND_URL = "http://localhost:4200"
        $env:LOG_LEVEL = "error"
        $env:ENABLE_LOGGING = "false"
        $env:RATE_LIMIT_MAX_REQUESTS = "1000"
        
        Write-Host "✅ Ambiente de teste configurado" -ForegroundColor Green
        Write-Host "   - Porta: 3001" -ForegroundColor Cyan
        Write-Host "   - Banco: test.db" -ForegroundColor Cyan
        Write-Host "   - Logs: error" -ForegroundColor Cyan
        Write-Host "   - JWT: 1 hora" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "🚀 Para iniciar o servidor, use:" -ForegroundColor Yellow
Write-Host "   npm run dev          # Desenvolvimento" -ForegroundColor White
Write-Host "   npm run start:prod   # Produção" -ForegroundColor White
Write-Host "   npm run start:dev    # Desenvolvimento alternativo" -ForegroundColor White

Write-Host ""
Write-Host "📋 Variáveis de ambiente ativas:" -ForegroundColor Yellow
Get-ChildItem Env: | Where-Object { $_.Name -like "*NODE_ENV*" -or $_.Name -like "*DATABASE*" -or $_.Name -like "*JWT*" -or $_.Name -like "*LOG*" } | ForEach-Object {
    Write-Host "   $($_.Name): $($_.Value)" -ForegroundColor Cyan
}
