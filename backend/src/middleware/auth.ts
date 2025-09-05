import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface para estender o Request com informações do usuário
export interface AuthRequest extends Request {
   usuario?: {
      id: number;
      email: string;
      nome: string;
   };
}

// Chave secreta para JWT (em produção deve vir de variável de ambiente)
import { config } from '../config/environments';

const JWT_SECRET = config.JWT_SECRET;

// Middleware para verificar token JWT
export const verificarToken = (
   req: AuthRequest,
   res: Response,
   next: NextFunction
) => {
   try {
      // Obter token do header Authorization
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return res.status(401).json({
            error: 'Token de acesso não fornecido',
            message: 'É necessário fornecer um token de acesso válido',
         });
      }

      // Extrair o token (remover "Bearer " do início)
      const token = authHeader.substring(7);

      // Verificar e decodificar o token
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Adicionar informações do usuário ao request
      req.usuario = {
         id: decoded.id,
         email: decoded.email,
         nome: decoded.nome,
      };

      next();
   } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
         return res.status(401).json({
            error: 'Token inválido',
            message: 'O token fornecido não é válido',
         });
      }

      if (error instanceof jwt.TokenExpiredError) {
         return res.status(401).json({
            error: 'Token expirado',
            message: 'O token de acesso expirou',
         });
      }

      return res.status(500).json({
         error: 'Erro na verificação do token',
         message: 'Erro interno do servidor',
      });
   }
};

// Middleware opcional para rotas que podem ou não ter autenticação
export const verificarTokenOpcional = (
   req: AuthRequest,
   res: Response,
   next: NextFunction
) => {
   try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
         const token = authHeader.substring(7);
         const decoded = jwt.verify(token, JWT_SECRET) as any;

         req.usuario = {
            id: decoded.id,
            email: decoded.email,
            nome: decoded.nome,
         };
      }

      next();
   } catch (error) {
      // Se houver erro no token, continuar sem usuário autenticado
      next();
   }
};

// Função para gerar token JWT
export const gerarToken = (usuario: {
   id: number;
   email: string;
   nome: string;
}) => {
   return jwt.sign(
      {
         id: usuario.id,
         email: usuario.email,
         nome: usuario.nome,
      },
      JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
   );
};

// Função para verificar se o usuário tem permissão para acessar um recurso
export const verificarPermissao = (
   req: AuthRequest,
   res: Response,
   next: NextFunction
) => {
   if (!req.usuario) {
      return res.status(401).json({
         error: 'Usuário não autenticado',
         message: 'É necessário estar logado para acessar este recurso',
      });
   }

   next();
};
