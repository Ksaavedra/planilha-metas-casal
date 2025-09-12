// Controller de Meses
class MesesController {
   // Listar todos os meses
   static async listar(req, res) {
      try {
         // Mock - em produção seria busca no banco
         const meses = [
            { id: '1', nome: 'Janeiro', numero: 1 },
            { id: '2', nome: 'Fevereiro', numero: 2 },
            { id: '3', nome: 'Março', numero: 3 },
            { id: '4', nome: 'Abril', numero: 4 },
            { id: '5', nome: 'Maio', numero: 5 },
            { id: '6', nome: 'Junho', numero: 6 },
            { id: '7', nome: 'Julho', numero: 7 },
            { id: '8', nome: 'Agosto', numero: 8 },
            { id: '9', nome: 'Setembro', numero: 9 },
            { id: '10', nome: 'Outubro', numero: 10 },
            { id: '11', nome: 'Novembro', numero: 11 },
            { id: '12', nome: 'Dezembro', numero: 12 }
         ];

         res.status(200).json(meses);
      } catch (error) {
         console.error('Erro ao listar meses:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Obter mês por ID
   static async obterPorId(req, res) {
      try {
         const { id } = req.params;

         // Mock - em produção seria busca no banco
         const meses = [
            { id: '1', nome: 'Janeiro', numero: 1 },
            { id: '2', nome: 'Fevereiro', numero: 2 },
            { id: '3', nome: 'Março', numero: 3 },
            { id: '4', nome: 'Abril', numero: 4 },
            { id: '5', nome: 'Maio', numero: 5 },
            { id: '6', nome: 'Junho', numero: 6 },
            { id: '7', nome: 'Julho', numero: 7 },
            { id: '8', nome: 'Agosto', numero: 8 },
            { id: '9', nome: 'Setembro', numero: 9 },
            { id: '10', nome: 'Outubro', numero: 10 },
            { id: '11', nome: 'Novembro', numero: 11 },
            { id: '12', nome: 'Dezembro', numero: 12 }
         ];

         const mes = meses.find(m => m.id === id);

         if (!mes) {
            return res.status(404).json({
               error: 'Mês não encontrado'
            });
         }

         res.status(200).json(mes);
      } catch (error) {
         console.error('Erro ao buscar mês:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
}

module.exports = MesesController;
