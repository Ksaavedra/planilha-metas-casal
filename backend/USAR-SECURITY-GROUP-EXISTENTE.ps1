# Script para usar o Security Group existente e configurar as regras
# Este script usa o Security Group já criado e configura as regras necessárias

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "🔧 Usando Security Group existente..." -ForegroundColor Green
Write-Host ""

# Verificar se AWS CLI está instalado
if (-not (Test-Path $AwsCliPath)) {
    Write-Host "❌ AWS CLI não encontrado em: $AwsCliPath" -ForegroundColor Red
    exit 1
}

# Verificar se está configurado
try {
    $null = & $AwsCliPath sts get-caller-identity 2>$null
    Write-Host "✅ AWS CLI configurado!" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI não configurado. Execute: & `"$AwsCliPath`" configure" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Buscando Security Group existente..." -ForegroundColor Cyan

# Buscar Security Group existente
$SgResult = & $AwsCliPath ec2 describe-security-groups `
    --group-names lambda-planilha-organizacao `
    --query 'SecurityGroups[0].GroupId' `
    --output text

if ($SgResult -and $SgResult -ne "None") {
    $LambdaSgId = $SgResult
    Write-Host "✅ Security Group encontrado: $LambdaSgId" -ForegroundColor Green
} else {
    Write-Host "❌ Security Group não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Configurando regras..." -ForegroundColor Cyan

# 1. Configurar regras de saída do Lambda
Write-Host "1. Configurando regras de saída do Lambda..." -ForegroundColor Cyan

# HTTPS
Write-Host "   - Configurando HTTPS (porta 443)..." -ForegroundColor White
& $AwsCliPath ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 443 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

# HTTP
Write-Host "   - Configurando HTTP (porta 80)..." -ForegroundColor White
& $AwsCliPath ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 80 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

# MySQL para RDS
Write-Host "   - Configurando MySQL (porta 3306)..." -ForegroundColor White
& $AwsCliPath ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 3306 `
    --source-group sg-0ef62ae990699c842 `
    --output text | Out-Null

# DNS
Write-Host "   - Configurando DNS (porta 53)..." -ForegroundColor White
& $AwsCliPath ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol udp `
    --port 53 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

Write-Host "✅ Regras de saída configuradas" -ForegroundColor Green

# 2. Configurar regra de entrada do RDS
Write-Host "2. Configurando regra de entrada do RDS..." -ForegroundColor Cyan
& $AwsCliPath ec2 authorize-security-group-ingress `
    --group-id sg-0ef62ae990699c842 `
    --protocol tcp `
    --port 3306 `
    --source-group $LambdaSgId `
    --output text | Out-Null

Write-Host "✅ Regra de entrada do RDS configurada" -ForegroundColor Green

# 3. Atualizar arquivo de configuração
Write-Host "3. Atualizando arquivo de configuração..." -ForegroundColor Cyan
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

# 4. Mostrar resumo
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
