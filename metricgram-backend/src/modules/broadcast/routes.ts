import { Router } from 'express';
import { prisma } from '@/core/database/client';

const router = Router();

/**
 * 廣播模塊路由
 */

/**
 * 創建廣播任務
 * POST /api/v1/broadcast
 */
router.post('/', async (req, res) => {
  const { groupIds, messageType, contentJson, scheduledAt } = req.body;

  await prisma.broadcastQueue.create({
    data: {
      messageType,
      contentJson: JSON.stringify(contentJson),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      status: 'pending'
    }
  });

  res.json({ success: true, message: '廣播已加入隊列' });
});

/**
 * 立即發送廣播
 * POST /api/v1/broadcast/send-now
 */
router.post('/send-now', async (req, res) => {
  // 立即發送邏輯
  res.json({ success: true, message: '廣播已觸發' });
});

export { router as broadcastRoutes };
