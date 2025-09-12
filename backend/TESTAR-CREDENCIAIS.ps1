# Script para testar credenciais AWS
# Este script ajuda a diagnosticar problemas com credenciais

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "🔍 Testando credenciais AWS..." -ForegroundColor Blue
Write-Host ""

# Verificar configuração atual
Write-Host "1. Verificando configuração atual..." -ForegroundColor Cyan
$Config = & $AwsCliPath configure list
Write-Host $Config
Write-Host ""

# Testar comando simples
Write-Host "2. Testando comando simples..." -ForegroundColor Cyan
try {
    $Result = & $AwsCliPath sts get-caller-identity
    Write-Host "✅ Credenciais funcionando!" -ForegroundColor Green
    Write-Host $Result
} catch {
    Write-Host "❌ Erro nas credenciais:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "3. Possíveis soluções:" -ForegroundColor Yellow
Write-Host "- Verifique se a Secret Access Key está correta"
Write-Host "- Certifique-se de que não há espaços extras"
Write-Host "- Verifique se a conta AWS tem as permissões necessárias"
Write-Host "- Tente criar uma nova Access Key"
Write-Host ""

Write-Host "4. Para reconfigurar:" -ForegroundColor Yellow
Write-Host "& `"$AwsCliPath`" configure" -ForegroundColor White
Write-Host ""

Write-Host "5. Para verificar permissões:" -ForegroundColor Yellow
Write-Host "Acesse: https://console.aws.amazon.com/iam/" -ForegroundColor White
Write-Host "Vá em Users > Seu usuário > Permissions" -ForegroundColor White
Write-Host ""

Write-Host "6. Permissões necessárias:" -ForegroundColor Yellow
Write-Host "- EC2FullAccess (ou permissões específicas para Security Groups)"
Write-Host "- RDSReadOnlyAccess"
Write-Host "- LambdaFullAccess"
Write-Host "- IAMFullAccess"
Write-Host "- CloudFormationFullAccess"
Write-Host ""
