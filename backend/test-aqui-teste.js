const mysql = require('mysql2/promise');

async function testAquiTeste() {
   const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'user_planilha',
      password: 'SenhaPlanilha123!',
      database: 'planilha_organizacao',
   });

   try {
      console.log('🔧 Testando meta "aqui teste"...');

      // Verificar antes
      const [before] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 3 AND mes_id = 1'
      );
      console.log('Janeiro antes:', before[0]);

      // Mudar valor para 100
      await connection.execute(
         'UPDATE meses_meta SET valor = ?, status = ? WHERE meta_id = 3 AND mes_id = 1',
         [100, 'Programado']
      );

      console.log('✅ Valor mudado para 100!');

      // Verificar depois
      const [after] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 3 AND mes_id = 1'
      );
      console.log('Janeiro depois:', after[0]);
   } catch (error) {
      console.error('❌ Erro:', error);
   } finally {
      await connection.end();
   }
}

testAquiTeste();
