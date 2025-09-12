// Rotas de Autenticação
const AuthController = require('../controllers/auth.controller');

class AuthRoutes {
   static setupRoutes(app) {
      // Registro de usuário
      app.post('/auth/registrar', AuthController.registrar);
      
      // Login de usuário
      app.post('/auth/login', AuthController.login);
      
      // Perfil do usuário (protegida)
      app.get('/auth/perfil', AuthController.perfil);
   }
}

module.exports = AuthRoutes;
