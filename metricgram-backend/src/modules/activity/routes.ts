import { Router } from 'express';

const router = Router();

/**
 * 活動模塊路由
 */

/**
 * 創建活動
 */
router.post('/', async (req, res) => {
  res.json({ success: true, data: { id: 1 } });
});

/**
 * 獲取活動列表
 */
router.get('/', async (req, res) => {
  res.json({ success: true, data: [] });
});

export { router as activityRoutes };
