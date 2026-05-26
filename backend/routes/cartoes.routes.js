const express = require('express');
const db = require('../scripts/db');

const router = express.Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS cartoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    banco TEXT NOT NULL,
    limite REAL NOT NULL DEFAULT 0,
    valorUtilizado REAL NOT NULL DEFAULT 0,
    diaFechamento INTEGER,
    diaVencimento INTEGER,
    diaMelhorCompra INTEGER,
    observacoes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

for (const sql of [
  'ALTER TABLE cartoes ADD COLUMN faturaPaga INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE cartoes ADD COLUMN valorFaturaPaga REAL NOT NULL DEFAULT 0',
  'ALTER TABLE cartoes ADD COLUMN observacaoAtraso TEXT',
  'ALTER TABLE cartoes ADD COLUMN previsaoPagamento TEXT',
]) {
  try {
    db.exec(sql);
  } catch (e) {
    if (!String(e.message).includes('duplicate column')) throw e;
  }
}

function parseNum(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = parseFloat(String(value).replace(',', '.'));
  return isNaN(n) ? fallback : n;
}

function parseIntSafe(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? fallback : n;
}

function normalizarDia(value) {
  const dia = parseIntSafe(value);
  return dia != null && dia >= 1 && dia <= 31 ? dia : null;
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

function mapRow(row) {
  if (!row) return null;
  const limite = Math.max(0, row.limite ?? 0);
  const valorUtilizado = Math.max(0, row.valorUtilizado ?? 0);
  return {
    id: row.id,
    nome: row.nome,
    banco: row.banco,
    limite,
    valorUtilizado,
    valorDisponivel: Math.max(0, Math.round((limite - valorUtilizado) * 100) / 100),
    faturaPaga: Boolean(row.faturaPaga),
    valorFaturaPaga: Math.max(0, row.valorFaturaPaga ?? 0),
    diaFechamento: row.diaFechamento ?? null,
    diaVencimento: row.diaVencimento ?? null,
    diaMelhorCompra: row.diaMelhorCompra ?? null,
    observacoes: row.observacoes,
    observacaoAtraso: row.observacaoAtraso ?? null,
    previsaoPagamento: row.previsaoPagamento ?? null,
  };
}

router.get('/', (_req, res) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM cartoes ORDER BY banco ASC, nome ASC, id ASC`)
      .all();
    res.json(rows.map(mapRow));
  } catch (error) {
    console.error('Erro ao buscar cartões:', error);
    res.status(500).json({ error: 'Erro ao buscar cartões' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = db.prepare(`SELECT * FROM cartoes WHERE id = ?`).get(id);
    if (!row) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.json(mapRow(row));
  } catch (error) {
    console.error('Erro ao buscar cartão:', error);
    res.status(500).json({ error: 'Erro ao buscar cartão' });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      nome,
      banco,
      limite,
      valorUtilizado,
      faturaPaga,
      valorFaturaPaga,
      diaFechamento,
      diaVencimento,
      diaMelhorCompra,
      observacoes,
      observacaoAtraso,
      previsaoPagamento,
    } = req.body;

    if (!nome || !banco) {
      return res.status(400).json({ error: 'nome e banco são obrigatórios.' });
    }

    const result = db
      .prepare(
        `INSERT INTO cartoes
         (nome, banco, limite, valorUtilizado, faturaPaga, valorFaturaPaga, diaFechamento, diaVencimento, diaMelhorCompra, observacoes, observacaoAtraso, previsaoPagamento)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        String(nome).trim(),
        String(banco).trim(),
        Math.max(0, parseNum(limite)),
        Math.max(0, parseNum(valorUtilizado)),
        parseBool(faturaPaga) ? 1 : 0,
        Math.max(0, parseNum(valorFaturaPaga)),
        normalizarDia(diaFechamento),
        normalizarDia(diaVencimento),
        normalizarDia(diaMelhorCompra),
        observacoes ? String(observacoes).trim() : null,
        observacaoAtraso ? String(observacaoAtraso).trim() : null,
        previsaoPagamento ? String(previsaoPagamento).trim() : null,
      );

    const row = db
      .prepare(`SELECT * FROM cartoes WHERE id = ?`)
      .get(result.lastInsertRowid);
    res.status(201).json(mapRow(row));
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    res.status(500).json({ error: 'Erro ao criar cartão' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const atual = db.prepare(`SELECT * FROM cartoes WHERE id = ?`).get(id);
    if (!atual) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const body = req.body;
    const nome = body.nome != null ? String(body.nome).trim() : atual.nome;
    const banco = body.banco != null ? String(body.banco).trim() : atual.banco;

    if (!nome || !banco) {
      return res.status(400).json({ error: 'nome e banco são obrigatórios.' });
    }

    const limite =
      body.limite !== undefined ? Math.max(0, parseNum(body.limite)) : atual.limite;
    const valorUtilizado =
      body.valorUtilizado !== undefined
        ? Math.max(0, parseNum(body.valorUtilizado))
        : atual.valorUtilizado;
    const faturaPaga =
      body.faturaPaga !== undefined
        ? parseBool(body.faturaPaga)
        : Boolean(atual.faturaPaga);
    const valorFaturaPaga =
      body.valorFaturaPaga !== undefined
        ? Math.max(0, parseNum(body.valorFaturaPaga))
        : atual.valorFaturaPaga;
    const diaFechamento =
      body.diaFechamento !== undefined
        ? normalizarDia(body.diaFechamento)
        : atual.diaFechamento;
    const diaVencimento =
      body.diaVencimento !== undefined
        ? normalizarDia(body.diaVencimento)
        : atual.diaVencimento;
    const diaMelhorCompra =
      body.diaMelhorCompra !== undefined
        ? normalizarDia(body.diaMelhorCompra)
        : atual.diaMelhorCompra;
    const observacoes =
      body.observacoes !== undefined ? body.observacoes : atual.observacoes;
    const observacaoAtraso =
      body.observacaoAtraso !== undefined
        ? body.observacaoAtraso
        : atual.observacaoAtraso;
    const previsaoPagamento =
      body.previsaoPagamento !== undefined
        ? body.previsaoPagamento
        : atual.previsaoPagamento;

    db.prepare(
      `UPDATE cartoes SET
        nome = ?, banco = ?, limite = ?, valorUtilizado = ?,
        faturaPaga = ?, valorFaturaPaga = ?,
        diaFechamento = ?, diaVencimento = ?, diaMelhorCompra = ?,
        observacoes = ?, observacaoAtraso = ?, previsaoPagamento = ?,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(
      nome,
      banco,
      limite,
      valorUtilizado,
      faturaPaga ? 1 : 0,
      valorFaturaPaga,
      diaFechamento,
      diaVencimento,
      diaMelhorCompra,
      observacoes ? String(observacoes).trim() : null,
      observacaoAtraso ? String(observacaoAtraso).trim() : null,
      previsaoPagamento ? String(previsaoPagamento).trim() : null,
      id,
    );

    const row = db.prepare(`SELECT * FROM cartoes WHERE id = ?`).get(id);
    res.json(mapRow(row));
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    res.status(500).json({ error: 'Erro ao atualizar cartão' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = db.prepare(`DELETE FROM cartoes WHERE id = ?`).run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir cartão:', error);
    res.status(500).json({ error: 'Erro ao excluir cartão' });
  }
});

module.exports = router;
