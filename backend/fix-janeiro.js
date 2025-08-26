const mysql = require('mysql2/promise');

async function fixJaneiro() {
   const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'user_planilha',
      password: 'SenhaPlanilha123!',
      database: 'planilha_organizacao',
   });

   try {
      console.log('🔧 Corrigindo status de Janeiro...');

      // Verificar antes
      const [before] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 1 AND mes_id = 1'
      );
      console.log('Antes:', before[0]);

      // Fazer o UPDATE
      const [result] = await connection.execute(
         'UPDATE meses_meta SET status = ? WHERE meta_id = 1 AND mes_id = 1',
         ['Programado']
      );

      console.log('Resultado do UPDATE:', result);

      // Verificar depois
      const [after] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 1 AND mes_id = 1'
      );
      console.log('Depois:', after[0]);

      if (result.affectedRows > 0) {
         console.log('✅ Janeiro corrigido!');
      } else {
         console.log('❌ Nenhuma linha foi atualizada');
      }
   } catch (error) {
      console.error('❌ Erro:', error);
   } finally {
      await connection.end();
   }
}

fixJaneiro();
