import { Router } from 'express';

const router = Router();

/**
 * 清潔模塊路由
 */

router.post('/clean-now', async (req, res) => {
  res.json({ success: true, message: '清理已觸發', cleaned: 0 });
});

export { router as cleanRoutes };
