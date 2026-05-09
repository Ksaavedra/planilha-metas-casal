const express = require("express");
const db = require("../scripts/db");

const router = express.Router();

//GET /api/metas
router.get("/", (req, res) => {
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

// GET /api/metas/:id
router.get("/:id", (req, res) => {
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

// PATCH /api/metas/:id
router.patch("/:id", (req, res) => {
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

// DELETE /api/metas/:id
router.delete("/:id", (req, res) => {
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

module.exports = router;
