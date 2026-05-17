const express = require("express");
const db = require("../scripts/db");

const router = express.Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS receitas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pessoa TEXT NOT NULL DEFAULT 'Casal',
    natureza TEXT NOT NULL,
    categoria TEXT NOT NULL,
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

//GET /api/receitas
router.get("/", (req, res) => {
  try {
    const ano = parseInt(req.query.ano, 10);
    const mes = parseInt(req.query.mes, 10);

    if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) {
      return res
        .status(400)
        .json({ error: "Query params 'ano' e 'mes' obrigatórios." });
    }

    const rows = db
      .prepare(
        `SELECT id, pessoa, natureza, categoria, valor, data, ano, mes
         FROM receitas
         WHERE ano = ? AND mes = ?
         ORDER BY natureza ASC, pessoa, categoria, id`,
      )
      .all(ano, mes);

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar receitas:", error);
    res.status(500).json({ error: "Erro ao buscar receitas" });
  }
});

//GET /api/receitas/:id
router.get("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const row = db
      .prepare(
        `SELECT id, pessoa, natureza, categoria, valor, data, ano, mes
         FROM receitas
         WHERE id = ?`,
      )
      .get(id);

    if (!row) {
      return res.status(404).json({ error: "Receita não encontrada" });
    }

    res.json(row);
  } catch (error) {
    console.error("Erro ao buscar receita:", error);
    res.status(500).json({ error: "Erro ao buscar receita" });
  }
});

//POST /api/receitas
router.post("/", (req, res) => {
  try {
    const { pessoa, natureza, categoria, valor, data, ano, mes } = req.body;

    if (!natureza || !categoria) {
      return res
        .status(400)
        .json({ error: "natureza e categoria são obrigatórios." });
    }

    if (natureza !== "fixa" && natureza !== "variavel") {
      return res
        .status(400)
        .json({ error: "natureza deve ser 'fixa' ou 'variavel'." });
    }

    if (valor == null || valor === "") {
      return res.status(400).json({ error: "valor é obrigatório." });
    }

    const pessoaVal =
      pessoa != null && String(pessoa).trim() !== ""
        ? String(pessoa).trim()
        : "Casal";

    const v = parseFloat(String(valor).replace(",", "."));
    const a = parseInt(ano, 10);
    const m = parseInt(mes, 10);

    if (isNaN(v) || isNaN(a) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: "valor, ano ou mes inválidos." });
    }

    const dataVal =
      data != null && String(data).trim() !== "" ? String(data).trim() : null;

    const result = db
      .prepare(
        `INSERT INTO receitas
         (pessoa, natureza, categoria, valor, data, ano, mes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(pessoaVal, natureza, String(categoria).trim(), v, dataVal, a, m);

    const created = db
      .prepare(
        `SELECT id, pessoa, natureza, categoria, valor, data, ano, mes
         FROM receitas
         WHERE id = ?`,
      )
      .get(result.lastInsertRowid);

    res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao criar receita:", error);
    res.status(500).json({ error: "Erro ao criar receita" });
  }
});

//PATCH /api/receitas/:id
router.patch("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = db.prepare("SELECT * FROM receitas WHERE id = ?").get(id);

    if (!existing) {
      return res.status(404).json({ error: "Receita não encontrada" });
    }

    const updates = req.body;
    const allowed = [
      "pessoa",
      "natureza",
      "categoria",
      "valor",
      "data",
      "ano",
      "mes",
    ];

    const set = [];
    const values = [];

    for (const k of allowed) {
      if (updates[k] === undefined) continue;

      if (k === "pessoa") {
        set.push("pessoa = ?");
        values.push(String(updates[k]).trim() || "Casal");
      } else if (k === "natureza") {
        if (updates[k] !== "fixa" && updates[k] !== "variavel") {
          return res
            .status(400)
            .json({ error: "natureza deve ser 'fixa' ou 'variavel'." });
        }

        set.push("natureza = ?");
        values.push(updates[k]);
      } else if (k === "valor") {
        const v = parseFloat(String(updates[k]).replace(",", "."));

        if (isNaN(v)) {
          return res.status(400).json({ error: "valor inválido." });
        }

        set.push("valor = ?");
        values.push(v);
      } else if (k === "ano" || k === "mes") {
        set.push(`${k} = ?`);
        values.push(parseInt(updates[k], 10));
      } else if (k === "data") {
        const d =
          updates[k] != null && String(updates[k]).trim() !== ""
            ? String(updates[k]).trim()
            : null;

        set.push("data = ?");
        values.push(d);
      } else {
        set.push(`${k} = ?`);
        values.push(String(updates[k]).trim());
      }
    }

    if (set.length) {
      set.push("updatedAt = CURRENT_TIMESTAMP");

      db.prepare(`UPDATE receitas SET ${set.join(", ")} WHERE id = ?`).run(
        ...values,
        id,
      );
    }

    const updated = db
      .prepare(
        `SELECT id, pessoa, natureza, categoria, valor, data, ano, mes
         FROM receitas
         WHERE id = ?`,
      )
      .get(id);

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar receita:", error);
    res.status(500).json({ error: "Erro ao atualizar receita" });
  }
});

//DELETE /api/receitas/:id
router.delete("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = db.prepare("SELECT id FROM receitas WHERE id = ?").get(id);

    if (!existing) {
      return res.status(404).json({ error: "Receita não encontrada" });
    }

    db.prepare("DELETE FROM receitas WHERE id = ?").run(id);

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar receita:", error);
    res.status(500).json({ error: "Erro ao deletar receita" });
  }
});

module.exports = router;
