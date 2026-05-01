const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "../metas.db");

app.use(cors());
app.use(express.json());

// Verificação rápida: abra http://localhost:3000/api/health
// (Se der 404, o processo na porta 3000 não é este server.js — reinicie: npm run server na pasta frontend.)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "planilha-server", hasDespesasApi: true });
});

// Conectar ao banco de dados SQLite
const db = new Database(DB_PATH);

// Habilitar chaves estrangeiras
db.pragma("foreign_keys = ON");

// Garantir tabela receitas existe
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
db.exec(
  `CREATE INDEX IF NOT EXISTS idx_receitas_ano_mes ON receitas(ano, mes)`,
);

// Bancos antigos: coluna pessoa (quem comprou)
let RECEITAS_COLUNAS = [];
let RECEITAS_TEM_NATUREZA = false;
let RECEITAS_TEM_TIPO = false;
{
  const cols = db.prepare("PRAGMA table_info(receitas)").all();
  const nomes = cols.map((c) => c.name);
  RECEITAS_COLUNAS = nomes;
  RECEITAS_TEM_NATUREZA = nomes.includes("natureza");
  RECEITAS_TEM_TIPO = nomes.includes("tipo");

  if (!nomes.includes("pessoa")) {
    db.exec(
      "ALTER TABLE receitas ADD COLUMN pessoa TEXT NOT NULL DEFAULT 'Casal'",
    );
  }

  // Bancos legados tinham coluna "tipo" (Fixa/Variável) em vez de "natureza" (fixa/variavel).
  if (!RECEITAS_TEM_NATUREZA) {
    try {
      db.exec(
        "ALTER TABLE receitas ADD COLUMN natureza TEXT NOT NULL DEFAULT 'fixa'",
      );
      if (RECEITAS_TEM_TIPO) {
        db.exec(`
          UPDATE receitas
             SET natureza = CASE
               WHEN lower(trim(tipo)) LIKE 'vari%' THEN 'variavel'
               ELSE 'fixa'
             END
        `);
      }
      RECEITAS_TEM_NATUREZA = true;
    } catch (e) {
      console.warn(
        "Aviso ao migrar coluna natureza em receitas (seguindo com fallback):",
        e?.message || e,
      );
    }
  }

  if (!nomes.includes("data")) {
    db.exec("ALTER TABLE receitas ADD COLUMN data TEXT");
  }
}

const RECEITAS_NATUREZA_SELECT = RECEITAS_TEM_NATUREZA
  ? "natureza"
  : RECEITAS_TEM_TIPO
    ? "CASE WHEN lower(trim(tipo)) LIKE 'vari%' THEN 'variavel' ELSE 'fixa' END AS natureza"
    : "'fixa' AS natureza";

const toTipoLegacy = (natureza) =>
  natureza === "variavel" ? "Variável" : "Fixa";

// GET /api/receitas?ano=2026&mes=1
app.get("/api/receitas", (req, res) => {
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
        `SELECT id, pessoa, ${RECEITAS_NATUREZA_SELECT}, categoria, valor, data, ano, mes
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

// GET /api/receitas/:id
app.get("/api/receitas/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = db
      .prepare(
        `SELECT id, pessoa, ${RECEITAS_NATUREZA_SELECT}, categoria, valor, data, ano, mes
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

// POST /api/receitas
app.post("/api/receitas", (req, res) => {
  try {
    const { pessoa, natureza, categoria, valor, data, ano, mes } = req.body;
    if (!natureza || !categoria) {
      return res
        .status(400)
        .json({ error: "natureza e categoria são obrigatórios." });
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
    const naturezaFinal = String(natureza).trim();
    const result = RECEITAS_TEM_NATUREZA
      ? db
          .prepare(
            "INSERT INTO receitas (pessoa, natureza, categoria, valor, data, ano, mes) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            pessoaVal,
            naturezaFinal,
            String(categoria).trim(),
            v,
            dataVal,
            a,
            m,
          )
      : RECEITAS_TEM_TIPO
        ? db
            .prepare(
              "INSERT INTO receitas (pessoa, tipo, categoria, valor, data, ano, mes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            )
            .run(
              pessoaVal,
              toTipoLegacy(naturezaFinal),
              String(categoria).trim(),
              v,
              dataVal,
              a,
              m,
            )
        : db
            .prepare(
              "INSERT INTO receitas (pessoa, categoria, valor, data, ano, mes) VALUES (?, ?, ?, ?, ?, ?)",
            )
            .run(pessoaVal, String(categoria).trim(), v, dataVal, a, m);
    const created = db
      .prepare(
        `SELECT id, pessoa, ${RECEITAS_NATUREZA_SELECT}, categoria, valor, data, ano, mes
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

// PATCH /api/receitas/:id
app.patch("/api/receitas/:id", (req, res) => {
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
        values.push(String(updates.pessoa).trim() || "Casal");
        continue;
      }

      if (k === "natureza") {
        if (updates.natureza !== "fixa" && updates.natureza !== "variavel") {
          return res
            .status(400)
            .json({ error: "natureza deve ser 'fixa' ou 'variavel'." });
        }
        if (RECEITAS_TEM_NATUREZA) {
          set.push("natureza = ?");
          values.push(updates.natureza);
        } else if (RECEITAS_TEM_TIPO) {
          set.push("tipo = ?");
          values.push(toTipoLegacy(updates.natureza));
        }
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
        values.push(k === "categoria" ? String(updates[k]).trim() : updates[k]);
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
        `SELECT id, pessoa, ${RECEITAS_NATUREZA_SELECT}, categoria, valor, data, ano, mes
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

// DELETE /api/receitas/:id
app.delete("/api/receitas/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare("SELECT * FROM receitas WHERE id = ?").get(id);
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

// ---------- DESPESAS (fixa / variável, por mês) ----------

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

// Bancos antigos: coluna pessoa (quem comprou)
{
  const cols = db.prepare("PRAGMA table_info(despesas)").all();
  if (!cols.some((c) => c.name === "pessoa")) {
    db.exec(
      "ALTER TABLE despesas ADD COLUMN pessoa TEXT NOT NULL DEFAULT 'Casal'",
    );
  }
}

// GET /api/despesas?ano=2025&mes=1
app.get("/api/despesas", (req, res) => {
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
app.get("/api/despesas/:id", (req, res) => {
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
app.post("/api/despesas", (req, res) => {
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
app.patch("/api/despesas/:id", (req, res) => {
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
app.delete("/api/despesas/:id", (req, res) => {
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

// ---------- METAS ----------

// GET /api/metas - Listar todas as metas
app.get("/api/metas", (req, res) => {
  try {
    const metas = db.prepare("SELECT * FROM metas ORDER BY id").all();

    // Para cada meta, buscar seus meses
    const metasComMeses = metas.map((meta) => {
      const meses = db
        .prepare("SELECT * FROM meses WHERE metaId = ? ORDER BY id")
        .all(meta.id);

      return {
        ...meta,
        icon: meta.icon || "bi-bullseye", // Garantir que sempre tenha um ícone
        meses: meses.map((mes) => ({
          id: mes.id,
          nome: mes.nome,
          valor: mes.valor,
          status: mes.status,
        })),
      };
    });

    res.json(metasComMeses);
  } catch (error) {
    console.error("Erro ao buscar metas:", error);
    res.status(500).json({ error: "Erro ao buscar metas" });
  }
});

// GET /api/metas/:id - Buscar meta por ID
app.get("/api/metas/:id", (req, res) => {
  try {
    const meta = db
      .prepare("SELECT * FROM metas WHERE id = ?")
      .get(parseInt(req.params.id));

    if (!meta) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    // Buscar meses da meta
    const meses = db
      .prepare("SELECT * FROM meses WHERE metaId = ? ORDER BY id")
      .all(meta.id);

    res.json({
      ...meta,
      meses: meses.map((mes) => ({
        id: mes.id,
        nome: mes.nome,
        valor: mes.valor,
        status: mes.status,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar meta:", error);
    res.status(500).json({ error: "Erro ao buscar meta" });
  }
});

// POST /api/metas - Criar nova meta
app.post("/api/metas", (req, res) => {
  try {
    const {
      nome,
      valorMeta,
      valorPorMes,
      mesesNecessarios,
      valorAtual,
      icon,
      meses,
    } = req.body;

    // Inserir meta
    const insertMeta = db.prepare(`
      INSERT INTO metas (nome, valorMeta, valorPorMes, mesesNecessarios, valorAtual, icon)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const iconValue = icon && icon.trim() !== "" ? icon : "bi-bullseye";

    console.log(`🎨 Criando meta "${nome}" com ícone: ${iconValue}`);

    const result = insertMeta.run(
      nome,
      valorMeta || 0,
      valorPorMes || 0,
      mesesNecessarios || 0,
      valorAtual || 0,
      iconValue,
    );

    const metaId = result.lastInsertRowid;

    // Inserir meses da meta
    if (meses && Array.isArray(meses)) {
      const insertMes = db.prepare(`
        INSERT INTO meses (metaId, nome, valor, status)
        VALUES (?, ?, ?, ?)
      `);

      meses.forEach((mes) => {
        insertMes.run(metaId, mes.nome, mes.valor || 0, mes.status || "Vazio");
      });
    }

    // Buscar meta criada com meses
    const metaCriada = db
      .prepare("SELECT * FROM metas WHERE id = ?")
      .get(metaId);
    const mesesMeta = db
      .prepare("SELECT * FROM meses WHERE metaId = ? ORDER BY id")
      .all(metaId);

    res.status(201).json({
      ...metaCriada,
      meses: mesesMeta.map((mes) => ({
        id: mes.id,
        nome: mes.nome,
        valor: mes.valor,
        status: mes.status,
      })),
    });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    res.status(500).json({ error: "Erro ao criar meta" });
  }
});

// PATCH /api/metas/:id - Atualizar meta parcialmente
app.patch("/api/metas/:id", (req, res) => {
  try {
    const metaId = parseInt(req.params.id);
    const updates = req.body;

    // Verificar se meta existe
    const metaExistente = db
      .prepare("SELECT * FROM metas WHERE id = ?")
      .get(metaId);

    if (!metaExistente) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    // Atualizar campos da meta (exceto meses, que é tratado separadamente)
    const camposPermitidos = [
      "nome",
      "valorMeta",
      "valorPorMes",
      "mesesNecessarios",
      "valorAtual",
      "icon",
    ];
    const camposParaAtualizar = {};

    camposPermitidos.forEach((campo) => {
      if (updates[campo] !== undefined) {
        camposParaAtualizar[campo] = updates[campo];
      }
    });

    if (Object.keys(camposParaAtualizar).length > 0) {
      const setClause = Object.keys(camposParaAtualizar)
        .map((campo) => `${campo} = ?`)
        .join(", ");
      const values = Object.values(camposParaAtualizar);

      db.prepare(
        `UPDATE metas SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      ).run(...values, metaId);
    }

    // Se meses foram enviados, atualizar
    if (updates.meses && Array.isArray(updates.meses)) {
      // Deletar meses antigos
      db.prepare("DELETE FROM meses WHERE metaId = ?").run(metaId);

      // Inserir novos meses
      const insertMes = db.prepare(`
        INSERT INTO meses (metaId, nome, valor, status)
        VALUES (?, ?, ?, ?)
      `);

      updates.meses.forEach((mes) => {
        insertMes.run(metaId, mes.nome, mes.valor || 0, mes.status || "Vazio");
      });
    }

    // Buscar meta atualizada
    const metaAtualizada = db
      .prepare("SELECT * FROM metas WHERE id = ?")
      .get(metaId);
    const mesesMeta = db
      .prepare("SELECT * FROM meses WHERE metaId = ? ORDER BY id")
      .all(metaId);

    res.json({
      ...metaAtualizada,
      meses: mesesMeta.map((mes) => ({
        id: mes.id,
        nome: mes.nome,
        valor: mes.valor,
        status: mes.status,
      })),
    });
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    res.status(500).json({ error: "Erro ao atualizar meta" });
  }
});

// PUT /api/metas/:id - Atualizar meta completa
app.put("/api/metas/:id", (req, res) => {
  try {
    const metaId = parseInt(req.params.id);
    const {
      nome,
      valorMeta,
      valorPorMes,
      mesesNecessarios,
      valorAtual,
      meses,
    } = req.body;

    // Verificar se meta existe
    const metaExistente = db
      .prepare("SELECT * FROM metas WHERE id = ?")
      .get(metaId);

    if (!metaExistente) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    // Atualizar meta
    const iconValue = req.body.icon || "bi-bullseye";
    db.prepare(
      `UPDATE metas
       SET nome = ?, valorMeta = ?, valorPorMes = ?, mesesNecessarios = ?,
           valorAtual = ?, icon = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(
      nome,
      valorMeta || 0,
      valorPorMes || 0,
      mesesNecessarios || 0,
      valorAtual || 0,
      iconValue,
      metaId,
    );

    // Atualizar meses
    if (meses && Array.isArray(meses)) {
      // Deletar meses antigos
      db.prepare("DELETE FROM meses WHERE metaId = ?").run(metaId);

      // Inserir novos meses
      const insertMes = db.prepare(`
        INSERT INTO meses (metaId, nome, valor, status)
        VALUES (?, ?, ?, ?)
      `);

      meses.forEach((mes) => {
        insertMes.run(metaId, mes.nome, mes.valor || 0, mes.status || "Vazio");
      });
    }

    // Buscar meta atualizada
    const metaAtualizada = db
      .prepare("SELECT * FROM metas WHERE id = ?")
      .get(metaId);
    const mesesMeta = db
      .prepare("SELECT * FROM meses WHERE metaId = ? ORDER BY id")
      .all(metaId);

    res.json({
      ...metaAtualizada,
      meses: mesesMeta.map((mes) => ({
        id: mes.id,
        nome: mes.nome,
        valor: mes.valor,
        status: mes.status,
      })),
    });
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    res.status(500).json({ error: "Erro ao atualizar meta" });
  }
});

// DELETE /api/metas/:id - Deletar meta
app.delete("/api/metas/:id", (req, res) => {
  try {
    const metaId = parseInt(req.params.id);

    // Verificar se meta existe
    const meta = db.prepare("SELECT * FROM metas WHERE id = ?").get(metaId);

    if (!meta) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    // Deletar meses (devido ao CASCADE, isso acontece automaticamente)
    db.prepare("DELETE FROM meses WHERE metaId = ?").run(metaId);

    // Deletar meta
    db.prepare("DELETE FROM metas WHERE id = ?").run(metaId);

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    res.status(500).json({ error: "Erro ao deletar meta" });
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Fechando conexão com o banco...");
  db.close();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor está rodando em http://localhost:${PORT}`);
  console.log(`📡 API health:   http://localhost:${PORT}/api/health`);
  console.log(`📡 API metas:    http://localhost:${PORT}/api/metas`);
  console.log(`📡 API receitas: http://localhost:${PORT}/api/receitas`);
  console.log(
    `📡 API despesas: http://localhost:${PORT}/api/despesas?ano=2026&mes=4`,
  );
  console.log(`💾 Usando banco SQLite: ${DB_PATH}`);
  console.log(
    `\n✅ Servidor pronto! Se a app mostrar 404 em /api/despesas, pare este processo (Ctrl+C) e suba de novo: npm run server`,
  );
});
