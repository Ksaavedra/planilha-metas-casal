const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class MetaSQLite {
   constructor() {
      this.dbPath = path.join(__dirname, '..', 'database.sqlite');
      this.db = new sqlite3.Database(this.dbPath);
   }

   // Buscar todas as metas
   async findAll() {
      return new Promise((resolve, reject) => {
         this.db.all(
            `
        SELECT m.*, 
               GROUP_CONCAT(
                 json_object(
                   'id', mm.id,
                   'mes_id', mm.mes_id,
                   'nome', mm.nome,
                   'valor', mm.valor,
                   'status', mm.status
                 )
               ) as meses
        FROM metas m
        LEFT JOIN meses_meta mm ON m.id = mm.meta_id
        GROUP BY m.id
        ORDER BY m.created_at DESC
      `,
            (err, rows) => {
               if (err) {
                  reject(new Error(`Erro ao buscar metas: ${err.message}`));
               } else {
                  const metas = rows.map((row) => ({
                     ...row,
                     meses: row.meses ? JSON.parse(`[${row.meses}]`) : [],
                  }));
                  resolve(metas);
               }
            }
         );
      });
   }

   // Buscar meta por ID
   async findById(id) {
      return new Promise((resolve, reject) => {
         this.db.get(
            `
        SELECT m.*, 
               GROUP_CONCAT(
                 json_object(
                   'id', mm.id,
                   'mes_id', mm.mes_id,
                   'nome', mm.nome,
                   'valor', mm.valor,
                   'status', mm.status
                 )
               ) as meses
        FROM metas m
        LEFT JOIN meses_meta mm ON m.id = mm.meta_id
        WHERE m.id = ?
        GROUP BY m.id
      `,
            [id],
            (err, row) => {
               if (err) {
                  reject(new Error(`Erro ao buscar meta: ${err.message}`));
               } else if (!row) {
                  resolve(null);
               } else {
                  const meta = {
                     ...row,
                     meses: row.meses ? JSON.parse(`[${row.meses}]`) : [],
                  };
                  resolve(meta);
               }
            }
         );
      });
   }

   // Criar nova meta
   async create(metaData) {
      return new Promise((resolve, reject) => {
         this.db.serialize(() => {
            this.db.run(
               `
          INSERT INTO metas (nome, valorMeta, valorPorMes, mesesNecessarios, valorAtual)
          VALUES (?, ?, ?, ?, ?)
        `,
               [
                  metaData.nome,
                  metaData.valorMeta,
                  metaData.valorPorMes,
                  metaData.mesesNecessarios,
                  metaData.valorAtual || 0,
               ],
               function (err) {
                  if (err) {
                     reject(new Error(`Erro ao criar meta: ${err.message}`));
                     return;
                  }

                  const metaId = this.lastID;

                  // Inserir meses para a meta
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

                  let completed = 0;
                  const total = meses.length;

                  meses.forEach((mes, index) => {
                     this.db.run(
                        `
              INSERT INTO meses_meta (meta_id, mes_id, nome, valor, status)
              VALUES (?, ?, ?, ?, ?)
            `,
                        [metaId, index + 1, mes, 0, 'Vazio'],
                        (err) => {
                           if (err) {
                              console.error(
                                 `Erro ao inserir mês ${mes}:`,
                                 err.message
                              );
                           }
                           completed++;

                           if (completed === total) {
                              // Retornar a meta criada
                              this.findById(metaId).then(resolve).catch(reject);
                           }
                        }
                     );
                  });
               }.bind(this)
            );
         });
      });
   }

   // Atualizar meta
   async update(id, metaData) {
      return new Promise((resolve, reject) => {
         this.db.run(
            `
        UPDATE metas 
        SET nome = ?, valorMeta = ?, valorPorMes = ?, mesesNecessarios = ?, valorAtual = ?
        WHERE id = ?
      `,
            [
               metaData.nome,
               metaData.valorMeta,
               metaData.valorPorMes,
               metaData.mesesNecessarios,
               metaData.valorAtual,
               id,
            ],
            function (err) {
               if (err) {
                  reject(new Error(`Erro ao atualizar meta: ${err.message}`));
               } else if (this.changes === 0) {
                  resolve(null);
               } else {
                  this.findById(id).then(resolve).catch(reject);
               }
            }.bind(this)
         );
      });
   }

   // Deletar meta
   async delete(id) {
      return new Promise((resolve, reject) => {
         this.db.run('DELETE FROM metas WHERE id = ?', [id], function (err) {
            if (err) {
               reject(new Error(`Erro ao deletar meta: ${err.message}`));
            } else {
               resolve(this.changes > 0);
            }
         });
      });
   }

   // Atualizar valor de um mês específico
   async updateMes(metaId, mesId, valor) {
      return new Promise((resolve, reject) => {
         this.db.serialize(() => {
            let status = 'Vazio';
            if (valor > 0) {
               status = valor >= 100 ? 'Completo' : 'Parcial';
            }

            this.db.run(
               `
          UPDATE meses_meta 
          SET valor = ?, status = ?
          WHERE meta_id = ? AND mes_id = ?
        `,
               [valor, status, metaId, mesId],
               function (err) {
                  if (err) {
                     reject(new Error(`Erro ao atualizar mês: ${err.message}`));
                     return;
                  }

                  // Atualizar valor atual da meta
                  this.db.get(
                     `
            SELECT SUM(valor) as total
            FROM meses_meta 
            WHERE meta_id = ?
          `,
                     [metaId],
                     (err, row) => {
                        if (err) {
                           reject(
                              new Error(
                                 `Erro ao calcular total: ${err.message}`
                              )
                           );
                           return;
                        }

                        const valorAtual = row.total || 0;

                        this.db.run(
                           `
              UPDATE metas 
              SET valorAtual = ?
              WHERE id = ?
            `,
                           [valorAtual, metaId],
                           (err) => {
                              if (err) {
                                 reject(
                                    new Error(
                                       `Erro ao atualizar valor atual: ${err.message}`
                                    )
                                 );
                              } else {
                                 this.findById(metaId)
                                    .then(resolve)
                                    .catch(reject);
                              }
                           }
                        );
                     }
                  );
               }.bind(this)
            );
         });
      });
   }

   // Fechar conexão
   close() {
      this.db.close();
   }
}

module.exports = MetaSQLite;
