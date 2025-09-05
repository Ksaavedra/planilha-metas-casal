# Configuração MySQL - Planilha Organização

Este documento explica como configurar e usar o banco MySQL para o projeto de organização financeira.

## 📋 Pré-requisitos

-  MySQL 8.0+ instalado e rodando
-  Node.js 18+ instalado
-  PowerShell (Windows)

## 🚀 Configuração Rápida

### 1. Configurar Banco MySQL

Execute o script de setup:

```powershell
# No diretório backend/
npm run setup:mysql
```

Ou manualmente:

```powershell
# Parâmetros opcionais: -Host, -Port, -User, -Database
.\scripts\setup-mysql.ps1 -Host localhost -Port 3306 -User root -Database planilha_organizacao
```

### 2. Configurar Variável de Ambiente

Crie um arquivo `.env` no diretório `backend/`:

```env
DATABASE_URL_MYSQL="mysql://usuario:senha@localhost:3306/planilha_organizacao"
```

### 3. Gerar Cliente Prisma

```bash
npm run prisma:generate:mysql
```

### 4. Executar Aplicação

```bash
npm run dev:mysql
```

## 📊 Estrutura do Banco

### Tabelas Principais

-  **meses** - Meses do ano (Janeiro a Dezembro)
-  **conjuge** - Cônjuges (C1, C2, C3)
-  **categoria** - Categorias de despesas (Moradia, Automóvel, etc.)
-  **metaCasal** - Metas financeiras do casal
-  **mesesMeta** - Valores mensais das metas
-  **receita** - Receitas mensais
-  **despesa** - Despesas mensais
-  **divida** - Dívidas
-  **divida_parcela** - Parcelas das dívidas
-  **investimento** - Investimentos
-  **invest_aporte** - Aportes mensais
-  **invest_retirada** - Retiradas mensais

### Views Úteis

-  **vw_investido** - Total investido por investimento
-  **vw_saldo_mensal** - Saldo por mês (receita - despesa)

## 🔧 Comandos Úteis

### Prisma

```bash
# Gerar cliente Prisma
npm run prisma:generate:mysql

# Executar migrações
npm run prisma:migrate:mysql

# Abrir Prisma Studio
npx prisma studio --schema=prisma/schema.mysql.prisma
```

### MySQL

```bash
# Conectar ao banco
mysql -h localhost -P 3306 -u root -p planilha_organizacao

# Verificar tabelas
SHOW TABLES;

# Verificar dados das categorias
SELECT grupo, nome FROM categoria ORDER BY grupo, nome;

# Verificar saldo mensal
SELECT * FROM vw_saldo_mensal;
```

## 📁 Arquivos Importantes

-  `prisma/schema_financas.sql` - Schema completo do banco
-  `prisma/schema.mysql.prisma` - Schema Prisma para MySQL
-  `scripts/setup-mysql.ps1` - Script de configuração automática

## 🎯 Categorias Pré-configuradas

O banco já vem com as seguintes categorias:

### Moradia

-  Aluguel/Financiamento
-  Condomínio
-  Seguro Residencial
-  Energia Elétrica
-  Água
-  Telefone/internet móvel
-  TV por assinatura
-  Reformas
-  Utensílios para Casa
-  Reparos
-  Mobília
-  Melhorias
-  Outros

### Automóvel

-  Parcelas do Carro
-  Seguro Automóvel
-  Combustível
-  Transporte público
-  Transporte escolar
-  Pedágio
-  Estacionamento
-  Manutenções
-  IPVA
-  Lavagem
-  Outros

### Alimentação

-  Supermercado
-  Padaria
-  Pedidos por aplicativo
-  Restaurantes/lanchonetes
-  Feira
-  Comida livre na rua
-  Outros

### Lazer

-  Spotify
-  Netflix
-  Prime Vídeo
-  Outras assinaturas
-  Cinema
-  Festas/Shows
-  Viagens
-  Outros

### Saúde

-  Plano de Saúde
-  Academia
-  Médico
-  Dentista
-  Farmácia
-  Consultas particulares
-  Seguro de vida
-  Procedimentos
-  Outros

### Gastos Pessoais

-  Roupas
-  Sapatos
-  Acessórios
-  Estética
-  Educação/curso
-  Presentes
-  Personal Trainer
-  Suplementação
-  Gastos Livres
-  Cortes de Cabelo (assinatura)
-  Outros

### Viagens

-  Passagens
-  Acomodações
-  Alimentação
-  Lembrancinhas
-  Animais
-  Aluguel de Carro
-  Outros

## 🔄 Migração do SQLite

Se você estava usando SQLite e quer migrar para MySQL:

1. Execute o setup do MySQL
2. Configure a variável de ambiente `DATABASE_URL_MYSQL`
3. Execute `npm run prisma:generate:mysql`
4. Execute `npm run dev:mysql`

## 🐛 Solução de Problemas

### Erro de Conexão

-  Verifique se o MySQL está rodando
-  Confirme as credenciais no `.env`
-  Teste a conexão: `mysql -h localhost -u root -p`

### Erro de Schema

-  Execute novamente: `npm run setup:mysql`
-  Verifique se o arquivo `schema_financas.sql` existe

### Erro do Prisma

-  Execute: `npm run prisma:generate:mysql`
-  Verifique se o schema está correto

## 📞 Suporte

Para dúvidas ou problemas, consulte:

-  [Documentação Prisma](https://www.prisma.io/docs)
-  [Documentação MySQL](https://dev.mysql.com/doc/)
-  Issues do projeto no GitHub
