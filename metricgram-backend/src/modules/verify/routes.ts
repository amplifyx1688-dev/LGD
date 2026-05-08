import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { verifyService } from './service';

const router = Router();

/**
 * 驗證模塊 API 路由
 */

/**
 * 發送驗證請求
 * POST /api/v1/verify
 */
router.post(
  '/',
  [
    body('userId').isInt({ min: 1 }).withMessage('用戶 ID 必填且必須大於 0'),
    body('groupId').optional().isInt({ min: 1 }),
    body('type')
      .isIn(['join', 'private', 'channel'])
      .withMessage('驗證類型必須是 join/private/channel')
  ],
  async (req, res) => {
    try {
      const { userId, groupId, type } = req.body;

      // 檢查用戶是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用戶不存在'
        });
      }

      // 如果提供了 groupId，檢查群組是否存在
      if (groupId) {
        const group = await prisma.group.findUnique({
          where: { id: groupId }
        });

        if (!group) {
          return res.status(404).json({
            success: false,
            message: '群組不存在'
          });
        }
      }

      // 創建驗證記錄
      const verification = await verifyService.createVerification(
        userId,
        groupId || null,
        type
      );

      res.json({
        success: true,
        data: verification,
        message: '驗證申請已提交'
      });
    } catch (error: any) {
      logger.error('Create verification failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '創建驗證失敗'
      });
    }
  }
);

/**
 * 提交驗證碼
 * POST /api/v1/verify/code
 */
router.post(
  '/code',
  [
    body('userId').isInt({ min: 1 }).withMessage('用戶 ID 必填'),
    body('code')
      .isLength({ min: 4, max: 6 })
      .withMessage('驗證碼必須是 4-6 位數字')
  ],
  async (req, res) => {
    try {
      const { userId, code } = req.body;

      // 執行驗證
      const result = await verifyService.verifyCode(userId, code);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      // 驗證成功後，如果有群組，觸發解禁操作
      if (result.verification?.groupId) {
        // TODO: 集成 Telegram Bot 解禁邏輯
        // 這部分邏輯由 Bot 模塊處理，或是通過事件方式通知
        logger.info('Verification successful, unban pending', {
          userId,
          groupId: result.verification.groupId
        });
      }

      res.json({
        success: true,
        data: {
          verified: true,
          verificationId: result.verification?.id
        },
        message: '驗證成功'
      });
    } catch (error: any) {
      logger.error('Verify code failed', { error });
      res.status(500).json({
        success: false,
        message: '驗證失敗，請稍後再試'
      });
    }
  }
);

/**
 * 查詢驗證狀態
 * GET /api/v1/verify/status?userId=&groupId=
 */
router.get(
  '/status',
  [
    query('userId').isInt({ min: 1 }).withMessage('用戶 ID 必填'),
    query('groupId').optional().isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const { userId, groupId } = req.query;

      const isVerified = await verifyService.isUserVerified(
        parseInt(userId as string),
        groupId ? parseInt(groupId as string) : undefined
      );

      // 獲取待處理的驗證記錄
      const pending = await verifyService.getPendingVerifications(
        groupId ? parseInt(groupId as string) : undefined
      );

      const userPending = pending.filter((v) => v.userId === userId);

      res.json({
        success: true,
        data: {
          isVerified,
          hasPending: userPending.length > 0,
          pendingCode: userPending.length > 0 ? userPending[0].code : null,
          expiresAt: userPending.length > 0 ? userPending[0].expiresAt : null
        }
      });
    } catch (error: any) {
      logger.error('Get verification status failed', { error });
      res.status(500).json({
        success: false,
        message: '查詢失敗'
      });
    }
  }
);

/**
 * 獲取待驗證列表（管理員）
 * GET /api/v1/verify/pending?groupId=
 */
router.get(
  '/pending',
  [query('groupId').optional().isInt({ min: 1 })],
  async (req, res) => {
    try {
      const { groupId } = req.query;

      const pending = await verifyService.getPendingVerifications(
        groupId ? parseInt(groupId as string) : undefined
      );

      res.json({
        success: true,
        data: pending.map((v) => ({
          id: v.id,
          userId: v.userId,
          user: v.user,
          groupId: v.groupId,
          type: v.type,
          code: v.code,
          expiresAt: v.expiresAt,
          createdAt: v.createdAt
        }))
      });
    } catch (error: any) {
      logger.error('Get pending verifications failed', { error });
      res.status(500).json({
        success: false,
        message: '獲取列表失敗'
      });
    }
  }
);

/**
 * 撤銷驗證
 * DELETE /api/v1/verify/:id
 */
router.delete(
  '/:id',
  [param('id').isInt({ min: 1 })],
  async (req, res) => {
    try {
      const { id } = req.params;

      const success = await verifyService.revokeVerification(parseInt(id));

      if (!success) {
        return res.status(404).json({
          success: false,
          message: '驗證記錄不存在'
        });
      }

      res.json({
        success: true,
        message: '已撤銷驗證'
      });
    } catch (error: any) {
      logger.error('Revoke verification failed', { error });
      res.status(500).json({
        success: false,
        message: '撤銷失敗'
      });
    }
  }
);

/**
 * 驗證碼核對（由 Telegram Bot 處理器使用）
 * POST /api/v1/verify/validate
 * 這個端點主要供 Bot 內部使用
 */
router.post(
  '/validate',
  [body('code').isLength({ min: 4, max: 6 })],
  async (req, res) => {
    try {
      const { code } = req.body;

      const result = await verifyService.verifyByCode(code);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error: any) {
      logger.error('Validate code failed', { error });
      res.status(500).json({
        success: false,
        message: '驗證失敗'
      });
    }
  }
);

export { router as verifyRoutes };
