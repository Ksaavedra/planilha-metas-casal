// Controller de Metas
class MetasController {
   // Listar metas do usuário
   static async listar(req, res) {
      try {
         // Mock - em produção seria busca no banco
         const metas = [
            {
               id: '1',
               nome: 'Viagem para Europa',
               valorMeta: 10000,
               valorPorMes: 833.33,
               mesesNecessarios: 12,
               valorAtual: 2500,
               meses: [
                  { id: '1', mes_id: '1', nome: 'Janeiro', valor: 500, status: 'Pago' },
                  { id: '2', mes_id: '2', nome: 'Fevereiro', valor: 500, status: 'Pago' },
                  { id: '3', mes_id: '3', nome: 'Março', valor: 500, status: 'Pago' },
                  { id: '4', mes_id: '4', nome: 'Abril', valor: 500, status: 'Pago' },
                  { id: '5', mes_id: '5', nome: 'Maio', valor: 500, status: 'Pago' },
                  { id: '6', mes_id: '6', nome: 'Junho', valor: 0, status: 'Vazio' }
               ]
            },
            {
               id: '2',
               nome: 'Notebook Gamer',
               valorMeta: 5000,
               valorPorMes: 416.67,
               mesesNecessarios: 12,
               valorAtual: 1250,
               meses: [
                  { id: '7', mes_id: '1', nome: 'Janeiro', valor: 250, status: 'Pago' },
                  { id: '8', mes_id: '2', nome: 'Fevereiro', valor: 250, status: 'Pago' },
                  { id: '9', mes_id: '3', nome: 'Março', valor: 250, status: 'Pago' },
                  { id: '10', mes_id: '4', nome: 'Abril', valor: 250, status: 'Pago' },
                  { id: '11', mes_id: '5', nome: 'Maio', valor: 250, status: 'Pago' },
                  { id: '12', mes_id: '6', nome: 'Junho', valor: 0, status: 'Vazio' }
               ]
            }
         ];

         res.status(200).json(metas);
      } catch (error) {
         console.error('Erro ao listar metas:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Criar nova meta
   static async criar(req, res) {
      try {
         const { nome, valorMeta, valorPorMes } = req.body;

         if (!nome || !valorMeta) {
            return res.status(400).json({
               error: 'Nome e valor da meta são obrigatórios'
            });
         }

         const valorMetaNum = Number(valorMeta);
         const valorPorMesNum = Number(valorPorMes) || valorMetaNum / 12;
         const mesesNecessarios = Math.ceil(valorMetaNum / valorPorMesNum);

         // Mock - em produção seria criação no banco
         const meta = {
            id: Date.now().toString(),
            nome,
            valorMeta: valorMetaNum,
            valorPorMes: valorPorMesNum,
            mesesNecessarios,
            valorAtual: 0,
            meses: []
         };

         res.status(201).json(meta);
      } catch (error) {
         console.error('Erro ao criar meta:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Atualizar meta
   static async atualizar(req, res) {
      try {
         const { id } = req.params;
         const { nome, valorMeta, valorPorMes } = req.body;

         // Mock - em produção seria atualização no banco
         const meta = {
            id,
            nome: nome || 'Meta Atualizada',
            valorMeta: Number(valorMeta) || 1000,
            valorPorMes: Number(valorPorMes) || 100,
            mesesNecessarios: 10,
            valorAtual: 500,
            meses: []
         };

         res.status(200).json(meta);
      } catch (error) {
         console.error('Erro ao atualizar meta:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Deletar meta
   static async deletar(req, res) {
      try {
         const { id } = req.params;

         // Mock - em produção seria exclusão no banco
         res.status(200).json({
            message: 'Meta deletada com sucesso!',
            id
         });
      } catch (error) {
         console.error('Erro ao deletar meta:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
}

module.exports = MetasController;
