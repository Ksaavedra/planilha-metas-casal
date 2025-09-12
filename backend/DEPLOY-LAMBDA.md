# 🚀 Deploy para AWS Lambda + API Gateway

Este guia explica como fazer deploy do backend para AWS Lambda com API Gateway.

## 📋 Pré-requisitos

1. **AWS CLI configurado** com credenciais
2. **Node.js 18+** instalado
3. **Serverless Framework** instalado globalmente: `npm install -g serverless`
4. **RDS MySQL** configurado e acessível

## 🔧 Configuração

### 1. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp env.production.example .env.production
```

Edite o arquivo `.env.production` com suas configurações:

```bash
# RDS MySQL
DATABASE_URL="mysql://usuario:senha@endpoint-rds:3306/database"

# JWT Secret (use uma chave forte em produção)
JWT_SECRET=sua-chave-super-secreta-2025

# Frontend URL
FRONTEND_URL=https://seu-frontend.com

# AWS VPC Configuration
LAMBDA_SECURITY_GROUP_ID=sg-xxxxxxxxx
LAMBDA_SUBNET_ID_1=subnet-xxxxxxxxx
LAMBDA_SUBNET_ID_2=subnet-yyyyyyyyy
```

### 2. Configurar VPC para Lambda

O Lambda precisa estar na mesma VPC do RDS para acessar o banco:

1. **Criar Security Group** para Lambda:

   -  Inbound: Porta 3306 (MySQL) do Security Group do RDS
   -  Outbound: All traffic

2. **Configurar Subnets**:
   -  Use subnets privadas (recomendado)
   -  Ou subnets públicas com NAT Gateway

### 3. Configurar RDS Security Group

Adicione uma regra no Security Group do RDS:

-  Type: MySQL/Aurora
-  Port: 3306
-  Source: Security Group do Lambda

## 🚀 Deploy

### Deploy para Desenvolvimento

```bash
# Build e deploy
npm run deploy:dev

# Ou manualmente
npm run build:lambda
serverless deploy --stage dev
```

### Deploy para Produção

```bash
# Build e deploy
npm run deploy:prod

# Ou manualmente
npm run build:lambda
serverless deploy --stage prod
```

## 🧪 Teste Local

Para testar localmente com Serverless Offline:

```bash
npm run offline
```

Isso iniciará o servidor em `http://localhost:3000`

## 📊 Monitoramento

### CloudWatch Logs

Os logs do Lambda ficam em:

-  `/aws/lambda/planilha-organizacao-api-dev-api`
-  `/aws/lambda/planilha-organizacao-api-prod-api`

### Métricas Importantes

-  **Duration**: Tempo de execução
-  **Errors**: Erros 4xx/5xx
-  **Throttles**: Limitações de concorrência
-  **Concurrent Executions**: Execuções simultâneas

## 🔧 Otimizações

### 1. Cold Start

Para reduzir cold starts:

-  Use **Provisioned Concurrency** para funções críticas
-  Mantenha conexões de banco em pool
-  Use **Lambda Layers** para dependências grandes

### 2. Performance

-  **Memory**: Ajuste conforme necessário (512MB recomendado)
-  **Timeout**: 30s é suficiente para a maioria das operações
-  **VPC**: Use subnets privadas com NAT Gateway

### 3. Segurança

-  Use **IAM Roles** com permissões mínimas
-  Configure **VPC** adequadamente
-  Use **Secrets Manager** para credenciais sensíveis

## 🚨 Troubleshooting

### Erro de Conexão com RDS

```
Error: P1001: Can't reach database server
```

**Soluções:**

1. Verificar Security Groups
2. Verificar VPC/Subnets
3. Verificar se RDS está rodando
4. Testar conectividade de rede

### Timeout do Lambda

```
Task timed out after 30.00 seconds
```

**Soluções:**

1. Aumentar timeout no `serverless.yml`
2. Otimizar queries do banco
3. Usar conexões em pool

### Erro de CORS

```
Access to fetch at 'API_URL' from origin 'FRONTEND_URL' has been blocked by CORS policy
```

**Soluções:**

1. Verificar configuração CORS no `serverless.yml`
2. Verificar `FRONTEND_URL` nas variáveis de ambiente

## 📝 Comandos Úteis

```bash
# Ver logs em tempo real
serverless logs -f api --tail

# Remover stack
serverless remove

# Ver informações do deploy
serverless info

# Testar função localmente
serverless invoke local -f api --data '{"httpMethod":"GET","path":"/health"}'
```

## 🔄 CI/CD

Para automatizar o deploy, configure GitHub Actions:

```yaml
name: Deploy to AWS Lambda
on:
   push:
      branches: [main]
jobs:
   deploy:
      runs-on: ubuntu-latest
      steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
           with:
              node-version: '18'
         - run: npm install
         - run: npm run deploy:prod
           env:
              AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
              AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 📚 Recursos Adicionais

-  [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
-  [Serverless Framework Docs](https://www.serverless.com/framework/docs/)
-  [Prisma with Lambda](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-lambda)
