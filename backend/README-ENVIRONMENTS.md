# 🌍 Configuração de Ambientes

Este projeto suporta múltiplos ambientes: **desenvolvimento**, **produção** e **teste**.

## 🚀 Ambientes Disponíveis

### 1. **Desenvolvimento** (`development`)

-  **Porta**: 3000
-  **Banco**: `dev.db` (SQLite local)
-  **Logs**: Debug completo
-  **JWT**: 7 dias
-  **Rate Limit**: 100 req/15min

### 2. **Produção** (`production`)

-  **Porta**: Variável `PORT` ou 3000
-  **Banco**: `prod.db` (SQLite local) ou variável `DATABASE_URL`
-  **Logs**: Apenas warnings e erros
-  **JWT**: 1 dia
-  **Rate Limit**: 50 req/15min

### 3. **Teste** (`test`)

-  **Porta**: 3001
-  **Banco**: `test.db` (SQLite local)
-  **Logs**: Apenas erros
-  **JWT**: 1 hora
-  **Rate Limit**: 1000 req/15min

## 🔧 Como Configurar

### **Opção 1: Script PowerShell (Recomendado)**

```powershell
# Configurar ambiente de desenvolvimento
npm run setup:env:dev

# Configurar ambiente de produção
npm run setup:env:prod

# Configurar ambiente de teste
npm run setup:env:test
```

### **Opção 2: Variáveis de ambiente manuais**

```powershell
# Desenvolvimento
$env:NODE_ENV = "development"
$env:DATABASE_URL = "file:./dev.db"
$env:JWT_SECRET = "dev-secret-key-change-in-production-2025"

# Produção
$env:NODE_ENV = "production"
$env:DATABASE_URL = "file:./prod.db"
$env:JWT_SECRET = "production-secret-key-change-this-2025"
```

## 🚀 Como Executar

### **Desenvolvimento**

```bash
npm run dev
# ou
npm run start:dev
```

### **Produção**

```bash
# Primeiro build
npm run build

# Depois executar
npm run start:prod
# ou
npm start
```

### **Teste**

```bash
npm run setup:env:test
npm run start:test
```

## 📁 Estrutura de Arquivos

```
backend/
├── src/
│   ├── config/
│   │   ├── environments.ts      # Configurações principais
│   │   └── production.ts        # Configurações específicas de produção
│   ├── middleware/
│   │   └── auth.ts             # Middleware de autenticação
│   └── server-auth.ts          # Servidor principal
├── prisma/
│   └── schema.prisma           # Schema principal (usa variáveis de ambiente)
├── scripts/
│   └── setup-env.ps1          # Script de configuração de ambiente
├── config.env                  # Template de configuração
└── package.json                # Scripts npm
```

## 🔐 Variáveis de Ambiente Importantes

| Variável         | Descrição              | Padrão                  |
| ---------------- | ---------------------- | ----------------------- |
| `NODE_ENV`       | Ambiente da aplicação  | `development`           |
| `PORT`           | Porta do servidor      | `3000`                  |
| `DATABASE_URL`   | URL do banco de dados  | `file:./dev.db`         |
| `JWT_SECRET`     | Chave secreta para JWT | `dev-secret-key...`     |
| `JWT_EXPIRES_IN` | Expiração do token     | `7d`                    |
| `FRONTEND_URL`   | URL do frontend        | `http://localhost:4200` |
| `LOG_LEVEL`      | Nível de log           | `debug`                 |
| `ENABLE_LOGGING` | Habilitar logs         | `true`                  |

## 🚨 Segurança

### **Desenvolvimento**

-  JWT válido por 7 dias
-  Logs detalhados
-  Rate limit alto (100 req/15min)

### **Produção**

-  JWT válido por 1 dia
-  Logs mínimos
-  Rate limit baixo (50 req/15min)
-  **IMPORTANTE**: Altere `JWT_SECRET` em produção!

## 📊 Monitoramento

### **Health Check**

```bash
curl http://localhost:3000/health
```

### **Logs**

-  **Desenvolvimento**: Console + arquivo (opcional)
-  **Produção**: Arquivo com rotação
-  **Teste**: Apenas erros

## 🔄 Migração Entre Ambientes

1. **Parar servidor atual**
2. **Configurar novo ambiente**: `npm run setup:env:[ambiente]`
3. **Regenerar Prisma**: `npm run prisma:generate:sqlite`
4. **Iniciar servidor**: `npm run [comando]`

## 📝 Exemplo de Uso

```bash
# 1. Configurar ambiente de desenvolvimento
npm run setup:env:dev

# 2. Iniciar servidor
npm run dev

# 3. Testar
curl http://localhost:3000/health

# 4. Mudar para produção
npm run setup:env:prod
npm run build
npm run start:prod
```

## 🆘 Troubleshooting

### **Erro: "Cannot find module"**

```bash
npm install
npm run prisma:generate:sqlite
```

### **Erro: "Database locked"**

```bash
# Parar todos os processos Node.js
taskkill /F /IM node.exe
# Tentar novamente
```

### **Erro: "JWT_SECRET not set"**

```bash
npm run setup:env:dev
```
