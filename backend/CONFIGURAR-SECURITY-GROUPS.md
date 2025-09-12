# 🔒 Configurar Security Groups para Lambda + RDS

Este guia explica como configurar os Security Groups da AWS para permitir que o Lambda acesse o RDS MySQL.

## 📋 Pré-requisitos

1. **AWS CLI configurado** com credenciais
2. **RDS MySQL** já criado
3. **VPC** configurada
4. **Subnets** públicas/privadas

## 🎯 Objetivo

Criar uma conexão segura entre:

```
Lambda (VPC) → Security Group → RDS MySQL
```

## 🔧 Passo a Passo

### 1. Identificar Recursos Existentes

Primeiro, vamos identificar os recursos que você já tem:

```bash
# Listar VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,Tags[?Key==`Name`].Value|[0]]' --output table

# Listar Subnets
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,VpcId,CidrBlock,AvailabilityZone]' --output table

# Listar Security Groups
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName,VpcId,Description]' --output table

# Listar RDS
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,DBInstanceStatus,VpcSecurityGroups[0].VpcSecurityGroupId]' --output table
```

### 2. Criar Security Group para Lambda

```bash
# Criar Security Group para Lambda
aws ec2 create-security-group \
    --group-name lambda-planilha-organizacao \
    --description "Security Group para Lambda da Planilha Organização" \
    --vpc-id vpc-xxxxxxxxx

# Anotar o GroupId retornado (ex: sg-xxxxxxxxx)
```

### 3. Configurar Regras do Security Group do Lambda

```bash
# Permitir saída HTTPS (443) para internet
aws ec2 authorize-security-group-egress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Permitir saída HTTP (80) para internet
aws ec2 authorize-security-group-egress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Permitir saída MySQL (3306) para o Security Group do RDS
aws ec2 authorize-security-group-egress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 3306 \
    --source-group sg-yyyyyyyyy

# Permitir saída DNS (53) para resolver nomes
aws ec2 authorize-security-group-egress \
    --group-id sg-xxxxxxxxx \
    --protocol udp \
    --port 53 \
    --cidr 0.0.0.0/0
```

### 4. Configurar Security Group do RDS

```bash
# Permitir entrada MySQL (3306) do Security Group do Lambda
aws ec2 authorize-security-group-ingress \
    --group-id sg-yyyyyyyyy \
    --protocol tcp \
    --port 3306 \
    --source-group sg-xxxxxxxxx
```

### 5. Configurar Variáveis de Ambiente

Atualize seu arquivo `.env.production`:

```bash
# Security Groups
LAMBDA_SECURITY_GROUP_ID=sg-xxxxxxxxx
RDS_SECURITY_GROUP_ID=sg-yyyyyyyyy

# Subnets (escolha 2 subnets em AZs diferentes)
LAMBDA_SUBNET_ID_1=subnet-xxxxxxxxx
LAMBDA_SUBNET_ID_2=subnet-yyyyyyyyy

# RDS MySQL
DATABASE_URL="mysql://admin:_gxeF8*P1-a*bQ|gv4W(z!X3gtTZ@myapp-mysql-dev.c16kosqkuklw.sa-east-1.rds.amazonaws.com:3306/planilha_organizacao"
```

## 🖥️ Configuração via Console AWS

### 1. Security Group do Lambda

1. **AWS Console** → **EC2** → **Security Groups**
2. **Create Security Group**:

   -  **Name**: `lambda-planilha-organizacao`
   -  **Description**: `Security Group para Lambda da Planilha Organização`
   -  **VPC**: Selecione sua VPC

3. **Outbound Rules**:
   ```
   Type          Protocol    Port Range    Destination
   HTTPS         TCP         443           0.0.0.0/0
   HTTP          TCP         80            0.0.0.0/0
   MySQL/Aurora  TCP         3306          sg-yyyyyyyyy (RDS Security Group)
   DNS           UDP         53            0.0.0.0/0
   ```

### 2. Security Group do RDS

1. **AWS Console** → **EC2** → **Security Groups**
2. Encontre o Security Group do seu RDS
3. **Inbound Rules** → **Edit**:
   ```
   Type          Protocol    Port Range    Source
   MySQL/Aurora  TCP         3306          sg-xxxxxxxxx (Lambda Security Group)
   ```

## 🧪 Testar Configuração

### 1. Deploy do Lambda

```bash
# Fazer deploy
npm run deploy:prod
```

### 2. Testar Conexão

```bash
# Testar health check
curl https://your-api-gateway-url/dev/health

# Resposta esperada:
{
  "status": "ok",
  "database": "mysql",
  "timestamp": "2025-01-11T21:30:00.000Z",
  "message": "API funcionando perfeitamente com autenticação!"
}
```

### 3. Verificar Logs

```bash
# Ver logs do Lambda
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/planilha-organizacao-api"

# Ver logs em tempo real
aws logs tail /aws/lambda/planilha-organizacao-api-prod-api --follow
```

## 🚨 Troubleshooting

### Erro: "Can't reach database server"

**Possíveis causas:**

1. Security Groups não configurados corretamente
2. Lambda não está na VPC
3. RDS não está acessível

**Soluções:**

```bash
# Verificar Security Groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx sg-yyyyyyyyy

# Verificar VPC do Lambda
aws lambda get-function --function-name planilha-organizacao-api-prod-api

# Testar conectividade de rede
aws ec2 describe-network-interfaces --filters "Name=group-id,Values=sg-xxxxxxxxx"
```

### Erro: "Timeout"

**Possíveis causas:**

1. Lambda timeout muito baixo
2. RDS performance issues
3. Cold start

**Soluções:**

```bash
# Aumentar timeout no serverless.yml
timeout: 60  # 60 segundos

# Verificar métricas do RDS
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name DatabaseConnections \
    --dimensions Name=DBInstanceIdentifier,Value=myapp-mysql-dev \
    --start-time 2025-01-11T00:00:00Z \
    --end-time 2025-01-11T23:59:59Z \
    --period 300 \
    --statistics Average
```

## 📊 Monitoramento

### 1. CloudWatch Metrics

**Lambda:**

-  Duration
-  Errors
-  Throttles
-  Concurrent Executions

**RDS:**

-  DatabaseConnections
-  CPUUtilization
-  FreeableMemory
-  ReadLatency
-  WriteLatency

### 2. Alertas Recomendados

```bash
# Criar alarme para erros do Lambda
aws cloudwatch put-metric-alarm \
    --alarm-name "Lambda-Errors" \
    --alarm-description "Erros no Lambda" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=FunctionName,Value=planilha-organizacao-api-prod-api
```

## 🔐 Segurança Adicional

### 1. Secrets Manager

Para credenciais sensíveis:

```bash
# Criar secret
aws secretsmanager create-secret \
    --name "planilha-organizacao/database" \
    --description "Credenciais do banco de dados" \
    --secret-string '{"username":"admin","password":"_gxeF8*P1-a*bQ|gv4W(z!X3gtTZ"}'

# Atualizar Lambda para usar Secrets Manager
```

### 2. IAM Roles

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Effect": "Allow",
         "Action": ["rds:DescribeDBInstances", "rds:Connect"],
         "Resource": "*"
      },
      {
         "Effect": "Allow",
         "Action": ["secretsmanager:GetSecretValue"],
         "Resource": "arn:aws:secretsmanager:sa-east-1:123456789012:secret:planilha-organizacao/database-*"
      }
   ]
}
```

## 📝 Checklist Final

-  [ ] Security Group do Lambda criado
-  [ ] Regras de saída configuradas no Lambda
-  [ ] Regra de entrada configurada no RDS
-  [ ] Variáveis de ambiente atualizadas
-  [ ] Lambda deployado com VPC
-  [ ] Teste de conectividade realizado
-  [ ] Logs verificados
-  [ ] Monitoramento configurado

## 🎯 Resultado Esperado

Após a configuração, você deve ter:

1. **Lambda** rodando na VPC com acesso ao RDS
2. **API Gateway** funcionando
3. **Conexão segura** entre Lambda e RDS
4. **Monitoramento** ativo
5. **Logs** funcionando

## 📚 Recursos Adicionais

-  [AWS Security Groups Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/working-with-security-groups.html)
-  [Lambda VPC Configuration](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)
-  [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html)
