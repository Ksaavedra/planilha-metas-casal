# Configuração RDS MySQL na AWS

Este guia explica como configurar um banco MySQL no Amazon RDS para o projeto de organização financeira.

## 📋 Pré-requisitos

-  Conta AWS ativa
-  MySQL client instalado localmente
-  Node.js 18+ instalado
-  PowerShell (Windows)

## 🚀 Configuração Rápida

### 1. Criar RDS MySQL no Console AWS

#### Passo 1: Acessar RDS

1. Faça login no [Console AWS](https://console.aws.amazon.com/)
2. Vá para **RDS** (Relational Database Service)
3. Clique em **"Criar um banco de dados"**

#### Passo 2: Configurações Básicas

```
Database creation method: Standard create
Engine type: MySQL
Version: MySQL 8.0.35
Templates: Free tier (para testes) ou Production
```

#### Passo 3: Configurações do Banco

```
DB instance identifier: planilha-organizacao-db
Master username: admin
Master password: [senha forte - guarde bem!]
Confirm password: [mesma senha]
```

#### Passo 4: Configurações de Instância

```
DB instance class:
- Free tier: db.t3.micro
- Produção: db.t3.small ou db.t3.medium

Storage type: General Purpose SSD (gp2)
Allocated storage: 20 GB
Enable storage autoscaling: ✅ Sim
Maximum storage threshold: 100 GB
```

#### Passo 5: Conectividade

```
Network type: IPv4
Virtual private cloud (VPC): Default VPC
Public access: ✅ Yes (para desenvolvimento)
VPC security group: Create new
Security group name: planilha-organizacao-sg
Availability Zone: No preference
Database port: 3306
```

#### Passo 6: Configurações Adicionais

```
Database name: planilha_organizacao
Backup retention period: 7 days
Maintenance window: sun:04:00-sun:05:00 UTC
Enable deletion protection: ✅ Sim (produção)
```

### 2. Configurar Security Group

Após criar o RDS:

1. Vá para **EC2 > Security Groups**
2. Selecione o security group criado
3. Adicione regra:

```
Type: MySQL/Aurora
Protocol: TCP
Port: 3306
Source:
- Para desenvolvimento: 0.0.0.0/0 (cuidado!)
- Para produção: Seu IP específico
```

### 3. Obter Endpoint

1. No RDS, clique na sua instância
2. Copie o **Endpoint** (ex: `planilha-organizacao-db.abc123.us-east-1.rds.amazonaws.com`)

### 4. Configurar Banco Automaticamente

Execute o script de setup:

```powershell
# No diretório backend/
.\scripts\setup-aws-rds.ps1 -Endpoint "SEU_ENDPOINT" -Username "admin" -Password "SUA_SENHA"
```

Exemplo:

```powershell
.\scripts\setup-aws-rds.ps1 -Endpoint "planilha-organizacao-db.abc123.us-east-1.rds.amazonaws.com" -Username "admin" -Password "MinhaSenha123!"
```

### 5. Executar Aplicação

```bash
# Gerar cliente Prisma
npm run prisma:generate:mysql

# Executar aplicação
npm run dev:mysql
```

## 🔧 Comandos Disponíveis

```bash
# Setup RDS AWS
npm run setup:aws-rds

# Setup MySQL local
npm run setup:mysql

# Testar conexão
npm run test:mysql

# Prisma
npm run prisma:generate:mysql
npm run prisma:migrate:mysql

# Servidor
npm run dev:mysql
```

## 💰 Custos e Otimização

### Free Tier (12 meses)

-  **db.t3.micro**: Gratuito
-  **Storage**: 20 GB gratuito
-  **Backup**: 20 GB gratuito

### Produção

-  **db.t3.small**: ~$15/mês
-  **db.t3.medium**: ~$30/mês
-  **Storage**: ~$0.10/GB/mês

### Dicas para Economizar

1. **Use Free Tier** para desenvolvimento
2. **Stop/Start** instância quando não usar
3. **Reserved Instances** para produção
4. **Monitor** custos no Cost Explorer

## 🔒 Segurança

### Security Group (Desenvolvimento)

```
Type: MySQL/Aurora
Protocol: TCP
Port: 3306
Source: 0.0.0.0/0
```

### Security Group (Produção)

```
Type: MySQL/Aurora
Protocol: TCP
Port: 3306
Source: [IP específico da aplicação]
```

### Boas Práticas

1. **Senhas fortes** (12+ caracteres)
2. **Rotação de senhas** regular
3. **Backup automático** habilitado
4. **Deletion protection** habilitado
5. **Monitoramento** de acesso

## 📊 Monitoramento

### CloudWatch Metrics

-  **CPU Utilization**
-  **Database Connections**
-  **Free Storage Space**
-  **Read/Write IOPS**

### Logs

-  **Error Log**
-  **Slow Query Log**
-  **General Log**

## 🔄 Backup e Recuperação

### Backup Automático

-  **Retention**: 7 dias (configurável)
-  **Window**: 03:00-04:00 UTC
-  **Storage**: Incluído no preço

### Snapshot Manual

1. Vá para **RDS > Snapshots**
2. Clique **"Create snapshot"**
3. Configure nome e descrição

### Restaurar

1. Selecione snapshot
2. Clique **"Restore snapshot"**
3. Configure nova instância

## 🚨 Troubleshooting

### Erro de Conexão

```
✗ Falha na conexão com RDS
```

**Soluções:**

1. Verifique **Security Group** (porta 3306)
2. Confirme **Endpoint** correto
3. Teste **credenciais**
4. Verifique se **RDS está rodando**

### Erro de Schema

```
✗ Erro ao importar schema
```

**Soluções:**

1. Execute novamente: `npm run setup:aws-rds`
2. Verifique arquivo `schema_financas.sql`
3. Confirme permissões do usuário

### Erro de Performance

```
Database connections: High
CPU Utilization: >80%
```

**Soluções:**

1. **Upgrade** instance class
2. **Otimize** queries
3. **Add** connection pooling
4. **Scale** horizontalmente

## 📈 Próximos Passos

### Melhorias Sugeridas

1. **Aurora MySQL** para melhor performance
2. **Read Replicas** para leitura
3. **Multi-AZ** para alta disponibilidade
4. **Encryption** at rest e in transit
5. **IAM Authentication**

### Integração com Aplicação

1. **Connection pooling** (Prisma)
2. **Health checks** automáticos
3. **Retry logic** para falhas
4. **Monitoring** integrado

## 📞 Suporte

### AWS Support

-  **Basic**: Documentação e fóruns
-  **Developer**: $29/mês
-  **Business**: $100/mês
-  **Enterprise**: $15,000/mês

### Recursos Úteis

-  [Documentação RDS](https://docs.aws.amazon.com/rds/)
-  [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
-  [AWS Cost Explorer](https://console.aws.amazon.com/costexplorer/)
-  [AWS Well-Architected](https://aws.amazon.com/architecture/well-architected/)

---

**Configurado por**: Kelly  
**Data**: 2025-08-30  
**Versão**: 1.0.0
