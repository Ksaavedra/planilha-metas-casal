# API das Metas de Investimento

## Como usar

### 1. Iniciar o servidor

```bash
# Opção 1: Usar o script batch (Windows)
start-server.bat

# Opção 2: Usar npm
npm start

# Opção 3: Usar node diretamente
node server.js
```

### 2. Acessar a API

- **URL base**: `http://localhost:3001`
- **API das metas**: `http://localhost:3001/api/metas`

### 3. Endpoints disponíveis

#### GET /api/metas

Buscar todas as metas

```bash
curl http://localhost:3001/api/metas
```

#### GET /api/metas/:id

Buscar uma meta específica

```bash
curl http://localhost:3001/api/metas/1
```

#### POST /api/metas

Criar nova meta

```bash
curl -X POST http://localhost:3001/api/metas \
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

#### PUT /api/metas/:id

Atualizar uma meta

```bash
curl -X PUT http://localhost:3001/api/metas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Meta Atualizada",
    "valorMeta": 15000
  }'
```

#### DELETE /api/metas/:id

Deletar uma meta

```bash
curl -X DELETE http://localhost:3001/api/metas/1
```

### 4. Estrutura dos dados

O arquivo `src/app/api/metas.json` contém os dados das metas:

```json
{
  "metas": [
    {
      "id": 1,
      "nome": "Comprar uma casa",
      "valorMeta": 500000.0,
      "valorPorMes": 5000.0,
      "mesesNecessarios": 100,
      "valorAtual": 50000.0,
      "contribuicoesMensais": [5000, 5000, ...],
      "statusMensais": ["Pago", "Pago", ...]
    }
  ],
  "meses": ["Janeiro", "Fevereiro", ...]
}
```

### 5. Testar no navegador

Abra no navegador: `http://localhost:3001/api/metas`

Você verá o JSON das metas diretamente no navegador!

## Configuração

- **Porta**: 3001
- **CORS**: Habilitado para todas as origens
- **Arquivo de dados**: `src/app/api/metas.json`
- **Servidor**: Express.js

## Desenvolvimento

Para desenvolvimento com auto-reload:

```bash
npm run dev
```
