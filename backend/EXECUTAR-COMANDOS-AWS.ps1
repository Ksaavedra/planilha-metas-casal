# Script para executar os comandos AWS CLI
# Execute este script após instalar o AWS CLI

Write-Host "🚀 Executando comandos AWS CLI para configurar Security Groups..." -ForegroundColor Green
Write-Host ""

# Verificar se AWS CLI está instalado
$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
if (Test-Path $AwsCliPath) {
    Write-Host "✅ AWS CLI encontrado!" -ForegroundColor Green
    $AwsCommand = $AwsCliPath
} else {
    Write-Host "❌ AWS CLI não encontrado. Instale primeiro:" -ForegroundColor Red
    Write-Host "   https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host "   Ou execute: winget install Amazon.AWSCLI" -ForegroundColor Yellow
    exit 1
}

# Verificar se está configurado
try {
    $null = & $AwsCommand sts get-caller-identity 2>$null
    Write-Host "✅ AWS CLI configurado!" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI não configurado. Execute: & `"$AwsCommand`" configure" -ForegroundColor Red
    Write-Host "   Será solicitado:" -ForegroundColor Yellow
    Write-Host "   - AWS Access Key ID" -ForegroundColor Yellow
    Write-Host "   - AWS Secret Access Key" -ForegroundColor Yellow
    Write-Host "   - Default region name: sa-east-1" -ForegroundColor Yellow
    Write-Host "   - Default output format: json" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Executando comandos..." -ForegroundColor Blue

# 1. Criar Security Group para Lambda
Write-Host "1. Criando Security Group para Lambda..." -ForegroundColor Cyan
$LambdaSgResult = & $AwsCommand ec2 create-security-group `
    --group-name lambda-planilha-organizacao `
    --description "Security Group for Lambda Planilha Organizacao" `
    --vpc-id vpc-0ecfd9f0b57577248 `
    --output text

if ($LASTEXITCODE -eq 0) {
    $LambdaSgId = ($LambdaSgResult -split ' ')[0]
    Write-Host "✅ Security Group criado: $LambdaSgId" -ForegroundColor Green
} else {
    Write-Host "❌ Erro ao criar Security Group" -ForegroundColor Red
    exit 1
}

# 2. Configurar regras de saída do Lambda
Write-Host "2. Configurando regras de saída do Lambda..." -ForegroundColor Cyan

# HTTPS
& $AwsCommand ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 443 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

# HTTP
& $AwsCommand ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 80 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

# MySQL para RDS
& $AwsCommand ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 3306 `
    --source-group sg-0ef62ae990699c842 `
    --output text | Out-Null

# DNS
& $AwsCommand ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol udp `
    --port 53 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

Write-Host "✅ Regras de saída configuradas" -ForegroundColor Green

# 3. Configurar regra de entrada do RDS
Write-Host "3. Configurando regra de entrada do RDS..." -ForegroundColor Cyan
& $AwsCommand ec2 authorize-security-group-ingress `
    --group-id sg-0ef62ae990699c842 `
    --protocol tcp `
    --port 3306 `
    --source-group $LambdaSgId `
    --output text | Out-Null

Write-Host "✅ Regra de entrada do RDS configurada" -ForegroundColor Green

# 4. Atualizar arquivo de configuração
Write-Host "4. Atualizando arquivo de configuração..." -ForegroundColor Cyan
$ConfigContent = @"
# Security Groups configurados
LAMBDA_SECURITY_GROUP_ID=$LambdaSgId
RDS_SECURITY_GROUP_ID=sg-0ef62ae990699c842

# Subnets
LAMBDA_SUBNET_ID_1=subnet-0f32a8566046f10c6
LAMBDA_SUBNET_ID_2=subnet-096e044ea8769b673

# VPC
VPC_ID=vpc-0ecfd9f0b57577248

# RDS MySQL
DATABASE_URL="mysql://admin:_gxeF8*P1-a*bQ|gv4W(z!X3gtTZ@myapp-mysql-dev.c16kosqkuklw.sa-east-1.rds.amazonaws.com:3306/planilha_organizacao"

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-2025-producao
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://seu-frontend.com
"@

$ConfigContent | Out-File -FilePath ".env.production" -Encoding UTF8

Write-Host "✅ Arquivo .env.production criado" -ForegroundColor Green

# 5. Mostrar resumo
Write-Host ""
Write-Host "🎉 Configuração concluída com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Resumo:" -ForegroundColor Blue
Write-Host "  Lambda Security Group: $LambdaSgId" -ForegroundColor White
Write-Host "  RDS Security Group: sg-0ef62ae990699c842" -ForegroundColor White
Write-Host "  Subnet 1: subnet-0f32a8566046f10c6" -ForegroundColor White
Write-Host "  Subnet 2: subnet-096e044ea8769b673" -ForegroundColor White
Write-Host "  VPC: vpc-0ecfd9f0b57577248" -ForegroundColor White
Write-Host ""
Write-Host "📝 Próximo passo:" -ForegroundColor Blue
Write-Host "  Execute: npm run deploy:prod" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Security Groups configurados! Pronto para deploy!" -ForegroundColor Green
