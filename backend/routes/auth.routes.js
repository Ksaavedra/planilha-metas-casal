const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../scripts/db");
const { JWT_SECRET, autenticarToken } = require("../middlewares/auth.middleware");
const { migrarDadosLegadosParaUsuario } = require("../utils/user-data-scope");

const router = express.Router();
const TOKEN_EXPIRATION = "7d";

function ensureUsuariosAuthSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT,
      senha_hash TEXT,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const cols = db.prepare("PRAGMA table_info(usuarios)").all();
  const hasColumn = (name) => cols.some((col) => col.name === name);

  if (!hasColumn("email")) {
    db.exec("ALTER TABLE usuarios ADD COLUMN email TEXT");
  }

  if (!hasColumn("senha_hash")) {
    db.exec("ALTER TABLE usuarios ADD COLUMN senha_hash TEXT");
  }

  if (!hasColumn("data_criacao")) {
    db.exec("ALTER TABLE usuarios ADD COLUMN data_criacao TEXT");
    db.exec("UPDATE usuarios SET data_criacao = CURRENT_TIMESTAMP WHERE data_criacao IS NULL");
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unico
    ON usuarios(lower(email))
    WHERE email IS NOT NULL AND trim(email) <> ''
  `);
}

ensureUsuariosAuthSchema();

function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function usuarioResponse(row) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    dataCriacao: row.data_criacao,
  };
}

function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION },
  );
}

function buscarUsuarioPorEmail(email) {
  return db
    .prepare(
      `
      SELECT id, nome, email, senha_hash, data_criacao
      FROM usuarios
      WHERE lower(email) = lower(?)
    `,
    )
    .get(email);
}

router.post("/registrar", async (req, res) => {
  try {
    const nome = String(req.body.nome || "").trim();
    const email = normalizarEmail(req.body.email);
    const senha = String(req.body.senha || "");

    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: "Nome, email e senha são obrigatórios.",
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    const existente = buscarUsuarioPorEmail(email);
    if (existente) {
      return res.status(409).json({ error: "Email já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const result = db
      .prepare(
        `
        INSERT INTO usuarios (nome, email, senha_hash)
        VALUES (?, ?, ?)
      `,
      )
      .run(nome, email, senhaHash);

    const usuario = db
      .prepare(
        `
        SELECT id, nome, email, data_criacao
        FROM usuarios
        WHERE id = ?
      `,
      )
      .get(result.lastInsertRowid);

    migrarDadosLegadosParaUsuario(usuario.id);

    const token = gerarToken(usuario);

    res.status(201).json({
      message: "Conta criada com sucesso.",
      token,
      usuario: usuarioResponse(usuario),
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizarEmail(req.body.email);
    const senha = String(req.body.senha || "");

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    const usuario = buscarUsuarioPorEmail(email);
    if (!usuario || !usuario.senha_hash) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    const token = gerarToken(usuario);

    res.json({
      message: "Login realizado com sucesso.",
      token,
      usuario: usuarioResponse(usuario),
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ error: "Erro ao fazer login." });
  }
});

router.get("/perfil", autenticarToken, (req, res) => {
  try {
    const usuario = db
      .prepare(
        `
        SELECT id, nome, email, data_criacao
        FROM usuarios
        WHERE id = ?
      `,
      )
      .get(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(usuarioResponse(usuario));
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    res.status(500).json({ error: "Erro ao buscar perfil." });
  }
});

module.exports = router;
