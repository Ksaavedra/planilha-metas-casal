# Backend - Planilha Organização (XAMPP/MySQL)

Este é o backend da aplicação de planilha de organização, configurado para usar MySQL através do XAMPP.

## 📋 Pré-requisitos

1. **XAMPP** instalado e configurado
2. **Node.js** (versão 16 ou superior)
3. **npm** ou **yarn**

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar o XAMPP

1. Abra o **XAMPP Control Panel**
2. Clique em **"Start"** no MySQL
3. Aguarde o status ficar **verde**
4. Verifique se a porta **3306** está ativa

### 3. Configurar o Banco de Dados

```bash
npm run setup-xampp
```

Este comando irá:

-  Criar o banco `planilha_organizacao`
-  Criar as tabelas `metas` e `meses_meta`
-  Criar o usuário `user_planilha` com senha `SenhaPlanilha123!`
-  Inserir dados de exemplo

### 4. Testar a Conexão

```bash
npm run test-db
```

### 5. Iniciar o Servidor

```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`

## 🗄️ Estrutura do Banco

### Tabela `metas`

-  `id` - Chave primária
-  `nome` - Nome da meta
-  `valorMeta` - Valor total da meta
-  `valorPorMes` - Valor a ser economizado por mês
-  `mesesNecessarios` - Quantidade de meses necessários
-  `valorAtual` - Valor já economizado
-  `created_at` - Data de criação
-  `updated_at` - Data de atualização

### Tabela `meses_meta`

-  `id` - Chave primária
-  `meta_id` - Chave estrangeira para `metas`
-  `mes_id` - ID do mês (1-12)
-  `nome` - Nome do mês
-  `valor` - Valor economizado no mês
-  `status` - Status do mês (Vazio/Programado/Pago)
-  `created_at` - Data de criação
-  `updated_at` - Data de atualização

## 📊 Status dos Meses

O sistema utiliza três status para controlar o progresso de cada mês:

-  **Vazio** - Mês sem valor definido (valor = 0)
-  **Programado** - Mês com valor parcial (0 < valor < 100% da meta mensal)
-  **Pago** - Mês com valor completo (valor >= 100% da meta mensal)

### Lógica de Atualização Automática

Quando você atualiza o valor de um mês via API, o sistema automaticamente:

1. Define o status como **Vazio** se valor = 0
2. Define o status como **Programado** se 0 < valor < 100%
3. Define o status como **Pago** se valor >= 100%
4. Recalcula o `valorAtual` da meta somando todos os valores dos meses

## 🔧 Configuração de Conexão

As credenciais do banco estão configuradas em `config/database.js`:

```javascript
{
  host: '127.0.0.1',
  user: 'user_planilha',
  password: 'SenhaPlanilha123!',
  database: 'planilha_organizacao',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci'
}
```

## 📡 Endpoints da API

### Metas

-  `GET /metas` - Listar todas as metas
-  `GET /metas/:id` - Buscar meta por ID
-  `POST /metas` - Criar nova meta
-  `PUT /metas/:id` - Atualizar meta
-  `DELETE /metas/:id` - Deletar meta
-  `PUT /metas/:id/meses/:mesId` - Atualizar valor de um mês

### Health Check

-  `GET /health` - Verificar status do servidor

## 🛠️ Scripts Disponíveis

-  `npm start` - Iniciar servidor em produção
-  `npm run dev` - Iniciar servidor em desenvolvimento (com nodemon)
-  `npm run setup-xampp` - Configurar banco de dados
-  `npm run test-db` - Testar conexão com o banco
-  `npm run update-status` - Atualizar ENUM de status (se necessário)

## 🔍 Troubleshooting

### Erro: ECONNREFUSED

-  Verifique se o XAMPP está rodando
-  Confirme se o MySQL está ativo na porta 3306

### Erro: ER_ACCESS_DENIED_ERROR

-  Execute `npm run setup-xampp` para criar o usuário
-  Verifique se as credenciais estão corretas

### Erro: ER_BAD_DB_ERROR

-  Execute `npm run setup-xampp` para criar o banco

### Servidor não responde

-  Verifique se não há outro processo na porta 3000
-  Use `netstat -ano | findstr :3000` para verificar
-  Use `taskkill /F /IM node.exe` para matar processos Node

## 🔄 Migração de Dados

### Atualizar Status de Banco Existente

Se você já tinha um banco criado com os status antigos (`Vazio`, `Parcial`, `Completo`), execute:

```bash
npm run update-status
```

Este comando irá:

-  Atualizar o ENUM da coluna `status` para os novos valores
-  Converter registros existentes:
-  `Completo` → `Pago`
-  `Parcial` → `Programado`
-  `Vazio` → `Vazio` (mantém igual)

## 📝 Exemplo de Uso

### Criar uma Meta

```bash
curl -X POST http://localhost:3000/metas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Comprar um carro",
    "valorMeta": 50000,
    "valorPorMes": 5000,
    "mesesNecessarios": 10
  }'
```

### Listar Metas

```bash
curl http://localhost:3000/metas
```

### Atualizar Valor de um Mês

```bash
curl -X PUT http://localhost:3000/metas/1/meses/1 \
  -H "Content-Type: application/json" \
  -d '{"valor": 5000}'
```
