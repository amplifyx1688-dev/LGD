import { Router } from 'express';
import { walletService } from './service';

const router = Router();

/**
 * 錢包模塊路由
 */

/**
 * 獲取餘額
 * GET /api/v1/wallet
 */
router.get('/', async (req, res) => {
  const userId = (req as any).user?.userId;
  const balance = await walletService.getBalance(userId);
  
  res.json({ success: true, data: { balance } });
});

/**
 * 充值（管理員/測試用）
 * POST /api/v1/wallet/deposit
 */
router.post('/deposit', [
  body('amount').isFloat({ min: 0.01 })
], async (req, res) => {
  const userId = (req as any).user?.userId;
  const { amount, note } = req.body;

  await walletService.deposit(userId, amount, note);
  
  const balance = await walletService.getBalance(userId);
  res.json({ success: true, data: { balance }, message: `充值 ${amount} USDT 成功` });
});

/**
 * 提現
 * POST /api/v1/wallet/withdraw
 */
router.post('/withdraw', [
  body('amount').isFloat({ min: 1 }),
  body('walletAddress').notEmpty()
], async (req, res) => {
  const userId = (req as any).user?.userId;
  const { amount, walletAddress } = req.body;

  await walletService.withdraw(userId, amount, walletAddress);
  
  res.json({ success: true, message: '提現申請已提交，預計 2-7 天到賬' });
});

/**
 * 交易流水
 * GET /api/v1/wallet/transactions
 */
router.get('/transactions', async (req, res) => {
  const userId = (req as any).user?.userId;
  const { page = 1, limit = 20 } = req.query;

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    take: parseInt(limit.toString()),
    skip: (parseInt(page.toString()) - 1) * parseInt(limit.toString()),
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.walletTransaction.count({ where: { userId } });

  res.json({ 
    success: true, 
    data: transactions,
    pagination: {
      page: parseInt(page.toString()),
      limit: parseInt(limit.toString()),
      total,
      totalPages: Math.ceil(total / parseInt(limit.toString()))
    }
  });
});

export { router as walletRoutes };
