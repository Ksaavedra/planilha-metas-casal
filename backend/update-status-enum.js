const mysql = require('mysql2/promise');

async function updateStatusEnum() {
   try {
      console.log('🔄 Atualizando ENUM de status...');

      const connection = await mysql.createConnection({
         host: '127.0.0.1',
         user: 'user_planilha',
         password: 'SenhaPlanilha123!',
         database: 'planilha_organizacao',
         charset: 'utf8mb4',
      });

      // Atualizar o ENUM da coluna status
      await connection.execute(`
      ALTER TABLE meses_meta 
      MODIFY COLUMN status ENUM('Vazio', 'Programado', 'Pago') DEFAULT 'Vazio'
    `);

      console.log('✅ ENUM de status atualizado com sucesso!');

      // Atualizar registros existentes
      await connection.execute(`
      UPDATE meses_meta 
      SET status = 'Pago' 
      WHERE status = 'Completo'
    `);

      await connection.execute(`
      UPDATE meses_meta 
      SET status = 'Programado' 
      WHERE status = 'Parcial'
    `);

      console.log('✅ Registros existentes atualizados!');

      await connection.end();
      console.log('✅ Conexão fechada');
   } catch (error) {
      console.error('❌ Erro ao atualizar ENUM:', error.message);

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

updateStatusEnum();
