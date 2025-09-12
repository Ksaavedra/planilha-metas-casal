# 🔧 Instalar e Configurar AWS CLI

Este guia explica como instalar e configurar o AWS CLI para fazer deploy do Lambda.

## 📥 Instalação

### Windows

#### Opção 1: MSI Installer (Recomendado)

1. **Baixar**: [AWS CLI MSI Installer](https://awscli.amazonaws.com/AWSCLIV2.msi)
2. **Executar**: O arquivo MSI baixado
3. **Seguir**: O assistente de instalação
4. **Verificar**: Abrir novo PowerShell e executar `aws --version`

#### Opção 2: PowerShell

```powershell
# Baixar e instalar
Invoke-WebRequest -Uri "https://awscli.amazonaws.com/AWSCLIV2.msi" -OutFile "AWSCLIV2.msi"
Start-Process msiexec.exe -Wait -ArgumentList '/I AWSCLIV2.msi /quiet'
```

#### Opção 3: Chocolatey

```powershell
# Se tiver Chocolatey instalado
choco install awscli
```

### Linux/Mac

```bash
# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Mac
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

## 🔑 Configuração

### 1. Obter Credenciais AWS

Você precisa de:

-  **Access Key ID**
-  **Secret Access Key**
-  **Região** (ex: `sa-east-1`)

### 2. Configurar AWS CLI

```bash
# Configurar credenciais
aws configure

# Será solicitado:
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region name: sa-east-1
# Default output format: json
```

### 3. Verificar Configuração

```bash
# Verificar se está funcionando
aws sts get-caller-identity

# Deve retornar algo como:
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/YourUserName"
}
```

## 🚀 Após Instalação

Depois de instalar e configurar o AWS CLI, execute:

```powershell
# Configurar Security Groups
.\scripts\setup-security-groups.ps1

# Fazer deploy
npm run deploy:prod
```

## 🔐 Permissões Necessárias

Sua conta AWS precisa das seguintes permissões:

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Effect": "Allow",
         "Action": [
            "ec2:CreateSecurityGroup",
            "ec2:AuthorizeSecurityGroupEgress",
            "ec2:AuthorizeSecurityGroupIngress",
            "ec2:DescribeSecurityGroups",
            "ec2:DescribeVpcs",
            "ec2:DescribeSubnets",
            "rds:DescribeDBInstances",
            "lambda:CreateFunction",
            "lambda:UpdateFunctionCode",
            "lambda:UpdateFunctionConfiguration",
            "lambda:GetFunction",
            "iam:CreateRole",
            "iam:AttachRolePolicy",
            "iam:PassRole",
            "apigateway:*",
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "cloudformation:*"
         ],
         "Resource": "*"
      }
   ]
}
```

## 🧪 Teste Rápido

```bash
# Listar VPCs (deve funcionar)
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock]' --output table

# Listar RDS (deve funcionar)
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address]' --output table
```

## 🚨 Troubleshooting

### Erro: "aws: command not found"

**Solução**:

1. Reiniciar o terminal/PowerShell
2. Verificar se o AWS CLI foi instalado corretamente
3. Adicionar ao PATH se necessário

### Erro: "Unable to locate credentials"

**Solução**:

```bash
# Reconfigurar
aws configure

# Ou definir variáveis de ambiente
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=sa-east-1
```

### Erro: "Access Denied"

**Solução**:

1. Verificar se as credenciais estão corretas
2. Verificar se a conta tem as permissões necessárias
3. Verificar se a região está correta

## 📚 Recursos

-  [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
-  [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
-  [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

---

Após instalar e configurar o AWS CLI, você poderá executar o script de configuração dos Security Groups! 🚀
