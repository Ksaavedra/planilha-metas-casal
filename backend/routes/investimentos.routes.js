const express = require('express');
const db = require('../scripts/db');

const router = express.Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS investimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descricao TEXT NOT NULL,
    tipoInvestimento TEXT NOT NULL,
    valorInvestido REAL NOT NULL DEFAULT 0,
    valorAtual REAL NOT NULL DEFAULT 0,
    aporteMensal REAL DEFAULT 0,
    rentabilidade REAL DEFAULT 0,
    rentabilidadePercentual REAL DEFAULT 0,
    statusInvestimento TEXT NOT NULL DEFAULT 'crescendo',
    instituicao TEXT,
    ano INTEGER NOT NULL,
    dataInicio TEXT,
    observacoes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_investimentos_ano ON investimentos(ano)
`);

try {
  db.exec(`ALTER TABLE investimentos ADD COLUMN pessoa TEXT`);
} catch {
  // coluna já existe
}

function calcularRentabilidade(valorInvestido, valorAtual) {
  const inv = Number(valorInvestido) || 0;
  const atual = Number(valorAtual) || 0;
  const rentabilidade = atual - inv;
  const rentabilidadePercentual =
    inv > 0 ? (rentabilidade / inv) * 100 : 0;
  return {
    rentabilidade: Math.round(rentabilidade * 100) / 100,
    rentabilidadePercentual: Math.round(rentabilidadePercentual * 100) / 100,
  };
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    descricao: row.descricao,
    tipoInvestimento: row.tipoInvestimento,
    valorInvestido: row.valorInvestido,
    valorAtual: row.valorAtual,
    aporteMensal: row.aporteMensal ?? 0,
    rentabilidade: row.rentabilidade ?? 0,
    rentabilidadePercentual: row.rentabilidadePercentual ?? 0,
    statusInvestimento: row.statusInvestimento ?? 'crescendo',
    instituicao: row.instituicao,
    pessoa: row.pessoa ?? null,
    ano: row.ano,
    dataInicio: row.dataInicio,
    observacoes: row.observacoes,
  };
}

// GET /api/investimentos?ano=&tipo=
router.get('/', (req, res) => {
  try {
    const ano = parseInt(req.query.ano, 10);
    if (isNaN(ano)) {
      return res.status(400).json({ error: "Query param 'ano' obrigatório." });
    }

    const tipo = req.query.tipo ? String(req.query.tipo).trim() : '';
    let sql = `SELECT * FROM investimentos WHERE ano = ?`;
    const params = [ano];

    if (tipo) {
      sql += ` AND tipoInvestimento = ?`;
      params.push(tipo);
    }

    sql += ` ORDER BY descricao ASC, id ASC`;

    const rows = db.prepare(sql).all(...params);
    res.json(rows.map(mapRow));
  } catch (error) {
    console.error('Erro ao buscar investimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar investimentos' });
  }
});

// GET /api/investimentos/:id
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = db.prepare(`SELECT * FROM investimentos WHERE id = ?`).get(id);
    if (!row) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }
    res.json(mapRow(row));
  } catch (error) {
    console.error('Erro ao buscar investimento:', error);
    res.status(500).json({ error: 'Erro ao buscar investimento' });
  }
});

// POST /api/investimentos
router.post('/', (req, res) => {
  try {
    const {
      descricao,
      tipoInvestimento,
      valorInvestido,
      valorAtual,
      aporteMensal,
      statusInvestimento,
      instituicao,
      pessoa,
      ano,
      dataInicio,
      observacoes,
    } = req.body;

    if (!descricao || !tipoInvestimento) {
      return res
        .status(400)
        .json({ error: 'descricao e tipoInvestimento são obrigatórios.' });
    }

    const inv = parseFloat(String(valorInvestido ?? 0).replace(',', '.'));
    const atual = parseFloat(String(valorAtual ?? inv).replace(',', '.'));
    const aporte = parseFloat(String(aporteMensal ?? 0).replace(',', '.'));
    const a = parseInt(ano, 10);

    if (isNaN(inv) || isNaN(atual) || isNaN(a)) {
      return res.status(400).json({ error: 'valores ou ano inválidos.' });
    }

    const { rentabilidade, rentabilidadePercentual } = calcularRentabilidade(
      inv,
      atual,
    );
    const status = statusInvestimento || 'crescendo';

    const result = db
      .prepare(
        `INSERT INTO investimentos
         (descricao, tipoInvestimento, valorInvestido, valorAtual, aporteMensal,
          rentabilidade, rentabilidadePercentual, statusInvestimento, instituicao,
          pessoa, ano, dataInicio, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        String(descricao).trim(),
        String(tipoInvestimento).trim(),
        inv,
        atual,
        isNaN(aporte) ? 0 : aporte,
        rentabilidade,
        rentabilidadePercentual,
        status,
        instituicao ? String(instituicao).trim() : null,
        pessoa ? String(pessoa).trim() : null,
        a,
        dataInicio || null,
        observacoes ? String(observacoes).trim() : null,
      );

    const row = db
      .prepare(`SELECT * FROM investimentos WHERE id = ?`)
      .get(result.lastInsertRowid);
    res.status(201).json(mapRow(row));
  } catch (error) {
    console.error('Erro ao criar investimento:', error);
    res.status(500).json({ error: 'Erro ao criar investimento' });
  }
});

// PATCH /api/investimentos/:id
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const atual_row = db
      .prepare(`SELECT * FROM investimentos WHERE id = ?`)
      .get(id);
    if (!atual_row) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }

    const body = req.body;
    const inv =
      body.valorInvestido != null
        ? parseFloat(String(body.valorInvestido).replace(',', '.'))
        : atual_row.valorInvestido;
    const atual =
      body.valorAtual != null
        ? parseFloat(String(body.valorAtual).replace(',', '.'))
        : atual_row.valorAtual;

    const { rentabilidade, rentabilidadePercentual } = calcularRentabilidade(
      inv,
      atual,
    );

    const descricao =
      body.descricao != null ? String(body.descricao).trim() : atual_row.descricao;
    const tipoInvestimento =
      body.tipoInvestimento != null
        ? String(body.tipoInvestimento).trim()
        : atual_row.tipoInvestimento;
    const aporteMensal =
      body.aporteMensal != null
        ? parseFloat(String(body.aporteMensal).replace(',', '.'))
        : atual_row.aporteMensal;
    const statusInvestimento =
      body.statusInvestimento ?? atual_row.statusInvestimento;
    const instituicao =
      body.instituicao !== undefined ? body.instituicao : atual_row.instituicao;
    const pessoa =
      body.pessoa !== undefined ? body.pessoa : atual_row.pessoa;
    const ano = body.ano != null ? parseInt(body.ano, 10) : atual_row.ano;
    const dataInicio =
      body.dataInicio !== undefined ? body.dataInicio : atual_row.dataInicio;
    const observacoes =
      body.observacoes !== undefined ? body.observacoes : atual_row.observacoes;

    db.prepare(
      `UPDATE investimentos SET
        descricao = ?, tipoInvestimento = ?, valorInvestido = ?, valorAtual = ?,
        aporteMensal = ?, rentabilidade = ?, rentabilidadePercentual = ?,
        statusInvestimento = ?, instituicao = ?, pessoa = ?, ano = ?, dataInicio = ?,
        observacoes = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(
      descricao,
      tipoInvestimento,
      inv,
      atual,
      isNaN(aporteMensal) ? 0 : aporteMensal,
      rentabilidade,
      rentabilidadePercentual,
      statusInvestimento,
      instituicao,
      pessoa ? String(pessoa).trim() : null,
      ano,
      dataInicio,
      observacoes,
      id,
    );

    const row = db.prepare(`SELECT * FROM investimentos WHERE id = ?`).get(id);
    res.json(mapRow(row));
  } catch (error) {
    console.error('Erro ao atualizar investimento:', error);
    res.status(500).json({ error: 'Erro ao atualizar investimento' });
  }
});

// DELETE /api/investimentos/:id
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = db
      .prepare(`DELETE FROM investimentos WHERE id = ?`)
      .run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Investimento não encontrado' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir investimento:', error);
    res.status(500).json({ error: 'Erro ao excluir investimento' });
  }
});

module.exports = router;
