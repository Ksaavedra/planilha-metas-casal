# Script simplificado para configurar AWS CLI
# Este script ajuda a configurar as credenciais AWS passo a passo

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "🚀 Configuração AWS CLI - Passo a Passo" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
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
Write-Host "📋 INSTRUÇÕES PARA OBTER CREDENCIAIS:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://console.aws.amazon.com/iam/" -ForegroundColor White
Write-Host "2. Vá em 'Users' > Seu usuário > 'Security credentials'" -ForegroundColor White
Write-Host "3. Clique em 'Create access key'" -ForegroundColor White
Write-Host "4. Escolha 'Application running outside AWS'" -ForegroundColor White
Write-Host "5. Copie o Access Key ID e Secret Access Key" -ForegroundColor White
Write-Host ""

# Solicitar credenciais
Write-Host "🔑 Digite suas credenciais AWS:" -ForegroundColor Cyan
Write-Host ""

$AccessKeyId = Read-Host "AWS Access Key ID"
$SecretAccessKey = Read-Host "AWS Secret Access Key" -AsSecureString
$Region = Read-Host "Default region name [sa-east-1]"
$OutputFormat = Read-Host "Default output format [json]"

# Usar valores padrão se não fornecidos
if ([string]::IsNullOrEmpty($Region)) { $Region = "sa-east-1" }
if ([string]::IsNullOrEmpty($OutputFormat)) { $OutputFormat = "json" }

# Converter SecureString para string
$SecretAccessKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecretAccessKey))

Write-Host ""
Write-Host "⚙️ Configurando AWS CLI..." -ForegroundColor Cyan

# Configurar AWS CLI
$ConfigProcess = Start-Process -FilePath $AwsCliPath -ArgumentList "configure" -NoNewWindow -Wait -PassThru -RedirectStandardInput -RedirectStandardOutput -RedirectStandardError

# Enviar configurações
$ConfigProcess.StandardInput.WriteLine($AccessKeyId)
$ConfigProcess.StandardInput.WriteLine($SecretAccessKeyPlain)
$ConfigProcess.StandardInput.WriteLine($Region)
$ConfigProcess.StandardInput.WriteLine($OutputFormat)
$ConfigProcess.StandardInput.Close()

Write-Host "✅ Configuração concluída!" -ForegroundColor Green
Write-Host ""

# Testar configuração
Write-Host "🧪 Testando configuração..." -ForegroundColor Cyan
try {
    $TestResult = & $AwsCliPath sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Credenciais funcionando perfeitamente!" -ForegroundColor Green
        Write-Host $TestResult
        Write-Host ""
        Write-Host "🎯 Próximo passo: Execute .\EXECUTAR-COMANDOS-AWS.ps1" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Erro nas credenciais:" -ForegroundColor Red
        Write-Host $TestResult
        Write-Host ""
        Write-Host "🔧 Possíveis soluções:" -ForegroundColor Yellow
        Write-Host "- Verifique se a Secret Access Key está correta"
        Write-Host "- Certifique-se de que não há espaços extras"
        Write-Host "- Verifique se a conta AWS tem as permissões necessárias"
        Write-Host "- Tente criar uma nova Access Key"
    }
} catch {
    Write-Host "❌ Erro ao testar credenciais:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "📚 Para mais ajuda, consulte: RESOLVER-ERRO-CREDENCIAIS.md" -ForegroundColor Cyan
