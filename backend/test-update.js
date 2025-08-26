const mysql = require('mysql2/promise');

async function testUpdates() {
   const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'user_planilha',
      password: 'SenhaPlanilha123!',
      database: 'planilha_organizacao',
   });

   try {
      console.log('🔧 Testando atualizações...');

      // 1. Verificar antes
      const [before] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 3 AND mes_id = 1'
      );
      console.log('Janeiro antes:', before[0]);

      // 2. Testar atualizar valor do mês
      console.log('\n1. Atualizando valor de Janeiro para 200...');
      await connection.execute(
         'UPDATE meses_meta SET valor = ?, status = ? WHERE meta_id = 3 AND mes_id = 1',
         [200, 'Pago']
      );

      // 3. Verificar resultado
      const [after] = await connection.execute(
         'SELECT id, valor, status FROM meses_meta WHERE meta_id = 3 AND mes_id = 1'
      );
      console.log('Janeiro após atualização:', after[0]);

      // 4. Atualizar valorAtual da meta
      const [total] = await connection.execute(
         'SELECT SUM(valor) as total FROM meses_meta WHERE meta_id = 3'
      );
      const valorAtual = Number(total[0].total) || 0;
      console.log('Total da meta:', valorAtual);

      await connection.execute('UPDATE metas SET valorAtual = ? WHERE id = 3', [
         valorAtual,
      ]);

      console.log('✅ Atualizações concluídas!');
   } catch (error) {
      console.error('❌ Erro:', error);
   } finally {
      await connection.end();
   }
}

testUpdates();
