# Script para guiar a criação de nova Access Key AWS
# Este script te ajuda passo a passo a resolver o problema das credenciais

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "🔑 Criar Nova Access Key AWS" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 PASSO 1: Acessar AWS Console" -ForegroundColor Cyan
Write-Host "1. Abra seu navegador e acesse:" -ForegroundColor White
Write-Host "   https://console.aws.amazon.com/iam/" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Faça login com sua conta AWS" -ForegroundColor White
Write-Host ""

Write-Host "📋 PASSO 2: Navegar para Users" -ForegroundColor Cyan
Write-Host "1. No menu lateral, clique em 'Users'" -ForegroundColor White
Write-Host "2. Clique no seu usuário" -ForegroundColor White
Write-Host "3. Clique na aba 'Security credentials'" -ForegroundColor White
Write-Host ""

Write-Host "📋 PASSO 3: Criar Nova Access Key" -ForegroundColor Cyan
Write-Host "1. Role até a seção 'Access keys'" -ForegroundColor White
Write-Host "2. Clique em 'Create access key'" -ForegroundColor White
Write-Host "3. Escolha 'Application running outside AWS'" -ForegroundColor White
Write-Host "4. Clique em 'Next'" -ForegroundColor White
Write-Host "5. Adicione uma tag (opcional):" -ForegroundColor White
Write-Host "   - Key: Environment" -ForegroundColor Yellow
Write-Host "   - Value: Development" -ForegroundColor Yellow
Write-Host "6. Clique em 'Create access key'" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANTE: Copie as credenciais imediatamente!" -ForegroundColor Red
Write-Host "A Secret Access Key só é mostrada uma vez!" -ForegroundColor Red
Write-Host ""

Write-Host "📋 PASSO 4: Copiar Credenciais" -ForegroundColor Cyan
Write-Host "1. Copie o 'Access key ID'" -ForegroundColor White
Write-Host "2. Copie o 'Secret access key'" -ForegroundColor White
Write-Host "3. Clique em 'Done'" -ForegroundColor White
Write-Host ""

Write-Host "📋 PASSO 5: Reconfigurar AWS CLI" -ForegroundColor Cyan
Write-Host "Pressione ENTER quando tiver copiado as credenciais..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "🧹 Limpando configuração anterior..." -ForegroundColor Cyan
if (Test-Path "$env:USERPROFILE\.aws") {
    Remove-Item -Path "$env:USERPROFILE\.aws" -Recurse -Force
    Write-Host "✅ Configuração anterior removida" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚙️ Configurando AWS CLI com novas credenciais..." -ForegroundColor Cyan
Write-Host "Digite as credenciais quando solicitado:" -ForegroundColor Yellow
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
    }
} catch {
    Write-Host "❌ Erro ao testar credenciais:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "📚 Para mais ajuda, consulte: RESOLVER-ERRO-CREDENCIAIS.md" -ForegroundColor Cyan
