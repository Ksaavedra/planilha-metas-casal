# Script para configurar AWS CLI com novas credenciais
# Execute este script após criar uma nova Access Key

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "⚙️ Configurar AWS CLI" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host ""

# Verificar se AWS CLI está instalado
if (-not (Test-Path $AwsCliPath)) {
    Write-Host "❌ AWS CLI não encontrado em: $AwsCliPath" -ForegroundColor Red
    Write-Host "Instale primeiro: winget install Amazon.AWSCLIV2" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ AWS CLI encontrado: $AwsCliPath" -ForegroundColor Green
Write-Host ""

# Limpar configuração anterior
Write-Host "🧹 Limpando configuração anterior..." -ForegroundColor Cyan
if (Test-Path "$env:USERPROFILE\.aws") {
    Remove-Item -Path "$env:USERPROFILE\.aws" -Recurse -Force
    Write-Host "✅ Configuração anterior removida" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔑 Digite suas NOVAS credenciais AWS:" -ForegroundColor Cyan
Write-Host ""

# Configurar AWS CLI
& $AwsCliPath configure

Write-Host ""
Write-Host "🧪 Testando novas credenciais..." -ForegroundColor Cyan
try {
    $TestResult = & $AwsCliPath sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Credenciais funcionando perfeitamente!" -ForegroundColor Green
        Write-Host $TestResult
        Write-Host ""
        Write-Host "🎯 Próximo passo: Execute .\EXECUTAR-COMANDOS-AWS.ps1" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Ainda há erro nas credenciais:" -ForegroundColor Red
        Write-Host $TestResult
        Write-Host ""
        Write-Host "🔧 Possíveis soluções:" -ForegroundColor Yellow
        Write-Host "- Verifique se copiou a Secret Access Key corretamente"
        Write-Host "- Certifique-se de que não há espaços extras"
        Write-Host "- Verifique se o usuário tem permissões para STS"
        Write-Host "- Tente criar outra Access Key"
        Write-Host ""
        Write-Host "📚 Para mais ajuda, consulte: RESOLVER-ERRO-CREDENCIAIS.md" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao testar credenciais:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
