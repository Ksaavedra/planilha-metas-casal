// Rotas de Receitas
const ReceitasController = require('../controllers/receitas.controller');

class ReceitasRoutes {
   static setupRoutes(app) {
      // Listar receitas
      app.get('/receitas', ReceitasController.listar);
      
      // Criar receita
      app.post('/receitas', ReceitasController.criar);
      
      // Atualizar receita
      app.put('/receitas/:id', ReceitasController.atualizar);
      
      // Deletar receita
      app.delete('/receitas/:id', ReceitasController.deletar);
   }
}

module.exports = ReceitasRoutes;
