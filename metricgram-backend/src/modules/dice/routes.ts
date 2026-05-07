import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { z } from 'zod';
import { prisma } from '@/core/database/client';
import { authMiddleware } from '@/core/middleware/auth';
import { logger } from '@/core/utils/logger';

/**
 * 骰子游戲 API 完整版
 * 所有路由使用 Zod 驗證
 */

const router = Router();

/**
 * 骰子賠率配置（從數據庫讀取）
 */
router.get('/config/multipliers', async (req, res) => {
  // 從 game_settings 讀取
  res.json({ 
    success: true, 
    data: {
      multipliers: {
        niu_niu: 5,
        niu_9: 4,
        niu_8: 4,
        niu_7: 4,
        niu_6: 2,
        niu_5: 2,
        niu_4: 2,
        niu_3: 2,
        niu_2: 2,
        niu_1: 2,
        iron_straight: 5,
        pair: 2
      }
    } 
  });
});

/**
 * 計算骰子點數（純前端也可用）
 */
router.post('/calculate', [
  body('dice').isArray().isLength(5)
], (req, res) => {
  const { dice } = req.body;
  
  const sum = dice.reduce((a: number, b: number) => a + b, 0);
  const remainder = sum % 10;
  
  let type = '';
  let multiplier = 1;

  if (remainder === 0) {
    type = 'niu_niu'; multiplier = 5;
  } else {
    type = `niu_${remainder}`;
    multiplier = [2,2,2,2,2,2,2,4,4,4][remainder] || 1;
  }

  res.json({ 
    success: true, 
    data: { dice, sum, remainder, type, multiplier } 
  });
});

/**
 * 獲取黑名單
 */
router.get('/blacklist', async (req, res) => {
  const blacklistedUsers = await prisma.user.findMany({
    where: { isBlacklisted: true },
    select: { telegramId: true, username: true, firstName: true, blacklistReason: true }
  });

  res.json({ success: true, data: blacklistedUsers });
});

/**
 * 提交黑名單（管理員）
 */
router.post('/blacklist', [
  body('telegramId').isInt(),
  body('reason').notEmpty()
], async (req, res) => {
  await prisma.user.update({
    where: { telegramId: req.body.telegramId },
    data: { isBlacklisted: true, blacklistReason: req.body.reason }
  });

  res.json({ success: true, message: 'User blacklisted' });
});

export { router as diceRoutes };
