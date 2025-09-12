// Rotas de Categorias
const CategoriasController = require('../controllers/categorias.controller');

class CategoriasRoutes {
   static setupRoutes(app) {
      // Listar categorias
      app.get('/categorias', CategoriasController.listar);
      
      // Criar categoria
      app.post('/categorias', CategoriasController.criar);
      
      // Atualizar categoria
      app.put('/categorias/:id', CategoriasController.atualizar);
      
      // Deletar categoria
      app.delete('/categorias/:id', CategoriasController.deletar);
   }
}

module.exports = CategoriasRoutes;
