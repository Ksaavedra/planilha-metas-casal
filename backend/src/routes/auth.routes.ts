import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verificarToken, verificarPermissao } from '../middleware/auth';

const router = Router();

// Rotas públicas (sem autenticação)
router.post('/registrar', AuthController.registrar);
router.post('/login', AuthController.login);

// Rotas protegidas (requerem autenticação)
router.get(
   '/perfil',
   verificarToken,
   verificarPermissao,
   AuthController.obterPerfil
);
router.put(
   '/perfil',
   verificarToken,
   verificarPermissao,
   AuthController.atualizarPerfil
);
router.put(
   '/alterar-senha',
   verificarToken,
   verificarPermissao,
   AuthController.alterarSenha
);
router.delete(
   '/desativar-conta',
   verificarToken,
   verificarPermissao,
   AuthController.desativarConta
);

// Rota para verificar se o token é válido
router.get('/verificar', verificarToken, (req, res) => {
   res.json({
      message: 'Token válido',
      usuario: (req as any).usuario,
   });
});

export default router;
