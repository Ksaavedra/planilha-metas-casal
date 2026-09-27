const express = require("express");
const db = require("../scripts/db");
const { autenticarToken } = require("../middlewares/auth.middleware");

const router = express.Router();

const COMENTARIO_MAX = 1000;
const PAGINA_MAX = 200;

db.exec(`
  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
    comentario TEXT,
    pagina TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_feedbacks_usuario
  ON feedbacks(usuario_id)
`);

router.use(autenticarToken);

//POST /api/feedback
router.post("/", (req, res) => {
  try {
    const nota = Number(req.body.nota);

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res
        .status(400)
        .json({ error: "nota deve ser um número inteiro de 1 a 5." });
    }

    const comentario =
      String(req.body.comentario ?? "")
        .trim()
        .slice(0, COMENTARIO_MAX) || null;
    const pagina =
      String(req.body.pagina ?? "")
        .trim()
        .slice(0, PAGINA_MAX) || null;

    const result = db
      .prepare(
        `INSERT INTO feedbacks (usuario_id, nota, comentario, pagina)
         VALUES (?, ?, ?, ?)`,
      )
      .run(req.usuario.id, nota, comentario, pagina);

    const created = db
      .prepare(
        `SELECT id, nota, comentario, pagina, createdAt
         FROM feedbacks
         WHERE id = ?`,
      )
      .get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao salvar feedback:", error);
    res.status(500).json({ error: "Erro ao salvar feedback" });
  }
});

module.exports = router;
