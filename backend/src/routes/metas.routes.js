// Rotas de Metas
const MetasController = require('../controllers/metas.controller');

class MetasRoutes {
   static setupRoutes(app) {
      // Listar metas
      app.get('/metas', MetasController.listar);
      
      // Criar meta
      app.post('/metas', MetasController.criar);
      
      // Atualizar meta
      app.put('/metas/:id', MetasController.atualizar);
      
      // Deletar meta
      app.delete('/metas/:id', MetasController.deletar);
   }
}

module.exports = MetasRoutes;
