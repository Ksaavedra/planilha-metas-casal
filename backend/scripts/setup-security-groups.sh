#!/bin/bash

# Script para configurar Security Groups para Lambda + RDS
# Uso: ./setup-security-groups.sh

set -e

echo "🔒 Configurando Security Groups para Lambda + RDS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se AWS CLI está configurado
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI não está instalado. Instale primeiro: https://aws.amazon.com/cli/"
    exit 1
fi

# Verificar se está logado
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI não está configurado. Execute: aws configure"
    exit 1
fi

print_status "AWS CLI configurado ✓"

# Obter informações da conta
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
print_status "Conta: $ACCOUNT_ID, Região: $REGION"

# Listar VPCs
print_status "Listando VPCs disponíveis..."
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,Tags[?Key==`Name`].Value|[0]]' --output table

echo ""
read -p "Digite o VPC ID: " VPC_ID

# Listar Subnets
print_status "Listando Subnets na VPC $VPC_ID..."
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone]' --output table

echo ""
read -p "Digite a primeira Subnet ID: " SUBNET_ID_1
read -p "Digite a segunda Subnet ID: " SUBNET_ID_2

# Listar RDS
print_status "Listando instâncias RDS..."
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,DBInstanceStatus,VpcSecurityGroups[0].VpcSecurityGroupId]' --output table

echo ""
read -p "Digite o Security Group ID do RDS: " RDS_SECURITY_GROUP_ID

# Criar Security Group para Lambda
print_status "Criando Security Group para Lambda..."
LAMBDA_SG_ID=$(aws ec2 create-security-group \
    --group-name lambda-planilha-organizacao \
    --description "Security Group para Lambda da Planilha Organização" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

print_success "Security Group do Lambda criado: $LAMBDA_SG_ID"

# Configurar regras de saída do Lambda
print_status "Configurando regras de saída do Lambda..."

# HTTPS
aws ec2 authorize-security-group-egress \
    --group-id $LAMBDA_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --output text > /dev/null

# HTTP
aws ec2 authorize-security-group-egress \
    --group-id $LAMBDA_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --output text > /dev/null

# MySQL para RDS
aws ec2 authorize-security-group-egress \
    --group-id $LAMBDA_SG_ID \
    --protocol tcp \
    --port 3306 \
    --source-group $RDS_SECURITY_GROUP_ID \
    --output text > /dev/null

# DNS
aws ec2 authorize-security-group-egress \
    --group-id $LAMBDA_SG_ID \
    --protocol udp \
    --port 53 \
    --cidr 0.0.0.0/0 \
    --output text > /dev/null

print_success "Regras de saída do Lambda configuradas ✓"

# Configurar regra de entrada do RDS
print_status "Configurando regra de entrada do RDS..."
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SECURITY_GROUP_ID \
    --protocol tcp \
    --port 3306 \
    --source-group $LAMBDA_SG_ID \
    --output text > /dev/null

print_success "Regra de entrada do RDS configurada ✓"

# Criar arquivo de configuração
print_status "Criando arquivo de configuração..."
cat > .env.security-groups << EOF
# Security Groups configurados
LAMBDA_SECURITY_GROUP_ID=$LAMBDA_SG_ID
RDS_SECURITY_GROUP_ID=$RDS_SECURITY_GROUP_ID

# Subnets
LAMBDA_SUBNET_ID_1=$SUBNET_ID_1
LAMBDA_SUBNET_ID_2=$SUBNET_ID_2

# VPC
VPC_ID=$VPC_ID
EOF

print_success "Arquivo .env.security-groups criado ✓"

# Mostrar resumo
echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Resumo:"
echo "  Lambda Security Group: $LAMBDA_SG_ID"
echo "  RDS Security Group: $RDS_SECURITY_GROUP_ID"
echo "  Subnet 1: $SUBNET_ID_1"
echo "  Subnet 2: $SUBNET_ID_2"
echo "  VPC: $VPC_ID"
echo ""
echo "📝 Próximos passos:"
echo "  1. Copie as variáveis do arquivo .env.security-groups para .env.production"
echo "  2. Execute: npm run deploy:prod"
echo "  3. Teste a API: curl https://your-api-gateway-url/dev/health"
echo ""
print_success "Security Groups configurados com sucesso! 🚀"
