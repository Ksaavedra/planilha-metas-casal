const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../metas.db");

const fs = require("fs");
if (!fs.existsSync(DB_PATH)) {
  console.error("❌ Banco metas.db não encontrado. Rode: npm run db:create");
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");

console.log("📦 Adicionando tabela 'receitas' ao banco...");

db.exec(`
  CREATE TABLE IF NOT EXISTS receitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa TEXT NOT NULL DEFAULT 'Casal',
    natureza TEXT NOT NULL,
    categoria TEXT NOT NULL, -- sem descricao (igual solicitado)
    valor REAL NOT NULL,
    data TEXT,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_receitas_ano_mes ON receitas(ano, mes)
`);

// Bancos antigos: garantir compatibilidade com estrutura atual
const cols = db.prepare("PRAGMA table_info(receitas)").all();
if (!cols.some((c) => c.name === "pessoa")) {
  db.exec(
    "ALTER TABLE receitas ADD COLUMN pessoa TEXT NOT NULL DEFAULT 'Casal'",
  );
}
if (!cols.some((c) => c.name === "natureza")) {
  db.exec(
    "ALTER TABLE receitas ADD COLUMN natureza TEXT NOT NULL DEFAULT 'fixa'",
  );
}
if (!cols.some((c) => c.name === "data")) {
  db.exec("ALTER TABLE receitas ADD COLUMN data TEXT");
}

console.log("✅ Tabela 'receitas' criada (ou já existia).");
console.log(
  "   Campos: id, pessoa, natureza, categoria, valor, data, ano, mes, createdAt, updatedAt",
);
db.close();
