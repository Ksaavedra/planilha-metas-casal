const express = require("express");
const db = require("../scripts/db");
const { autenticarToken } = require("../middlewares/auth.middleware");

const router = express.Router();

// 1. Criar tabela usuários
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pessoas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_pessoas_usuario_nome
  ON pessoas(usuario_id, lower(nome))
`);

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

function adicionarPessoaSeNaoExiste(usuarioId, nome) {
  const nomeVal = String(nome || "").trim();
  if (!nomeVal) return;

  const existente = db
    .prepare(
      "SELECT id FROM pessoas WHERE usuario_id = ? AND lower(nome) = lower(?)",
    )
    .get(usuarioId, nomeVal);

  if (!existente) {
    db.prepare("INSERT INTO pessoas (usuario_id, nome) VALUES (?, ?)").run(
      usuarioId,
      nomeVal,
    );
  }
}

function migrarPessoasLegadas(usuarioId) {
  const possuiPessoas = db
    .prepare("SELECT 1 FROM pessoas WHERE usuario_id = ? LIMIT 1")
    .get(usuarioId);

  if (possuiPessoas) return;

  if (usuarioId === getPrimeiroUsuarioAuthId()) {
    const nomesLegados = db
      .prepare(
        `
        SELECT nome FROM usuarios
        WHERE (email IS NULL OR trim(email) = '')
          AND nome IS NOT NULL
          AND trim(nome) <> ''
      `,
      )
      .all();

    nomesLegados.forEach((row) => adicionarPessoaSeNaoExiste(usuarioId, row.nome));
  }

  for (const tableName of ["receitas", "despesas", "cartoes", "investimentos"]) {
    const table = db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName);
    if (!table) continue;

    const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const hasPessoa = cols.some((col) => col.name === "pessoa");
    const hasUsuarioId = cols.some((col) => col.name === "usuario_id");
    if (!hasPessoa || !hasUsuarioId) continue;

    const rows = db
      .prepare(
        `SELECT DISTINCT pessoa FROM ${tableName}
         WHERE usuario_id = ?
           AND pessoa IS NOT NULL
           AND trim(pessoa) <> ''`,
      )
      .all(usuarioId);

    rows.forEach((row) => adicionarPessoaSeNaoExiste(usuarioId, row.pessoa));
  }
}

router.use(autenticarToken);

router.use((req, _res, next) => {
  migrarPessoasLegadas(req.usuario.id);
  next();
});

// GET → lista usuários (autocomplete)
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT id, nome FROM pessoas WHERE usuario_id = ? ORDER BY nome")
      .all(req.usuario.id);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// POST → cria usuário se não existir
router.post("/", (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome || !String(nome).trim()) {
      return res.status(400).json({ error: "Nome é obrigatório." });
    }

    const nomeVal = String(nome).trim();

    const existente = db
      .prepare(
        "SELECT id, nome FROM pessoas WHERE usuario_id = ? AND lower(nome) = lower(?)",
      )
      .get(req.usuario.id, nomeVal);

    if (existente) {
      return res.status(200).json(existente);
    }

    const result = db
      .prepare("INSERT INTO pessoas (usuario_id, nome) VALUES (?, ?)")
      .run(req.usuario.id, nomeVal);

    const created = db
      .prepare("SELECT id, nome FROM pessoas WHERE id = ? AND usuario_id = ?")
      .get(result.lastInsertRowid, req.usuario.id);

    res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

module.exports = router;
