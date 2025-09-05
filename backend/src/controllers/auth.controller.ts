import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { gerarToken } from '../middleware/auth';

const prisma = new PrismaClient();

// Interface para dados de registro
interface RegistroRequest {
   nome: string;
   email: string;
   senha: string;
}

// Interface para dados de login
interface LoginRequest {
   email: string;
   senha: string;
}

// Interface para dados de atualização de perfil
interface AtualizarPerfilRequest {
   nome?: string;
   email?: string;
   senha?: string;
}

export class AuthController {
   // Registrar novo usuário
   static async registrar(req: Request, res: Response) {
      try {
         const { nome, email, senha }: RegistroRequest = req.body;

         // Validações básicas
         if (!nome || !email || !senha) {
            return res.status(400).json({
               error: 'Dados incompletos',
               message: 'Nome, email e senha são obrigatórios',
            });
         }

         if (senha.length < 6) {
            return res.status(400).json({
               error: 'Senha muito curta',
               message: 'A senha deve ter pelo menos 6 caracteres',
            });
         }

         // Verificar se o email já existe
         const usuarioExistente = await prisma.usuario.findUnique({
            where: { email: email.toLowerCase() },
         });

         if (usuarioExistente) {
            return res.status(409).json({
               error: 'Email já cadastrado',
               message: 'Este email já está sendo usado por outro usuário',
            });
         }

         // Criptografar senha
         const saltRounds = 12;
         const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

         // Criar usuário
         const novoUsuario = await prisma.usuario.create({
            data: {
               nome: nome.trim(),
               email: email.toLowerCase().trim(),
               senha: senhaCriptografada,
            },
            select: {
               id: true,
               nome: true,
               email: true,
               ativo: true,
               createdAt: true,
            },
         });

         // Gerar token JWT
         const token = gerarToken({
            id: novoUsuario.id,
            email: novoUsuario.email,
            nome: novoUsuario.nome,
         });

         // Criar dados iniciais para o usuário
         await prisma.$transaction(async (tx) => {
            // Criar meses padrão
            const meses = [
               { nome: 'Janeiro', numero: 1 },
               { nome: 'Fevereiro', numero: 2 },
               { nome: 'Março', numero: 3 },
               { nome: 'Abril', numero: 4 },
               { nome: 'Maio', numero: 5 },
               { nome: 'Junho', numero: 6 },
               { nome: 'Julho', numero: 7 },
               { nome: 'Agosto', numero: 8 },
               { nome: 'Setembro', numero: 9 },
               { nome: 'Outubro', numero: 10 },
               { nome: 'Novembro', numero: 11 },
               { nome: 'Dezembro', numero: 12 },
            ];

            for (const mes of meses) {
               const mesExistente = await tx.meses.findFirst({
                  where: { numero: mes.numero },
               });

               if (!mesExistente) {
                  await tx.meses.create({
                     data: mes as any,
                  });
               }
            }

            // Criar categorias padrão
            const categorias = [
               // Categorias de despesas
               {
                  nome: 'Alimentação',
                  tipo: 'despesa',
                  descricao: 'Gastos com comida e bebida',
               },
               {
                  nome: 'Transporte',
                  tipo: 'despesa',
                  descricao: 'Combustível, passagens, Uber',
               },
               {
                  nome: 'Moradia',
                  tipo: 'despesa',
                  descricao: 'Aluguel, contas, manutenção',
               },
               {
                  nome: 'Saúde',
                  tipo: 'despesa',
                  descricao: 'Médicos, medicamentos, plano de saúde',
               },
               {
                  nome: 'Educação',
                  tipo: 'despesa',
                  descricao: 'Cursos, livros, material escolar',
               },
               {
                  nome: 'Lazer',
                  tipo: 'despesa',
                  descricao: 'Entretenimento, hobbies, viagens',
               },
               {
                  nome: 'Vestuário',
                  tipo: 'despesa',
                  descricao: 'Roupas, calçados, acessórios',
               },
               {
                  nome: 'Outros',
                  tipo: 'despesa',
                  descricao: 'Gastos diversos',
               },

               // Categorias de receitas
               {
                  nome: 'Salário',
                  tipo: 'receita',
                  descricao: 'Renda principal do trabalho',
               },
               {
                  nome: 'Freelance',
                  tipo: 'receita',
                  descricao: 'Trabalhos extras',
               },
               {
                  nome: 'Investimentos',
                  tipo: 'receita',
                  descricao: 'Rendimentos de aplicações',
               },
               {
                  nome: 'Aluguel',
                  tipo: 'receita',
                  descricao: 'Renda de imóveis',
               },
               {
                  nome: 'Vendas',
                  tipo: 'receita',
                  descricao: 'Venda de produtos ou serviços',
               },
               {
                  nome: 'Outros',
                  tipo: 'receita',
                  descricao: 'Outras fontes de renda',
               },
            ];

            for (const categoria of categorias) {
               await tx.categoria.create({
                  data: {
                     ...categoria,
                     usuarioId: novoUsuario.id,
                  },
               });
            }
         });

         res.status(201).json({
            message: 'Usuário criado com sucesso',
            usuario: novoUsuario,
            token,
            expiresIn: '7d',
         });
      } catch (error) {
         console.error('Erro ao registrar usuário:', error);
         res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível criar o usuário',
         });
      }
   }

   // Fazer login
   static async login(req: Request, res: Response) {
      try {
         const { email, senha }: LoginRequest = req.body;

         // Validações básicas
         if (!email || !senha) {
            return res.status(400).json({
               error: 'Dados incompletos',
               message: 'Email e senha são obrigatórios',
            });
         }

         // Buscar usuário pelo email
         const usuario = await prisma.usuario.findUnique({
            where: { email: email.toLowerCase().trim() },
         });

         if (!usuario) {
            return res.status(401).json({
               error: 'Credenciais inválidas',
               message: 'Email ou senha incorretos',
            });
         }

         if (!usuario.ativo) {
            return res.status(401).json({
               error: 'Conta desativada',
               message:
                  'Sua conta foi desativada. Entre em contato com o suporte.',
            });
         }

         // Verificar senha
         const senhaValida = await bcrypt.compare(senha, usuario.senha);

         if (!senhaValida) {
            return res.status(401).json({
               error: 'Credenciais inválidas',
               message: 'Email ou senha incorretos',
            });
         }

         // Gerar token JWT
         const token = gerarToken({
            id: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
         });

         res.json({
            message: 'Login realizado com sucesso',
            usuario: {
               id: usuario.id,
               nome: usuario.nome,
               email: usuario.email,
               ativo: usuario.ativo,
            },
            token,
            expiresIn: '7d',
         });
      } catch (error) {
         console.error('Erro ao fazer login:', error);
         res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível realizar o login',
         });
      }
   }

   // Obter perfil do usuário
   static async obterPerfil(req: Request, res: Response) {
      try {
         const usuarioId = (req as any).usuario?.id;

         if (!usuarioId) {
            return res.status(401).json({
               error: 'Usuário não autenticado',
               message: 'É necessário estar logado para acessar o perfil',
            });
         }

         const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: {
               id: true,
               nome: true,
               email: true,
               ativo: true,
               createdAt: true,
               updatedAt: true,
            },
         });

         if (!usuario) {
            return res.status(404).json({
               error: 'Usuário não encontrado',
               message: 'Usuário não foi encontrado no sistema',
            });
         }

         res.json({
            usuario,
         });
      } catch (error) {
         console.error('Erro ao obter perfil:', error);
         res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível obter o perfil',
         });
      }
   }

   // Atualizar perfil do usuário
   static async atualizarPerfil(req: Request, res: Response) {
      try {
         const usuarioId = (req as any).usuario?.id;
         const { nome, email, senha }: AtualizarPerfilRequest = req.body;

         if (!usuarioId) {
            return res.status(401).json({
               error: 'Usuário não autenticado',
               message: 'É necessário estar logado para atualizar o perfil',
            });
         }

         // Verificar se o usuário existe
         const usuarioExistente = await prisma.usuario.findUnique({
            where: { id: usuarioId },
         });

         if (!usuarioExistente) {
            return res.status(404).json({
               error: 'Usuário não encontrado',
               message: 'Usuário não foi encontrado no sistema',
            });
         }

         // Preparar dados para atualização
         const dadosAtualizacao: any = {};

         if (nome && nome.trim() !== '') {
            dadosAtualizacao.nome = nome.trim();
         }

         if (email && email.trim() !== '') {
            // Verificar se o novo email já está sendo usado por outro usuário
            if (email.toLowerCase() !== usuarioExistente.email) {
               const emailEmUso = await prisma.usuario.findUnique({
                  where: { email: email.toLowerCase().trim() },
               });

               if (emailEmUso) {
                  return res.status(409).json({
                     error: 'Email já cadastrado',
                     message:
                        'Este email já está sendo usado por outro usuário',
                  });
               }

               dadosAtualizacao.email = email.toLowerCase().trim();
            }
         }

         if (senha && senha.length >= 6) {
            const saltRounds = 12;
            dadosAtualizacao.senha = await bcrypt.hash(senha, saltRounds);
         }

         // Se não há dados para atualizar
         if (Object.keys(dadosAtualizacao).length === 0) {
            return res.status(400).json({
               error: 'Nenhum dado para atualizar',
               message: 'Forneça pelo menos um campo para atualização',
            });
         }

         // Atualizar usuário
         const usuarioAtualizado = await prisma.usuario.update({
            where: { id: usuarioId },
            data: dadosAtualizacao,
            select: {
               id: true,
               nome: true,
               email: true,
               ativo: true,
               updatedAt: true,
            },
         });

         res.json({
            message: 'Perfil atualizado com sucesso',
            usuario: usuarioAtualizado,
         });
      } catch (error) {
         console.error('Erro ao atualizar perfil:', error);
         res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível atualizar o perfil',
         });
      }
   }

   // Alterar senha
   static async alterarSenha(req: Request, res: Response) {
      try {
         const usuarioId = (req as any).usuario?.id;
         const { senhaAtual, novaSenha } = req.body;

         if (!usuarioId) {
            return res.status(401).json({
               error: 'Usuário não autenticado',
               message: 'É necessário estar logado para alterar a senha',
            });
         }

         if (!senhaAtual || !novaSenha) {
            return res.status(400).json({
               error: 'Dados incompletos',
               message: 'Senha atual e nova senha são obrigatórias',
            });
         }

         if (novaSenha.length < 6) {
            return res.status(400).json({
               error: 'Nova senha muito curta',
               message: 'A nova senha deve ter pelo menos 6 caracteres',
            });
         }

         // Buscar usuário com senha
         const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
         });

         if (!usuario) {
            return res.status(404).json({
               error: 'Usuário não encontrado',
               message: 'Usuário não foi encontrado no sistema',
            });
         }

         // Verificar senha atual
         const senhaAtualValida = await bcrypt.compare(
            senhaAtual,
            usuario.senha
         );

         if (!senhaAtualValida) {
            return res.status(401).json({
               error: 'Senha atual incorreta',
               message: 'A senha atual fornecida está incorreta',
            });
         }

         // Criptografar nova senha
         const saltRounds = 12;
         const novaSenhaCriptografada = await bcrypt.hash(
            novaSenha,
            saltRounds
         );

         // Atualizar senha
         await prisma.usuario.update({
            where: { id: usuarioId },
            data: { senha: novaSenhaCriptografada },
         });

         res.json({
            message: 'Senha alterada com sucesso',
         });
      } catch (error) {
         console.error('Erro ao alterar senha:', error);
         res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível alterar a senha',
         });
      }
   }

   // Desativar conta
   static async desativarConta(req: Request, res: Response) {
      try {
         const usuarioId = (req as any).usuario?.id;
         const { senha } = req.body;

         if (!usuarioId) {
            return res.status(401).json({
               error: 'Usuário não autenticado',
               message: 'É necessário estar logado para desativar a conta',
            });
         }

         if (!senha) {
            return res.status(400).json({
               error: 'Senha obrigatória',
               message:
                  'É necessário fornecer a senha para confirmar a desativação',
            });
         }

         // Buscar usuário com senha
         const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
         });

         if (!usuario) {
            return res.status(404).json({
               error: 'Usuário não encontrado',
               message: 'Usuário não foi encontrado no sistema',
            });
         }

         // Verificar senha
         const senhaValida = await bcrypt.compare(senha, usuario.senha);

         if (!senhaValida) {
            return res.status(401).json({
               error: 'Senha incorreta',
               message: 'A senha fornecida está incorreta',
            });
         }

         // Desativar usuário
         await prisma.usuario.update({
            where: { id: usuarioId },
            data: { ativo: false },
         });

         res.json({
            message: 'Conta desativada com sucesso',
         });
      } catch (error) {
         console.error('Erro ao desativar conta:', error);
         res.status(500).json({
            error: 'Erro interno do servidor',
            message: 'Não foi possível desativar a conta',
         });
      }
   }
}
