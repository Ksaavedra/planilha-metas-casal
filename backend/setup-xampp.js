const mysql = require('mysql2/promise');

async function setupXAMPPDatabase() {
   // Primeiro, conectar como root para criar o usuário e banco
   const rootConnection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '', // XAMPP MySQL geralmente não tem senha
      port: 3306,
   });

   try {
      console.log('Conectando ao MySQL do XAMPP como root...');

      // 1) Criar o banco de dados
      await rootConnection.execute(`
      CREATE DATABASE IF NOT EXISTS planilha_organizacao
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
    `);
      console.log('✅ Banco de dados criado/verificado');

      // 2) Criar usuário específico só para esse banco
      await rootConnection.execute(`
      CREATE USER IF NOT EXISTS 'user_planilha'@'localhost' IDENTIFIED BY 'SenhaPlanilha123!'
    `);
      console.log('✅ Usuário user_planilha criado');

      // 3) Dar permissão somente no banco planilha_organizacao
      await rootConnection.execute(`
      GRANT ALL PRIVILEGES ON planilha_organizacao.* TO 'user_planilha'@'localhost'
    `);
      console.log('✅ Permissões concedidas');

      // 4) Aplicar as permissões
      await rootConnection.execute('FLUSH PRIVILEGES');
      console.log('✅ Permissões aplicadas');

      await rootConnection.end();

      // Agora conectar com o usuário específico e banco específico
      const userConnection = await mysql.createConnection({
         host: '127.0.0.1',
         user: 'user_planilha',
         password: 'SenhaPlanilha123!',
         database: 'planilha_organizacao',
         charset: 'utf8mb4',
      });

      // 5) Criar tabela de metas
      await userConnection.execute(`
      CREATE TABLE IF NOT EXISTS metas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        valorMeta DECIMAL(15,2) NOT NULL,
        valorPorMes DECIMAL(15,2) NOT NULL,
        mesesNecessarios INT NOT NULL,
        valorAtual DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE = InnoDB
    `);
      console.log('✅ Tabela metas criada');

      // 6) Criar tabela de meses vinculados a cada meta
      await userConnection.execute(`
      CREATE TABLE IF NOT EXISTS meses_meta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meta_id INT NOT NULL,
        mes_id INT NOT NULL,
        nome VARCHAR(50) NOT NULL,
        valor DECIMAL(15,2) DEFAULT 0,
        status ENUM('Vazio', 'Programado', 'Pago') DEFAULT 'Vazio',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_meses_meta_metas
        FOREIGN KEY (meta_id) REFERENCES metas(id) ON DELETE CASCADE
      ) ENGINE = InnoDB
    `);
      console.log('✅ Tabela meses_meta criada');

      // Verificar se já existe meta de exemplo
      const [rows] = await userConnection.execute(
         'SELECT COUNT(*) as count FROM metas WHERE id = 1'
      );

      if (rows[0].count === 0) {
         // Inserir dados de exemplo
         await userConnection.execute(`
       INSERT INTO metas (id, nome, valorMeta, valorPorMes, mesesNecessarios, valorAtual)
       VALUES (1, 'Comprar um carro', 50000.00, 5000.00, 10, 10000.00)
     `);
         console.log('✅ Meta de exemplo inserida');

         // Inserir meses para a meta de exemplo
         const meses = [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro',
         ];

         for (let i = 0; i < meses.length; i++) {
            await userConnection.execute(
               `
         INSERT INTO meses_meta (meta_id, mes_id, nome, valor, status)
         VALUES (1, ?, ?, 0, 'Vazio')
       `,
               [i + 1, meses[i]]
            );
         }
         console.log('✅ Meses inseridos');
      } else {
         console.log('✅ Dados de exemplo já existem');
      }

      console.log('✅ Banco de dados XAMPP configurado com sucesso!');
      console.log('📋 Credenciais de conexão:');
      console.log('   Host: 127.0.0.1');
      console.log('   Usuário: user_planilha');
      console.log('   Senha: SenhaPlanilha123!');
      console.log('   Banco: planilha_organizacao');

      await userConnection.end();
   } catch (error) {
      console.error('❌ Erro ao configurar banco:', error.message);

      if (error.code === 'ECONNREFUSED') {
         console.log('\n💡 Dica: Verifique se o XAMPP está rodando.');
         console.log('   - Abra o XAMPP Control Panel');
         console.log('   - Inicie o MySQL');
         console.log('   - Verifique se a porta 3306 está livre');
      }
   }
}

setupXAMPPDatabase();
