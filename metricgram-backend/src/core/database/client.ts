import { PrismaClient } from '@prisma/client';
import path from 'path';
import { config } from '../config';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ],
});

// 開發環境：輸出 SQL 查詢日誌
if (config.nodeEnv === 'development') {
  prisma.$on('query', (e) => {
    // console.log(`🔍 Query: ${e.query}`);
    // console.log(`⏱️  Duration: ${e.duration}ms`);
  });
}

// 全局錯誤處理
prisma.$on('error', (e) => {
  console.error('❌ Prisma error:', e);
});

prisma.$on('warn', (e) => {
  console.warn('⚠️ Prisma warning:', e);
});

// 生命周期鉤子
prisma.$connect();

export default prisma;
