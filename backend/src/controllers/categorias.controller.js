// Controller de Categorias
class CategoriasController {
   // Listar categorias do usuário
   static async listar(req, res) {
      try {
         // Mock - em produção seria busca no banco
         const categorias = [
            { id: '1', nome: 'Salário', descricao: 'Receitas de salário' },
            { id: '2', nome: 'Freelance', descricao: 'Trabalhos freelancer' },
            { id: '3', nome: 'Moradia', descricao: 'Gastos com moradia' },
            { id: '4', nome: 'Alimentação', descricao: 'Gastos com comida' },
            { id: '5', nome: 'Transporte', descricao: 'Gastos com transporte' }
         ];

         res.status(200).json(categorias);
      } catch (error) {
         console.error('Erro ao listar categorias:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Criar nova categoria
   static async criar(req, res) {
      try {
         const { nome, descricao } = req.body;

         if (!nome) {
            return res.status(400).json({
               error: 'Nome da categoria é obrigatório'
            });
         }

         // Mock - em produção seria criação no banco
         const categoria = {
            id: Date.now().toString(),
            nome,
            descricao: descricao || ''
         };

         res.status(201).json(categoria);
      } catch (error) {
         console.error('Erro ao criar categoria:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Atualizar categoria
   static async atualizar(req, res) {
      try {
         const { id } = req.params;
         const { nome, descricao } = req.body;

         // Mock - em produção seria atualização no banco
         const categoria = {
            id,
            nome: nome || 'Categoria Atualizada',
            descricao: descricao || ''
         };

         res.status(200).json(categoria);
      } catch (error) {
         console.error('Erro ao atualizar categoria:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Deletar categoria
   static async deletar(req, res) {
      try {
         const { id } = req.params;

         // Mock - em produção seria exclusão no banco
         res.status(200).json({
            message: 'Categoria deletada com sucesso!',
            id
         });
      } catch (error) {
         console.error('Erro ao deletar categoria:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
}

module.exports = CategoriasController;
