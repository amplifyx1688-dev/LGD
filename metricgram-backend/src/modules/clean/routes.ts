import { Router } from 'express';
import { body, query } from 'express-validator';
import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { cleanService } from './service';
import { CLEAN_CONSTANTS } from '@/shared/constants';

const router = Router();

/**
 * 獲取清理設置
 * GET /settings?groupId=<groupId>
 */
router.get('/settings', [
  query('groupId').isInt({ min: 1 }).withMessage('groupId 必須為大於 0 的整數')
], async (req, res) => {
  try {
    const groupId = parseInt(req.query.groupId as string, 10);
    const settings = await cleanService.getCleanSettings(groupId);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    logger.error('獲取清理設置失敗', { error: error.message, query: req.query });

    if (error.message.includes('群組不存在')) {
      return res.status(404).json({ success: false, error: '群組不存在' });
    }

    res.status(500).json({
      success: false,
      error: '獲取清理設置失敗',
      details: error.message
    });
  }
});

/**
 * 更新清理設置
 * PUT /settings
 * Body: { groupId, enabled?, intervalMinutes?, messageTypes?, deleteWithinMinutes? }
 */
router.put('/settings', [
  body('groupId').isInt({ min: 1 }).withMessage('groupId 必須為大於 0 的整數'),
  body('enabled').optional().isBoolean(),
  body('intervalMinutes').optional().isInt({ min: 1 }),
  body('messageTypes').optional().isArray(),
  body('messageTypes.*').optional().isString(),
  body('deleteWithinMinutes').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const { groupId, enabled, intervalMinutes, messageTypes, deleteWithinMinutes } = req.body;

    const updates: any = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (intervalMinutes !== undefined) updates.intervalMinutes = intervalMinutes;
    if (messageTypes !== undefined) updates.messageTypes = messageTypes;
    if (deleteWithinMinutes !== undefined) updates.deleteWithinMinutes = deleteWithinMinutes;

    await cleanService.updateCleanSettings(groupId, updates);

    const updated = await cleanService.getCleanSettings(groupId);

    res.json({
      success: true,
      message: '清理設置已更新',
      data: updated
    });
  } catch (error: any) {
    logger.error('更新清理設置失敗', { error: error.message, body: req.body });

    if (error.message.includes('群組不存在')) {
      return res.status(404).json({ success: false, error: '群組不存在' });
    }

    res.status(500).json({
      success: false,
      error: '更新清理設置失敗',
      details: error.message
    });
  }
});

/**
 * 立即執行清理
 * POST /clean-now
 * Body: { groupId, types?, deleteWithinMinutes? }
 */
router.post('/clean-now', [
  body('groupId').isInt({ min: 1 }).withMessage('groupId 必須為大於 0 的整數'),
  body('types').optional().isArray(),
  body('types.*').optional().isString(),
  body('deleteWithinMinutes').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const { groupId, types, deleteWithinMinutes } = req.body;

    const cleaned = await cleanService.cleanNow(groupId, { types, deleteWithinMinutes });

    res.json({
      success: true,
      message: '清理完成',
      cleaned
    });
  } catch (error: any) {
    logger.error('執行清理失敗', { error: error.message, body: req.body });

    if (error.message.includes('群組不存在')) {
      return res.status(404).json({ success: false, error: '群組不存在' });
    }

    res.status(500).json({
      success: false,
      error: '清理失敗',
      details: error.message
    });
  }
});

/**
 * 查詢清理歷史
 * GET /history?groupId=&limit=
 */
router.get('/history', [
  query('groupId').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const groupId = req.query.groupId ? parseInt(req.query.groupId as string, 10) : undefined;
    const limit = parseInt((req.query.limit as string) || '50', 10);

    const where: any = {
      module: 'clean',
      action: 'clean_run'
    };

    if (groupId) {
      where.groupId = groupId;
    }

    const history = await prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        groupId: true,
        createdAt: true,
        message: true,
        metadata: true
      }
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    logger.error('獲取清理歷史失敗', { error: error.message, query: req.query });

    res.status(500).json({
      success: false,
      error: '獲取歷史失敗',
      details: error.message
    });
  }
});

export { router as cleanRoutes };
