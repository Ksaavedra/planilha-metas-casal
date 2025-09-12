// Controller de Despesas
class DespesasController {
   // Listar despesas do usuário
   static async listar(req, res) {
      try {
         const { mes_id, categoriaId } = req.query;

         // Mock - em produção seria busca no banco com filtros
         const despesas = [
            {
               id: '1',
               mes_id: '1',
               categoriaId: '3',
               descricao: 'Aluguel',
               valor: 1200,
               status: 'ativa',
               data: '2025-01-01',
               observacao: 'Aluguel do apartamento',
               categoria: { id: '3', nome: 'Moradia' },
               mes: { id: '1', nome: 'Janeiro', numero: 1 }
            },
            {
               id: '2',
               mes_id: '1',
               categoriaId: '4',
               descricao: 'Supermercado',
               valor: 400,
               status: 'ativa',
               data: '2025-01-10',
               observacao: 'Compras do mês',
               categoria: { id: '4', nome: 'Alimentação' },
               mes: { id: '1', nome: 'Janeiro', numero: 1 }
            }
         ];

         res.status(200).json(despesas);
      } catch (error) {
         console.error('Erro ao listar despesas:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Criar nova despesa
   static async criar(req, res) {
      try {
         const { descricao, valor, mes_id, categoriaId, observacao } = req.body;

         if (!descricao || !valor || !mes_id) {
            return res.status(400).json({
               error: 'Descrição, valor e mês são obrigatórios'
            });
         }

         // Mock - em produção seria criação no banco
         const despesa = {
            id: Date.now().toString(),
            mes_id,
            categoriaId: categoriaId || '3',
            descricao,
            valor: Number(valor),
            status: 'ativa',
            data: new Date().toISOString().split('T')[0],
            observacao: observacao || '',
            categoria: { id: categoriaId || '3', nome: 'Moradia' },
            mes: { id: mes_id, nome: 'Janeiro', numero: 1 }
         };

         res.status(201).json(despesa);
      } catch (error) {
         console.error('Erro ao criar despesa:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Atualizar despesa
   static async atualizar(req, res) {
      try {
         const { id } = req.params;
         const { descricao, valor, categoriaId, observacao } = req.body;

         // Mock - em produção seria atualização no banco
         const despesa = {
            id,
            mes_id: '1',
            categoriaId: categoriaId || '3',
            descricao: descricao || 'Despesa Atualizada',
            valor: Number(valor) || 200,
            status: 'ativa',
            data: new Date().toISOString().split('T')[0],
            observacao: observacao || '',
            categoria: { id: categoriaId || '3', nome: 'Moradia' },
            mes: { id: '1', nome: 'Janeiro', numero: 1 }
         };

         res.status(200).json(despesa);
      } catch (error) {
         console.error('Erro ao atualizar despesa:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Deletar despesa
   static async deletar(req, res) {
      try {
         const { id } = req.params;

         // Mock - em produção seria exclusão no banco
         res.status(200).json({
            message: 'Despesa deletada com sucesso!',
            id
         });
      } catch (error) {
         console.error('Erro ao deletar despesa:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
}

module.exports = DespesasController;
