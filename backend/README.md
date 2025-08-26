# Backend - Planilha de Organização

## Configuração do MySQL

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do backend com:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345
DB_NAME=planilha_organizacao
DB_PORT=3306
PORT=3000
```

### 3. Configurar banco de dados

```bash
npm run setup
```

### 4. Iniciar servidor

```bash
npm start
```

ou para desenvolvimento:

```bash
npm run dev
```

## Estrutura do Banco

### Tabela `metas`

-  `id` - Chave primária auto-incremento
-  `nome` - Nome da meta
-  `valorMeta` - Valor total da meta
-  `valorPorMes` - Valor a ser economizado por mês
-  `mesesNecessarios` - Quantidade de meses necessários
-  `valorAtual` - Valor já economizado
-  `created_at` - Data de criação
-  `updated_at` - Data de atualização

### Tabela `meses_meta`

-  `id` - Chave primária auto-incremento
-  `meta_id` - Chave estrangeira para metas
-  `mes_id` - ID do mês (1-12)
-  `nome` - Nome do mês
-  `valor` - Valor economizado no mês
-  `status` - Status do mês (Vazio, Parcial, Completo)
-  `created_at` - Data de criação
-  `updated_at` - Data de atualização

## Endpoints

-  `GET /metas` - Listar todas as metas
-  `GET /metas/:id` - Buscar meta por ID
-  `POST /metas` - Criar nova meta
-  `PUT /metas/:id` - Atualizar meta
-  `DELETE /metas/:id` - Deletar meta
-  `PUT /metas/:id/meses/:mesId` - Atualizar valor de um mês
