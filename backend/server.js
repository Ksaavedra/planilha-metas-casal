const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.time('BOOT');

const metasRoutes = require('./routes/metas');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/metas', metasRoutes);

// Rota de teste
app.get('/', (req, res) => {
   res.json({
      message: 'API da Planilha de Organização funcionando com MySQL/XAMPP!',
   });
});

// Rota de health check
app.get('/health', (req, res) => {
   res.send('ok');
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({ error: 'Erro interno do servidor' });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
   res.status(404).json({ error: 'Rota não encontrada' });
});

const server = app.listen(PORT, HOST, () => {
   console.timeEnd('BOOT');
   const addr = server.address();
   console.log(`Servidor rodando em http://${addr.address}:${addr.port}`);
   console.log('📁 Usando MySQL/XAMPP como banco de dados');
});
