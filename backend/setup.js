const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
   let connection;

   try {
      console.log('Conectando ao MySQL...');

      // Primeiro, conectar sem especificar o banco
      connection = await mysql.createConnection({
         host: 'localhost',
         user: 'root',
         password: '12345',
         port: 3306,
      });

      console.log('✅ Conectado ao MySQL com sucesso!');

      // Criar banco de dados se não existir
      await connection.execute(
         'CREATE DATABASE IF NOT EXISTS planilha_organizacao'
      );
      console.log('✅ Banco de dados criado/verificado');

      // Usar o banco
      await connection.execute('USE planilha_organizacao');

      // Criar tabela metas
      await connection.execute(`
      CREATE TABLE IF NOT EXISTS metas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        valorMeta DECIMAL(15,2) NOT NULL,
        valorPorMes DECIMAL(15,2) NOT NULL,
        mesesNecessarios INT NOT NULL,
        valorAtual DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
      console.log('✅ Tabela metas criada');

      // Criar tabela meses_meta
      await connection.execute(`
      CREATE TABLE IF NOT EXISTS meses_meta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meta_id INT NOT NULL,
        mes_id INT NOT NULL,
        nome VARCHAR(50) NOT NULL,
        valor DECIMAL(15,2) DEFAULT 0,
        status ENUM('Vazio', 'Parcial', 'Completo') DEFAULT 'Vazio',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE CASCADE
      )
    `);
      console.log('✅ Tabela meses_meta criada');

      console.log('✅ Banco de dados configurado com sucesso!');
   } catch (error) {
      console.error('❌ Erro ao configurar banco:', error.message);

      if (error.code === 'ECONNREFUSED') {
         console.log('\n💡 Dica: Verifique se o MySQL está rodando.');
         console.log('   - Instale o MySQL se ainda não tiver instalado');
         console.log('   - Inicie o serviço MySQL');
         console.log('   - Verifique se a senha está correta');
      }
   } finally {
      if (connection) {
         await connection.end();
      }
   }
}

setupDatabase();
