// Rotas de Despesas
const DespesasController = require('../controllers/despesas.controller');

class DespesasRoutes {
   static setupRoutes(app) {
      // Listar despesas
      app.get('/despesas', DespesasController.listar);
      
      // Criar despesa
      app.post('/despesas', DespesasController.criar);
      
      // Atualizar despesa
      app.put('/despesas/:id', DespesasController.atualizar);
      
      // Deletar despesa
      app.delete('/despesas/:id', DespesasController.deletar);
   }
}

module.exports = DespesasRoutes;
