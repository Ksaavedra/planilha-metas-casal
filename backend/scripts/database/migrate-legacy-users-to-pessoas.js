const fs = require('fs');
const path = require('path');

const Database = require(
   process.env.SQLITE_MODULE_PATH || 'better-sqlite3',
);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../metas.db');
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const backupPath = dbPath.replace(/\.db$/i, `.backup-${timestamp}.db`);

if (!fs.existsSync(dbPath)) {
   throw new Error(`Banco nao encontrado: ${dbPath}`);
}

fs.copyFileSync(dbPath, backupPath);

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function hasTable(tableName) {
   return Boolean(
      db
         .prepare(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
         )
         .get(tableName),
   );
}

function hasColumn(tableName, columnName) {
   return db
      .prepare(`PRAGMA table_info(${tableName})`)
      .all()
      .some((column) => column.name === columnName);
}

function addColumnIfMissing(tableName, columnName, definition) {
   if (!hasColumn(tableName, columnName)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
   }
}

function normalize(value) {
   return String(value || '').trim();
}

function emailLocal(email) {
   const value = normalize(email);
   if (!value.includes('@')) return '';
   return value.split('@')[0];
}

function semEmail(value) {
   const normalized = normalize(value);
   return normalized.includes('@') ? '' : normalized;
}

function usernameFrom(row) {
   return (
      semEmail(row.usuario) ||
      semEmail(row.nome) ||
      emailLocal(row.email) ||
      `usuario${row.id}`
   );
}

function lower(value) {
   return normalize(value).toLowerCase();
}

function ensureSchema() {
   db.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         usuario TEXT,
         nomeCompleto TEXT,
         apelido TEXT,
         email TEXT,
         senha_hash TEXT,
         tipoUso TEXT DEFAULT 'individual',
         createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
         updatedAt DATETIME
      )
   `);

   addColumnIfMissing('usuarios', 'email', 'TEXT');
   addColumnIfMissing('usuarios', 'senha_hash', 'TEXT');
   addColumnIfMissing('usuarios', 'usuario', 'TEXT');
   addColumnIfMissing('usuarios', 'nomeCompleto', 'TEXT');
   addColumnIfMissing('usuarios', 'apelido', 'TEXT');
   addColumnIfMissing('usuarios', 'tipoUso', "TEXT DEFAULT 'individual'");
   addColumnIfMissing('usuarios', 'createdAt', 'TEXT');
   addColumnIfMissing('usuarios', 'updatedAt', 'TEXT');

   db.exec(`
      CREATE TABLE IF NOT EXISTS pessoas (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         usuario_id INTEGER NOT NULL,
         nome TEXT NOT NULL,
         apelido TEXT,
         principal INTEGER DEFAULT 0,
         createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
   `);

   addColumnIfMissing('pessoas', 'apelido', 'TEXT');
   addColumnIfMissing('pessoas', 'principal', 'INTEGER DEFAULT 0');
}

function authRows() {
   const nomeSelect = hasColumn('usuarios', 'nome') ? 'nome' : 'NULL AS nome';

   return db
      .prepare(
         `
            SELECT id, ${nomeSelect}, usuario, nomeCompleto, apelido, email, senha_hash, tipoUso, createdAt
            FROM usuarios
            WHERE email IS NOT NULL
              AND trim(email) <> ''
              AND senha_hash IS NOT NULL
              AND trim(senha_hash) <> ''
            ORDER BY id
         `,
      )
      .all();
}

function legacyRows() {
   if (!hasColumn('usuarios', 'nome')) return [];

   return db
      .prepare(
         `
            SELECT id, nome, createdAt
            FROM usuarios
            WHERE (email IS NULL OR trim(email) = '')
              AND (senha_hash IS NULL OR trim(senha_hash) = '')
              AND nome IS NOT NULL
              AND trim(nome) <> ''
            ORDER BY id
         `,
      )
      .all();
}

function countNonPrincipalPeople(usuarioId) {
   return db
      .prepare(
         `
            SELECT COUNT(*) AS total
            FROM pessoas
            WHERE usuario_id = ?
              AND COALESCE(principal, 0) = 0
         `,
      )
      .get(usuarioId).total;
}

function upsertPrincipalPerson(usuarioId, nome, apelido) {
   const nomeVal = normalize(nome);
   const apelidoVal = normalize(apelido) || null;
   if (!nomeVal) return;

   db.prepare('UPDATE pessoas SET principal = 0 WHERE usuario_id = ?').run(
      usuarioId,
   );

   const existente =
      db
         .prepare(
            `
               SELECT id
               FROM pessoas
               WHERE usuario_id = ?
                 AND lower(trim(nome)) = lower(?)
               LIMIT 1
            `,
         )
         .get(usuarioId, nomeVal) ||
      db
         .prepare(
            `
               SELECT id
               FROM pessoas
               WHERE usuario_id = ?
               ORDER BY id
               LIMIT 1
            `,
         )
         .get(usuarioId);

   if (existente) {
      db.prepare(
         `
            UPDATE pessoas
            SET nome = ?, apelido = ?, principal = 1
            WHERE id = ? AND usuario_id = ?
         `,
      ).run(nomeVal, apelidoVal, existente.id, usuarioId);
      return;
   }

   db.prepare(
      `
         INSERT INTO pessoas (usuario_id, nome, apelido, principal)
         VALUES (?, ?, ?, 1)
      `,
   ).run(usuarioId, nomeVal, apelidoVal);
}

function addPersonIfMissing(usuarioId, nome, apelido = null) {
   const nomeVal = normalize(nome);
   const apelidoVal = normalize(apelido) || null;
   if (!nomeVal) return false;

   const existe = db
      .prepare(
         `
            SELECT id
            FROM pessoas
            WHERE usuario_id = ?
              AND lower(trim(nome)) = lower(?)
            LIMIT 1
         `,
      )
      .get(usuarioId, nomeVal);

   if (existe) return false;

   db.prepare(
      `
         INSERT INTO pessoas (usuario_id, nome, apelido, principal)
         VALUES (?, ?, ?, 0)
      `,
   ).run(usuarioId, nomeVal, apelidoVal);
   return true;
}

function financialPeople(usuarioId) {
   const tables = ['receitas', 'despesas', 'cartoes', 'investimentos'];
   const people = new Set();

   for (const tableName of tables) {
      if (!hasTable(tableName)) continue;

      const hasPessoa = hasColumn(tableName, 'pessoa');
      const hasUsuarioId = hasColumn(tableName, 'usuario_id');
      if (!hasPessoa || !hasUsuarioId) continue;

      const rows = db
         .prepare(
            `
               SELECT DISTINCT pessoa
               FROM ${tableName}
               WHERE usuario_id = ?
                 AND pessoa IS NOT NULL
                 AND trim(pessoa) <> ''
            `,
         )
         .all(usuarioId);

      rows.forEach((row) => people.add(normalize(row.pessoa)));
   }

   return [...people].filter(Boolean);
}

function migrate() {
   ensureSchema();

   const accounts = authRows();
   if (!accounts.length) {
      throw new Error('Nenhuma conta com email e senha_hash foi encontrada.');
   }

   const primaryAccount = accounts[0];
   const legacy = legacyRows();
   const legacyPrincipalName =
      semEmail(process.env.PRINCIPAL_NOME) || semEmail(legacy[0]?.nome);

   const accountUpdates = [];
   const peopleInserted = [];

   for (const account of accounts) {
      const isPrimary = account.id === primaryAccount.id;
      const usuario = usernameFrom(account);
      const nomeCompleto =
         (isPrimary && legacyPrincipalName) ||
         semEmail(account.nomeCompleto) ||
         semEmail(account.nome) ||
         usuario;
      const apelido =
         semEmail(account.apelido) ||
         (isPrimary && legacyPrincipalName) ||
         nomeCompleto;
      const currentTipoUso = normalize(account.tipoUso);
      const hasFamilyPeople =
         isPrimary && (legacy.length > 1 || countNonPrincipalPeople(account.id) > 0);
      const tipoUso =
         hasFamilyPeople
            ? 'familia'
            : currentTipoUso === 'familia' || currentTipoUso === 'individual'
            ? currentTipoUso
            : 'individual';

      db.prepare(
         `
            UPDATE usuarios
            SET usuario = ?, nomeCompleto = ?, apelido = ?, tipoUso = ?,
                createdAt = COALESCE(createdAt, CURRENT_TIMESTAMP),
                updatedAt = COALESCE(updatedAt, CURRENT_TIMESTAMP)
            WHERE id = ?
         `,
      ).run(usuario, nomeCompleto, apelido, tipoUso, account.id);

      upsertPrincipalPerson(account.id, nomeCompleto, apelido);
      accountUpdates.push({
         id: account.id,
         usuario,
         nomeCompleto,
         apelido,
         tipoUso,
      });
   }

   const principalLower = lower(
      legacyPrincipalName ||
         primaryAccount.nomeCompleto ||
         primaryAccount.nome ||
         primaryAccount.usuario,
   );

   for (const row of legacy) {
      if (lower(row.nome) === principalLower) continue;
      if (addPersonIfMissing(primaryAccount.id, row.nome)) {
         peopleInserted.push(row.nome);
      }
   }

   for (const pessoa of financialPeople(primaryAccount.id)) {
      if (lower(pessoa) === principalLower) continue;
      if (addPersonIfMissing(primaryAccount.id, pessoa)) {
         peopleInserted.push(pessoa);
      }
   }

   db.prepare(
      `
         DELETE FROM usuarios
         WHERE (email IS NULL OR trim(email) = '')
           AND (senha_hash IS NULL OR trim(senha_hash) = '')
      `,
   ).run();

   db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unico
      ON usuarios(lower(email))
      WHERE email IS NOT NULL AND trim(email) <> ''
   `);

   db.exec('DROP INDEX IF EXISTS idx_usuarios_usuario_unico');
   db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_usuario_unico
      ON usuarios(lower(usuario))
      WHERE usuario IS NOT NULL
        AND trim(usuario) <> ''
        AND senha_hash IS NOT NULL
        AND trim(senha_hash) <> ''
   `);

   return {
      backupPath,
      primaryUsuarioId: primaryAccount.id,
      contasAtualizadas: accountUpdates,
      pessoasInseridas: peopleInserted,
      usuariosRestantes: db.prepare('SELECT COUNT(*) total FROM usuarios').get()
         .total,
      pessoasRestantes: db.prepare('SELECT COUNT(*) total FROM pessoas').get()
         .total,
   };
}

const result = db.transaction(migrate)();
console.log(JSON.stringify(result, null, 2));

