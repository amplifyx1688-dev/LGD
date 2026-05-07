import { Router } from 'express';

const router = Router();

/**
 * 夜間模塊路由
 */

router.get('/config', async (req, res) => {
  res.json({ success: true, data: { enabled: true, startTime: '00:00', rules: [] } });
});

router.put('/config', async (req, res) => {
  res.json({ success: true, message: '配置已更新' });
});

export { router as nightRoutes };
