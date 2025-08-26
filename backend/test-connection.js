const mysql = require('mysql2/promise');

async function testConnection() {
   try {
      console.log('🔍 Testando conexão com MySQL...');

      const connection = await mysql.createConnection({
         host: '127.0.0.1',
         user: 'user_planilha',
         password: 'SenhaPlanilha123!',
         database: 'planilha_organizacao',
         charset: 'utf8mb4',
      });

      console.log('✅ Conexão estabelecida com sucesso!');

      // Testar uma query simples
      const [rows] = await connection.execute('SELECT 1 as test');
      console.log('✅ Query de teste executada:', rows[0]);

      // Verificar se as tabelas existem
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(
         '📋 Tabelas encontradas:',
         tables.map((t) => Object.values(t)[0])
      );

      await connection.end();
      console.log('✅ Conexão fechada');
   } catch (error) {
      console.error('❌ Erro na conexão:', error.message);

      if (error.code === 'ECONNREFUSED') {
         console.log('\n💡 O MySQL não está rodando. Por favor:');
         console.log('   1. Abra o XAMPP Control Panel');
         console.log('   2. Clique em "Start" no MySQL');
         console.log('   3. Aguarde o status ficar verde');
         console.log('   4. Execute este script novamente');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
         console.log('\n💡 Erro de acesso. Verifique:');
         console.log('   - Se o usuário user_planilha existe');
         console.log('   - Se a senha está correta');
         console.log('   - Execute npm run setup-xampp primeiro');
      } else if (error.code === 'ER_BAD_DB_ERROR') {
         console.log('\n💡 Banco de dados não existe. Execute:');
         console.log('   npm run setup-xampp');
      }
   }
}

testConnection();
