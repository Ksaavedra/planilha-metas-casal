// Controller de Receitas
class ReceitasController {
   // Listar receitas do usuário
   static async listar(req, res) {
      try {
         const { mes_id, categoriaId, tipo } = req.query;

         // Mock - em produção seria busca no banco com filtros
         const receitas = [
            {
               id: '1',
               mes_id: '1',
               categoriaId: '1',
               descricao: 'Salário',
               valor: 5000,
               status: 'ativa',
               tipo: 'receita',
               data: '2025-01-01',
               observacao: 'Salário mensal',
               categoria: { id: '1', nome: 'Salário' },
               mes: { id: '1', nome: 'Janeiro', numero: 1 }
            },
            {
               id: '2',
               mes_id: '1',
               categoriaId: '2',
               descricao: 'Freelance',
               valor: 1500,
               status: 'ativa',
               tipo: 'receita',
               data: '2025-01-15',
               observacao: 'Projeto web',
               categoria: { id: '2', nome: 'Freelance' },
               mes: { id: '1', nome: 'Janeiro', numero: 1 }
            }
         ];

         res.status(200).json(receitas);
      } catch (error) {
         console.error('Erro ao listar receitas:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Criar nova receita
   static async criar(req, res) {
      try {
         const { descricao, valor, mes_id, categoriaId, tipo, observacao } = req.body;

         if (!descricao || !valor || !mes_id) {
            return res.status(400).json({
               error: 'Descrição, valor e mês são obrigatórios'
            });
         }

         // Mock - em produção seria criação no banco
         const receita = {
            id: Date.now().toString(),
            mes_id,
            categoriaId: categoriaId || '1',
            descricao,
            valor: Number(valor),
            status: 'ativa',
            tipo: tipo || 'receita',
            data: new Date().toISOString().split('T')[0],
            observacao: observacao || '',
            categoria: { id: categoriaId || '1', nome: 'Salário' },
            mes: { id: mes_id, nome: 'Janeiro', numero: 1 }
         };

         res.status(201).json(receita);
      } catch (error) {
         console.error('Erro ao criar receita:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Atualizar receita
   static async atualizar(req, res) {
      try {
         const { id } = req.params;
         const { descricao, valor, categoriaId, observacao } = req.body;

         // Mock - em produção seria atualização no banco
         const receita = {
            id,
            mes_id: '1',
            categoriaId: categoriaId || '1',
            descricao: descricao || 'Receita Atualizada',
            valor: Number(valor) || 1000,
            status: 'ativa',
            tipo: 'receita',
            data: new Date().toISOString().split('T')[0],
            observacao: observacao || '',
            categoria: { id: categoriaId || '1', nome: 'Salário' },
            mes: { id: '1', nome: 'Janeiro', numero: 1 }
         };

         res.status(200).json(receita);
      } catch (error) {
         console.error('Erro ao atualizar receita:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Deletar receita
   static async deletar(req, res) {
      try {
         const { id } = req.params;

         // Mock - em produção seria exclusão no banco
         res.status(200).json({
            message: 'Receita deletada com sucesso!',
            id
         });
      } catch (error) {
         console.error('Erro ao deletar receita:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
}

module.exports = ReceitasController;
