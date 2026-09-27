const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../scripts/db');
const {
   JWT_SECRET,
   autenticarToken,
} = require('../middlewares/auth.middleware');
const { migrarDadosLegadosParaUsuario } = require('../utils/user-data-scope');
const {
   enviarCodigoRecuperacaoSenha,
   enviarBoasVindas,
} = require('../utils/email.service');

const router = express.Router();
const TOKEN_EXPIRATION = '7d';
const RESET_CODE_EXPIRATION_MINUTES = 15;
const RESET_TOKEN_EXPIRATION = '15m';
const MAX_RESET_CODE_ATTEMPTS = 5;
const GENERIC_FORGOT_PASSWORD_MESSAGE =
   'Se o email estiver cadastrado, enviaremos um código de recuperação.';

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

function ensurePasswordResetSchema() {
   db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      attempts INTEGER DEFAULT 0,
      date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
  `);

   const cols = db.prepare('PRAGMA table_info(password_reset_tokens)').all();
   const hasColumn = (name) => cols.some((col) => col.name === name);

   if (!hasColumn('code_hash')) {
      if (hasColumn('token')) {
         db.exec('ALTER TABLE password_reset_tokens ADD COLUMN code_hash TEXT');
         db.exec(
            'UPDATE password_reset_tokens SET code_hash = token WHERE code_hash IS NULL',
         );
      } else {
         db.exec('ALTER TABLE password_reset_tokens ADD COLUMN code_hash TEXT');
      }
   }

   if (!hasColumn('attempts')) {
      db.exec(
         'ALTER TABLE password_reset_tokens ADD COLUMN attempts INTEGER DEFAULT 0',
      );
      db.exec(
         'UPDATE password_reset_tokens SET attempts = 0 WHERE attempts IS NULL',
      );
   }

   if (hasColumn('token')) {
      db.exec(
         'UPDATE password_reset_tokens SET token = code_hash WHERE token IS NULL AND code_hash IS NOT NULL',
      );
   }

   db.exec(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_user_active
    ON password_reset_tokens(user_id, used_at, expires_at)
  `);
}

ensurePasswordResetSchema();

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

function emailValido(email) {
   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buscarUsuarioPorEmail(email) {
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
      WHERE lower(email) = lower(?)
        AND password_hash IS NOT NULL
        AND trim(password_hash) <> ''
    `,
      )
      .get(email);
}

function gerarCodigoRecuperacao() {
   return String(crypto.randomInt(100000, 1000000));
}

function invalidarTokensRecuperacaoAtivos(userId) {
   db.prepare(
      `
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND used_at IS NULL
    `,
   ).run(userId);
}

function inserirTokenRecuperacao(userId, codeHash, expiresAt) {
   const cols = db.prepare('PRAGMA table_info(password_reset_tokens)').all();
   const hasTokenLegado = cols.some((col) => col.name === 'token');

   if (hasTokenLegado) {
      return db
         .prepare(
            `
            INSERT INTO password_reset_tokens (user_id, code_hash, token, expires_at)
            VALUES (?, ?, ?, ?)
          `,
         )
         .run(userId, codeHash, codeHash, expiresAt);
   }

   return db
      .prepare(
         `
        INSERT INTO password_reset_tokens (user_id, code_hash, expires_at)
        VALUES (?, ?, ?)
      `,
      )
      .run(userId, codeHash, expiresAt);
}

function buscarTokenRecuperacaoAtivo(userId) {
   return db
      .prepare(
         `
      SELECT id, user_id AS userId, code_hash AS codeHash, expires_at AS expiresAt, attempts
      FROM password_reset_tokens
      WHERE user_id = ?
        AND used_at IS NULL
        AND datetime(expires_at) > datetime('now')
      ORDER BY date_created DESC
      LIMIT 1
    `,
      )
      .get(userId);
}

function gerarResetToken(userId, resetId) {
   return jwt.sign(
      {
         id: userId,
         resetId,
         purpose: 'password_reset',
      },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRATION },
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

      // A conta já foi criada; falha no email não deve virar erro para o usuário.
      enviarBoasVindas(usuario).catch(() => {});
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

router.post('/forgot-password', async (req, res) => {
   try {
      const email = normalizarEmail(req.body.email);

      if (!email || !emailValido(email)) {
         return res.status(400).json({ error: 'Informe um email válido.' });
      }

      const usuario = buscarUsuarioPorEmail(email);

      if (usuario) {
         invalidarTokensRecuperacaoAtivos(usuario.id);

         const codigo = gerarCodigoRecuperacao();
         const codeHash = await bcrypt.hash(codigo, 10);
         const expiresAt = new Date(
            Date.now() + RESET_CODE_EXPIRATION_MINUTES * 60 * 1000,
         ).toISOString();

         inserirTokenRecuperacao(usuario.id, codeHash, expiresAt);

         try {
            await enviarCodigoRecuperacaoSenha(email, codigo);
         } catch (emailError) {
            console.error('Erro ao enviar email de recuperação:', emailError);
         }
      } else {
         console.log(
            'Recuperação de senha solicitada para email não cadastrado:',
            email,
         );
      }

      res.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE });
   } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      res.status(500).json({ error: 'Erro ao solicitar recuperação de senha.' });
   }
});

router.post('/verify-reset-code', async (req, res) => {
   try {
      const email = normalizarEmail(req.body.email);
      const codigo = String(req.body.codigo || req.body.code || '').trim();

      if (!email || !emailValido(email)) {
         return res.status(400).json({ error: 'Informe um email válido.' });
      }

      if (!/^\d{6}$/.test(codigo)) {
         return res.status(400).json({ error: 'Informe o código de 6 dígitos.' });
      }

      const usuario = buscarUsuarioPorEmail(email);
      if (!usuario) {
         return res.status(400).json({ error: 'Código inválido ou expirado.' });
      }

      const token = buscarTokenRecuperacaoAtivo(usuario.id);
      if (!token) {
         return res.status(400).json({ error: 'Código inválido ou expirado.' });
      }

      if (token.attempts >= MAX_RESET_CODE_ATTEMPTS) {
         return res.status(429).json({
            error: 'Número máximo de tentativas excedido. Solicite um novo código.',
         });
      }

      const codigoValido = await bcrypt.compare(codigo, token.codeHash);
      db.prepare(
         'UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?',
      ).run(token.id);

      if (!codigoValido) {
         return res.status(400).json({ error: 'Código inválido ou expirado.' });
      }

      const resetToken = gerarResetToken(usuario.id, token.id);

      res.json({
         message: 'Código verificado com sucesso.',
         resetToken,
      });
   } catch (error) {
      console.error('Erro ao verificar código de recuperação:', error);
      res.status(500).json({ error: 'Erro ao verificar código de recuperação.' });
   }
});

router.post('/reset-password', async (req, res) => {
   try {
      const resetToken = String(req.body.resetToken || '').trim();
      const novaSenha = String(
         req.body.novaSenha || req.body.senha || req.body.password || '',
      );

      if (!resetToken) {
         return res.status(400).json({ error: 'Token de recuperação não informado.' });
      }

      if (!novaSenha || novaSenha.length < 6) {
         return res.status(400).json({
            error: 'A nova senha deve ter pelo menos 6 caracteres.',
         });
      }

      let payload;
      try {
         payload = jwt.verify(resetToken, JWT_SECRET);
      } catch (error) {
         return res.status(400).json({
            error: 'Token de recuperação inválido ou expirado.',
         });
      }

      if (payload.purpose !== 'password_reset' || !payload.id || !payload.resetId) {
         return res.status(400).json({
            error: 'Token de recuperação inválido ou expirado.',
         });
      }

      const token = db
         .prepare(
            `
        SELECT id, user_id AS userId, used_at AS usedAt, expires_at AS expiresAt
        FROM password_reset_tokens
        WHERE id = ? AND user_id = ?
      `,
         )
         .get(payload.resetId, payload.id);

      if (
         !token ||
         token.usedAt ||
         new Date(token.expiresAt).getTime() <= Date.now()
      ) {
         return res.status(400).json({
            error: 'Token de recuperação inválido ou expirado.',
         });
      }

      const senhaHash = await bcrypt.hash(novaSenha, 10);
      db.prepare(
         'UPDATE usuarios SET password_hash = ?, date_updated = CURRENT_TIMESTAMP WHERE id = ?',
      ).run(senhaHash, payload.id);

      db.prepare(
         'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).run(token.id);

      invalidarTokensRecuperacaoAtivos(payload.id);

      res.json({ message: 'Senha redefinida com sucesso.' });
   } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha.' });
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
