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

console.log("📦 Adicionando tabela 'despesas' ao banco...");

db.exec(`
  CREATE TABLE IF NOT EXISTS despesas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa TEXT NOT NULL DEFAULT 'Casal',
    natureza TEXT NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor REAL NOT NULL,
    data TEXT,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(
  `CREATE INDEX IF NOT EXISTS idx_despesas_ano_mes ON despesas(ano, mes)`,
);

const cols = db.prepare("PRAGMA table_info(despesas)").all();
if (!cols.some((c) => c.name === "pessoa")) {
  db.exec(
    "ALTER TABLE despesas ADD COLUMN pessoa TEXT NOT NULL DEFAULT 'Casal'",
  );
}

console.log("✅ Tabela 'despesas' criada (ou já existia).");
console.log(
  "   Campos: id, pessoa, natureza, categoria, descricao, valor, data, ano, mes, createdAt, updatedAt",
);
db.close();
