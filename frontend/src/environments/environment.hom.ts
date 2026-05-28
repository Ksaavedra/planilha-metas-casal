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
    realTimeUpdates: false,
  },
  cors: {
    origin: ['https://hom.seudominio.com', 'https://api-hom.seudominio.com'],
  },
};
