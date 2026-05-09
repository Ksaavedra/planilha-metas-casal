const express = require("express");
const db = require("../scripts/db");

const router = express.Router();

// 1. Criar tabela usuários
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 2. Copiar nomes que já existem em receitas
db.exec(`
  INSERT OR IGNORE INTO usuarios (nome)
  SELECT DISTINCT pessoa FROM receitas
  WHERE pessoa IS NOT NULL AND trim(pessoa) <> ''
`);

// 3. Copiar nomes que já existem em despesas
db.exec(`
  INSERT OR IGNORE INTO usuarios (nome)
  SELECT DISTINCT pessoa FROM despesas
  WHERE pessoa IS NOT NULL AND trim(pessoa) <> ''
`);

// GET → lista usuários (autocomplete)
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT id, nome FROM usuarios ORDER BY nome")
      .all();

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
      .prepare("SELECT id, nome FROM usuarios WHERE lower(nome) = lower(?)")
      .get(nomeVal);

    if (existente) {
      return res.status(200).json(existente);
    }

    const result = db
      .prepare("INSERT INTO usuarios (nome) VALUES (?)")
      .run(nomeVal);

    const created = db
      .prepare("SELECT id, nome FROM usuarios WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

module.exports = router;
