const fs = require('fs');
const path = require('path');

const Database = require(process.env.SQLITE_MODULE_PATH || 'better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../metas.db');
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const backupPath = dbPath.replace(
   /\.db$/i,
   `.backup-english-columns-${timestamp}.db`,
);

if (!fs.existsSync(dbPath)) {
   throw new Error(`Banco nao encontrado: ${dbPath}`);
}

fs.copyFileSync(dbPath, backupPath);

const db = new Database(dbPath);

function columns(tableName) {
   return db.prepare(`PRAGMA table_info(${tableName})`).all();
}

function hasColumn(tableName, columnName) {
   return columns(tableName).some((column) => column.name === columnName);
}

function renameColumn(tableName, from, to) {
   if (!hasColumn(tableName, from) || hasColumn(tableName, to)) return false;
   db.exec(`ALTER TABLE ${tableName} RENAME COLUMN ${from} TO ${to}`);
   return true;
}

const renamed = [];

db.transaction(() => {
   [
      ['usuarios', 'usuario', 'username'],
      ['usuarios', 'nomeCompleto', 'full_name'],
      ['usuarios', 'apelido', 'nickname'],
      ['usuarios', 'senha_hash', 'password_hash'],
      ['usuarios', 'tipoUso', 'use_type'],
      ['usuarios', 'createdAt', 'date_created'],
      ['usuarios', 'updatedAt', 'date_updated'],
      ['pessoas', 'usuario_id', 'user_id'],
      ['pessoas', 'nome', 'full_name'],
      ['pessoas', 'apelido', 'nickname'],
      ['pessoas', 'principal', 'is_primary'],
      ['pessoas', 'createdAt', 'date_created'],
      ['pessoas', 'updatedAt', 'date_updated'],
   ].forEach(([tableName, from, to]) => {
      if (renameColumn(tableName, from, to)) {
         renamed.push(`${tableName}.${from}->${to}`);
      }
   });

   db.exec('DROP INDEX IF EXISTS idx_usuarios_usuario_unico');
   db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_username_unique
      ON usuarios(lower(username))
      WHERE username IS NOT NULL
        AND trim(username) <> ''
        AND password_hash IS NOT NULL
        AND trim(password_hash) <> ''
   `);
})();

const result = {
   backupPath,
   renamed,
   usuariosColumns: columns('usuarios').map((column) => column.name),
   pessoasColumns: columns('pessoas').map((column) => column.name),
   users: db
      .prepare(
         `
            SELECT id, username, full_name, nickname, email, use_type, date_created, date_updated
            FROM usuarios
            ORDER BY id
         `,
      )
      .all(),
};

console.log(JSON.stringify(result, null, 2));
