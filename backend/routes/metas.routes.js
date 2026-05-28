const express = require("express");
const db = require("../scripts/db");
const { autenticarToken } = require("../middlewares/auth.middleware");
const { ensureDadosFinanceirosPorUsuario } = require("../utils/user-data-scope");

const router = express.Router();

function ensureAnoColumn() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const cols = db.prepare("PRAGMA table_info(metas)").all();
  if (!cols.some((c) => c.name === "ano")) {
    db.exec(`ALTER TABLE metas ADD COLUMN ano INTEGER`);
  }

  const migracaoAplicada = db
    .prepare("SELECT 1 FROM schema_migrations WHERE name = ?")
    .get("metas_ano_legado_null");

  if (!migracaoAplicada) {
    db.exec(`UPDATE metas SET ano = NULL`);
    db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(
      "metas_ano_legado_null",
    );
  }

  const migracaoAnoExercicio = db
    .prepare("SELECT 1 FROM schema_migrations WHERE name = ?")
    .get("metas_ano_legado_exercicio_atual");

  if (!migracaoAnoExercicio) {
    const anoAtual = new Date().getFullYear();
    db.prepare("UPDATE metas SET ano = ? WHERE ano IS NULL").run(anoAtual);
    db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(
      "metas_ano_legado_exercicio_atual",
    );
  }

  // Metas criadas antes do campo "ano" passam a valer para o exercício atual
  const anoAtual = new Date().getFullYear();
  const corrigidas = db
    .prepare("UPDATE metas SET ano = ? WHERE ano IS NULL")
    .run(anoAtual);
  if (corrigidas.changes > 0) {
    console.log(
      `[metas] ${corrigidas.changes} meta(s) legada(s) vinculada(s) ao ano ${anoAtual}`,
    );
  }
}

ensureAnoColumn();
ensureDadosFinanceirosPorUsuario();
router.use(autenticarToken);

function listarMetasPorAno(anoQuery, usuarioId) {
  const anoAtual = new Date().getFullYear();

  if (anoQuery === anoAtual) {
    db.prepare(
      "UPDATE metas SET ano = ? WHERE usuario_id = ? AND ano IS NULL",
    ).run(anoAtual, usuarioId);
  }

  const sufixoAno = `/${anoQuery}`;

  // Criada no ano, parcelas com /ano no nome, ou planejamento longo (ex. 18 meses 2026→2027)
  return db
    .prepare(
      `
      SELECT DISTINCT m.* FROM metas m
      WHERE m.usuario_id = ?
        AND (
          m.ano = ?
          OR (m.ano IS NULL AND ? = ?)
          OR EXISTS (
           SELECT 1 FROM meses ms
           WHERE ms.metaId = m.id AND ms.nome LIKE '%' || ?
          )
          OR (
           m.ano IS NOT NULL
           AND m.mesesNecessarios > 0
           AND m.ano <= ?
           AND (m.ano + (m.mesesNecessarios - 1) / 12) >= ?
          )
        )
      ORDER BY m.id
    `,
    )
    .all(usuarioId, anoQuery, anoQuery, anoAtual, sufixoAno, anoQuery, anoQuery);
}

//GET /api/metas?ano=2026  (ano obrigatório)
router.get("/", (req, res) => {
  try {
    const anoQuery = parseInt(req.query.ano, 10);
    if (!Number.isFinite(anoQuery)) {
      return res.status(400).json({
        error: "Informe o parâmetro ano (ex.: ?ano=2026)",
      });
    }

    const metas = listarMetasPorAno(anoQuery, req.usuario.id);

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

// GET /api/metas/:id
router.get("/:id", (req, res) => {
  try {
    const meta = db
      .prepare("SELECT * FROM metas WHERE id = ? AND usuario_id = ?")
      .get(parseInt(req.params.id), req.usuario.id);

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

// POST /api/metas
router.post("/", (req, res) => {
  try {
    const {
      nome,
      valorMeta,
      valorPorMes,
      mesesNecessarios,
      valorAtual,
      icon,
      meses,
      ano,
    } = req.body;

    const anoMeta = parseInt(ano, 10);
    const anoInserir = Number.isFinite(anoMeta)
      ? anoMeta
      : new Date().getFullYear();

    // Inserir meta
    const insertMeta = db.prepare(`
      INSERT INTO metas (usuario_id, nome, valorMeta, valorPorMes, mesesNecessarios, valorAtual, icon, ano)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const iconValue = icon && icon.trim() !== "" ? icon : "bi-bullseye";

    console.log(`🎨 Criando meta "${nome}" com ícone: ${iconValue}`);

    const result = insertMeta.run(
      req.usuario.id,
      nome,
      valorMeta || 0,
      valorPorMes || 0,
      mesesNecessarios || 0,
      valorAtual || 0,
      iconValue,
      anoInserir,
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
      .prepare("SELECT * FROM metas WHERE id = ? AND usuario_id = ?")
      .get(metaId, req.usuario.id);
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

// PATCH /api/metas/:id
router.patch("/:id", (req, res) => {
  try {
    const metaId = parseInt(req.params.id);
    const updates = req.body;

    // Verificar se meta existe
    const metaExistente = db
      .prepare("SELECT * FROM metas WHERE id = ? AND usuario_id = ?")
      .get(metaId, req.usuario.id);

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
      "ano",
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
        `UPDATE metas SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?`,
      ).run(...values, metaId, req.usuario.id);
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
      .prepare("SELECT * FROM metas WHERE id = ? AND usuario_id = ?")
      .get(metaId, req.usuario.id);
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

// PUT /api/metas/:id
router.put("/:id", (req, res) => {
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
      .prepare("SELECT * FROM metas WHERE id = ? AND usuario_id = ?")
      .get(metaId, req.usuario.id);

    if (!metaExistente) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    // Atualizar meta
    const iconValue = req.body.icon || "bi-bullseye";
    db.prepare(
      `UPDATE metas
       SET nome = ?, valorMeta = ?, valorPorMes = ?, mesesNecessarios = ?,
           valorAtual = ?, icon = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND usuario_id = ?`,
    ).run(
      nome,
      valorMeta || 0,
      valorPorMes || 0,
      mesesNecessarios || 0,
      valorAtual || 0,
      iconValue,
      metaId,
      req.usuario.id,
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
      .prepare("SELECT * FROM metas WHERE id = ? AND usuario_id = ?")
      .get(metaId, req.usuario.id);
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

// DELETE /api/metas/:id
router.delete("/:id", (req, res) => {
  try {
    const metaId = parseInt(req.params.id);

    // Verificar se meta existe
    const meta = db
      .prepare("SELECT * FROM metas WHERE id = ? AND usuario_id = ?")
      .get(metaId, req.usuario.id);

    if (!meta) {
      return res.status(404).json({ error: "Meta não encontrada" });
    }

    // Deletar meses (devido ao CASCADE, isso acontece automaticamente)
    db.prepare("DELETE FROM meses WHERE metaId = ?").run(metaId);

    // Deletar meta
    db.prepare("DELETE FROM metas WHERE id = ? AND usuario_id = ?").run(
      metaId,
      req.usuario.id,
    );

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    res.status(500).json({ error: "Erro ao deletar meta" });
  }
});

module.exports = router;
