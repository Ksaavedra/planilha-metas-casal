export interface Environment {
   NODE_ENV: 'development' | 'production' | 'test';
   PORT: number;
   DATABASE_URL: string;
   JWT_SECRET: string;
   JWT_EXPIRES_IN: string;
   CORS_ORIGIN: string;
   LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
   ENABLE_LOGGING: boolean;
   RATE_LIMIT_WINDOW_MS: number;
   RATE_LIMIT_MAX_REQUESTS: number;
   ENABLE_HELMET: boolean;
   ENABLE_CORS: boolean;
   ENABLE_RATE_LIMIT: boolean;
}

const development: Environment = {
   NODE_ENV: 'development',
   PORT: 3000,
   DATABASE_URL: 'file:./dev.db',
   JWT_SECRET: 'dev-secret-key-change-in-production-2025',
   JWT_EXPIRES_IN: '7d',
   CORS_ORIGIN: 'http://localhost:4200',
   LOG_LEVEL: 'debug',
   ENABLE_LOGGING: true,
   RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
   RATE_LIMIT_MAX_REQUESTS: 100,
   ENABLE_HELMET: true,
   ENABLE_CORS: true,
   ENABLE_RATE_LIMIT: true,
};

const production: Environment = {
   NODE_ENV: 'production',
   PORT: Number(process.env.PORT) || 3000,
   DATABASE_URL: process.env.DATABASE_URL || 'file:./prod.db',
   JWT_SECRET:
      process.env.JWT_SECRET || 'production-secret-key-change-this-2025',
   JWT_EXPIRES_IN: '1d',
   CORS_ORIGIN: process.env.FRONTEND_URL || 'https://seu-dominio.com',
   LOG_LEVEL: 'warn',
   ENABLE_LOGGING: true,
   RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
   RATE_LIMIT_MAX_REQUESTS: 50,
   ENABLE_HELMET: true,
   ENABLE_CORS: true,
   ENABLE_RATE_LIMIT: true,
};

const test: Environment = {
   NODE_ENV: 'test',
   PORT: 3001,
   DATABASE_URL: 'file:./test.db',
   JWT_SECRET: 'test-secret-key-2025',
   JWT_EXPIRES_IN: '1h',
   CORS_ORIGIN: 'http://localhost:4200',
   LOG_LEVEL: 'error',
   ENABLE_LOGGING: false,
   RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
   RATE_LIMIT_MAX_REQUESTS: 1000,
   ENABLE_HELMET: false,
   ENABLE_CORS: true,
   ENABLE_RATE_LIMIT: false
};

export function getEnvironment(): Environment {
   const env = process.env.NODE_ENV || 'development';

   switch (env) {
      case 'production':
         return production;
      case 'test':
         return test;
      case 'development':
      default:
         return development;
   }
}

export const config = getEnvironment();
