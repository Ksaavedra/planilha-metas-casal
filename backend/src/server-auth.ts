import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes';
import {
   verificarToken,
   verificarPermissao,
   AuthRequest,
} from './middleware/auth';
import { config } from './config/environments';

const app = express();
const PORT = config.PORT;
const prisma = new PrismaClient();

// Configurações de segurança baseadas no ambiente
if (config.ENABLE_HELMET) {
   app.use(helmet());
}

// CORS com allowlist
const allowlist = [
   config.CORS_ORIGIN,
   'http://localhost:5173',
   'http://localhost:3000',
];
app.use(
   cors({
      origin: (origin, cb) => {
         if (!origin || allowlist.includes(origin)) return cb(null, true);
         cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
   })
);

// Rate limiting
if (config.ENABLE_RATE_LIMIT) {
   app.use(
      rateLimit({
         windowMs: config.RATE_LIMIT_WINDOW_MS,
         max: config.RATE_LIMIT_MAX_REQUESTS,
         message: 'Muitas requisições deste IP, tente novamente mais tarde.',
         standardHeaders: true,
         legacyHeaders: false,
      })
   );
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/auth', authRoutes);

function toNum(v: any) {
   return v && typeof v.toNumber === 'function' ? v.toNumber() : Number(v ?? 0);
}

app.get('/health', async (_req, res) => {
   try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
         status: 'ok',
         database: 'mysql',
         timestamp: new Date().toISOString(),
         message: 'API funcionando perfeitamente com autenticação!',
      });
   } catch (error) {
      res.status(500).json({
         status: 'error',
         database: 'mysql',
         error: 'Erro na conexão com o banco de dados',
      });
   }
});

app.get(
   '/metas',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const metas = await prisma.meta.findMany({
            where: { usuarioId },
            include: { meses: { include: { mes: true } } },
            orderBy: { id: 'asc' },
         });

         const metasFormatadas = metas.map((m: any) => ({
            id: m.id,
            nome: m.nome,
            valorMeta: toNum(m.valorMeta),
            valorPorMes: toNum(m.valorPorMes),
            mesesNecessarios: Number(m.mesesNecessarios ?? 0),
            valorAtual: toNum(m.valorAtual),
            meses: m.meses.map((x: any) => ({
               id: x.id,
               mes_id: x.mes_id,
               nome: x.mes.nome,
               valor: toNum(x.valor),
               status: x.status,
            })),
         }));

         res.json(metasFormatadas);
      } catch (error) {
         console.error('Erro ao buscar metas:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.post(
   '/metas',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const {
            nome,
            valorMeta = 0,
            valorPorMes = 0,
            mesesNecessarios = 0,
            valorAtual = 0,
         } = req.body;

         if (!nome || nome.trim() === '') {
            return res
               .status(400)
               .json({ error: 'Nome da meta é obrigatório' });
         }

         const meta = await prisma.meta.create({
            data: {
               nome: nome.trim(),
               valorMeta: Number(valorMeta),
               valorPorMes: Number(valorPorMes),
               mesesNecessarios: Number(mesesNecessarios),
               valorAtual: Number(valorAtual),
               usuarioId,
            },
         });

         const mesesPadrao = [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro',
         ];

         const mesesMeta = [];
         for (let i = 0; i < mesesPadrao.length; i++) {
            const nomeMes = mesesPadrao[i];
            const numeroMes = i + 1;

            let mes = await prisma.meses.findFirst({
               where: { numero: numeroMes },
            });
            if (!mes) {
               mes = await prisma.meses.create({
                  data: { nome: nomeMes, numero: numeroMes } as any,
               });
            }

            const mesMeta = await prisma.mesesMeta.create({
               data: {
                  metaId: meta.id,
                  mes_id: mes.id,
                  valor: 0,
                  status: 'Vazio',
               },
            });

            mesesMeta.push({
               id: mesMeta.id,
               mes_id: mesMeta.mes_id,
               nome: nomeMes,
               valor: 0,
               status: 'Vazio',
            });
         }

         const metaCompleta = {
            id: meta.id,
            nome: meta.nome,
            valorMeta: toNum(meta.valorMeta),
            valorPorMes: toNum(meta.valorPorMes),
            mesesNecessarios: Number(meta.mesesNecessarios ?? 0),
            valorAtual: toNum(meta.valorAtual),
            meses: mesesMeta,
         };

         res.status(201).json(metaCompleta);
      } catch (error) {
         console.error('Erro ao criar meta:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.get(
   '/categorias',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { tipo } = req.query;

         const where: any = { usuarioId };
         if (tipo) where.tipo = tipo;

         const categorias = await prisma.categoria.findMany({
            where,
            orderBy: { nome: 'asc' },
         });

         res.json(categorias);
      } catch (error) {
         console.error('Erro ao buscar categorias:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.post(
   '/categorias',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { nome, tipo, descricao } = req.body;

         if (!nome || !tipo) {
            return res
               .status(400)
               .json({ error: 'Nome e tipo são obrigatórios' });
         }

         const categoriaExistente = await prisma.categoria.findFirst({
            where: { nome: nome.trim(), usuarioId },
         });

         if (categoriaExistente) {
            return res
               .status(409)
               .json({ error: 'Categoria com este nome já existe' });
         }

         const categoria = await prisma.categoria.create({
            data: {
               nome: nome.trim(),
               tipo: tipo.trim(),
               descricao: descricao?.trim(),
               usuarioId,
            },
         });

         res.status(201).json(categoria);
      } catch (error) {
         console.error('Erro ao criar categoria:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

// ===== ROTAS DE RECEITAS =====
app.get(
   '/receitas',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { mes_id, categoriaId, tipo } = req.query;

         const where: any = { usuarioId };
         if (mes_id) where.mes_id = Number(mes_id);
         if (categoriaId) where.categoriaId = Number(categoriaId);
         if (tipo) where.tipo = tipo;

         const receitas = await prisma.receita.findMany({
            where,
            include: {
               categoria: true,
               mes: true,
            },
            orderBy: { createdAt: 'desc' },
         });

         const receitasFormatadas = receitas.map((r: any) => ({
            id: r.id,
            mes_id: r.mes_id,
            categoriaId: r.categoriaId,
            descricao: r.descricao,
            valor: toNum(r.valor),
            status: r.status,
            tipo: r.tipo,
            data: r.data,
            observacao: r.observacao,
            categoria: r.categoria,
            mes: r.mes,
         }));

         res.json(receitasFormatadas);
      } catch (error) {
         console.error('Erro ao buscar receitas:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.post(
   '/receitas',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const {
            mes_id,
            categoriaId,
            descricao,
            valor,
            status = 'Vazio',
            tipo = 'Ativa',
            data,
            observacao,
         } = req.body;

         if (!mes_id || !categoriaId || !descricao || valor === undefined) {
            return res.status(400).json({
               error: 'mes_id, categoriaId, descricao e valor são obrigatórios',
            });
         }

         const receita = await prisma.receita.create({
            data: {
               mes_id: Number(mes_id),
               categoriaId: Number(categoriaId),
               descricao: descricao.trim(),
               valor: Number(valor),
               status,
               tipo,
               data: data ? new Date(data) : null,
               observacao: observacao?.trim(),
               usuarioId,
            },
            include: {
               categoria: true,
               mes: true,
            },
         });

         res.status(201).json({
            id: receita.id,
            mes_id: receita.mes_id,
            categoriaId: receita.categoriaId,
            descricao: receita.descricao,
            valor: toNum(receita.valor),
            status: receita.status,
            tipo: receita.tipo,
            data: receita.data,
            observacao: receita.observacao,
            categoria: receita.categoria,
            mes: receita.mes,
         });
      } catch (error) {
         console.error('Erro ao criar receita:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.put(
   '/receitas/:id',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { id } = req.params;
         const {
            mes_id,
            categoriaId,
            descricao,
            valor,
            status,
            tipo,
            data,
            observacao,
         } = req.body;

         const receita = await prisma.receita.findFirst({
            where: { id: Number(id), usuarioId },
         });

         if (!receita) {
            return res.status(404).json({ error: 'Receita não encontrada' });
         }

         const receitaAtualizada = await prisma.receita.update({
            where: { id: Number(id) },
            data: {
               ...(mes_id && { mes_id: Number(mes_id) }),
               ...(categoriaId && { categoriaId: Number(categoriaId) }),
               ...(descricao && { descricao: descricao.trim() }),
               ...(valor !== undefined && { valor: Number(valor) }),
               ...(status && { status }),
               ...(tipo && { tipo }),
               ...(data && { data: new Date(data) }),
               ...(observacao !== undefined && {
                  observacao: observacao?.trim(),
               }),
            },
            include: {
               categoria: true,
               mes: true,
            },
         });

         res.json({
            id: receitaAtualizada.id,
            mes_id: receitaAtualizada.mes_id,
            categoriaId: receitaAtualizada.categoriaId,
            descricao: receitaAtualizada.descricao,
            valor: toNum(receitaAtualizada.valor),
            status: receitaAtualizada.status,
            tipo: receitaAtualizada.tipo,
            data: receitaAtualizada.data,
            observacao: receitaAtualizada.observacao,
            categoria: receitaAtualizada.categoria,
            mes: receitaAtualizada.mes,
         });
      } catch (error) {
         console.error('Erro ao atualizar receita:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.delete(
   '/receitas/:id',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { id } = req.params;

         const receita = await prisma.receita.findFirst({
            where: { id: Number(id), usuarioId },
         });

         if (!receita) {
            return res.status(404).json({ error: 'Receita não encontrada' });
         }

         await prisma.receita.delete({
            where: { id: Number(id) },
         });

         res.status(204).send();
      } catch (error) {
         console.error('Erro ao deletar receita:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

// ===== ROTAS DE DESPESAS =====
app.get(
   '/despesas',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { mes_id, categoriaId } = req.query;

         const where: any = { usuarioId };
         if (mes_id) where.mes_id = Number(mes_id);
         if (categoriaId) where.categoriaId = Number(categoriaId);

         const despesas = await prisma.despesa.findMany({
            where,
            include: {
               categoria: true,
               mes: true,
            },
            orderBy: { createdAt: 'desc' },
         });

         const despesasFormatadas = despesas.map((d: any) => ({
            id: d.id,
            mes_id: d.mes_id,
            categoriaId: d.categoriaId,
            descricao: d.descricao,
            valor: toNum(d.valor),
            status: d.status,
            data: d.data,
            observacao: d.observacao,
            categoria: d.categoria,
            mes: d.mes,
         }));

         res.json(despesasFormatadas);
      } catch (error) {
         console.error('Erro ao buscar despesas:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.post(
   '/despesas',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const {
            mes_id,
            categoriaId,
            descricao,
            valor,
            status = 'Vazio',
            data,
            observacao,
         } = req.body;

         if (!mes_id || !categoriaId || !descricao || valor === undefined) {
            return res.status(400).json({
               error: 'mes_id, categoriaId, descricao e valor são obrigatórios',
            });
         }

         const despesa = await prisma.despesa.create({
            data: {
               mes_id: Number(mes_id),
               categoriaId: Number(categoriaId),
               descricao: descricao.trim(),
               valor: Number(valor),
               status,
               data: data ? new Date(data) : null,
               observacao: observacao?.trim(),
               usuarioId,
            },
            include: {
               categoria: true,
               mes: true,
            },
         });

         res.status(201).json({
            id: despesa.id,
            mes_id: despesa.mes_id,
            categoriaId: despesa.categoriaId,
            descricao: despesa.descricao,
            valor: toNum(despesa.valor),
            status: despesa.status,
            data: despesa.data,
            observacao: despesa.observacao,
            categoria: despesa.categoria,
            mes: despesa.mes,
         });
      } catch (error) {
         console.error('Erro ao criar despesa:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.put(
   '/despesas/:id',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { id } = req.params;
         const {
            mes_id,
            categoriaId,
            descricao,
            valor,
            status,
            data,
            observacao,
         } = req.body;

         const despesa = await prisma.despesa.findFirst({
            where: { id: Number(id), usuarioId },
         });

         if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
         }

         const despesaAtualizada = await prisma.despesa.update({
            where: { id: Number(id) },
            data: {
               ...(mes_id && { mes_id: Number(mes_id) }),
               ...(categoriaId && { categoriaId: Number(categoriaId) }),
               ...(descricao && { descricao: descricao.trim() }),
               ...(valor !== undefined && { valor: Number(valor) }),
               ...(status && { status }),
               ...(data && { data: new Date(data) }),
               ...(observacao !== undefined && {
                  observacao: observacao?.trim(),
               }),
            },
            include: {
               categoria: true,
               mes: true,
            },
         });

         res.json({
            id: despesaAtualizada.id,
            mes_id: despesaAtualizada.mes_id,
            categoriaId: despesaAtualizada.categoriaId,
            descricao: despesaAtualizada.descricao,
            valor: toNum(despesaAtualizada.valor),
            status: despesaAtualizada.status,
            data: despesaAtualizada.data,
            observacao: despesaAtualizada.observacao,
            categoria: despesaAtualizada.categoria,
            mes: despesaAtualizada.mes,
         });
      } catch (error) {
         console.error('Erro ao atualizar despesa:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.delete(
   '/despesas/:id',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { id } = req.params;

         const despesa = await prisma.despesa.findFirst({
            where: { id: Number(id), usuarioId },
         });

         if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
         }

         await prisma.despesa.delete({
            where: { id: Number(id) },
         });

         res.status(204).send();
      } catch (error) {
         console.error('Erro ao deletar despesa:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

app.get(
   '/relatorios/resumo',
   verificarToken,
   verificarPermissao,
   async (req: AuthRequest, res) => {
      try {
         const usuarioId = req.usuario!.id;
         const { mes_id } = req.query;

         const where: any = { usuarioId };
         if (mes_id) where.mes_id = Number(mes_id);

         const [receitas, despesas] = await Promise.all([
            prisma.receita.aggregate({
               where,
               _sum: { valor: true },
            }),
            prisma.despesa.aggregate({
               where,
               _sum: { valor: true },
            }),
         ]);

         const totalReceitas = toNum(receitas._sum.valor);
         const totalDespesas = toNum(despesas._sum.valor);
         const saldo = totalReceitas - totalDespesas;

         res.json({
            receitas: totalReceitas,
            despesas: totalDespesas,
            saldo,
            mes_id: mes_id ? Number(mes_id) : undefined,
         });
      } catch (error) {
         console.error('Erro ao gerar relatório:', error);
         res.status(500).json({ error: 'Erro interno do servidor' });
      }
   }
);

async function startServer() {
   try {
      await prisma.$connect();
      console.log('✅ Conectado ao banco de dados SQLite');

      app.listen(PORT, () => {
         console.log(`🚀 Servidor rodando na porta ${PORT}`);
         console.log(`🔐 Sistema de autenticação ativo`);
         console.log(`📊 Rotas disponíveis:`);
         console.log(`   POST /auth/registrar - Registrar usuário`);
         console.log(`   POST /auth/login - Fazer login`);
         console.log(`   GET /auth/perfil - Obter perfil (autenticado)`);
         console.log(`   PUT /auth/perfil - Atualizar perfil (autenticado)`);
         console.log(`   GET /metas - Listar metas (autenticado)`);
         console.log(`   POST /metas - Criar meta (autenticado)`);
         console.log(`   GET /categorias - Listar categorias (autenticado)`);
         console.log(`   POST /categorias - Criar categoria (autenticado)`);
         console.log(`   GET /receitas - Listar receitas (autenticado)`);
         console.log(`   POST /receitas - Criar receita (autenticado)`);
         console.log(`   PUT /receitas/:id - Atualizar receita (autenticado)`);
         console.log(`   DELETE /receitas/:id - Deletar receita (autenticado)`);
         console.log(`   GET /despesas - Listar despesas (autenticado)`);
         console.log(`   POST /despesas - Criar despesa (autenticado)`);
         console.log(`   PUT /despesas/:id - Atualizar despesa (autenticado)`);
         console.log(`   DELETE /despesas/:id - Deletar despesa (autenticado)`);
         console.log(
            `   GET /relatorios/resumo - Relatório financeiro (autenticado)`
         );
         console.log(`   GET /health - Health check`);
      });
   } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
   }
}

process.on('SIGINT', async () => {
   console.log('\n🔄 Encerrando servidor...');
   await prisma.$disconnect();
   process.exit(0);
});

process.on('SIGTERM', async () => {
   console.log('\n🔄 Encerrando servidor...');
   await prisma.$disconnect();
   process.exit(0);
});

startServer();
