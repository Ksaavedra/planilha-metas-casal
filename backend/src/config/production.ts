export const productionConfig = {
   // Configurações de Produção
   database: {
      url: process.env.DATABASE_URL || 'file:./prod.db',
      pool: {
         min: 2,
         max: 10,
      },
   },

   security: {
      jwtSecret:
         process.env.JWT_SECRET || 'production-secret-key-change-this-2025',
      jwtExpiresIn: '1d',
      bcryptRounds: 12,
      rateLimit: {
         windowMs: 15 * 60 * 1000, // 15 minutos
         max: 50, // máximo 50 requests por IP
      },
   },

   cors: {
      origin: process.env.FRONTEND_URL || 'https://seu-dominio.com',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
   },

   logging: {
      level: 'warn',
      enableFileLogging: true,
      logFilePath: './logs/production.log',
      maxFileSize: '10m',
      maxFiles: 5,
   },

   monitoring: {
      enableHealthCheck: true,
      enableMetrics: true,
      metricsPort: 3001,
   },
};
