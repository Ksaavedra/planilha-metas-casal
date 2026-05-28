const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../../../metas.db");

// Remove banco antigo se existir (para recriar do zero)
if (fs.existsSync(DB_PATH)) {
  console.log("⚠️  Banco já existe. Removendo...");
  fs.unlinkSync(DB_PATH);
}

// Criar novo banco
const db = new Database(DB_PATH);

console.log("📦 Criando estrutura do banco de dados...");

// Criar tabela de metas
db.exec(`
  CREATE TABLE IF NOT EXISTS metas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    valorMeta REAL NOT NULL DEFAULT 0,
    valorPorMes REAL NOT NULL DEFAULT 0,
    mesesNecessarios INTEGER NOT NULL DEFAULT 0,
    valorAtual REAL NOT NULL DEFAULT 0,
    icon TEXT DEFAULT 'bi-bullseye',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Criar tabela de meses (meses de cada meta)
db.exec(`
  CREATE TABLE IF NOT EXISTS meses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metaId INTEGER NOT NULL,
    nome TEXT NOT NULL,
    valor REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Vazio',
    FOREIGN KEY (metaId) REFERENCES metas(id) ON DELETE CASCADE
  )
`);

// Criar índices para melhor performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_meses_metaId ON meses(metaId)
`);

console.log("✅ Tabelas criadas com sucesso!");
console.log("📊 Estrutura:");
console.log(
  "   - Tabela: metas (id, nome, valorMeta, valorPorMes, mesesNecessarios, valorAtual, icon)"
);
console.log("   - Tabela: meses (id, metaId, nome, valor, status)");
console.log(`\n📁 Banco criado em: ${DB_PATH}`);
console.log("\n✅ Banco SQLite vazio criado com sucesso!");
console.log("💡 Próximo passo: Rodar script de migração dos dados");

db.close();
