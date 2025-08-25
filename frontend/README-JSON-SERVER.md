# JSON Server - API das Metas de Investimento

## Como usar

### 1. Iniciar o servidor

```bash
# Opção 1: Usar o script batch (Windows)
start-json-server.bat

# Opção 2: Usar json-server diretamente
json-server --watch db.json --port 3000

# Opção 3: Usar npm (se configurado)
npm run json-server
```

### 2. Acessar a API

- **URL base**: `http://localhost:3000`
- **API das metas**: `http://localhost:3000/metas`

### 3. Endpoints disponíveis

#### GET /metas

Buscar todas as metas

```bash
curl http://localhost:3000/metas
```

#### GET /metas/:id

Buscar uma meta específica

```bash
curl http://localhost:3000/metas/1
```

#### POST /metas

Criar nova meta

```bash
curl -X POST http://localhost:3000/metas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Nova Meta",
    "valorMeta": 10000,
    "valorPorMes": 500,
    "mesesNecessarios": 20,
    "valorAtual": 0,
    "contribuicoesMensais": [0,0,0,0,0,0,0,0,0,0,0,0],
    "statusMensais": ["Vazio","Vazio","Vazio","Vazio","Vazio","Vazio","Vazio","Vazio","Vazio","Vazio","Vazio","Vazio"]
  }'
```

#### PUT /metas/:id

Atualizar uma meta

```bash
curl -X PUT http://localhost:3000/metas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Meta Atualizada",
    "valorMeta": 15000
  }'
```

#### DELETE /metas/:id

Deletar uma meta

```bash
curl -X DELETE http://localhost:3000/metas/1
```

### 4. Outros endpoints

#### GET /meses

Buscar lista de meses

```bash
curl http://localhost:3000/meses
```

#### GET /usuarios

Buscar usuários

```bash
curl http://localhost:3000/usuarios
```

#### GET /configuracoes

Buscar configurações

```bash
curl http://localhost:3000/configuracoes
```

### 5. Testar no navegador

Abra no navegador: `http://localhost:3000/metas`

Você verá o JSON das metas diretamente no navegador!

### 6. Interface web do JSON Server

Acesse: `http://localhost:3000`

Você verá uma interface web para gerenciar os dados!

## Estrutura do db.json

```json
{
  "metas": [...],
  "meses": [...],
  "usuarios": [...],
  "configuracoes": {...}
}
```

## Vantagens do JSON Server

✅ **Zero configuração** - Funciona imediatamente
✅ **CRUD completo** - GET, POST, PUT, DELETE automáticos
✅ **Interface web** - Gerencia dados visualmente
✅ **Auto-reload** - Atualiza automaticamente
✅ **Filtros e busca** - `/metas?nome_like=casa`
✅ **Paginação** - `/metas?_page=1&_limit=10`
✅ **Ordenação** - `/metas?_sort=valorMeta&_order=desc`

## Exemplos de consultas

```bash
# Buscar metas com valor > 10000
GET /metas?valorMeta_gte=10000

# Buscar metas que contenham "casa" no nome
GET /metas?nome_like=casa

# Buscar com paginação
GET /metas?_page=1&_limit=5

# Buscar ordenado por valor
GET /metas?_sort=valorMeta&_order=desc
```

## Configuração

- **Porta**: 3000
- **Arquivo de dados**: `db.json`
- **Auto-reload**: Sim
- **CORS**: Habilitado
