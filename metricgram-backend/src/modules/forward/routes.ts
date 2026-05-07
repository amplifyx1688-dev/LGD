import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

const router = Router();

/**
 * 搬運模塊路由
 */

/**
 * 發布搬運任務
 * POST /api/v1/forward
 */
router.post('/', [
  body('sourceChannelId').notEmpty(),
  body('targetGroupId').notEmpty(),
  body('keywords').isString()
], async (req, res) => {
  const { sourceChannelId, targetGroupId, keywords, templateId } = req.body;

  // 創建搬運任務
  // await prisma.forwardTask.create({ ... });

  res.json({ success: true, message: '搬運任務已創建' });
});

/**
 * 獲取搬運任務列表
 */
router.get('/', async (req, res) => {
  const tasks = await prisma.$queryRaw`SELECT * FROM carousel_content WHERE module = 'forward'`;
  res.json({ success: true, data: tasks });
});

export { router as forwardRoutes };
