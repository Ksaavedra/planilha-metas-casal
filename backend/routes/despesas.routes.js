const express = require("express");
const db = require("../scripts/db");

const router = express.Router();

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

console.table(db.prepare("PRAGMA table_info(despesas)").all());
db.exec(
  `CREATE INDEX IF NOT EXISTS idx_despesas_ano_mes ON despesas(ano, mes)`,
);

// Bancos antigos: coluna pessoa (quem comprou)
{
  const cols = db.prepare("PRAGMA table_info(despesas)").all();
  if (!cols.some((c) => c.name === "pessoa")) {
    db.exec(
      "ALTER TABLE despesas ADD COLUMN pessoa TEXT NOT NULL DEFAULT 'Casal'",
    );
  }
}

// GET /api/despesas
router.get("/", (req, res) => {
  try {
    const ano = parseInt(req.query.ano, 10);
    const mes = parseInt(req.query.mes, 10);
    if (isNaN(ano) || isNaN(mes) || mes < 1 || mes > 12) {
      return res
        .status(400)
        .json({ error: "Query params 'ano' e 'mes' (1-12) obrigatórios." });
    }
    const rows = db
      .prepare(
        "SELECT id, pessoa, natureza, categoria, descricao, valor, data, ano, mes FROM despesas WHERE ano = ? AND mes = ? ORDER BY natureza ASC, pessoa, categoria, id",
      )
      .all(ano, mes);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    res.status(500).json({ error: "Erro ao buscar despesas" });
  }
});

// GET /api/despesas/:id
router.get("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = db
      .prepare(
        "SELECT id, pessoa, natureza, categoria, descricao, valor, data, ano, mes FROM despesas WHERE id = ?",
      )
      .get(id);
    if (!row) {
      return res.status(404).json({ error: "Despesa não encontrada" });
    }
    res.json(row);
  } catch (error) {
    console.error("Erro ao buscar despesa:", error);
    res.status(500).json({ error: "Erro ao buscar despesa" });
  }
});

// POST /api/despesas
router.post("/", (req, res) => {
  try {
    const { pessoa, natureza, categoria, descricao, valor, data, ano, mes } =
      req.body;
    if (!natureza || !categoria || !descricao) {
      return res
        .status(400)
        .json({ error: "natureza, categoria e descricao são obrigatórios." });
    }
    const pessoaVal =
      pessoa != null && String(pessoa).trim() !== ""
        ? String(pessoa).trim()
        : "Casal";
    if (natureza !== "fixa" && natureza !== "variavel") {
      return res
        .status(400)
        .json({ error: "natureza deve ser 'fixa' ou 'variavel'." });
    }
    if (valor == null || valor === "") {
      return res.status(400).json({ error: "valor é obrigatório." });
    }
    const a = parseInt(ano, 10);
    const m = parseInt(mes, 10);
    if (isNaN(a) || isNaN(m) || m < 1 || m > 12) {
      return res.status(400).json({ error: "ano e mes (1-12) inválidos." });
    }
    const v = parseFloat(String(valor).replace(",", "."));
    if (isNaN(v)) {
      return res.status(400).json({ error: "valor inválido." });
    }
    const dataVal =
      data != null && String(data).trim() !== "" ? String(data).trim() : null;
    const result = db
      .prepare(
        "INSERT INTO despesas (pessoa, natureza, categoria, descricao, valor, data, ano, mes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        pessoaVal,
        natureza,
        String(categoria).trim(),
        String(descricao).trim(),
        v,
        dataVal,
        a,
        m,
      );
    const created = db
      .prepare(
        "SELECT id, pessoa, natureza, categoria, descricao, valor, data, ano, mes FROM despesas WHERE id = ?",
      )
      .get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    console.error("Erro ao criar despesa:", error);
    res.status(500).json({ error: "Erro ao criar despesa" });
  }
});

// PATCH /api/despesas/:id
router.patch("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare("SELECT * FROM despesas WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Despesa não encontrada" });
    }
    const updates = req.body;
    const allowed = [
      "pessoa",
      "natureza",
      "categoria",
      "descricao",
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
        values.push(String(updates.pessoa).trim() || "Casal");
        continue;
      }
      if (k === "natureza") {
        if (updates.natureza !== "fixa" && updates.natureza !== "variavel") {
          return res
            .status(400)
            .json({ error: "natureza deve ser 'fixa' ou 'variavel'." });
        }
        set.push("natureza = ?");
        values.push(updates.natureza);
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
          updates.data != null && String(updates.data).trim() !== ""
            ? String(updates.data).trim()
            : null;
        set.push("data = ?");
        values.push(d);
      } else {
        set.push(`${k} = ?`);
        values.push(
          k === "categoria" || k === "descricao"
            ? String(updates[k]).trim()
            : updates[k],
        );
      }
    }
    if (set.length) {
      set.push("updatedAt = CURRENT_TIMESTAMP");
      db.prepare(`UPDATE despesas SET ${set.join(", ")} WHERE id = ?`).run(
        ...values,
        id,
      );
    }
    const updated = db
      .prepare(
        "SELECT id, pessoa, natureza, categoria, descricao, valor, data, ano, mes FROM despesas WHERE id = ?",
      )
      .get(id);
    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar despesa:", error);
    res.status(500).json({ error: "Erro ao atualizar despesa" });
  }
});

// DELETE /api/despesas/:id
router.delete("/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare("SELECT * FROM despesas WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Despesa não encontrada" });
    }
    db.prepare("DELETE FROM despesas WHERE id = ?").run(id);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar despesa:", error);
    res.status(500).json({ error: "Erro ao deletar despesa" });
  }
});

module.exports = router;
