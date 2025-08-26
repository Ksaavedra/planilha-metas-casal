const mysql = require('mysql2/promise');

async function testCasa() {
   const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'user_planilha',
      password: 'SenhaPlanilha123!',
      database: 'planilha_organizacao',
   });

   try {
      console.log('🏠 Testando meta "Casa"...');

      // Verificar antes
      const [before] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 5 AND mes_id IN (1, 2)'
      );
      console.log('Janeiro e Fevereiro antes:', before);

      // Mudar Janeiro para 3000
      await connection.execute(
         'UPDATE meses_meta SET valor = ?, status = ? WHERE meta_id = 5 AND mes_id = 1',
         [3000, 'Pago']
      );

      // Mudar Fevereiro para 3000
      await connection.execute(
         'UPDATE meses_meta SET valor = ?, status = ? WHERE meta_id = 5 AND mes_id = 2',
         [3000, 'Pago']
      );

      console.log('✅ Valores mudados para 3000!');

      // Verificar depois
      const [after] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 5 AND mes_id IN (1, 2)'
      );
      console.log('Janeiro e Fevereiro depois:', after);
   } catch (error) {
      console.error('❌ Erro:', error);
   } finally {
      await connection.end();
   }
}

testCasa();
