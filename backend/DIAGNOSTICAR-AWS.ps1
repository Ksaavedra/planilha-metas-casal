# Script para diagnosticar problemas com AWS CLI
# Este script testa diferentes abordagens para identificar o problema

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "🔍 Diagnóstico AWS CLI" -ForegroundColor Blue
Write-Host "=====================" -ForegroundColor Blue
Write-Host ""

# Verificar configuração atual
Write-Host "1. Verificando configuração atual..." -ForegroundColor Cyan
$Config = & $AwsCliPath configure list
Write-Host $Config
Write-Host ""

# Verificar arquivos de configuração
Write-Host "2. Verificando arquivos de configuração..." -ForegroundColor Cyan
$ConfigFile = "$env:USERPROFILE\.aws\config"
$CredentialsFile = "$env:USERPROFILE\.aws\credentials"

if (Test-Path $ConfigFile) {
    Write-Host "✅ Config file encontrado: $ConfigFile" -ForegroundColor Green
    Write-Host "Conteúdo:" -ForegroundColor Yellow
    Get-Content $ConfigFile
} else {
    Write-Host "❌ Config file não encontrado: $ConfigFile" -ForegroundColor Red
}

Write-Host ""

if (Test-Path $CredentialsFile) {
    Write-Host "✅ Credentials file encontrado: $CredentialsFile" -ForegroundColor Green
    Write-Host "Conteúdo (mascarado):" -ForegroundColor Yellow
    $Credentials = Get-Content $CredentialsFile
    foreach ($Line in $Credentials) {
        if ($Line -match "aws_secret_access_key") {
            $Parts = $Line -split "="
            if ($Parts.Length -eq 2) {
                $MaskedKey = $Parts[1].Substring(0, 4) + "*" * ($Parts[1].Length - 4)
                Write-Host "$($Parts[0])=$MaskedKey"
            } else {
                Write-Host $Line
            }
        } else {
            Write-Host $Line
        }
    }
} else {
    Write-Host "❌ Credentials file não encontrado: $CredentialsFile" -ForegroundColor Red
}

Write-Host ""

# Testar comando simples
Write-Host "3. Testando comando simples..." -ForegroundColor Cyan
try {
    $Result = & $AwsCliPath sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Credenciais funcionando!" -ForegroundColor Green
        Write-Host $Result
    } else {
        Write-Host "❌ Erro nas credenciais:" -ForegroundColor Red
        Write-Host $Result
    }
} catch {
    Write-Host "❌ Erro ao testar credenciais:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""

# Verificar conectividade
Write-Host "4. Verificando conectividade..." -ForegroundColor Cyan
try {
    $PingResult = Test-NetConnection -ComputerName "aws.amazon.com" -Port 443 -InformationLevel Quiet
    if ($PingResult) {
        Write-Host "✅ Conectividade com AWS OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Problema de conectividade com AWS" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao testar conectividade:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""

# Verificar versão do AWS CLI
Write-Host "5. Verificando versão do AWS CLI..." -ForegroundColor Cyan
try {
    $Version = & $AwsCliPath --version
    Write-Host "✅ Versão do AWS CLI:" -ForegroundColor Green
    Write-Host $Version
} catch {
    Write-Host "❌ Erro ao verificar versão:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""

# Sugestões de solução
Write-Host "6. Sugestões de solução:" -ForegroundColor Yellow
Write-Host "- Verifique se a Secret Access Key está correta (sem espaços extras)"
Write-Host "- Certifique-se de que a Access Key não expirou"
Write-Host "- Verifique se o usuário tem permissões para STS"
Write-Host "- Tente criar uma nova Access Key"
Write-Host "- Verifique se a região está correta (sa-east-1)"
Write-Host ""

Write-Host "7. Para criar nova Access Key:" -ForegroundColor Yellow
Write-Host "Acesse: https://console.aws.amazon.com/iam/" -ForegroundColor White
Write-Host "Vá em Users > Seu usuário > Security credentials" -ForegroundColor White
Write-Host "Clique em Create access key" -ForegroundColor White
Write-Host ""

Write-Host "8. Para reconfigurar:" -ForegroundColor Yellow
Write-Host "& `"$AwsCliPath`" configure" -ForegroundColor White
