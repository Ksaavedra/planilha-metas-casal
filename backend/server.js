const express = require('express');
const cors = require('cors');
const db = require('./scripts/db');

const usuariosRoutes = require('./routes/usuarios.routes');
const receitasRoutes = require('./routes/receitas.routes');
const despesasRoutes = require('./routes/despesas.routes');
const metasRoutes = require('./routes/metas.routes');
const investimentosRoutes = require('./routes/investimentos.routes');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
   res.json({ ok: true });
});

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/receitas', receitasRoutes);
app.use('/api/despesas', despesasRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/investimentos', investimentosRoutes);

process.on('SIGINT', () => {
   console.log('\n🛑 Fechando conexão com o banco...');
   db.close();
   process.exit(0);
});

app.listen(PORT, () => {
   console.log(`Servidor rodando na porta ${PORT}`);
   console.log(`API health: http://localhost:${PORT}/api/health`);
   console.log(`API usuarios: http://localhost:${PORT}/api/usuarios`);
   console.log(`API receitas: http://localhost:${PORT}/api/receitas`);
   console.log(`API despesas: http://localhost:${PORT}/api/despesas`);
   console.log(`API metas: http://localhost:${PORT}/api/metas`);
   console.log(`API investimentos: http://localhost:${PORT}/api/investimentos`);
});
