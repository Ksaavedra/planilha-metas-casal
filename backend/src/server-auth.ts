import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

app.use(
   cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
   })
);

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
         database: 'sqlite',
         timestamp: new Date().toISOString(),
         message: 'API funcionando perfeitamente com autenticação!',
      });
   } catch (error) {
      res.status(500).json({
         status: 'error',
         database: 'sqlite',
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
