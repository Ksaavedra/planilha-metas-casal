const express = require('express');
const db = require('../scripts/db');
const { autenticarToken } = require('../middlewares/auth.middleware');
const { ensureDadosFinanceirosPorUsuario } = require('../utils/user-data-scope');

const router = express.Router();

db.exec(`
  CREATE TABLE IF NOT EXISTS dividas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objetivo TEXT NOT NULL,
    tipoDivida TEXT NOT NULL,
    valorTotal REAL NOT NULL DEFAULT 0,
    valorPago REAL NOT NULL DEFAULT 0,
    valorRestante REAL DEFAULT 0,
    parcelaMensal REAL DEFAULT 0,
    quantidadeParcelas INTEGER DEFAULT 0,
    parcelasRestantes INTEGER DEFAULT 0,
    percentualQuitado REAL DEFAULT 0,
    statusDivida TEXT NOT NULL DEFAULT 'pagando',
    instituicao TEXT,
    ano INTEGER NOT NULL,
    dataInicio TEXT,
    observacoes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_dividas_ano ON dividas(ano)
`);

for (const sql of [
  'ALTER TABLE dividas ADD COLUMN limiteCartao REAL DEFAULT 0',
  'ALTER TABLE dividas ADD COLUMN diaVencimento INTEGER',
  'ALTER TABLE dividas ADD COLUMN diaMelhorCompra INTEGER',
  'ALTER TABLE dividas ADD COLUMN cartaoId INTEGER',
  'ALTER TABLE dividas ADD COLUMN dataPagamento TEXT',
  'ALTER TABLE dividas ADD COLUMN dataCompra TEXT',
]) {
  try {
    db.exec(sql);
  } catch (e) {
    if (!String(e.message).includes('duplicate column')) throw e;
  }
}

ensureDadosFinanceirosPorUsuario();
router.use(autenticarToken);

function parseNum(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const n = parseFloat(String(value).replace(',', '.'));
  return isNaN(n) ? fallback : n;
}

function parseIntSafe(value, fallback = 0) {
  const n = parseInt(String(value), 10);
  return isNaN(n) ? fallback : n;
}

const TIPO_AJUSTE_FATURA = 'ajuste_fatura';

function calcularCamposAjusteFatura(valorTotal) {
  const total = Math.round(parseNum(valorTotal, 0) * 100) / 100;
  return {
    valorTotal: total,
    valorPago: 0,
    valorRestante: total,
    parcelaMensal: total,
    quantidadeParcelas: 1,
    parcelasRestantes: 0,
    percentualQuitado: 0,
    statusInferido: 'quitada',
  };
}

function calcularCamposDerivados(valorTotal, valorPago, quantidadeParcelas) {
  const total = Math.max(0, parseNum(valorTotal));
  const pago = Math.max(0, Math.min(parseNum(valorPago), total));
  const qtd = Math.max(0, parseIntSafe(quantidadeParcelas));

  let parcela = 0;
  if (qtd > 0 && total > 0) {
    parcela = Math.round((total / qtd) * 100) / 100;
  }

  const valorRestante = Math.round((total - pago) * 100) / 100;
  const percentualQuitado =
    total > 0 ? Math.round((pago / total) * 10000) / 100 : 0;

  let parcelasRestantes = 0;
  if (valorRestante <= 0.009) {
    parcelasRestantes = 0;
  } else if (parcela > 0) {
    parcelasRestantes = Math.min(qtd, Math.ceil(valorRestante / parcela));
  } else {
    parcelasRestantes = qtd;
  }

  let statusInferido = 'pagando';
  if (valorRestante <= 0.009 || percentualQuitado >= 99.99) {
    statusInferido = 'quitada';
  }

  return {
    valorTotal: total,
    valorPago: pago,
    valorRestante,
    parcelaMensal: parcela,
    quantidadeParcelas: qtd,
    parcelasRestantes,
    percentualQuitado,
    statusInferido,
  };
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    objetivo: row.objetivo,
    tipoDivida: row.tipoDivida,
    valorTotal: row.valorTotal,
    valorPago: row.valorPago,
    valorRestante: row.valorRestante ?? 0,
    parcelaMensal: row.parcelaMensal ?? 0,
    quantidadeParcelas: row.quantidadeParcelas ?? 0,
    parcelasRestantes: row.parcelasRestantes ?? 0,
    percentualQuitado: row.percentualQuitado ?? 0,
    statusDivida: row.statusDivida ?? 'pagando',
    instituicao: row.instituicao,
    limiteCartao: row.limiteCartao ?? 0,
    diaVencimento: row.diaVencimento ?? null,
    diaMelhorCompra: row.diaMelhorCompra ?? null,
    cartaoId: row.cartaoId ?? null,
    cartaoNome: row.cartaoNome ?? null,
    cartaoBanco: row.cartaoBanco ?? null,
    ano: row.ano,
    dataInicio: row.dataInicio,
    dataCompra: row.dataCompra ?? null,
    dataPagamento: row.dataPagamento ?? null,
    observacoes: row.observacoes,
  };
}

function selectDividasBase() {
  return `
    SELECT d.*, c.nome AS cartaoNome, c.banco AS cartaoBanco
    FROM dividas d
    LEFT JOIN cartoes c ON c.id = d.cartaoId AND c.usuario_id = d.usuario_id
  `;
}

function getCartao(id, usuarioId) {
  const cartaoId = parseIntSafe(id, null);
  if (cartaoId == null) return null;
  return db
    .prepare(`SELECT * FROM cartoes WHERE id = ? AND usuario_id = ?`)
    .get(cartaoId, usuarioId);
}

function cartaoIdInformado(value) {
  return value !== undefined && value !== null && value !== '';
}

function mergeStatus(statusBody, derivados) {
  if (derivados.statusInferido === 'quitada') return 'quitada';
  if (derivados.valorRestante > 0.009) {
    const s = statusBody ? String(statusBody).trim() : '';
    if (s === 'atrasada') return 'atrasada';
    return 'pagando';
  }
  const s = statusBody ? String(statusBody).trim() : '';
  if (s === 'atrasada' || s === 'quitada' || s === 'pagando') return s;
  return derivados.statusInferido;
}

router.get('/', (req, res) => {
  try {
    const ano = parseInt(req.query.ano, 10);
    if (isNaN(ano)) {
      return res.status(400).json({ error: "Query param 'ano' obrigatório." });
    }

    const rows = db
      .prepare(
        `${selectDividasBase()}
         WHERE d.usuario_id = ? AND d.ano = ?
         ORDER BY d.objetivo ASC, d.id ASC`,
      )
      .all(req.usuario.id, ano);
    res.json(rows.map(mapRow));
  } catch (error) {
    console.error('Erro ao buscar dívidas:', error);
    res.status(500).json({ error: 'Erro ao buscar dívidas' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = db
      .prepare(`${selectDividasBase()} WHERE d.id = ? AND d.usuario_id = ?`)
      .get(id, req.usuario.id);
    if (!row) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }
    res.json(mapRow(row));
  } catch (error) {
    console.error('Erro ao buscar dívida:', error);
    res.status(500).json({ error: 'Erro ao buscar dívida' });
  }
});

router.post('/', (req, res) => {
  try {
    const {
      objetivo,
      tipoDivida,
      valorTotal,
      valorPago,
      quantidadeParcelas,
      statusDivida,
      instituicao,
      limiteCartao,
      diaVencimento,
      diaMelhorCompra,
      cartaoId,
      ano,
      dataInicio,
      dataCompra,
      observacoes,
    } = req.body;

    if (!objetivo || !tipoDivida) {
      return res
        .status(400)
        .json({ error: 'objetivo e tipoDivida são obrigatórios.' });
    }

    const a = parseInt(ano, 10);
    if (isNaN(a)) {
      return res.status(400).json({ error: 'ano inválido.' });
    }

    const tipo = String(tipoDivida).trim();
    const qtd = parseIntSafe(quantidadeParcelas);
    if (tipo !== TIPO_AJUSTE_FATURA && qtd < 1) {
      return res
        .status(400)
        .json({ error: 'quantidadeParcelas deve ser pelo menos 1.' });
    }

    const derivados =
      tipo === TIPO_AJUSTE_FATURA
        ? calcularCamposAjusteFatura(valorTotal)
        : calcularCamposDerivados(valorTotal, valorPago, quantidadeParcelas);
    const status = mergeStatus(statusDivida, derivados);
    const cartao = getCartao(cartaoId, req.usuario.id);
    if (cartaoIdInformado(cartaoId) && !cartao) {
      return res.status(400).json({ error: 'Cartão informado não encontrado.' });
    }
    const cartaoIdFinal = cartao ? cartao.id : null;
    const instituicaoFinal = cartao
      ? cartao.banco
      : instituicao
        ? String(instituicao).trim()
        : null;

    const result = db
      .prepare(
        `INSERT INTO dividas
         (objetivo, tipoDivida, valorTotal, valorPago, valorRestante, parcelaMensal,
          quantidadeParcelas, parcelasRestantes, percentualQuitado, statusDivida,
          instituicao, limiteCartao, diaVencimento, diaMelhorCompra, cartaoId, usuario_id, ano, dataInicio, dataCompra, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        String(objetivo).trim(),
        String(tipoDivida).trim(),
        derivados.valorTotal,
        derivados.valorPago,
        derivados.valorRestante,
        derivados.parcelaMensal,
        derivados.quantidadeParcelas,
        derivados.parcelasRestantes,
        derivados.percentualQuitado,
        status,
        instituicaoFinal,
        parseNum(limiteCartao),
        parseIntSafe(diaVencimento) || null,
        parseIntSafe(diaMelhorCompra) || null,
        cartaoIdFinal,
        req.usuario.id,
        a,
        dataInicio || null,
        dataCompra ? String(dataCompra).trim().slice(0, 10) : null,
        observacoes ? String(observacoes).trim() : null,
      );

    const row = db
      .prepare(`${selectDividasBase()} WHERE d.id = ? AND d.usuario_id = ?`)
      .get(result.lastInsertRowid, req.usuario.id);
    res.status(201).json(mapRow(row));
  } catch (error) {
    console.error('Erro ao criar dívida:', error);
    res.status(500).json({ error: 'Erro ao criar dívida' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const atual = db
      .prepare(`SELECT * FROM dividas WHERE id = ? AND usuario_id = ?`)
      .get(id, req.usuario.id);
    if (!atual) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    const body = req.body;
    const valorTotal =
      body.valorTotal != null ? body.valorTotal : atual.valorTotal;
    const valorPago = body.valorPago != null ? body.valorPago : atual.valorPago;
    const quantidadeParcelas =
      body.quantidadeParcelas != null
        ? body.quantidadeParcelas
        : atual.quantidadeParcelas;

    const tipoDividaAtual =
      body.tipoDivida != null
        ? String(body.tipoDivida).trim()
        : atual.tipoDivida;
    const qtd = parseIntSafe(quantidadeParcelas);
    if (tipoDividaAtual !== TIPO_AJUSTE_FATURA && qtd < 1) {
      return res
        .status(400)
        .json({ error: 'quantidadeParcelas deve ser pelo menos 1.' });
    }

    const derivados =
      tipoDividaAtual === TIPO_AJUSTE_FATURA
        ? calcularCamposAjusteFatura(valorTotal)
        : calcularCamposDerivados(valorTotal, valorPago, quantidadeParcelas);

    const objetivo =
      body.objetivo != null ? String(body.objetivo).trim() : atual.objetivo;
    const tipoDivida = tipoDividaAtual;
    const status = mergeStatus(
      body.statusDivida ?? atual.statusDivida,
      derivados,
    );
    const instituicao =
      body.instituicao !== undefined ? body.instituicao : atual.instituicao;
    const cartao =
      body.cartaoId !== undefined ? getCartao(body.cartaoId, req.usuario.id) : null;
    if (cartaoIdInformado(body.cartaoId) && !cartao) {
      return res.status(400).json({ error: 'Cartão informado não encontrado.' });
    }
    const cartaoId =
      body.cartaoId !== undefined
        ? cartao
          ? cartao.id
          : null
        : atual.cartaoId;
    const instituicaoFinal = cartao
      ? cartao.banco
      : instituicao !== undefined && instituicao !== null && instituicao !== ''
        ? String(instituicao).trim()
        : null;
    const limiteCartao =
      body.limiteCartao !== undefined
        ? body.limiteCartao
        : atual.limiteCartao;
    const diaVencimento =
      body.diaVencimento !== undefined
        ? body.diaVencimento
        : atual.diaVencimento;
    const diaMelhorCompra =
      body.diaMelhorCompra !== undefined
        ? body.diaMelhorCompra
        : atual.diaMelhorCompra;
    const ano = body.ano != null ? parseInt(body.ano, 10) : atual.ano;
    const dataInicio =
      body.dataInicio !== undefined ? body.dataInicio : atual.dataInicio;
    const dataCompra =
      body.dataCompra !== undefined
        ? body.dataCompra
          ? String(body.dataCompra).trim().slice(0, 10)
          : null
        : atual.dataCompra;
    const observacoes =
      body.observacoes !== undefined ? body.observacoes : atual.observacoes;
    const dataPagamento =
      body.dataPagamento !== undefined
        ? body.dataPagamento
          ? String(body.dataPagamento).trim().slice(0, 10)
          : null
        : atual.dataPagamento;

    db.prepare(
      `UPDATE dividas SET
        objetivo = ?, tipoDivida = ?, valorTotal = ?, valorPago = ?,
        valorRestante = ?, parcelaMensal = ?, quantidadeParcelas = ?,
        parcelasRestantes = ?, percentualQuitado = ?, statusDivida = ?,
        instituicao = ?, limiteCartao = ?, diaVencimento = ?, diaMelhorCompra = ?,
        cartaoId = ?, ano = ?, dataInicio = ?, dataCompra = ?, dataPagamento = ?, observacoes = ?,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND usuario_id = ?`,
    ).run(
      objetivo,
      tipoDivida,
      derivados.valorTotal,
      derivados.valorPago,
      derivados.valorRestante,
      derivados.parcelaMensal,
      derivados.quantidadeParcelas,
      derivados.parcelasRestantes,
      derivados.percentualQuitado,
      status,
      instituicaoFinal,
      parseNum(limiteCartao),
      parseIntSafe(diaVencimento) || null,
      parseIntSafe(diaMelhorCompra) || null,
      cartaoId,
      ano,
      dataInicio,
      dataCompra,
      dataPagamento,
      observacoes,
      id,
      req.usuario.id,
    );

    const row = db
      .prepare(`${selectDividasBase()} WHERE d.id = ? AND d.usuario_id = ?`)
      .get(id, req.usuario.id);
    res.json(mapRow(row));
  } catch (error) {
    console.error('Erro ao atualizar dívida:', error);
    res.status(500).json({ error: 'Erro ao atualizar dívida' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = db
      .prepare(`DELETE FROM dividas WHERE id = ? AND usuario_id = ?`)
      .run(id, req.usuario.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir dívida:', error);
    res.status(500).json({ error: 'Erro ao excluir dívida' });
  }
});

module.exports = router;
