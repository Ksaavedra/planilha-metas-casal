// backend/server.js
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// POST /metas: não aceitamos 'id' no corpo (deixa auto-incrementar)
server.post('/metas', (req, res, next) => {
   if ('id' in req.body) delete req.body.id;
   next();
});

// Somente ids numéricos na URL /metas/:id
server.use((req, res, next) => {
   const alvo =
      /^(GET|PUT|PATCH|DELETE)$/.test(req.method) &&
      /^\/metas\/[^/]+$/.test(req.path);
   if (alvo) {
      const id = Number(req.path.split('/').pop());
      if (!Number.isFinite(id))
         return res.status(400).json({ error: 'id deve ser numérico' });
   }
   next();
});

server.use(router);
server.listen(3000, () =>
   console.log('JSON Server rodando em http://localhost:3000')
);
