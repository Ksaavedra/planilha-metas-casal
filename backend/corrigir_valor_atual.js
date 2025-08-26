const Meta = require('./models/Meta.js');

async function corrigirValorAtual() {
   try {
      console.log('🔧 Corrigindo valorAtual da meta Casa...');

      // Atualizar o valorAtual para 0
      await Meta.update(5, { valorAtual: 0 });

      // Verificar se foi corrigido
      const meta = await Meta.findById(5);
      console.log('✅ Meta Casa atualizada:');
      console.log(`   Nome: ${meta.nome}`);
      console.log(`   valorAtual: ${meta.valorAtual}`);

      console.log('🎉 ValorAtual corrigido com sucesso!');
   } catch (error) {
      console.error('❌ Erro ao corrigir valorAtual:', error);
   }
}

corrigirValorAtual();
