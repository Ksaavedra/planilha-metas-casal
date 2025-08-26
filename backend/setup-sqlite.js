const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function setupSQLiteDatabase() {
   const dbPath = path.join(__dirname, 'database.sqlite');
   const db = new sqlite3.Database(dbPath);

   console.log('Criando banco SQLite...');

   db.serialize(() => {
      // Criar tabela metas
      db.run(
         `
      CREATE TABLE IF NOT EXISTS metas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        valorMeta REAL NOT NULL,
        valorPorMes REAL NOT NULL,
        mesesNecessarios INTEGER NOT NULL,
        valorAtual REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
         (err) => {
            if (err) {
               console.error('❌ Erro ao criar tabela metas:', err.message);
            } else {
               console.log('✅ Tabela metas criada');
            }
         }
      );

      // Criar tabela meses_meta
      db.run(
         `
      CREATE TABLE IF NOT EXISTS meses_meta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meta_id INTEGER NOT NULL,
        mes_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        valor REAL DEFAULT 0,
        status TEXT DEFAULT 'Vazio' CHECK(status IN ('Vazio', 'Parcial', 'Completo')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE CASCADE
      )
    `,
         (err) => {
            if (err) {
               console.error(
                  '❌ Erro ao criar tabela meses_meta:',
                  err.message
               );
            } else {
               console.log('✅ Tabela meses_meta criada');
            }
         }
      );

      // Inserir dados de exemplo
      db.run(
         `
      INSERT OR IGNORE INTO metas (id, nome, valorMeta, valorPorMes, mesesNecessarios, valorAtual)
      VALUES (1, 'Comprar um carro', 500000, 5000, 80, 100000)
    `,
         (err) => {
            if (err) {
               console.error(
                  '❌ Erro ao inserir meta de exemplo:',
                  err.message
               );
            } else {
               console.log('✅ Meta de exemplo inserida');
            }
         }
      );

      // Inserir meses para a meta de exemplo
      const meses = [
         'Janeiro',
         'Fevereiro',
         'Março',
         'Abril',
         'Maio',
         'Junho',
         'Julho',
         'Agosto',
         'Setembro',
         'Outubro',
         'Novembro',
         'Dezembro',
      ];

      meses.forEach((mes, index) => {
         db.run(
            `
        INSERT OR IGNORE INTO meses_meta (meta_id, mes_id, nome, valor, status)
        VALUES (1, ?, ?, 0, 'Vazio')
      `,
            [index + 1, mes],
            (err) => {
               if (err) {
                  console.error(`❌ Erro ao inserir mês ${mes}:`, err.message);
               }
            }
         );
      });

      console.log('✅ Banco SQLite configurado com sucesso!');
      console.log(`📁 Arquivo do banco: ${dbPath}`);
   });

   db.close((err) => {
      if (err) {
         console.error('❌ Erro ao fechar banco:', err.message);
      } else {
         console.log('✅ Conexão fechada');
      }
   });
}

setupSQLiteDatabase();
