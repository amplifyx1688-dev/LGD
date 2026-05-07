import { Router } from 'express';

const router = Router();

/**
 * 簽到模塊路由
 */

/**
 * 執行簽到
 * POST /api/v1/checkin
 */
router.post('/', async (req, res) => {
  const userId = (req as any).user?.userId;
  const { groupId } = req.body;

  // TODO: 簽到邏輯
  // 1. 檢查今日是否已簽到
  // 2. 計算連續簽到天數
  // 3. 增加積分
  // 4. 創建簽到記錄
  // 5. 創建積分流水

  res.json({ 
    success: true, 
    data: {
      points: 1,
      streak: 3,
      totalPoints: 15
    },
    message: '簽到成功！'
  });
});

/**
 * 獲取個人詳情
 * GET /api/v1/checkin/profile
 */
router.get('/profile', async (req, res) => {
  const userId = (req as any).user?.userId;

  // TODO: 查詢數據

  res.json({ 
    success: true, 
    data: {
      points: 3,
      streak: 1,
      totalCheckins: 10,
      lastCheckinAt: new Date().toISOString()
    }
  });
});

/**
 * 旋轉獎勵輪盤
 * POST /api/v1/checkin/spin-wheel
 */
router.post('/spin-wheel', async (req, res) => {
  const userId = (req as any).user?.userId;

  // TODO: 檢查積分 ≥ 20
  // TODO: 扣除積分
  // TODO: 隨機算法
  // TODO: 發放獎勵

  const prizes = ['一等獎', '二等獎', '三等獎', '再接再厲'];
  const random = Math.random();
  let prize = prizes[3]; // 預設再接再厲

  if (random < 0.0001) prize = prizes[0];
  else if (random < 0.0011) prize = prizes[1];
  else if (random < 0.0061) prize = prizes[2];

  res.json({ 
    success: true, 
    data: { prize, amount: 0 },
    message: `🎰 結果：${prize}`
  });
});

export { router as checkinRoutes };
