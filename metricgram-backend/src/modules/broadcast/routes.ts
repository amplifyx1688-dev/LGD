import { Router } from 'express';
import { broadcastService } from './service';
import { logger } from '@/core/utils/logger';

const router = Router();

/**
 * 廣播模塊路由
 */

/**
 * 創建廣播任務
 * POST /api/v1/broadcast
 */
router.post('/', async (req, res) => {
  try {
    const { groupIds, messageType, contentJson, scheduledAt, timeWindowStart, timeWindowEnd } = req.body;

    if (!messageType || !contentJson) {
      return res.status(400).json({ success: false, error: '缺少必要參數: messageType, contentJson' });
    }

    const broadcast = await broadcastService.createBroadcast({
      messageType,
      contentJson,
      targetGroupIds: groupIds,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      timeWindowStart,
      timeWindowEnd
    });

    res.status(201).json({ success: true, data: broadcast });
  } catch (error: any) {
    logger.error('創建廣播失敗', { error: error.message });
    res.status(500).json({ success: false, error: '創建廣播失敗' });
  }
});

/**
 * 立即發送廣播
 * POST /api/v1/broadcast/send-now
 */
router.post('/send-now', async (req, res) => {
  try {
    const { groupIds, message } = req.body;

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ success: false, error: '請提供有效的 groupIds 數組' });
    }

    if (!message || !message.type || !message.content) {
      return res.status(400).json({ success: false, error: '缺少消息參數: message.type 和 message.content' });
    }

    const results = await broadcastService.sendNow(groupIds, message);

    const successCount = results.filter(r => r.success).length;
    const allSuccess = successCount === groupIds.length;

    res.json({
      success: allSuccess,
      data: {
        total: groupIds.length,
        success: successCount,
        failed: groupIds.length - successCount,
        results
      }
    });
  } catch (error: any) {
    logger.error('立即發送廣播失敗', { error: error.message });
    res.status(500).json({ success: false, error: '發送廣播失敗' });
  }
});

/**
 * 獲取隊列狀態
 * GET /api/v1/broadcast/queue
 */
router.get('/queue', async (req, res) => {
  try {
    const status = await broadcastService.getQueueStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    logger.error('獲取隊列狀態失敗', { error: error.message });
    res.status(500).json({ success: false, error: '獲取隊列狀態失敗' });
  }
});

/**
 * 取消任務
 * DELETE /api/v1/broadcast/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const broadcastId = parseInt(id, 10);

    if (isNaN(broadcastId)) {
      return res.status(400).json({ success: false, error: '無效的任務 ID' });
    }

    const result = await broadcastService.cancelBroadcast(broadcastId);

    if (!result) {
      return res.status(404).json({ success: false, error: '任務不存在' });
    }

    res.json({ success: true, message: '任務已取消' });
  } catch (error: any) {
    logger.error('取消廣播任務失敗', { error: error.message });
    res.status(500).json({ success: false, error: '取消失敗' });
  }
});

export { router as broadcastRoutes };
