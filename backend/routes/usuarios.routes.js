const express = require('express');
const db = require('../scripts/db');
const { autenticarToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// 1. Criar tabela usuários
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    full_name TEXT,
    nickname TEXT,
    email TEXT,
    password_hash TEXT,
    use_type TEXT DEFAULT 'individual',
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_updated DATETIME
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS pessoas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    nickname TEXT,
    is_primary INTEGER DEFAULT 0,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_updated DATETIME
  )
`);

const pessoasCols = db.prepare('PRAGMA table_info(pessoas)').all();
if (!pessoasCols.some((col) => col.name === 'nickname')) {
   db.exec('ALTER TABLE pessoas ADD COLUMN nickname TEXT');
}

if (!pessoasCols.some((col) => col.name === 'is_primary')) {
   db.exec('ALTER TABLE pessoas ADD COLUMN is_primary INTEGER DEFAULT 0');
}

if (!pessoasCols.some((col) => col.name === 'date_updated')) {
   db.exec('ALTER TABLE pessoas ADD COLUMN date_updated TEXT');
}

db.exec('DROP INDEX IF EXISTS idx_pessoas_usuario_nome');

const ERRO_PESSOA_PROPRIETARIO =
   'Esta pessoa já corresponde ao proprietário da conta.';

function normalizarTexto(valor) {
   return String(valor || '').trim();
}

function normalizarComparacao(valor) {
   return normalizarTexto(valor).toLowerCase();
}

function tabelaTemColuna(tabela, coluna) {
   return db
      .prepare(`PRAGMA table_info(${tabela})`)
      .all()
      .some((col) => col.name === coluna);
}

function pessoaResponse(row) {
   const apelido = normalizarTexto(row?.apelido);
   const nome = normalizarTexto(row?.nome);
   return {
      id: row.id,
      nome,
      apelido: apelido || null,
      nomeExibicao: apelido || nome,
      principal: Boolean(row.principal),
   };
}

function getUsuarioConta(usuarioId) {
   return db
      .prepare(
         `
         SELECT
            id,
            username AS usuario,
            full_name AS nomeCompleto,
            nickname AS apelido,
            email
         FROM usuarios
         WHERE id = ?
      `,
      )
      .get(usuarioId);
}

function nomeIgualContaPrincipal(usuarioId, nome) {
   const conta = getUsuarioConta(usuarioId);
   const nomeConta = conta?.nomeCompleto;
   if (!nomeConta) return false;
   return normalizarComparacao(nomeConta) === normalizarComparacao(nome);
}

function nomePareceContaPrincipal(usuarioId, nome) {
   const conta = getUsuarioConta(usuarioId);
   const nomeComparacao = normalizarComparacao(nome);
   if (!nomeComparacao) return false;

   const nomesConta = [
      conta?.nomeCompleto,
      conta?.apelido,
      conta?.usuario,
      normalizarTexto(conta?.nomeCompleto).split(' ')[0],
      normalizarTexto(conta?.apelido).split(' ')[0],
   ]
      .map((valor) => normalizarComparacao(valor))
      .filter(Boolean);

   return nomesConta.includes(nomeComparacao);
}

function garantirPessoaPrincipal(usuarioId) {
   const conta = getUsuarioConta(usuarioId);
   const nome = normalizarTexto(conta?.nomeCompleto);
   const apelido = normalizarTexto(conta?.apelido);
   if (!nome) return;

   const existente = db
      .prepare(
         'SELECT id FROM pessoas WHERE user_id = ? AND is_primary = 1 LIMIT 1',
      )
      .get(usuarioId);

   if (existente) {
      db.prepare(
         'UPDATE pessoas SET full_name = ?, nickname = ?, date_updated = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      ).run(nome, apelido || null, existente.id, usuarioId);
      return;
   }

   db.prepare(
      'INSERT INTO pessoas (user_id, full_name, nickname, is_primary, date_updated) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
   ).run(usuarioId, nome, apelido || null);
}

function getPrimeiroUsuarioAuthId() {
   const usuario = db
      .prepare(
         `
      SELECT id
      FROM usuarios
      WHERE email IS NOT NULL
        AND trim(email) <> ''
        AND password_hash IS NOT NULL
        AND trim(password_hash) <> ''
      ORDER BY id
      LIMIT 1
    `,
      )
      .get();

   return usuario?.id ?? null;
}

function adicionarPessoaSeNaoExiste(usuarioId, nome) {
   const nomeVal = String(nome || '').trim();
   if (!nomeVal) return;
   if (nomePareceContaPrincipal(usuarioId, nomeVal)) return;

   const existente = db
      .prepare(
         `
         SELECT id
         FROM pessoas
         WHERE user_id = ?
           AND (
              lower(full_name) = lower(?)
              OR lower(COALESCE(nickname, '')) = lower(?)
           )
      `,
      )
      .get(usuarioId, nomeVal, nomeVal);

   if (!existente) {
      db.prepare('INSERT INTO pessoas (user_id, full_name, date_updated) VALUES (?, ?, CURRENT_TIMESTAMP)').run(
         usuarioId,
         nomeVal,
      );
   }
}

function migrarPessoasLegadas(usuarioId) {
   if (
      usuarioId === getPrimeiroUsuarioAuthId() &&
      tabelaTemColuna('usuarios', 'nome')
   ) {
      const nomesLegados = db
         .prepare(
            `
        SELECT nome FROM usuarios
        WHERE (email IS NULL OR trim(email) = '')
          AND nome IS NOT NULL
          AND trim(nome) <> ''
      `,
         )
         .all();

      nomesLegados.forEach((row) =>
         adicionarPessoaSeNaoExiste(usuarioId, row.nome),
      );

      db.prepare(
         `DELETE FROM usuarios
       WHERE (email IS NULL OR trim(email) = '')
         AND (senha_hash IS NULL OR trim(senha_hash) = '')`,
      ).run();
   }

   for (const tableName of [
      'receitas',
      'despesas',
      'cartoes',
      'investimentos',
   ]) {
      const table = db
         .prepare(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
         )
         .get(tableName);
      if (!table) continue;

      const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const hasPessoa = cols.some((col) => col.name === 'pessoa');
      const hasUsuarioId = cols.some((col) => col.name === 'usuario_id');
      if (!hasPessoa || !hasUsuarioId) continue;

      const rows = db
         .prepare(
            `SELECT DISTINCT pessoa FROM ${tableName}
         WHERE usuario_id = ?
           AND pessoa IS NOT NULL
           AND trim(pessoa) <> ''`,
         )
         .all(usuarioId);

      rows.forEach((row) => adicionarPessoaSeNaoExiste(usuarioId, row.pessoa));
   }
}

router.use(autenticarToken);

router.use((req, _res, next) => {
   garantirPessoaPrincipal(req.usuario.id);
   migrarPessoasLegadas(req.usuario.id);
   next();
});

// GET → lista usuários (autocomplete)
router.get('/', (req, res) => {
   try {
      const rows = db
         .prepare(
            `SELECT
            id,
            full_name AS nome,
            nickname AS apelido,
            is_primary AS principal
         FROM pessoas
         WHERE user_id = ?
         ORDER BY COALESCE(NULLIF(trim(nickname), ''), full_name)`,
         )
         .all(req.usuario.id);

      res.json(rows.map(pessoaResponse));
   } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
   }
});

router.get('/perfil', (req, res) => {
   try {
      const usuario = getUsuarioConta(req.usuario.id);
      res.json(usuario);
   } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil' });
   }
});

// POST → cria pessoa se não existir
router.post('/', (req, res) => {
   try {
      const { nome, apelido } = req.body;

      if (!nome || !String(nome).trim()) {
         return res.status(400).json({ error: 'Nome é obrigatório.' });
      }

      const nomeVal = normalizarTexto(nome);
      const apelidoVal = normalizarTexto(apelido);

      const result = db
         .prepare(
            'INSERT INTO pessoas (user_id, full_name, nickname, is_primary, date_updated) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)',
         )
         .run(req.usuario.id, nomeVal, apelidoVal || null);

      const created = db
         .prepare(
            'SELECT id, full_name AS nome, nickname AS apelido, is_primary AS principal FROM pessoas WHERE id = ? AND user_id = ?',
         )
         .get(result.lastInsertRowid, req.usuario.id);

      res.status(201).json(pessoaResponse(created));
   } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({ error: 'Erro ao criar usuário' });
   }
});

// PUT → atualiza pessoa cadastrada
router.put('/:id', (req, res) => {
   try {
      const id = Number(req.params.id);
      const { nome, apelido } = req.body;

      if (!Number.isInteger(id) || id <= 0) {
         return res.status(400).json({ error: 'ID inválido.' });
      }

      if (!nome || !String(nome).trim()) {
         return res.status(400).json({ error: 'Nome é obrigatório.' });
      }

      const nomeVal = normalizarTexto(nome);
      const apelidoVal = normalizarTexto(apelido);

      const pessoa = db
         .prepare(
            'SELECT id, is_primary AS principal FROM pessoas WHERE id = ? AND user_id = ?',
         )
         .get(id, req.usuario.id);

      if (!pessoa) {
         return res.status(404).json({ error: 'Pessoa não encontrada.' });
      }

      db.prepare(
         'UPDATE pessoas SET full_name = ?, nickname = ?, date_updated = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      ).run(nomeVal, apelidoVal || null, id, req.usuario.id);

      const atualizado = db
         .prepare(
            'SELECT id, full_name AS nome, nickname AS apelido, is_primary AS principal FROM pessoas WHERE id = ? AND user_id = ?',
         )
         .get(id, req.usuario.id);

      res.json(pessoaResponse(atualizado));
   } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro ao atualizar usuário' });
   }
});

// DELETE → remove pessoa cadastrada
router.delete('/:id', (req, res) => {
   try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
         return res.status(400).json({ error: 'ID inválido.' });
      }

      const pessoa = db
         .prepare(
            'SELECT id, is_primary AS principal FROM pessoas WHERE id = ? AND user_id = ?',
         )
         .get(id, req.usuario.id);

      if (!pessoa) {
         return res.status(404).json({ error: 'Pessoa não encontrada.' });
      }

      if (pessoa.principal) {
         return res
            .status(400)
            .json({
               error: 'A pessoa principal da conta não pode ser removida.',
            });
      }

      db.prepare('DELETE FROM pessoas WHERE id = ? AND user_id = ?').run(
         id,
         req.usuario.id,
      );

      res.status(204).send();
   } catch (error) {
      console.error('Erro ao remover usuário:', error);
      res.status(500).json({ error: 'Erro ao remover usuário' });
   }
});

module.exports = router;
