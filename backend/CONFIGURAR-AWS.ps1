# Script para configurar AWS CLI
# Execute este script para configurar suas credenciais AWS

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "🔑 Configurando AWS CLI..." -ForegroundColor Green
Write-Host ""
Write-Host "Você precisa das seguintes informações:" -ForegroundColor Yellow
Write-Host "1. AWS Access Key ID" -ForegroundColor White
Write-Host "2. AWS Secret Access Key" -ForegroundColor White
Write-Host "3. Default region name: sa-east-1" -ForegroundColor White
Write-Host "4. Default output format: json" -ForegroundColor White
Write-Host ""

Write-Host "Para obter suas credenciais:" -ForegroundColor Cyan
Write-Host "1. Acesse: https://console.aws.amazon.com/iam/" -ForegroundColor White
Write-Host "2. Vá em 'Users' > Seu usuário > 'Security credentials'" -ForegroundColor White
Write-Host "3. Clique em 'Create access key'" -ForegroundColor White
Write-Host "4. Copie o Access Key ID e Secret Access Key" -ForegroundColor White
Write-Host ""

$Continue = Read-Host "Tem suas credenciais AWS? (s/n)"
if ($Continue -ne "s" -and $Continue -ne "S") {
    Write-Host "Configure suas credenciais AWS primeiro e execute este script novamente." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Executando: aws configure" -ForegroundColor Blue
Write-Host ""

# Executar aws configure
& $AwsCliPath configure

Write-Host ""
Write-Host "Testando configuração..." -ForegroundColor Blue

try {
    $Result = & $AwsCliPath sts get-caller-identity
    Write-Host "✅ AWS CLI configurado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Informações da conta:" -ForegroundColor Cyan
    Write-Host $Result
    Write-Host ""
    Write-Host "Próximo passo: Execute .\EXECUTAR-COMANDOS-AWS.ps1" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Erro na configuração. Verifique suas credenciais." -ForegroundColor Red
    Write-Host "Execute novamente: & `"$AwsCliPath`" configure" -ForegroundColor Yellow
}
