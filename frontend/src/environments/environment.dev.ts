export const environment = {
  production: false,
  environment: 'development',
  apiUrl: 'http://localhost:3000/api',
  version: '1.0.0',
  debug: true,
  logLevel: 'debug',
  features: {
    analytics: false,
    caching: true,
    realTimeUpdates: false,
  },
  database: {
    type: 'sqlite',
    path: './database.sqlite',
  },
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
  },
};
