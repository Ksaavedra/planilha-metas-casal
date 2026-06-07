const fs = require('fs');
const path = require('path');

const Database = require(process.env.SQLITE_MODULE_PATH || 'better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../metas.db');
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const backupPath = dbPath.replace(
   /\.db$/i,
   `.backup-rebuild-usuarios-${timestamp}.db`,
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

const needsRebuild =
   hasColumn('usuarios', 'nome') || hasColumn('usuarios', 'data_criacao');

if (needsRebuild) {
   db.pragma('foreign_keys = OFF');

   db.transaction(() => {
      db.exec('DROP INDEX IF EXISTS idx_usuarios_email_unico');
      db.exec('DROP INDEX IF EXISTS idx_usuarios_usuario_unico');

      db.exec(`
         CREATE TABLE usuarios_novo (
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

      db.exec(`
         INSERT INTO usuarios_novo (
            id,
            usuario,
            nomeCompleto,
            apelido,
            email,
            senha_hash,
            tipoUso,
            createdAt,
            updatedAt
         )
         SELECT
            id,
            usuario,
            nomeCompleto,
            apelido,
            email,
            senha_hash,
            COALESCE(tipoUso, 'individual'),
            createdAt,
            updatedAt
         FROM usuarios
      `);

      db.exec('DROP TABLE usuarios');
      db.exec('ALTER TABLE usuarios_novo RENAME TO usuarios');

      db.exec(`
         CREATE UNIQUE INDEX idx_usuarios_email_unico
         ON usuarios(lower(email))
         WHERE email IS NOT NULL AND trim(email) <> ''
      `);

      db.exec(`
         CREATE UNIQUE INDEX idx_usuarios_usuario_unico
         ON usuarios(lower(usuario))
         WHERE usuario IS NOT NULL
           AND trim(usuario) <> ''
           AND senha_hash IS NOT NULL
           AND trim(senha_hash) <> ''
      `);

      const maxId = db
         .prepare('SELECT COALESCE(MAX(id), 0) AS maxId FROM usuarios')
         .get().maxId;

      const sequence = db
         .prepare("SELECT 1 FROM sqlite_sequence WHERE name = 'usuarios'")
         .get();

      if (sequence) {
         db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'usuarios'").run(
            maxId,
         );
      } else {
         db.prepare('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)').run(
            'usuarios',
            maxId,
         );
      }
   })();

   db.pragma('foreign_keys = ON');
}

const result = {
   backupPath,
   rebuilt: needsRebuild,
   colunas: columns('usuarios').map((column) => column.name),
   usuario377: db.prepare('SELECT * FROM usuarios WHERE id = ?').get(377),
};

console.log(JSON.stringify(result, null, 2));
