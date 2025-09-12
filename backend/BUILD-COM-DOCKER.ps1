# Script para fazer build com Docker (ambiente Linux)
# Resolve o problema do Prisma Engine Windows vs Linux

Write-Host "🐳 Build com Docker - Solução Definitiva" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Verificar se Docker está rodando
Write-Host "🔍 Verificando Docker..." -ForegroundColor Cyan
try {
    $dockerInfo = docker info 2>$null
    if (-not $dockerInfo) {
        Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
        Write-Host "Por favor, inicie o Docker Desktop e tente novamente" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Docker está rodando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não está instalado ou não está rodando!" -ForegroundColor Red
    Write-Host "Execute: .\INSTALAR-DOCKER.ps1" -ForegroundColor Yellow
    exit 1
}

# Configurar Prisma para MySQL (produção)
Write-Host "🔧 Configurando Prisma para MySQL..." -ForegroundColor Cyan
$schemaContent = @"
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum StatusMes {
  Vazio
  Programado
  Pago
}

model Usuario {
  id        String   @id @default(cuid())
  email     String   @unique
  nome      String
  senha     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  metas      Meta[]
  categorias Categoria[]
  receitas   Receita[]
  despesas   Despesa[]
  investimentos Investimento[]
  dividas    Divida[]
  meses      Mes[]

  @@map("usuarios")
}

model Meta {
  id                String   @id @default(cuid())
  nome              String
  valorTotal        Float
  valorPorMes       Float
  mesesNecessarios  Int
  dataInicio        DateTime
  dataFim           DateTime?
  status            String   @default("ativa")
  usuarioId         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@map("metas")
}

model Categoria {
  id        String   @id @default(cuid())
  nome      String
  tipo      String   // "receita" ou "despesa"
  usuarioId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuario   Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  receitas  Receita[]
  despesas  Despesa[]

  @@unique([usuarioId, nome])
  @@map("categorias")
}

model Mes {
  id        String    @id @default(cuid())
  numero    Int       @unique
  nome      String
  usuarioId String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  usuario   Usuario        @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  receitas  Receita[]
  despesas  Despesa[]
  investimentos Investimento[]
  dividas   Divida[]

  @@map("meses")
}

model Receita {
  id          String   @id @default(cuid())
  descricao   String
  valor       Float
  data        DateTime
  mes_id      Int
  categoriaId String
  usuarioId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  usuario   Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  categoria Categoria @relation(fields: [categoriaId], references: [id], onDelete: Cascade)
  mes       Mes       @relation(fields: [mes_id], references: [numero], onDelete: Cascade)

  @@map("receitas")
}

model Despesa {
  id          String   @id @default(cuid())
  descricao   String
  valor       Float
  data        DateTime
  mes_id      Int
  categoriaId String
  usuarioId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  usuario   Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  categoria Categoria @relation(fields: [categoriaId], references: [id], onDelete: Cascade)
  mes       Mes       @relation(fields: [mes_id], references: [numero], onDelete: Cascade)

  @@map("despesas")
}

model Investimento {
  id        String   @id @default(cuid())
  nome      String
  valor     Float
  data      DateTime
  mes_id    Int
  usuarioId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  mes     Mes     @relation(fields: [mes_id], references: [numero], onDelete: Cascade)

  @@map("investimentos")
}

model Divida {
  id        String   @id @default(cuid())
  nome      String
  valor     Float
  data      DateTime
  mes_id    Int
  usuarioId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuario Usuario @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  mes     Mes     @relation(fields: [mes_id], references: [numero], onDelete: Cascade)

  @@map("dividas")
}
"@

$schemaContent | Out-File -FilePath "prisma/schema.prisma" -Encoding UTF8
Write-Host "✅ Schema Prisma configurado para MySQL" -ForegroundColor Green

# Fazer build no ambiente Linux
Write-Host "🐳 Fazendo build no ambiente Linux..." -ForegroundColor Cyan
Write-Host "Isso pode levar alguns minutos..." -ForegroundColor Yellow

try {
    # Build com Docker
    docker run --rm -v "${PWD}:/app" -w /app node:18-alpine sh -c "
        npm ci --production &&
        npx prisma generate &&
        npm run build:lambda
    "
    
    Write-Host "✅ Build com Docker concluído com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no build com Docker" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verificar se o build foi bem-sucedido
if (Test-Path "dist/src/lambda.js") {
    Write-Host "✅ Arquivo lambda.js criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo lambda.js não foi criado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Build com Docker concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Blue
Write-Host "1. ✅ Execute: .\DEPLOY-COM-VARIAVEIS.ps1" -ForegroundColor White
Write-Host "2. ✅ Teste a API" -ForegroundColor White
Write-Host "3. ✅ Configure o frontend" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Pronto para deploy!" -ForegroundColor Green

