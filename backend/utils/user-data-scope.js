const db = require("../scripts/db");

const TABELAS_FINANCEIRAS = [
  "receitas",
  "despesas",
  "metas",
  "investimentos",
  "dividas",
  "cartoes",
];

function tableExists(tableName) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName),
  );
}

function columnExists(tableName, columnName) {
  return db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);
}

function ensureUsuarioIdColumn(tableName) {
  if (!tableExists(tableName)) return;

  if (!columnExists(tableName, "usuario_id")) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN usuario_id INTEGER`);
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_${tableName}_usuario_id
    ON ${tableName}(usuario_id)
  `);
}

function getPrimeiroUsuarioAuthId() {
  const usuario = db
    .prepare(
      `
      SELECT id
      FROM usuarios
      WHERE email IS NOT NULL
        AND trim(email) <> ''
        AND senha_hash IS NOT NULL
        AND trim(senha_hash) <> ''
      ORDER BY id
      LIMIT 1
    `,
    )
    .get();

  return usuario?.id ?? null;
}

function migrarDadosLegadosParaUsuario(usuarioId) {
  if (!usuarioId) return;

  for (const tableName of TABELAS_FINANCEIRAS) {
    if (!tableExists(tableName)) continue;
    ensureUsuarioIdColumn(tableName);
    db.prepare(
      `UPDATE ${tableName} SET usuario_id = ? WHERE usuario_id IS NULL`,
    ).run(usuarioId);
  }
}

function ensureDadosFinanceirosPorUsuario() {
  for (const tableName of TABELAS_FINANCEIRAS) {
    ensureUsuarioIdColumn(tableName);
  }

  migrarDadosLegadosParaUsuario(getPrimeiroUsuarioAuthId());
}

module.exports = {
  ensureDadosFinanceirosPorUsuario,
  migrarDadosLegadosParaUsuario,
};
