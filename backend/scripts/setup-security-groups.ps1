# Script PowerShell para configurar Security Groups para Lambda + RDS
# Uso: .\setup-security-groups.ps1

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

# Verificar se AWS CLI está instalado
try {
    $null = Get-Command aws -ErrorAction Stop
} catch {
    Write-Error "AWS CLI não está instalado. Instale primeiro: https://aws.amazon.com/cli/"
    exit 1
}

# Verificar se está logado
try {
    $null = aws sts get-caller-identity 2>$null
} catch {
    Write-Error "AWS CLI não está configurado. Execute: aws configure"
    exit 1
}

Write-Status "AWS CLI configurado ✓"

# Obter informações da conta
$AccountId = aws sts get-caller-identity --query Account --output text
$Region = aws configure get region
Write-Status "Conta: $AccountId, Região: $Region"

# Listar VPCs se não foi fornecido
if ([string]::IsNullOrEmpty($VpcId)) {
    Write-Status "Listando VPCs disponíveis..."
    aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,Tags[?Key==`Name`].Value|[0]]' --output table
    $VpcId = Read-Host "Digite o VPC ID"
}

# Listar Subnets se não foram fornecidos
if ([string]::IsNullOrEmpty($SubnetId1) -or [string]::IsNullOrEmpty($SubnetId2)) {
    Write-Status "Listando Subnets na VPC $VpcId..."
    aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VpcId" --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone]' --output table
    $SubnetId1 = Read-Host "Digite a primeira Subnet ID"
    $SubnetId2 = Read-Host "Digite a segunda Subnet ID"
}

# Listar RDS se não foi fornecido
if ([string]::IsNullOrEmpty($RdsSecurityGroupId)) {
    Write-Status "Listando instâncias RDS..."
    aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,DBInstanceStatus,VpcSecurityGroups[0].VpcSecurityGroupId]' --output table
    $RdsSecurityGroupId = Read-Host "Digite o Security Group ID do RDS"
}

# Criar Security Group para Lambda
Write-Status "Criando Security Group para Lambda..."
$LambdaSgId = aws ec2 create-security-group `
    --group-name lambda-planilha-organizacao `
    --description "Security Group para Lambda da Planilha Organização" `
    --vpc-id $VpcId `
    --query 'GroupId' `
    --output text

Write-Success "Security Group do Lambda criado: $LambdaSgId"

# Configurar regras de saída do Lambda
Write-Status "Configurando regras de saída do Lambda..."

# HTTPS
aws ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 443 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

# HTTP
aws ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 80 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

# MySQL para RDS
aws ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol tcp `
    --port 3306 `
    --source-group $RdsSecurityGroupId `
    --output text | Out-Null

# DNS
aws ec2 authorize-security-group-egress `
    --group-id $LambdaSgId `
    --protocol udp `
    --port 53 `
    --cidr 0.0.0.0/0 `
    --output text | Out-Null

Write-Success "Regras de saída do Lambda configuradas ✓"

# Configurar regra de entrada do RDS
Write-Status "Configurando regra de entrada do RDS..."
aws ec2 authorize-security-group-ingress `
    --group-id $RdsSecurityGroupId `
    --protocol tcp `
    --port 3306 `
    --source-group $LambdaSgId `
    --output text | Out-Null

Write-Success "Regra de entrada do RDS configurada ✓"

# Criar arquivo de configuração
Write-Status "Criando arquivo de configuração..."
$ConfigContent = @"
# Security Groups configurados
LAMBDA_SECURITY_GROUP_ID=$LambdaSgId
RDS_SECURITY_GROUP_ID=$RdsSecurityGroupId

# Subnets
LAMBDA_SUBNET_ID_1=$SubnetId1
LAMBDA_SUBNET_ID_2=$SubnetId2

# VPC
VPC_ID=$VpcId
"@

$ConfigContent | Out-File -FilePath ".env.security-groups" -Encoding UTF8

Write-Success "Arquivo .env.security-groups criado ✓"

# Mostrar resumo
Write-Host ""
Write-Host "🎉 Configuração concluída!" -ForegroundColor $Green
Write-Host ""
Write-Host "📋 Resumo:"
Write-Host "  Lambda Security Group: $LambdaSgId"
Write-Host "  RDS Security Group: $RdsSecurityGroupId"
Write-Host "  Subnet 1: $SubnetId1"
Write-Host "  Subnet 2: $SubnetId2"
Write-Host "  VPC: $VpcId"
Write-Host ""
Write-Host "📝 Próximos passos:"
Write-Host "  1. Copie as variáveis do arquivo .env.security-groups para .env.production"
Write-Host "  2. Execute: npm run deploy:prod"
Write-Host "  3. Teste a API: curl https://your-api-gateway-url/dev/health"
Write-Host ""
Write-Success "Security Groups configurados com sucesso! 🚀"
