# Script para configurar Security Groups manualmente
# Use este script se não tiver AWS CLI instalado

param(
    [string]$VpcId = "",
    [string]$RdsSecurityGroupId = "",
    [string]$SubnetId1 = "",
    [string]$SubnetId2 = ""
)

# Cores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

Write-Status "🔧 Configuração Manual de Security Groups"
Write-Host ""
Write-Warning "Este script gera os comandos AWS CLI que você precisa executar manualmente."
Write-Host ""

# Coletar informações
if ([string]::IsNullOrEmpty($VpcId)) {
    $VpcId = Read-Host "Digite o VPC ID (ex: vpc-12345678)"
}

if ([string]::IsNullOrEmpty($RdsSecurityGroupId)) {
    $RdsSecurityGroupId = Read-Host "Digite o Security Group ID do RDS (ex: sg-12345678)"
}

if ([string]::IsNullOrEmpty($SubnetId1)) {
    $SubnetId1 = Read-Host "Digite a primeira Subnet ID (ex: subnet-12345678)"
}

if ([string]::IsNullOrEmpty($SubnetId2)) {
    $SubnetId2 = Read-Host "Digite a segunda Subnet ID (ex: subnet-87654321)"
}

Write-Host ""
Write-Status "📋 Informações coletadas:"
Write-Host "  VPC ID: $VpcId"
Write-Host "  RDS Security Group: $RdsSecurityGroupId"
Write-Host "  Subnet 1: $SubnetId1"
Write-Host "  Subnet 2: $SubnetId2"
Write-Host ""

# Gerar comandos AWS CLI
Write-Status "🔧 Comandos AWS CLI para executar:"
Write-Host ""

Write-Host "# 1. Criar Security Group para Lambda" -ForegroundColor $Yellow
Write-Host "aws ec2 create-security-group \"
Write-Host "    --group-name lambda-planilha-organizacao \"
Write-Host "    --description `"Security Group para Lambda da Planilha Organização`" \"
Write-Host "    --vpc-id $VpcId"
Write-Host ""

Write-Host "# 2. Anotar o GroupId retornado (ex: sg-xxxxxxxxx)" -ForegroundColor $Yellow
Write-Host "# Substitua LAMBDA_SG_ID pelo ID retornado nos comandos abaixo"
Write-Host ""

Write-Host "# 3. Configurar regras de saída do Lambda" -ForegroundColor $Yellow
Write-Host "aws ec2 authorize-security-group-egress \"
Write-Host "    --group-id LAMBDA_SG_ID \"
Write-Host "    --protocol tcp \"
Write-Host "    --port 443 \"
Write-Host "    --cidr 0.0.0.0/0"
Write-Host ""

Write-Host "aws ec2 authorize-security-group-egress \"
Write-Host "    --group-id LAMBDA_SG_ID \"
Write-Host "    --protocol tcp \"
Write-Host "    --port 80 \"
Write-Host "    --cidr 0.0.0.0/0"
Write-Host ""

Write-Host "aws ec2 authorize-security-group-egress \"
Write-Host "    --group-id LAMBDA_SG_ID \"
Write-Host "    --protocol tcp \"
Write-Host "    --port 3306 \"
Write-Host "    --source-group $RdsSecurityGroupId"
Write-Host ""

Write-Host "aws ec2 authorize-security-group-egress \"
Write-Host "    --group-id LAMBDA_SG_ID \"
Write-Host "    --protocol udp \"
Write-Host "    --port 53 \"
Write-Host "    --cidr 0.0.0.0/0"
Write-Host ""

Write-Host "# 4. Configurar regra de entrada do RDS" -ForegroundColor $Yellow
Write-Host "aws ec2 authorize-security-group-ingress \"
Write-Host "    --group-id $RdsSecurityGroupId \"
Write-Host "    --protocol tcp \"
Write-Host "    --port 3306 \"
Write-Host "    --source-group LAMBDA_SG_ID"
Write-Host ""

# Criar arquivo de configuração
Write-Status "📝 Criando arquivo de configuração..."
$ConfigContent = @"
# Security Groups - CONFIGURE APÓS EXECUTAR OS COMANDOS AWS CLI
# Substitua LAMBDA_SG_ID pelo ID retornado do comando create-security-group

LAMBDA_SECURITY_GROUP_ID=LAMBDA_SG_ID
RDS_SECURITY_GROUP_ID=$RdsSecurityGroupId

# Subnets
LAMBDA_SUBNET_ID_1=$SubnetId1
LAMBDA_SUBNET_ID_2=$SubnetId2

# VPC
VPC_ID=$VpcId

# RDS MySQL
DATABASE_URL="mysql://admin:_gxeF8*P1-a*bQ|gv4W(z!X3gtTZ@myapp-mysql-dev.c16kosqkuklw.sa-east-1.rds.amazonaws.com:3306/planilha_organizacao"

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-2025-producao
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://seu-frontend.com
"@

$ConfigContent | Out-File -FilePath ".env.security-groups-manual" -Encoding UTF8

Write-Success "Arquivo .env.security-groups-manual criado ✓"
Write-Host ""

Write-Status "📋 Próximos passos:"
Write-Host "1. Instale o AWS CLI: https://aws.amazon.com/cli/"
Write-Host "2. Configure: aws configure"
Write-Host "3. Execute os comandos acima no terminal"
Write-Host "4. Anote o LAMBDA_SG_ID retornado"
Write-Host "5. Edite o arquivo .env.security-groups-manual"
Write-Host "6. Copie as variáveis para .env.production"
Write-Host "7. Execute: npm run deploy:prod"
Write-Host ""

Write-Warning "⚠️  IMPORTANTE:"
Write-Host "- Substitua LAMBDA_SG_ID pelo ID real retornado"
Write-Host "- Verifique se as credenciais AWS estão corretas"
Write-Host "- Confirme que o RDS está na mesma VPC"
Write-Host ""

Write-Success "Configuração manual preparada! 🚀"
