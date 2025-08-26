const mysql = require('mysql2/promise');

async function fixStatus() {
   const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'user_planilha',
      password: 'SenhaPlanilha123!',
      database: 'planilha_organizacao',
      charset: 'utf8mb4',
   });

   try {
      console.log('🔧 Corrigindo status dos meses...');

      // Buscar todas as metas
      const [metas] = await connection.execute(
         'SELECT id, valorPorMes FROM metas'
      );

      for (const meta of metas) {
         console.log(
            `📋 Meta ID ${meta.id}: valorPorMes = ${meta.valorPorMes}`
         );

         // Buscar meses desta meta
         const [meses] = await connection.execute(
            'SELECT id, valor, status FROM meses_meta WHERE meta_id = ?',
            [meta.id]
         );

         for (const mes of meses) {
            let novoStatus = 'Vazio';

            if (mes.valor > 0) {
               if (mes.valor >= meta.valorPorMes) {
                  novoStatus = 'Pago';
               } else {
                  novoStatus = 'Programado';
               }
            }

            if (mes.status !== novoStatus) {
               console.log(
                  `  📅 Mês ${mes.id}: valor=${mes.valor}, status=${mes.status} → ${novoStatus}`
               );
               await connection.execute(
                  'UPDATE meses_meta SET status = ? WHERE id = ?',
                  [novoStatus, mes.id]
               );
            }
         }
      }

      console.log('✅ Status corrigido com sucesso!');
   } catch (error) {
      console.error('❌ Erro:', error);
   } finally {
      await connection.end();
   }
}

fixStatus();
