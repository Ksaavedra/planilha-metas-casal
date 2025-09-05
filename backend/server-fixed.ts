import express from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

type TStatusMes = 'Vazio' | 'Programado' | 'Pago';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Configurar Prisma baseado no ambiente
const NODE_ENV = process.env.NODE_ENV || 'sqlite';
let prisma: PrismaClient;

if (NODE_ENV === 'mysql') {
   // Usar schema MySQL
   const { PrismaClient: PrismaClientMySQL } = require('@prisma/client');
   prisma = new PrismaClientMySQL();
   console.log('🔵 Usando banco MySQL');
} else {
   // Usar schema SQLite (padrão)
   prisma = new PrismaClient();
   console.log('🟢 Usando banco SQLite');
}

app.use(cors());
app.use(express.json());

// helper: converter Decimal -> number para o JSON do front
function toNum(v: any) {
   return v && typeof v.toNumber === 'function' ? v.toNumber() : Number(v ?? 0);
}

function toPlainMeta(m: any) {
   return {
      id: m.id,
      nome: m.nome,
      valorMeta: toNum(m.valorMeta),
      valorPorMes: toNum(m.valorPorMes),
      mesesNecessarios: Number(m.mesesNecessarios ?? 0),
      valorAtual: toNum(m.valorAtual),
      meses: (m.Meses ?? []).map((x: any) => ({
         id: x.id,
         mes_id: x.mes_id,
         nome: x.nome,
         valor: toNum(x.valor),
         status: x.status,
      })),
   };
}

// GET /metas
app.get('/metas', async (_req, res) => {
   try {
      const metas = await prisma.meta.findMany({
         include: { Meses: true },
         orderBy: { id: 'asc' },
      });
      res.json(metas.map(toPlainMeta));
   } catch (error) {
      console.error('Erro ao buscar metas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// POST /metas
app.post('/metas', async (req, res) => {
   try {
      const {
         nome,
         valorMeta = 0,
         valorPorMes = 0,
         mesesNecessarios = 0,
         valorAtual = 0,
         meses = [],
      } = req.body;

      const mesesPadrao =
         meses.length > 0
            ? meses
            : [
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
              ].map((n, i) => ({
                 mes_id: i + 1,
                 nome: n,
                 valor: 0,
                 status: 'Vazio' as TStatusMes,
              }));

      const created = await prisma.meta.create({
         data: {
            nome,
            valorMeta,
            valorPorMes,
            mesesNecessarios,
            valorAtual,
            Meses: {
               create: mesesPadrao.map((m: any, i: number) => ({
                  mes_id: m.mes_id ?? i + 1,
                  nome: m.nome,
                  valor: m.valor ?? 0,
                  status: (m.status as TStatusMes) ?? 'Vazio',
               })),
            },
         },
         include: { Meses: true },
      });

      res.status(201).json(toPlainMeta(created));
   } catch (error) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// PATCH /metas/:id
app.patch('/metas/:id', async (req, res) => {
   try {
      const id = Number(req.params.id);
      const { meses, ...fields } = req.body;

      await prisma.meta.update({ where: { id }, data: fields });

      if (Array.isArray(meses)) {
         for (const m of meses) {
            const mes_id = m.mes_id ?? m.id;
            await prisma.mesesMeta.upsert({
               where: { metaId_mes_id: { metaId: id, mes_id } },
               update: {
                  valor: m.valor ?? 0,
                  status: (m.status as TStatusMes) ?? 'Vazio',
               },
               create: {
                  metaId: id,
                  mes_id,
                  nome: m.nome,
                  valor: m.valor ?? 0,
                  status: (m.status as TStatusMes) ?? 'Vazio',
               },
            });
         }
      }

      const final = await prisma.meta.findUnique({
         where: { id },
         include: { Meses: true },
      });

      res.json(toPlainMeta(final));
   } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// DELETE /metas/:id
app.delete('/metas/:id', async (req, res) => {
   try {
      const id = Number(req.params.id);
      await prisma.mesesMeta.deleteMany({ where: { metaId: id } });
      await prisma.meta.delete({ where: { id } });
      res.status(204).send();
   } catch (error) {
      console.error('Erro ao deletar meta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
   }
});

// Health check
app.get('/health', async (_req, res) => {
   try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
         status: 'ok',
         database: NODE_ENV,
         timestamp: new Date().toISOString(),
      });
   } catch (error) {
      res.status(500).json({
         status: 'error',
         database: NODE_ENV,
         error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
   }
});

app.listen(PORT, () => {
   console.log(`🚀 API rodando em http://localhost:${PORT}`);
   console.log(`📊 Ambiente: ${NODE_ENV.toUpperCase()}`);
   console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Backup apenas para SQLite
if (NODE_ENV === 'sqlite') {
   const SQLITE_DB_PATH = path.resolve(__dirname, '../prisma/dev.db');
   const BACKUP_DIR = path.resolve(__dirname, '../backups/sqlite');

   function ensureDir(p: string) {
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
   }

   function timestamp() {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      return (
         d.getFullYear().toString() +
         pad(d.getMonth() + 1) +
         pad(d.getDate()) +
         '-' +
         pad(d.getHours()) +
         pad(d.getMinutes()) +
         pad(d.getSeconds())
      );
   }

   function backupSqlite(reason: string) {
      try {
         ensureDir(BACKUP_DIR);
         if (!fs.existsSync(SQLITE_DB_PATH)) {
            console.warn(`[backup] dev.db não existe (pulado).`);
            return;
         }
         const dest = path.join(BACKUP_DIR, `dev-${timestamp()}.db`);
         fs.copyFileSync(SQLITE_DB_PATH, dest);
         console.log(
            `✅ [backup] SQLite salvo (${reason}) -> ${path.relative(
               process.cwd(),
               dest
            )}`
         );
      } catch (e) {
         console.error('❌ [backup] Falhou:', e);
      }
   }

   // backup ao iniciar (opcional, comente se não quiser)
   backupSqlite('startup');

   // backup ao encerrar
   let shuttingDown = false;
   async function gracefulShutdown(signal: string) {
      if (shuttingDown) return;
      shuttingDown = true;
      try {
         backupSqlite(`shutdown-${signal}`);
      } finally {
         process.exit(0);
      }
   }
   process.on('SIGINT', gracefulShutdown); // Ctrl+C
   process.on('SIGTERM', gracefulShutdown); // kill/stop
}
