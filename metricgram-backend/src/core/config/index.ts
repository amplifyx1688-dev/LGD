import dotenv from 'dotenv';
import path from 'path';

// 加載環境變數
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],

   // Telegram
   telegram: {
     token: process.env.BOT_TOKEN || '',
     username: process.env.BOT_USERNAME || '',
     polling: process.env.TELEGRAM_POLLING === 'true' || true, // 强制开发模式为 polling
     pollingInterval: parseInt(process.env.TELEGRAM_POLLING_INTERVAL || '1000', 10),
     webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:3001',
     webhookSecret: process.env.WEBHOOK_SECRET || ''
   },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10)
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-this',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },

  // OKPay
  okpay: {
    apiKey: process.env.OKPAY_API_KEY || '',
    apiSecret: process.env.OKPAY_API_SECRET || '',
    walletId: process.env.OKPAY_WALLET_ID || ''
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    frontendEndpoint: process.env.FRONTEND_LOG_ENDPOINT || ''
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },

  // File Upload
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10) // 5MB
  },

  // Feature Flags
  features: {
    dice: process.env.FEATURE_DICE === 'true',
    carousel: process.env.FEATURE_CAROUSEL === 'true',
    checkin: process.env.FEATURE_CHECKIN === 'true',
    wheel: process.env.FEATURE_WHEEL === 'true'
  }
};

// 验证必需配置
export function validateConfig() {
  const errors: string[] = [];

  if (!config.telegram.token) {
    errors.push('BOT_TOKEN is required');
  }
  if (!config.telegram.username) {
    errors.push('BOT_USERNAME is required');
  }
  if (!config.database.url) {
    errors.push('DATABASE_URL is required');
  }
  if (!config.jwt.secret || config.jwt.secret === 'dev-secret-change-this') {
    errors.push('JWT_SECRET must be set (and not default)');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error('Invalid configuration');
  }

  console.log('✅ Configuration validated');
}
