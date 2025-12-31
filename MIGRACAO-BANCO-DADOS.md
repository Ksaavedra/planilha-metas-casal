# 📚 Guia: Migração de JSON para Banco de Dados

## 🎯 Objetivo

Migrar os dados do `db.json` para um banco de dados real sem perder nenhum dado.

---

## 📋 Passo a Passo - SQLite (Recomendado)

### 1. Instalar dependências

```bash
cd frontend
npm install better-sqlite3
```

### 2. Criar estrutura do banco

-  Criar tabela `metas`
-  Criar tabela `meses` (para os meses de cada meta)

### 3. Script de migração

-  Ler dados do `db.json`
-  Inserir no banco SQLite
-  Validar que todos os dados foram migrados

### 4. Atualizar servidor

-  Modificar `server.js` para usar SQLite
-  Manter mesma interface da API (sem mudar frontend)

---

## 🔄 Estratégia de Migração Segura

### Opção A: Migração Manual (Mais Segura)

1. ✅ Fazer backup do `db.json`
2. ✅ Criar banco SQLite vazio
3. ✅ Rodar script de migração
4. ✅ Validar dados no banco
5. ✅ Testar API
6. ✅ Se tudo OK, usar banco. Se não, voltar para JSON

### Opção B: Duplo Sistema (Durante Testes)

1. ✅ Continuar usando JSON
2. ✅ Criar banco em paralelo
3. ✅ Migrar dados gradualmente
4. ✅ Testar ambos sistemas
5. ✅ Trocar quando estiver confiante

---

## 💾 Backup dos Dados Atuais

**IMPORTANTE**: Antes de migrar, sempre faça backup!

```bash
# Fazer cópia do db.json
cp db.json db.json.backup
```

---

## 🛠️ O que vou criar para você:

1. **Script de migração** (`migrate-to-database.js`)

   -  Lê `db.json`
   -  Cria banco SQLite
   -  Insere todos os dados
   -  Valida migração

2. **Servidor atualizado** (`server-database.js`)

   -  Usa SQLite em vez de JSON
   -  Mesma API (sem mudar frontend)

3. **Script de rollback** (voltar para JSON se necessário)

---

## ❓ Qual opção você prefere?

**A)** SQLite (simples, arquivo local)
**B)** PostgreSQL (mais robusto, precisa instalar)
**C)** Manter JSON mas criar sistema de backup automático

Qual você quer que eu implemente primeiro?
