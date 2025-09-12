// Controller de Autenticação
class AuthController {
   // Registro de usuário
   static async registrar(req, res) {
      try {
         const { nome, email, senha } = req.body;

         if (!nome || !email || !senha) {
            return res.status(400).json({
               error: 'Dados obrigatórios: nome, email, senha',
            });
         }

         // Mock - em produção seria com bcrypt e banco de dados
         const usuario = {
            id: '1',
            nome,
            email,
            senha: '***', // Senha hashada
         };

         const token = 'mock-jwt-token-' + Date.now();

         res.status(201).json({
            message: 'Usuário criado com sucesso!',
            token,
            usuario: {
               id: usuario.id,
               nome: usuario.nome,
               email: usuario.email,
            },
         });
      } catch (error) {
         console.error('Erro ao registrar usuário:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Login de usuário
   static async login(req, res) {
      try {
         const { email, senha } = req.body;

         if (!email || !senha) {
            return res.status(400).json({
               error: 'Email e senha são obrigatórios',
            });
         }

         // Mock - em produção seria verificação real
         const usuario = {
            id: '1',
            nome: 'Usuário Teste',
            email: email,
         };

         const token = 'mock-jwt-token-' + Date.now();

         res.status(200).json({
            message: 'Login realizado com sucesso!',
            token,
            usuario: {
               id: usuario.id,
               nome: usuario.nome,
               email: usuario.email,
            },
         });
      } catch (error) {
         console.error('Erro ao fazer login:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }

   // Obter perfil do usuário
   static async perfil(req, res) {
      try {
         // Mock - em produção seria busca no banco
         const usuario = {
            id: '1',
            nome: 'Usuário Teste',
            email: 'teste@exemplo.com',
            createdAt: new Date().toISOString(),
         };

         res.status(200).json(usuario);
      } catch (error) {
         console.error('Erro ao buscar perfil:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
}

module.exports = AuthController;
