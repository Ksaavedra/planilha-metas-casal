const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../scripts/db');
const {
   JWT_SECRET,
   autenticarToken,
} = require('../middlewares/auth.middleware');
const { migrarDadosLegadosParaUsuario } = require('../utils/user-data-scope');

const router = express.Router();
const TOKEN_EXPIRATION = '7d';

function ensureUsuariosAuthSchema() {
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

   const cols = db.prepare('PRAGMA table_info(usuarios)').all();
   const hasColumn = (name) => cols.some((col) => col.name === name);
   const hasNomeLegado = hasColumn('nome');

   if (!hasColumn('email')) {
      db.exec('ALTER TABLE usuarios ADD COLUMN email TEXT');
   }

   if (!hasColumn('username')) {
      db.exec('ALTER TABLE usuarios ADD COLUMN username TEXT');
      db.exec(
         hasNomeLegado
            ? `
              UPDATE usuarios
              SET username = lower(replace(trim(COALESCE(email, nome, 'usuario' || id)), ' ', ''))
              WHERE username IS NULL OR trim(username) = ''
            `
            : `
              UPDATE usuarios
              SET username = lower(replace(trim(COALESCE(email, 'usuario' || id)), ' ', ''))
              WHERE username IS NULL OR trim(username) = ''
            `,
      );
   }

   db.exec(`
      UPDATE usuarios
      SET username = CASE
         WHEN email IS NOT NULL AND instr(email, '@') > 1 THEN substr(email, 1, instr(email, '@') - 1)
         ELSE 'usuario' || id
      END
      WHERE username IS NULL
         OR trim(username) = ''
         OR instr(username, '@') > 0
   `);

   if (!hasColumn('full_name')) {
      db.exec('ALTER TABLE usuarios ADD COLUMN full_name TEXT');
      db.exec(
         hasNomeLegado
            ? `
              UPDATE usuarios
              SET full_name = nome
              WHERE full_name IS NULL OR trim(full_name) = ''
            `
            : `
              UPDATE usuarios
              SET full_name = username
              WHERE full_name IS NULL OR trim(full_name) = ''
            `,
      );
   }

   if (!hasColumn('nickname')) {
      db.exec('ALTER TABLE usuarios ADD COLUMN nickname TEXT');
   }

   db.exec(`
      UPDATE usuarios
      SET nickname = COALESCE(
         CASE
            WHEN full_name IS NOT NULL AND instr(full_name, '@') = 0 THEN NULLIF(trim(full_name), '')
            ELSE NULL
         END,
         CASE
            WHEN username IS NOT NULL AND instr(username, '@') = 0 THEN NULLIF(trim(username), '')
            ELSE NULL
         END,
         CASE
            WHEN email IS NOT NULL AND instr(email, '@') > 1 THEN substr(email, 1, instr(email, '@') - 1)
            ELSE NULL
         END
      )
      WHERE nickname IS NULL OR trim(nickname) = '' OR instr(nickname, '@') > 0
   `);

   if (!hasColumn('password_hash')) {
      db.exec('ALTER TABLE usuarios ADD COLUMN password_hash TEXT');
   }

   if (!hasColumn('use_type')) {
      db.exec(
         "ALTER TABLE usuarios ADD COLUMN use_type TEXT DEFAULT 'individual'",
      );
   }

   if (!hasColumn('date_created')) {
      db.exec('ALTER TABLE usuarios ADD COLUMN date_created TEXT');
      db.exec('UPDATE usuarios SET date_created = CURRENT_TIMESTAMP WHERE date_created IS NULL');
   }

   if (!hasColumn('date_updated')) {
      db.exec('ALTER TABLE usuarios ADD COLUMN date_updated TEXT');
   }

   db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unico
    ON usuarios(lower(email))
    WHERE email IS NOT NULL AND trim(email) <> ''
  `);

   db.exec('DROP INDEX IF EXISTS idx_usuarios_usuario_unico');
   db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_usuario_unico
    ON usuarios(lower(username))
    WHERE username IS NOT NULL
      AND trim(username) <> ''
      AND password_hash IS NOT NULL
      AND trim(password_hash) <> ''
  `);
}

ensureUsuariosAuthSchema();

function ensurePessoasSchema() {
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

   const cols = db.prepare('PRAGMA table_info(pessoas)').all();
   const hasColumn = (name) => cols.some((col) => col.name === name);

   if (!hasColumn('nickname')) {
      db.exec('ALTER TABLE pessoas ADD COLUMN nickname TEXT');
   }

   if (!hasColumn('is_primary')) {
      db.exec('ALTER TABLE pessoas ADD COLUMN is_primary INTEGER DEFAULT 0');
   }

   if (!hasColumn('date_updated')) {
      db.exec('ALTER TABLE pessoas ADD COLUMN date_updated TEXT');
   }
}

ensurePessoasSchema();

function normalizarEmail(email) {
   return String(email || '')
      .trim()
      .toLowerCase();
}

function usuarioResponse(row) {
   const nomeCompleto = row.nomeCompleto || row.usuario;
   const usuarioSemEmail =
      row.usuario && !String(row.usuario).includes('@') ? row.usuario : null;
   const apelidoSemEmail =
      row.apelido && !String(row.apelido).includes('@') ? row.apelido : null;
   const nomeSemEmail =
      nomeCompleto && !String(nomeCompleto).includes('@') ? nomeCompleto : null;
   const emailLocal =
      row.email && String(row.email).includes('@')
         ? String(row.email).split('@')[0]
         : null;
   const usuario = usuarioSemEmail || emailLocal || null;
   const apelido = apelidoSemEmail || nomeSemEmail || usuario || null;
   return {
      id: row.id,
      usuario,
      nomeCompleto: nomeCompleto,
      apelido,
      email: row.email,
      tipoUso: row.tipoUso || 'individual',
      dataCriacao: row.createdAt,
   };
}

function gerarToken(usuario) {
   return jwt.sign(
      {
         id: usuario.id,
         usuario: usuario.usuario,
         email: usuario.email,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION },
   );
}

function buscarUsuarioPorIdentificador(identificador) {
   return db
      .prepare(
         `
      SELECT
         id,
         username AS usuario,
         full_name AS nomeCompleto,
         nickname AS apelido,
         email,
         password_hash AS senha_hash,
         use_type AS tipoUso,
         date_created AS createdAt,
         date_updated AS updatedAt
      FROM usuarios
      WHERE (lower(email) = lower(?) OR lower(username) = lower(?))
        AND password_hash IS NOT NULL
        AND trim(password_hash) <> ''
    `,
      )
      .get(identificador, identificador);
}

function criarPessoaPrincipalSeNaoExiste(usuario) {
   const nomeCompleto = String(usuario.nomeCompleto || '').trim();
   const apelido = String(usuario.apelido || '').trim();
   if (!nomeCompleto) return;

   const existente = db
      .prepare(
         'SELECT id FROM pessoas WHERE user_id = ? AND is_primary = 1 LIMIT 1',
      )
      .get(usuario.id);

   if (existente) {
      db.prepare(
         'UPDATE pessoas SET full_name = ?, nickname = ?, date_updated = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      ).run(nomeCompleto, apelido || null, existente.id, usuario.id);
      return;
   }

   db.prepare(
      'INSERT INTO pessoas (user_id, full_name, nickname, is_primary, date_updated) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
   ).run(usuario.id, nomeCompleto, apelido || null);
}

router.post('/registrar', async (req, res) => {
   try {
      const usuarioVal = String(req.body.usuario || '').trim();
      const nomeCompleto = String(req.body.nomeCompleto || '').trim();
      const apelido = String(req.body.apelido || '').trim();
      const email = normalizarEmail(req.body.email);
      const senha = String(req.body.senha || '');

      if (!usuarioVal || !nomeCompleto || !apelido || !email || !senha) {
         return res.status(400).json({
            error: 'Usuário, nome completo, apelido, email e senha são obrigatórios.',
         });
      }

      if (senha.length < 6) {
         return res.status(400).json({
            error: 'A senha deve ter pelo menos 6 caracteres.',
         });
      }

      const existenteEmail = buscarUsuarioPorIdentificador(email);
      if (existenteEmail?.email?.toLowerCase() === email) {
         return res.status(409).json({ error: 'Email já cadastrado.' });
      }

      const existenteUsuario = buscarUsuarioPorIdentificador(usuarioVal);
      if (
         existenteUsuario?.usuario?.toLowerCase() === usuarioVal.toLowerCase()
      ) {
         return res.status(409).json({ error: 'Usuário já cadastrado.' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);
      const result = db
         .prepare(
            `
            INSERT INTO usuarios (
              username, full_name, nickname, email, password_hash, use_type, date_created, date_updated
            )
            VALUES (?, ?, ?, ?, ?, 'individual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `,
         )
         .run(usuarioVal, nomeCompleto, apelido, email, senhaHash);

      const usuario = db
         .prepare(
            `
        SELECT
          id,
          username AS usuario,
          full_name AS nomeCompleto,
          nickname AS apelido,
          email,
          use_type AS tipoUso,
          date_created AS createdAt,
          date_updated AS updatedAt
        FROM usuarios
        WHERE id = ?
      `,
         )
         .get(result.lastInsertRowid);

      criarPessoaPrincipalSeNaoExiste(usuario);
      migrarDadosLegadosParaUsuario(usuario.id);

      const token = gerarToken(usuario);

      res.status(201).json({
         message: 'Conta criada com sucesso.',
         token,
         usuario: usuarioResponse(usuario),
      });
   } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ error: 'Erro ao criar conta.' });
   }
});

router.post('/login', async (req, res) => {
   try {
      const identificador = String(
         req.body.usuarioOuEmail || req.body.email || req.body.usuario || '',
      ).trim();
      const senha = String(req.body.senha || '');

      if (!identificador || !senha) {
         return res
            .status(400)
            .json({ error: 'Usuário ou email e senha são obrigatórios.' });
      }

      const usuario = buscarUsuarioPorIdentificador(identificador);
      if (!usuario || !usuario.senha_hash) {
         return res
            .status(401)
            .json({ error: 'Usuário/email ou senha inválidos.' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
         return res
            .status(401)
            .json({ error: 'Usuário/email ou senha inválidos.' });
      }

      const token = gerarToken(usuario);

      res.json({
         message: 'Login realizado com sucesso.',
         token,
         usuario: usuarioResponse(usuario),
      });
   } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ error: 'Erro ao fazer login.' });
   }
});

router.get('/perfil', autenticarToken, (req, res) => {
   try {
      const usuario = db
         .prepare(
            `
        SELECT
          id,
          username AS usuario,
          full_name AS nomeCompleto,
          nickname AS apelido,
          email,
          use_type AS tipoUso,
          date_created AS createdAt,
          date_updated AS updatedAt
        FROM usuarios
        WHERE id = ?
      `,
         )
         .get(req.usuario.id);

      if (!usuario) {
         return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      res.json(usuarioResponse(usuario));
   } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil.' });
   }
});

router.put('/tipo-uso', autenticarToken, (req, res) => {
   try {
      const tipoUso = String(req.body.tipoUso || '').trim();

      if (tipoUso !== 'individual' && tipoUso !== 'familia') {
         return res.status(400).json({ error: 'Tipo de uso inválido.' });
      }

      db.prepare('UPDATE usuarios SET use_type = ?, date_updated = CURRENT_TIMESTAMP WHERE id = ?').run(
         tipoUso,
         req.usuario.id,
      );

      const usuario = db
         .prepare(
            `
        SELECT
          id,
          username AS usuario,
          full_name AS nomeCompleto,
          nickname AS apelido,
          email,
          use_type AS tipoUso,
          date_created AS createdAt,
          date_updated AS updatedAt
        FROM usuarios
        WHERE id = ?
      `,
         )
         .get(req.usuario.id);

      if (!usuario) {
         return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      res.json(usuarioResponse(usuario));
   } catch (error) {
      console.error('Erro ao atualizar tipo de uso:', error);
      res.status(500).json({ error: 'Erro ao atualizar tipo de uso.' });
   }
});

module.exports = router;
