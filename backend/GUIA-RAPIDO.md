# 🚀 Guia Rápido - Deploy Lambda

## 📋 Passos para Deploy

### 1. Instalar AWS CLI

**Opção A: Download Manual**

1. Baixar: https://awscli.amazonaws.com/AWSCLIV2.msi
2. Executar o instalador
3. Reiniciar o terminal

**Opção B: PowerShell**

```powershell
winget install Amazon.AWSCLI
```

### 2. Configurar AWS CLI

```bash
aws configure
```

Será solicitado:

-  **AWS Access Key ID**: [sua-chave]
-  **AWS Secret Access Key**: [sua-chave-secreta]
-  **Default region name**: `sa-east-1`
-  **Default output format**: `json`

### 3. Executar Comandos AWS

```powershell
# Executar script automático
.\EXECUTAR-COMANDOS-AWS.ps1
```

**OU executar manualmente:**

```bash
# 1. Criar Security Group
aws ec2 create-security-group --group-name lambda-planilha-organizacao --description "Security Group para Lambda" --vpc-id vpc-0ecfd9f0b57577248

# 2. Anotar o ID retornado (ex: sg-xxxxxxxxx)
# 3. Substituir LAMBDA_SG_ID nos comandos abaixo

# 4. Configurar regras
aws ec2 authorize-security-group-egress --group-id LAMBDA_SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-egress --group-id LAMBDA_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-egress --group-id LAMBDA_SG_ID --protocol tcp --port 3306 --source-group sg-0ef62ae990699c842
aws ec2 authorize-security-group-egress --group-id LAMBDA_SG_ID --protocol udp --port 53 --cidr 0.0.0.0/0

# 5. Configurar RDS
aws ec2 authorize-security-group-ingress --group-id sg-0ef62ae990699c842 --protocol tcp --port 3306 --source-group LAMBDA_SG_ID
```

### 4. Fazer Deploy

```bash
npm run deploy:prod
```

### 5. Testar

```bash
# Testar health check
curl https://sua-api-gateway-url/dev/health
```

## 🎯 Resultado Esperado

Após o deploy, você terá:

-  ✅ Lambda funcionando na AWS
-  ✅ API Gateway configurado
-  ✅ Conexão com RDS MySQL
-  ✅ URL da API para usar no frontend

## 🚨 Se der erro:

1. **AWS CLI não encontrado**: Reinicie o terminal
2. **Credenciais inválidas**: Execute `aws configure` novamente
3. **Permissões insuficientes**: Verifique as permissões da conta AWS
4. **RDS inacessível**: Verifique se está na mesma VPC

## 📞 Suporte

-  **Logs**: `aws logs tail /aws/lambda/planilha-organizacao-api-prod-api --follow`
-  **Métricas**: CloudWatch Console
-  **Documentação**: `DEPLOY-PRODUCAO.md`

---

**Tudo pronto para deploy!** 🚀
