const mysql = require('mysql2/promise');

async function testPago() {
   const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'user_planilha',
      password: 'SenhaPlanilha123!',
      database: 'planilha_organizacao',
   });

   try {
      console.log('🔧 Testando mudança para Pago...');

      // Verificar antes
      const [before] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 1 AND mes_id = 1'
      );
      console.log('Antes:', before[0]);

      // Mudar para Pago
      await connection.execute(
         'UPDATE meses_meta SET status = ? WHERE meta_id = 1 AND mes_id = 1',
         ['Pago']
      );

      console.log('✅ Status mudado para Pago!');

      // Verificar depois
      const [after] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 1 AND mes_id = 1'
      );
      console.log('Depois:', after[0]);
   } catch (error) {
      console.error('❌ Erro:', error);
   } finally {
      await connection.end();
   }
}

testPago();
