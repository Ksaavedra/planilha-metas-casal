// Rotas de Meses
const MesesController = require('../controllers/meses.controller');

class MesesRoutes {
   static setupRoutes(app) {
      // Listar meses
      app.get('/meses', MesesController.listar);
      
      // Obter mês por ID
      app.get('/meses/:id', MesesController.obterPorId);
   }
}

module.exports = MesesRoutes;
