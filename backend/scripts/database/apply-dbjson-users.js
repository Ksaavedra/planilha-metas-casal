const fs = require('fs');
const path = require('path');

const Database = require(process.env.SQLITE_MODULE_PATH || 'better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../metas.db');
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const backupPath = dbPath.replace(
   /\.db$/i,
   `.backup-apply-dbjson-${timestamp}.db`,
);

const users = [
   {
      id: 377,
      username: 'usuario1',
      full_name: 'Kelly Michele Torrico',
      nickname: 'Kelly Michele',
      email: 'kellymichelenbsp191@gmail.com',
      password: '$2b$10$/M/LBTK8CCgpTb8MX/rWVOPRd8U0jzX1hU4/CjmO5Ksxejos5bnNu',
      use_type: 'familia',
      date_created: '2026-05-29 00:00:00',
      date_updated: '2026-06-03 00:00:00',
      people: [
         {
            full_name: 'Kelly Michele Torrico',
            nickname: 'Kelly Michele',
            date_created: '2026-05-29 00:00:00',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 1,
         },
         {
            full_name: 'Marcia Cezar',
            nickname: 'Marcia',
            date_created: '2026-05-30 01:40:10',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 0,
         },
         {
            full_name: 'Eloina Saavedra',
            nickname: 'Eloina',
            date_created: '2026-05-30 01:40:10',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 0,
         },
         {
            full_name: 'Max Torrico',
            nickname: 'Max',
            date_created: '2026-05-30 01:40:10',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 0,
         },
         {
            full_name: 'Javier Torrico',
            nickname: 'Javier',
            date_created: '2026-05-30 01:40:11',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 0,
         },
         {
            full_name: 'Carla Torrico',
            nickname: 'Carla',
            date_created: '2026-06-04 00:55:59',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 0,
         },
         {
            full_name: 'David Rodrigues',
            nickname: 'David',
            date_created: '2026-06-04 00:55:59',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 0,
         },
      ],
   },
   {
      id: 394,
      username: 'carla2026',
      full_name: 'Carla Torrico',
      nickname: 'Carla',
      email: 'carla2026@gmail.com',
      password: '$2b$10$Q/9bSblDw4HI8vURvPz88eZC5nD.0CoGsvuNhl1yzos4hnBJ54kNG',
      use_type: 'familia',
      date_created: '2026-05-28 00:09:28',
      date_updated: '2026-06-04 00:55:59',
      people: [
         {
            full_name: 'Carla Torrico',
            nickname: 'Carla',
            date_created: '2026-06-04 00:55:59',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 1,
         },
         {
            full_name: 'Javier Torrico',
            nickname: 'Javier',
            date_created: '2026-06-04 00:55:59',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 0,
         },
      ],
   },
   {
      id: 395,
      username: 'david2026',
      full_name: 'David Rodrigues',
      nickname: 'David',
      email: 'david2026@gmail.com',
      password: '$2b$10$Q/9bSblDw4HI8vURvPz88eZC5nD.0CoGsvuNhl1yzos4hnBJ54kNG',
      use_type: 'individual',
      date_created: '2026-05-28 00:09:28',
      date_updated: '2026-06-04 00:55:59',
      people: [
         {
            full_name: 'David Rodrigues',
            nickname: 'David',
            date_created: '2026-06-04 00:55:59',
            date_updated: '2026-06-03 00:00:00',
            is_primary: 1,
         },
      ],
   },
];

if (!fs.existsSync(dbPath)) {
   throw new Error(`Banco nao encontrado: ${dbPath}`);
}

fs.copyFileSync(dbPath, backupPath);

const db = new Database(dbPath);

db.transaction(() => {
   const upsertUser = db.prepare(`
      INSERT INTO usuarios (
         id,
         username,
         full_name,
         nickname,
         email,
         password_hash,
         use_type,
         date_created,
         date_updated
      )
      VALUES (
         @id,
         @username,
         @full_name,
         @nickname,
         @email,
         @password_hash,
         @use_type,
         @date_created,
         @date_updated
      )
      ON CONFLICT(id) DO UPDATE SET
         username = excluded.username,
         full_name = excluded.full_name,
         nickname = excluded.nickname,
         email = excluded.email,
         password_hash = excluded.password_hash,
         use_type = excluded.use_type,
         date_created = excluded.date_created,
         date_updated = excluded.date_updated
   `);

   const insertPerson = db.prepare(`
      INSERT INTO pessoas (user_id, full_name, nickname, date_created, date_updated, is_primary)
      VALUES (?, ?, ?, ?, ?, ?)
   `);

   users.forEach((user) => {
      upsertUser.run({
         id: user.id,
         username: user.username,
         full_name: user.full_name,
         nickname: user.nickname,
         email: user.email,
         password_hash: user.password,
         use_type: user.use_type,
         date_created: user.date_created,
         date_updated: user.date_updated,
      });
      db.prepare('DELETE FROM pessoas WHERE user_id = ?').run(user.id);

      user.people.forEach((person) => {
         insertPerson.run(
            user.id,
            person.full_name,
            person.nickname,
            person.date_created,
            person.date_updated,
            person.is_primary,
         );
      });
   });

   const maxUserId = db
      .prepare('SELECT COALESCE(MAX(id), 0) AS maxId FROM usuarios')
      .get().maxId;

   const sequence = db
      .prepare("SELECT 1 FROM sqlite_sequence WHERE name = 'usuarios'")
      .get();

   if (sequence) {
      db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'usuarios'").run(
         maxUserId,
      );
   } else {
      db.prepare('INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)').run(
         'usuarios',
         maxUserId,
      );
   }
})();

const result = {
   backupPath,
   users: db
      .prepare(
         `
            SELECT
               id,
               username,
               full_name,
               nickname,
               email,
               use_type,
               date_created,
               date_updated
            FROM usuarios
            ORDER BY id
         `,
      )
      .all(),
   people: db
      .prepare(
         `
            SELECT
               id,
               user_id,
               full_name,
               nickname,
               date_created,
               date_updated,
               is_primary
            FROM pessoas
            ORDER BY user_id, is_primary DESC, id
         `,
      )
      .all(),
};

console.log(JSON.stringify(result, null, 2));
