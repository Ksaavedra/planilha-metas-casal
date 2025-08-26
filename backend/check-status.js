const mysql = require('mysql2/promise');

async function checkStatus() {
   const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'user_planilha',
      password: 'SenhaPlanilha123!',
      database: 'planilha_organizacao',
   });

   try {
      console.log('🔍 Verificando estrutura da coluna status...');

      const [columns] = await connection.execute(
         'SHOW COLUMNS FROM meses_meta LIKE "status"'
      );
      console.log('Coluna status:', columns[0]);

      const [janeiro] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 1 AND mes_id = 1'
      );
      console.log('Janeiro:', janeiro[0]);
   } catch (error) {
      console.error('❌ Erro:', error);
   } finally {
      await connection.end();
   }
}

checkStatus();
