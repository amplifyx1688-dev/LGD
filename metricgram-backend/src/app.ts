import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from '@/core/config';
import { logger, requestLoggerMiddleware } from '@/core/utils/logger';
import { errorMiddleware, notFoundMiddleware } from '@/core/middleware/error';
import { authMiddleware, adminMiddleware } from '@/core/middleware/auth';

// 路由模塊
import { authRoutes } from '@/modules/auth/routes';
import { groupRoutes } from '@/modules/groups/routes';
import { carouselRoutes } from '@/modules/carousel/routes';
import { checkinRoutes } from '@/modules/checkin/routes';
import { diceRoutes } from '@/modules/dice/routes';
import { dashboardRoutes } from '@/modules/dashboard/routes';
import { nightRoutes } from '@/modules/night/routes';
import { broadcastRoutes } from '@/modules/broadcast/routes';
import { verifyRoutes } from '@/modules/verify/routes';
import { forwardRoutes } from '@/modules/forward/routes';
import { activityRoutes } from '@/modules/activity/routes';

// 驗證配置
validateConfig();

const app = express();

// ============================================
// 1. MIDDLEWARE (順序重要！)
// ============================================

// 安全
app.use(helmet());

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// 壓縮
app.use(compression());

// 解析 Body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 請求日誌（優先，以便記錄所有請求）
app.use(requestLoggerMiddleware);

// 開發環境 HTTP 請求日誌
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// 速率限制
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
}));

// ============================================
// 2. ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/groups`, authMiddleware, groupRoutes);
app.use(`/api/${config.apiVersion}/carousel`, authMiddleware, carouselRoutes);
app.use(`/api/${config.apiVersion}/checkin`, authMiddleware, checkinRoutes);
app.use(`/api/${config.apiVersion}/dice`, authMiddleware, diceRoutes);
app.use(`/api/${config.apiVersion}/dashboard`, authMiddleware, dashboardRoutes);
app.use(`/api/${config.apiVersion}/night`, authMiddleware, nightRoutes);
app.use(`/api/${config.apiVersion}/broadcast`, authMiddleware, broadcastRoutes);
app.use(`/api/${config.apiVersion}/verify`, authMiddleware, verifyRoutes);
app.use(`/api/${config.apiVersion}/forward`, authMiddleware, forwardRoutes);
app.use(`/api/${config.apiVersion}/activity`, authMiddleware, activityRoutes);

// API 前向兼容（如果前端用 /api）
app.use('/api/auth', authRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/carousel', authMiddleware, carouselRoutes);
app.use('/api/checkin', authMiddleware, checkinRoutes);
app.use('/api/dice', authMiddleware, diceRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/night', authMiddleware, nightRoutes);
app.use('/api/broadcast', authMiddleware, broadcastRoutes);
app.use('/api/verify', authMiddleware, verifyRoutes);
app.use('/api/forward', authMiddleware, forwardRoutes);
app.use('/api/activity', authMiddleware, activityRoutes);

// Telegram Webhook（不經過 JWT 驗證）
app.post('/api/telegram/webhook', express.json(), (req, res) => {
  // 由 Bot 處理，簡化返回
  res.sendStatus(200);
});

// ============================================
// 3. 錯誤處理（必須在路由之後）
// ============================================
app.use(errorMiddleware);
app.use(notFoundMiddleware);

// ============================================
// 4. 啟動服務器
// ============================================
export function startServer() {
  app.listen(config.port, () => {
    console.log(`Server started on port ${config.port}`);
    console.log(`API: http://localhost:${config.port}/api/${config.apiVersion}`);
    console.log(`Health: http://localhost:${config.port}/health`);
  });
}

// 導出 app 用於測試
export default app;
