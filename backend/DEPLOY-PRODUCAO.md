# 🚀 Deploy para Produção - Lambda + RDS

Guia completo para fazer deploy do backend para AWS Lambda + RDS MySQL.

## 📋 Checklist Pré-Deploy

-  [ ] AWS CLI configurado
-  [ ] RDS MySQL criado e funcionando
-  [ ] VPC configurada
-  [ ] Subnets públicas/privadas criadas
-  [ ] Serverless Framework instalado

## 🔧 Passo 1: Configurar Security Groups

### Opção A: Script Automático (Recomendado)

```powershell
# Windows PowerShell
.\scripts\setup-security-groups.ps1

# Linux/Mac
chmod +x scripts/setup-security-groups.sh
./scripts/setup-security-groups.sh
```

### Opção B: Manual

```bash
# 1. Criar Security Group para Lambda
aws ec2 create-security-group \
    --group-name lambda-planilha-organizacao \
    --description "Security Group para Lambda" \
    --vpc-id vpc-xxxxxxxxx

# 2. Configurar regras de saída do Lambda
aws ec2 authorize-security-group-egress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 3306 \
    --source-group sg-yyyyyyyyy

# 3. Configurar regra de entrada do RDS
aws ec2 authorize-security-group-ingress \
    --group-id sg-yyyyyyyyy \
    --protocol tcp \
    --port 3306 \
    --source-group sg-xxxxxxxxx
```

## 🔧 Passo 2: Configurar Variáveis de Ambiente

Criar arquivo `.env.production`:

```bash
# Copiar exemplo
cp env.production.example .env.production

# Editar com suas configurações
```

Conteúdo do `.env.production`:

```env
# Ambiente
NODE_ENV=production

# RDS MySQL
DATABASE_URL="mysql://admin:_gxeF8*P1-a*bQ|gv4W(z!X3gtTZ@myapp-mysql-dev.c16kosqkuklw.sa-east-1.rds.amazonaws.com:3306/planilha_organizacao"

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-2025-producao
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://seu-frontend.com

# AWS Lambda Configuration
LAMBDA_SECURITY_GROUP_ID=sg-xxxxxxxxx
LAMBDA_SUBNET_ID_1=subnet-xxxxxxxxx
LAMBDA_SUBNET_ID_2=subnet-yyyyyyyyy
```

## 🔧 Passo 3: Deploy

```bash
# Build e deploy para produção
npm run deploy:prod

# Ou manualmente
npm run build:lambda
serverless deploy --stage prod
```

## 🧪 Passo 4: Testar

### Teste Automático

```powershell
# Windows
.\scripts\test-connectivity.ps1 -ApiUrl "https://sua-api-gateway-url"

# Linux/Mac
./scripts/test-connectivity.sh "https://sua-api-gateway-url"
```

### Teste Manual

```bash
# Health check
curl https://sua-api-gateway-url/dev/health

# Resposta esperada:
{
  "status": "ok",
  "database": "mysql",
  "timestamp": "2025-01-11T21:30:00.000Z",
  "message": "API funcionando perfeitamente com autenticação!"
}
```

## 📊 Monitoramento

### Ver Logs

```bash
# Logs em tempo real
aws logs tail /aws/lambda/planilha-organizacao-api-prod-api --follow

# Logs das últimas horas
aws logs tail /aws/lambda/planilha-organizacao-api-prod-api --since 2h
```

### Ver Métricas

```bash
# Métricas do Lambda
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Duration \
    --dimensions Name=FunctionName,Value=planilha-organizacao-api-prod-api \
    --start-time 2025-01-11T00:00:00Z \
    --end-time 2025-01-11T23:59:59Z \
    --period 300 \
    --statistics Average
```

## 🚨 Troubleshooting

### Erro: "Can't reach database server"

**Causa**: Security Groups não configurados corretamente

**Solução**:

```bash
# Verificar Security Groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx sg-yyyyyyyyy

# Verificar VPC do Lambda
aws lambda get-function --function-name planilha-organizacao-api-prod-api
```

### Erro: "Timeout"

**Causa**: Lambda timeout muito baixo

**Solução**:

```yaml
# serverless.yml
provider:
   timeout: 60 # Aumentar para 60 segundos
```

### Erro: "CORS"

**Causa**: Frontend URL não configurada

**Solução**:

```bash
# Atualizar FRONTEND_URL
export FRONTEND_URL=https://seu-frontend.com
npm run deploy:prod
```

## 🔄 CI/CD com GitHub Actions

Criar `.github/workflows/deploy-lambda.yml`:

```yaml
name: Deploy Lambda

on:
   push:
      branches: [main]
      paths: ['backend/**']

jobs:
   deploy:
      runs-on: ubuntu-latest
      steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
              node-version: '18'
              cache: 'npm'
              cache-dependency-path: backend/package-lock.json

         - name: Install dependencies
           run: |
              cd backend
              npm ci

         - name: Build Lambda
           run: |
              cd backend
              npm run build:lambda

         - name: Deploy to AWS
           run: |
              cd backend
              npm run deploy:prod
           env:
              AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
              AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
              DATABASE_URL: ${{ secrets.DATABASE_URL }}
              JWT_SECRET: ${{ secrets.JWT_SECRET }}
              LAMBDA_SECURITY_GROUP_ID: ${{ secrets.LAMBDA_SECURITY_GROUP_ID }}
              LAMBDA_SUBNET_ID_1: ${{ secrets.LAMBDA_SUBNET_ID_1 }}
              LAMBDA_SUBNET_ID_2: ${{ secrets.LAMBDA_SUBNET_ID_2 }}
```

## 📝 Comandos Úteis

```bash
# Ver informações do deploy
serverless info --stage prod

# Ver logs
serverless logs -f api --tail --stage prod

# Remover stack
serverless remove --stage prod

# Invocar função localmente
serverless invoke local -f api --data '{"httpMethod":"GET","path":"/health"}'

# Ver métricas
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Errors \
    --dimensions Name=FunctionName,Value=planilha-organizacao-api-prod-api \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --period 300 \
    --statistics Sum
```

## 🎯 Resultado Final

Após o deploy bem-sucedido, você terá:

1. **API Gateway URL**: `https://xxxxxxxxx.execute-api.sa-east-1.amazonaws.com/prod`
2. **Lambda Function**: `planilha-organizacao-api-prod-api`
3. **CloudWatch Logs**: `/aws/lambda/planilha-organizacao-api-prod-api`
4. **Métricas**: Disponíveis no CloudWatch

## 🔐 Segurança

### Secrets Manager (Opcional)

```bash
# Criar secret para credenciais do banco
aws secretsmanager create-secret \
    --name "planilha-organizacao/database" \
    --description "Credenciais do banco de dados" \
    --secret-string '{"username":"admin","password":"_gxeF8*P1-a*bQ|gv4W(z!X3gtTZ"}'
```

### IAM Role

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Effect": "Allow",
         "Action": ["rds:DescribeDBInstances", "rds:Connect"],
         "Resource": "*"
      }
   ]
}
```

## 📚 Recursos

-  [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
-  [Serverless Framework Docs](https://www.serverless.com/framework/docs/)
-  [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html)
-  [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)

---

🎉 **Deploy concluído com sucesso!** Sua API está rodando na AWS! 🚀
