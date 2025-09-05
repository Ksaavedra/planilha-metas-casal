export const environment = {
  production: false,
  environment: 'homologation',
  apiUrl: 'https://api-hom.seudominio.com/api',
  version: '1.0.0',
  debug: true,
  logLevel: 'info',
  features: {
    analytics: true,
    caching: true,
    realTimeUpdates: false
  },
  database: {
    type: 'sqlite',
    path: './database.sqlite'
  },
  cors: {
    origin: ['https://hom.seudominio.com', 'https://api-hom.seudominio.com']
  }
};
