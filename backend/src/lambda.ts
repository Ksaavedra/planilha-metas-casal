import {
   APIGatewayProxyEvent,
   APIGatewayProxyResult,
   Context,
} from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http';
import authRoutes from './routes/auth.routes';
import { verificarToken } from './middleware/auth';

// Inicializar Prisma Client
const prisma = new PrismaClient();

// Configurar Express
const app = express();

// Configurar trust proxy para API Gateway
app.set('trust proxy', true);

// Middleware de segurança
app.use(helmet());
app.use(
   cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
   })
);

// Rate limiting temporariamente desabilitado para resolver problemas
// TODO: Reativar após resolver problemas do Prisma
// const limiter = rateLimit({
//    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
//    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
//    message: 'Muitas requisições, tente novamente mais tarde.',
//    standardHeaders: true,
//    legacyHeaders: false,
//    trustProxy: 1, // Confiar apenas no primeiro proxy (API Gateway)
// });
// app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
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

// Rotas de autenticação
app.use('/auth', authRoutes);

// Middleware de autenticação para rotas protegidas
app.use('/metas', verificarToken);
app.use('/categorias', verificarToken);
app.use('/receitas', verificarToken);
app.use('/despesas', verificarToken);
app.use('/relatorios', verificarToken);

// Rotas de Metas
app.get('/metas', async (req: any, res) => {
   try {
      const metas = await prisma.meta.findMany({
         where: { usuarioId: req.user.id },
         include: { meses: true },
      });
      res.json(metas);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar metas' });
   }
});

app.post('/metas', async (req: any, res) => {
   try {
      const { nome, valorMeta, valorPorMes, mesesNecessarios } = req.body;
      const meta = await prisma.meta.create({
         data: {
            nome,
            valorMeta: parseFloat(valorMeta),
            valorPorMes: parseFloat(valorPorMes),
            mesesNecessarios: parseInt(mesesNecessarios),
            usuarioId: req.user.id,
         },
      });
      res.status(201).json(meta);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao criar meta' });
   }
});

// Rotas de Categorias
app.get('/categorias', async (req: any, res) => {
   try {
      const categorias = await prisma.categoria.findMany({
         where: { usuarioId: req.user.id },
      });
      res.json(categorias);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar categorias' });
   }
});

app.post('/categorias', async (req: any, res) => {
   try {
      const { nome, tipo, descricao } = req.body;
      const categoria = await prisma.categoria.create({
         data: {
            nome,
            tipo,
            descricao,
            usuarioId: req.user.id,
         },
      });
      res.status(201).json(categoria);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao criar categoria' });
   }
});

// Rotas de Receitas
app.get('/receitas', async (req: any, res) => {
   try {
      const receitas = await prisma.receita.findMany({
         where: { usuarioId: req.user.id },
         include: { categoria: true },
      });
      res.json(receitas);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar receitas' });
   }
});

app.post('/receitas', async (req: any, res) => {
   try {
      const { valor, descricao, data, categoriaId, tipo, mes_id } = req.body;
      const receita = await prisma.receita.create({
         data: {
            valor: parseFloat(valor),
            descricao,
            data: new Date(data),
            categoriaId: parseInt(categoriaId),
            tipo,
            mes_id: parseInt(mes_id),
            usuarioId: req.user.id,
         },
         include: { categoria: true },
      });
      res.status(201).json(receita);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao criar receita' });
   }
});

app.put('/receitas/:id', async (req: any, res) => {
   try {
      const { id } = req.params;
      const { valor, descricao, data, categoriaId, tipo, mes_id } = req.body;
      const receita = await prisma.receita.update({
         where: { id: parseInt(id), usuarioId: req.user.id },
         data: {
            valor: parseFloat(valor),
            descricao,
            data: new Date(data),
            categoriaId: parseInt(categoriaId),
            tipo,
            mes_id: parseInt(mes_id),
         },
         include: { categoria: true },
      });
      res.json(receita);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar receita' });
   }
});

app.delete('/receitas/:id', async (req: any, res) => {
   try {
      const { id } = req.params;
      await prisma.receita.delete({
         where: { id: parseInt(id), usuarioId: req.user.id },
      });
      res.status(204).send();
   } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar receita' });
   }
});

// Rotas de Despesas
app.get('/despesas', async (req: any, res) => {
   try {
      const despesas = await prisma.despesa.findMany({
         where: { usuarioId: req.user.id },
         include: { categoria: true },
      });
      res.json(despesas);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar despesas' });
   }
});

app.post('/despesas', async (req: any, res) => {
   try {
      const { valor, descricao, data, categoriaId, mes_id } = req.body;
      const despesa = await prisma.despesa.create({
         data: {
            valor: parseFloat(valor),
            descricao,
            data: new Date(data),
            categoriaId: parseInt(categoriaId),
            mes_id: parseInt(mes_id),
            usuarioId: req.user.id,
         },
         include: { categoria: true },
      });
      res.status(201).json(despesa);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao criar despesa' });
   }
});

app.put('/despesas/:id', async (req: any, res) => {
   try {
      const { id } = req.params;
      const { valor, descricao, data, categoriaId, mes_id } = req.body;
      const despesa = await prisma.despesa.update({
         where: { id: parseInt(id), usuarioId: req.user.id },
         data: {
            valor: parseFloat(valor),
            descricao,
            data: new Date(data),
            categoriaId: parseInt(categoriaId),
            mes_id: parseInt(mes_id),
         },
         include: { categoria: true },
      });
      res.json(despesa);
   } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar despesa' });
   }
});

app.delete('/despesas/:id', async (req: any, res) => {
   try {
      const { id } = req.params;
      await prisma.despesa.delete({
         where: { id: parseInt(id), usuarioId: req.user.id },
      });
      res.status(204).send();
   } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar despesa' });
   }
});

// Rotas de Relatórios
app.get('/relatorios/resumo', async (req: any, res) => {
   try {
      const usuarioId = req.user.id;

      // Buscar receitas e despesas do mês atual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const fimMes = new Date();
      fimMes.setMonth(fimMes.getMonth() + 1, 0);
      fimMes.setHours(23, 59, 59, 999);

      const [receitas, despesas] = await Promise.all([
         prisma.receita.findMany({
            where: {
               usuarioId,
               data: { gte: inicioMes, lte: fimMes },
            },
            include: { categoria: true },
         }),
         prisma.despesa.findMany({
            where: {
               usuarioId,
               data: { gte: inicioMes, lte: fimMes },
            },
            include: { categoria: true },
         }),
      ]);

      const totalReceitas = receitas.reduce((sum, r) => sum + r.valor, 0);
      const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
      const saldo = totalReceitas - totalDespesas;

      res.json({
         periodo: {
            inicio: inicioMes,
            fim: fimMes,
         },
         receitas: {
            total: totalReceitas,
            quantidade: receitas.length,
            dados: receitas,
         },
         despesas: {
            total: totalDespesas,
            quantidade: despesas.length,
            dados: despesas,
         },
         saldo,
         indicadores: {
            economia: saldo > 0 ? saldo : 0,
            deficit: saldo < 0 ? Math.abs(saldo) : 0,
         },
      });
   } catch (error) {
      res.status(500).json({ error: 'Erro ao gerar relatório' });
   }
});

// Configurar serverless-http
const serverlessHandler = serverless(app);

// Handler do Lambda
export const handler = async (
   event: APIGatewayProxyEvent,
   context: Context
): Promise<APIGatewayProxyResult> => {
   // Configurar contexto do Lambda
   context.callbackWaitsForEmptyEventLoop = false;

   try {
      const result = await serverlessHandler(event, context);
      return result as APIGatewayProxyResult;
   } catch (error) {
      console.error('Erro no Lambda:', error);
      return {
         statusCode: 500,
         body: JSON.stringify({ error: 'Erro interno do servidor' }),
      };
   }
};
