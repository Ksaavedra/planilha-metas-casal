const express = require('express');
const db = require('../scripts/db');
const { autenticarToken } = require('../middlewares/auth.middleware');
const { ensureDadosFinanceirosPorUsuario } = require('../utils/user-data-scope');

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
  'ALTER TABLE cartoes ADD COLUMN pessoa TEXT',
]) {
  try {
    db.exec(sql);
  } catch (e) {
    if (!String(e.message).includes('duplicate column')) throw e;
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS pagamentos_fatura (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cartaoId INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    valorFatura REAL NOT NULL DEFAULT 0,
    valorPago REAL NOT NULL DEFAULT 0,
    dataPagamento TEXT,
    observacaoAtraso TEXT,
    previsaoPagamento TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, cartaoId, ano, mes)
  )
`);

ensureDadosFinanceirosPorUsuario();
router.use(autenticarToken);

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

function diaFechamentoFromMelhor(melhor) {
  const dia = normalizarDia(melhor);
  if (dia == null) return null;
  return dia <= 1 ? 31 : dia - 1;
}

function resolverDiasCicloFatura(diaFechamento, diaVencimento, diaMelhorCompra) {
  const melhor = normalizarDia(diaMelhorCompra);
  const venc = normalizarDia(diaVencimento);
  let fech = normalizarDia(diaFechamento);
  if (fech == null && melhor != null) {
    fech = diaFechamentoFromMelhor(melhor);
  }
  return { fech, venc, melhor };
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

const TIPOS_LANCAMENTO_CARTAO = [
  'parcelamento',
  'cartao_credito',
  'crediario',
  'pix_parcelado',
];

const TIPO_AJUSTE_FATURA = 'ajuste_fatura';

function mesDataInicio(dataInicio) {
  if (!dataInicio || String(dataInicio).length < 7) return null;
  const mes = parseInt(String(dataInicio).slice(5, 7), 10);
  return mes >= 1 && mes <= 12 ? mes : null;
}

function anoDataInicio(dataInicio) {
  if (!dataInicio || String(dataInicio).length < 4) return null;
  const ano = parseInt(String(dataInicio).slice(0, 4), 10);
  return Number.isFinite(ano) ? ano : null;
}

function parcelaMensalDivida(divida) {
  if (divida.tipoDivida === TIPO_AJUSTE_FATURA) {
    return Math.round(parseNum(divida.valorTotal) * 100) / 100;
  }
  const total = Math.max(0, parseNum(divida.valorTotal));
  const qtd = Math.max(0, parseIntSafe(divida.quantidadeParcelas, 0));
  if (total > 0 && qtd > 0) return Math.round((total / qtd) * 100) / 100;
  return Math.max(0, parseNum(divida.parcelaMensal));
}

function dividaNoMes(divida, ano, mes) {
  const anoInicio = anoDataInicio(divida.dataInicio) ?? divida.ano;
  const inicio = mesDataInicio(divida.dataInicio) ?? 1;
  const mesReferencia = ano * 12 + (mes - 1);
  const mesInicial = anoInicio * 12 + (inicio - 1);
  const indiceParcela = mesReferencia - mesInicial;
  if (indiceParcela < 0) return false;

  const qtd = Math.max(0, parseIntSafe(divida.quantidadeParcelas, 0));
  if (qtd > 0 && indiceParcela >= qtd) return false;
  return true;
}

function totalAPagarPorCartaoNoMes(usuarioId, ano, mes) {
  if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
    return new Map();
  }

  const tiposFatura = [...TIPOS_LANCAMENTO_CARTAO, TIPO_AJUSTE_FATURA];
  const lancamentos = db
    .prepare(
      `SELECT cartaoId, ano, dataInicio, valorTotal, parcelaMensal, quantidadeParcelas, tipoDivida
       FROM dividas
       WHERE usuario_id = ?
         AND cartaoId IS NOT NULL
         AND tipoDivida IN (${tiposFatura.map(() => '?').join(',')})`,
    )
    .all(usuarioId, ...tiposFatura);

  const totais = new Map();
  for (const item of lancamentos) {
    if (!dividaNoMes(item, ano, mes)) continue;
    const atual = totais.get(item.cartaoId) ?? 0;
    const parcela = parcelaMensalDivida(item);
    totais.set(item.cartaoId, atual + parcela);
  }

  return new Map(
    [...totais.entries()].map(([id, total]) => [
      id,
      Math.max(0, Math.round(total * 100) / 100),
    ]),
  );
}

function arredondarMoeda(valor) {
  return Math.round(Math.max(0, valor) * 100) / 100;
}

function buscarPagamentosFaturaMes(usuarioId, ano, mes) {
  if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
    return new Map();
  }

  const rows = db
    .prepare(
      `SELECT * FROM pagamentos_fatura
       WHERE usuario_id = ? AND ano = ? AND mes = ?`,
    )
    .all(usuarioId, ano, mes);

  return new Map(rows.map((row) => [row.cartaoId, row]));
}

function faturaQuitadaNoMes(pagamento) {
  if (!pagamento) return false;
  const valorFatura = arredondarMoeda(pagamento.valorFatura ?? 0);
  const valorPago = arredondarMoeda(pagamento.valorPago ?? 0);
  if (valorPago <= 0) return false;
  if (valorFatura <= 0) return valorPago > 0;
  return valorPago >= valorFatura - 0.01;
}

function mapRow(row, totalAPagarMesOverride = null, pagamentoMes = undefined) {
  if (!row) return null;
  const limite = Math.max(0, row.limite ?? 0);
  const valorUtilizado = Math.max(0, row.valorUtilizado ?? 0);
  const totalAPagarMes =
    totalAPagarMesOverride == null
      ? valorUtilizado
      : Math.max(0, totalAPagarMesOverride);

  let faturaPaga = Boolean(row.faturaPaga);
  let valorFaturaPaga = Math.max(0, row.valorFaturaPaga ?? 0);
  let observacaoAtraso = row.observacaoAtraso ?? null;
  let previsaoPagamento = row.previsaoPagamento ?? null;

  if (pagamentoMes !== undefined) {
    if (pagamentoMes) {
      valorFaturaPaga = arredondarMoeda(pagamentoMes.valorPago ?? 0);
      faturaPaga = faturaQuitadaNoMes(pagamentoMes);
      observacaoAtraso = pagamentoMes.observacaoAtraso ?? null;
      previsaoPagamento = pagamentoMes.previsaoPagamento ?? null;
    } else {
      faturaPaga = false;
      valorFaturaPaga = 0;
      observacaoAtraso = null;
      previsaoPagamento = null;
    }
  }

  return {
    id: row.id,
    nome: row.nome,
    banco: row.banco,
    limite,
    valorUtilizado,
    totalAPagarMes: Math.round(totalAPagarMes * 100) / 100,
    valorDisponivel: Math.max(0, Math.round((limite - valorUtilizado) * 100) / 100),
    faturaPaga,
    valorFaturaPaga,
    diaFechamento: row.diaFechamento ?? null,
    diaVencimento: row.diaVencimento ?? null,
    diaMelhorCompra: row.diaMelhorCompra ?? null,
    pessoa: row.pessoa ?? null,
    observacoes: row.observacoes,
    observacaoAtraso,
    previsaoPagamento,
  };
}

router.get('/', (req, res) => {
  try {
    const ano = parseInt(req.query.ano, 10);
    const mes = parseInt(req.query.mes, 10);
    const temMesReferencia =
      Number.isFinite(ano) && Number.isFinite(mes) && mes >= 1 && mes <= 12;
    const totaisMes = totalAPagarPorCartaoNoMes(req.usuario.id, ano, mes);
    const pagamentosMes = temMesReferencia
      ? buscarPagamentosFaturaMes(req.usuario.id, ano, mes)
      : null;
    const rows = db
      .prepare(
        `SELECT * FROM cartoes WHERE usuario_id = ? ORDER BY banco ASC, nome ASC, id ASC`,
      )
      .all(req.usuario.id);
    res.json(
      rows.map((row) =>
        mapRow(
          row,
          totaisMes.get(row.id),
          pagamentosMes ? (pagamentosMes.get(row.id) ?? null) : undefined,
        ),
      ),
    );
  } catch (error) {
    console.error('Erro ao buscar cartões:', error);
    res.status(500).json({ error: 'Erro ao buscar cartões' });
  }
});

router.put('/:id/fatura-pagamento', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const atual = db
      .prepare(`SELECT * FROM cartoes WHERE id = ? AND usuario_id = ?`)
      .get(id, req.usuario.id);
    if (!atual) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const ano = parseInt(req.body.ano, 10);
    const mes = parseInt(req.body.mes, 10);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'ano e mes são obrigatórios.' });
    }

    const valorFatura = arredondarMoeda(parseNum(req.body.valorFatura));
    const valorPago = arredondarMoeda(parseNum(req.body.valorPago));
    const dataPagamento =
      req.body.dataPagamento != null && String(req.body.dataPagamento).length >= 10
        ? String(req.body.dataPagamento).slice(0, 10)
        : null;
    const observacaoAtraso =
      req.body.observacaoAtraso !== undefined
        ? req.body.observacaoAtraso
        : null;
    const previsaoPagamento =
      req.body.previsaoPagamento !== undefined
        ? req.body.previsaoPagamento
        : null;

    db.prepare(
      `INSERT INTO pagamentos_fatura
        (usuario_id, cartaoId, ano, mes, valorFatura, valorPago, dataPagamento, observacaoAtraso, previsaoPagamento, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(usuario_id, cartaoId, ano, mes) DO UPDATE SET
        valorFatura = excluded.valorFatura,
        valorPago = excluded.valorPago,
        dataPagamento = excluded.dataPagamento,
        observacaoAtraso = excluded.observacaoAtraso,
        previsaoPagamento = excluded.previsaoPagamento,
        updatedAt = CURRENT_TIMESTAMP`,
    ).run(
      req.usuario.id,
      id,
      ano,
      mes,
      valorFatura,
      valorPago,
      dataPagamento,
      observacaoAtraso ? String(observacaoAtraso).trim() : null,
      previsaoPagamento ? String(previsaoPagamento).trim() : null,
    );

    const pagamento = db
      .prepare(
        `SELECT * FROM pagamentos_fatura
         WHERE usuario_id = ? AND cartaoId = ? AND ano = ? AND mes = ?`,
      )
      .get(req.usuario.id, id, ano, mes);

    res.json({
      cartaoId: id,
      ano,
      mes,
      valorFatura: arredondarMoeda(pagamento.valorFatura),
      valorPago: arredondarMoeda(pagamento.valorPago),
      dataPagamento: pagamento.dataPagamento ?? null,
      faturaPaga: faturaQuitadaNoMes(pagamento),
      observacaoAtraso: pagamento.observacaoAtraso ?? null,
      previsaoPagamento: pagamento.previsaoPagamento ?? null,
    });
  } catch (error) {
    console.error('Erro ao registrar pagamento da fatura:', error);
    res.status(500).json({ error: 'Erro ao registrar pagamento da fatura' });
  }
});

router.delete('/:id/fatura-pagamento', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const atual = db
      .prepare(`SELECT id FROM cartoes WHERE id = ? AND usuario_id = ?`)
      .get(id, req.usuario.id);
    if (!atual) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const ano = parseInt(req.query.ano, 10);
    const mes = parseInt(req.query.mes, 10);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ error: 'ano e mes são obrigatórios.' });
    }

    db.prepare(
      `DELETE FROM pagamentos_fatura
       WHERE usuario_id = ? AND cartaoId = ? AND ano = ? AND mes = ?`,
    ).run(req.usuario.id, id, ano, mes);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao desfazer pagamento da fatura:', error);
    res.status(500).json({ error: 'Erro ao desfazer pagamento da fatura' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = db
      .prepare(`SELECT * FROM cartoes WHERE id = ? AND usuario_id = ?`)
      .get(id, req.usuario.id);
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
      pessoa,
      observacoes,
      observacaoAtraso,
      previsaoPagamento,
    } = req.body;

    if (!nome || !banco) {
      return res.status(400).json({ error: 'nome e banco são obrigatórios.' });
    }

    const dias = resolverDiasCicloFatura(
      diaFechamento,
      diaVencimento,
      diaMelhorCompra,
    );

    const result = db
      .prepare(
        `INSERT INTO cartoes
         (usuario_id, nome, banco, limite, valorUtilizado, faturaPaga, valorFaturaPaga, diaFechamento, diaVencimento, diaMelhorCompra, pessoa, observacoes, observacaoAtraso, previsaoPagamento)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.usuario.id,
        String(nome).trim(),
        String(banco).trim(),
        Math.max(0, parseNum(limite)),
        Math.max(0, parseNum(valorUtilizado)),
        parseBool(faturaPaga) ? 1 : 0,
        Math.max(0, parseNum(valorFaturaPaga)),
        dias.fech,
        dias.venc,
        dias.melhor,
        pessoa ? String(pessoa).trim() : null,
        observacoes ? String(observacoes).trim() : null,
        observacaoAtraso ? String(observacaoAtraso).trim() : null,
        previsaoPagamento ? String(previsaoPagamento).trim() : null,
      );

    const row = db
      .prepare(`SELECT * FROM cartoes WHERE id = ? AND usuario_id = ?`)
      .get(result.lastInsertRowid, req.usuario.id);
    res.status(201).json(mapRow(row));
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    res.status(500).json({ error: 'Erro ao criar cartão' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const atual = db
      .prepare(`SELECT * FROM cartoes WHERE id = ? AND usuario_id = ?`)
      .get(id, req.usuario.id);
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
    const dias = resolverDiasCicloFatura(
      body.diaFechamento !== undefined
        ? body.diaFechamento
        : atual.diaFechamento,
      body.diaVencimento !== undefined
        ? body.diaVencimento
        : atual.diaVencimento,
      body.diaMelhorCompra !== undefined
        ? body.diaMelhorCompra
        : atual.diaMelhorCompra,
    );
    const observacoes =
      body.observacoes !== undefined ? body.observacoes : atual.observacoes;
    const pessoa = body.pessoa !== undefined ? body.pessoa : atual.pessoa;
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
        pessoa = ?, observacoes = ?, observacaoAtraso = ?, previsaoPagamento = ?,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND usuario_id = ?`,
    ).run(
      nome,
      banco,
      limite,
      valorUtilizado,
      faturaPaga ? 1 : 0,
      valorFaturaPaga,
      dias.fech,
      dias.venc,
      dias.melhor,
      pessoa ? String(pessoa).trim() : null,
      observacoes ? String(observacoes).trim() : null,
      observacaoAtraso ? String(observacaoAtraso).trim() : null,
      previsaoPagamento ? String(previsaoPagamento).trim() : null,
      id,
      req.usuario.id,
    );

    const row = db
      .prepare(`SELECT * FROM cartoes WHERE id = ? AND usuario_id = ?`)
      .get(id, req.usuario.id);
    res.json(mapRow(row));
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    res.status(500).json({ error: 'Erro ao atualizar cartão' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = db
      .prepare(`DELETE FROM cartoes WHERE id = ? AND usuario_id = ?`)
      .run(id, req.usuario.id);
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
