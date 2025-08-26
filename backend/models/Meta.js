const db = require('../config/database');

class Meta {
   // Buscar todas as metas
   static async findAll() {
      try {
         // Primeiro buscar todas as metas
         const [metas] = await db.query(`
            SELECT * FROM metas ORDER BY created_at DESC
         `);

         // Para cada meta, buscar os meses
         const metasComMeses = await Promise.all(
            metas.map(async (meta) => {
               const [meses] = await db.query(
                  `
                  SELECT id, mes_id, nome, valor, status
                  FROM meses_meta 
                  WHERE meta_id = ?
                  ORDER BY mes_id
               `,
                  [meta.id]
               );

               // Converter valores para números
               const metaConvertida = {
                  ...meta,
                  valorMeta: Number(meta.valorMeta) || 0,
                  valorPorMes: Number(meta.valorPorMes) || 0,
                  mesesNecessarios: Number(meta.mesesNecessarios) || 0,
                  valorAtual: Number(meta.valorAtual) || 0,
                  meses: meses.map((mes) => ({
                     ...mes,
                     valor: Number(mes.valor) || 0,
                  })),
               };

               return metaConvertida;
            })
         );

         return metasComMeses;
      } catch (error) {
         throw new Error(`Erro ao buscar metas: ${error.message}`);
      }
   }

   // Buscar meta por ID
   static async findById(id) {
      try {
         const [metas] = await db.query('SELECT * FROM metas WHERE id = ?', [
            id,
         ]);

         if (metas.length === 0) {
            return null;
         }

         const meta = metas[0];

         // Buscar meses da meta
         const [meses] = await db.query(
            `
         SELECT id, mes_id, nome, valor, status
         FROM meses_meta 
         WHERE meta_id = ?
         ORDER BY mes_id
       `,
            [id]
         );

         // Converter valores para números
         const metaConvertida = {
            ...meta,
            valorMeta: Number(meta.valorMeta) || 0,
            valorPorMes: Number(meta.valorPorMes) || 0,
            mesesNecessarios: Number(meta.mesesNecessarios) || 0,
            valorAtual: Number(meta.valorAtual) || 0,
            meses: meses.map((mes) => ({
               ...mes,
               valor: Number(mes.valor) || 0,
            })),
         };

         return metaConvertida;
      } catch (error) {
         throw new Error(`Erro ao buscar meta: ${error.message}`);
      }
   }

   // Criar nova meta
   static async create(metaData) {
      const connection = await db.getConnection();
      try {
         await connection.beginTransaction();

         // Inserir meta
         const [result] = await connection.query(
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
            ]
         );

         const metaId = result.insertId;

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

         for (let i = 0; i < meses.length; i++) {
            await connection.query(
               `
          INSERT INTO meses_meta (meta_id, mes_id, nome, valor, status)
          VALUES (?, ?, ?, ?, ?)
        `,
               [metaId, i + 1, meses[i], 0, 'Vazio']
            );
         }

         await connection.commit();

         // Retornar a meta criada
         return await this.findById(metaId);
      } catch (error) {
         await connection.rollback();
         throw new Error(`Erro ao criar meta: ${error.message}`);
      } finally {
         connection.release();
      }
   }

   // Atualizar meta
   static async update(id, metaData) {
      try {
         // Construir query dinamicamente baseada nos campos fornecidos
         const fields = [];
         const values = [];

         if (metaData.nome !== undefined) {
            fields.push('nome = ?');
            values.push(metaData.nome);
         }
         if (metaData.valorMeta !== undefined) {
            fields.push('valorMeta = ?');
            values.push(metaData.valorMeta);
         }
         if (metaData.valorPorMes !== undefined) {
            fields.push('valorPorMes = ?');
            values.push(metaData.valorPorMes);
         }
         if (metaData.mesesNecessarios !== undefined) {
            fields.push('mesesNecessarios = ?');
            values.push(metaData.mesesNecessarios);
         }
         if (metaData.valorAtual !== undefined) {
            fields.push('valorAtual = ?');
            values.push(metaData.valorAtual);
         }

         if (fields.length === 0) {
            // Nenhum campo para atualizar
            return await this.findById(id);
         }

         values.push(id); // ID para WHERE

         const query = `
            UPDATE metas 
            SET ${fields.join(', ')}
            WHERE id = ?
         `;

         await db.query(query, values);

         return await this.findById(id);
      } catch (error) {
         throw new Error(`Erro ao atualizar meta: ${error.message}`);
      }
   }

   // Deletar meta
   static async delete(id) {
      try {
         const [result] = await db.query('DELETE FROM metas WHERE id = ?', [
            id,
         ]);
         return result.affectedRows > 0;
      } catch (error) {
         throw new Error(`Erro ao deletar meta: ${error.message}`);
      }
   }

   // Atualizar valor de um mês específico
   static async updateMes(metaId, mesId, valor) {
      try {
         let status = 'Vazio';
         if (valor > 0) {
            // Para determinar se está pago, precisamos comparar com o valor por mês da meta
            const [metaRows] = await db.query(
               'SELECT valorPorMes FROM metas WHERE id = ?',
               [metaId]
            );
            const valorPorMes = Number(metaRows[0]?.valorPorMes) || 0;

            if (valor >= valorPorMes) {
               status = 'Pago';
            } else {
               status = 'Programado';
            }
         }

         await db.query(
            `
        UPDATE meses_meta 
        SET valor = ?, status = ?
        WHERE meta_id = ? AND mes_id = ?
      `,
            [valor, status, metaId, mesId]
         );

         // REMOVIDO: Não atualizar valorAtual automaticamente
         // O valorAtual deve ser um valor separado, não a soma dos meses

         return await this.findById(metaId);
      } catch (error) {
         console.error('Erro detalhado:', error);
         throw new Error(`Erro ao atualizar mês: ${error.message}`);
      }
   }

   // Atualizar status de um mês específico
   static async updateStatusMes(metaId, mesId, status) {
      try {
         await db.query(
            `
        UPDATE meses_meta 
        SET status = ?
        WHERE meta_id = ? AND mes_id = ?
      `,
            [status, metaId, mesId]
         );

         return await this.findById(metaId);
      } catch (error) {
         throw new Error(`Erro ao atualizar status: ${error.message}`);
      }
   }
}

module.exports = Meta;
