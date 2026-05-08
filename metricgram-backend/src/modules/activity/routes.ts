import { Router } from 'express';
import { activityService } from './service';
import { authMiddleware, adminMiddleware } from '@/core/middleware/auth';
import { logger } from '@/core/utils/logger';
import { ApiResponse } from '@metricgram/shared-types';

const router = Router();

/**
 * 活動模塊路由
 */

/**
 * 獲取活動列表
 * GET /api/v1/activity
 * 可選過濾: ?type=lottery&status=active
 */
router.get('/', async (req, res) => {
  try {
    const { type, status, isActive } = req.query;

    const filters: any = {};
    if (type) filters.type = type as 'lottery' | 'streak' | 'ranking' | 'accumulative';
    if (status) filters.status = status as 'active' | 'upcoming' | 'ended' | 'all';
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const activities = await activityService.getActivities(filters);

    const response: ApiResponse = {
      success: true,
      data: activities
    };

    res.json(response);
  } catch (error: any) {
    logger.error('獲取活動列表失敗', { error: error.message });
    res.status(500).json({
      success: false,
      error: '獲取活動列表失敗'
    } as ApiResponse);
  }
});

/**
 * 創建活動（管理員）
 * POST /api/v1/activity
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      title,
      type,
      startDate,
      endDate,
      rules,
      rewards,
      isActive
    } = req.body;

    if (!title || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: '缺少必要參數: title, type, startDate, endDate'
      } as ApiResponse);
    }

    const activity = await activityService.createActivity({
      title,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rules: rules || {},
      rewards: rewards || {},
      isActive: isActive !== false
    });

    res.status(201).json({
      success: true,
      data: activity,
      message: '活動創建成功'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('創建活動失敗', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || '創建活動失敗'
    } as ApiResponse);
  }
});

/**
 * 獲取活動詳情
 * GET /api/v1/activity/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id, 10);

    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: '無效的活動 ID'
      } as ApiResponse);
    }

    const activity = await activityService.getActivityById(activityId);

    res.json({
      success: true,
      data: activity
    } as ApiResponse);
  } catch (error: any) {
    logger.error('獲取活動詳情失敗', { error: error.message });
    const statusCode = error.message === '活動不存在' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || '獲取活動詳情失敗'
    } as ApiResponse);
  }
});

/**
 * 更新活動（管理員）
 * PUT /api/v1/activity/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id, 10);

    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: '無效的活動 ID'
      } as ApiResponse);
    }

    const updates: any = { ...req.body };

    // 日期字段特殊處理
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const activity = await activityService.updateActivity(activityId, updates);

    res.json({
      success: true,
      data: activity,
      message: '活動更新成功'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('更新活動失敗', { error: error.message });
    const statusCode = error.message === '活動不存在' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || '更新活動失敗'
    } as ApiResponse);
  }
});

/**
 * 刪除活動（管理員）
 * DELETE /api/v1/activity/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id, 10);

    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: '無效的活動 ID'
      } as ApiResponse);
    }

    await activityService.deleteActivity(activityId);

    res.json({
      success: true,
      message: '活動已刪除'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('刪除活動失敗', { error: error.message });
    const statusCode = error.message === '活動不存在' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || '刪除活動失敗'
    } as ApiResponse);
  }
});

/**
 * 用戶參與活動
 * POST /api/v1/activity/:id/join
 */
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id, 10);
    const userId = (req as any).user.userId;
    const extra = req.body.extra || {};

    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: '無效的活動 ID'
      } as ApiResponse);
    }

    const result = await activityService.participantJoin({
      userId,
      activityId,
      extra
    });

    res.json({
      success: true,
      data: result,
      message: '參與活動成功'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('參與活動失敗', { error: error.message });
    const statusCode = error.message.includes('不存在') || error.message.includes('未在進行中')
      ? 400
      : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || '參與活動失敗'
    } as ApiResponse);
  }
});

/**
 * 獲取排行榜
 * GET /api/v1/activity/:id/leaderboard
 */
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id, 10);

    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: '無效的活動 ID'
      } as ApiResponse);
    }

    const leaderboard = await activityService.getLeaderboard(activityId);

    res.json({
      success: true,
      data: leaderboard
    } as ApiResponse);
  } catch (error: any) {
    logger.error('獲取排行榜失敗', { error: error.message });
    const statusCode = error.message === '活動不存在' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message || '獲取排行榜失敗'
    } as ApiResponse);
  }
});

/**
 * 查詢個人參與進度
 * GET /api/v1/activity/:id/status?userId=
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const activityId = parseInt(id, 10);

    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: '無效的活動 ID'
      } as ApiResponse);
    }

    // 可選登入用戶查詢自己，或指定 userId（需權限）
    let targetUserId: number;
    if (userId) {
      targetUserId = parseInt(userId as string, 10);
      // 如果查詢他人且已登入，驗證是否為本人或管理員
      const authUser = (req as any).user?.userId;
      if (authUser && authUser !== targetUserId) {
        // 暫時跳過權限檢查，後續可加
      }
    } else {
      // 未提供 userId，使用當前登入用戶
      targetUserId = (req as any).user?.userId;
      if (!targetUserId) {
        return res.status(401).json({
          success: false,
          error: '請登入或提供 userId'
        } as ApiResponse);
      }
    }

    const status = await activityService.getUserActivityStatus(targetUserId, activityId);

    if (!status) {
      return res.json({
        success: true,
        data: null,
        message: '尚未參與此活動'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: status
    } as ApiResponse);
  } catch (error: any) {
    logger.error('查詢活動狀態失敗', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || '查詢失敗'
    } as ApiResponse);
  }
});

/**
 * 獲取用戶參與的所有活動
 * GET /api/v1/activity/user/:userId
 */
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUserId = parseInt(userId, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({
        success: false,
        error: '無效的用戶 ID'
      } as ApiResponse);
    }

    const currentUserId = (req as any).user?.userId;
    if (currentUserId !== targetUserId) {
      // 查詢他人，需管理員權限（略）
    }

    const activities = await activityService.getUserActivities(targetUserId);

    res.json({
      success: true,
      data: activities
    } as ApiResponse);
  } catch (error: any) {
    logger.error('獲取用戶活動失敗', { error: error.message });
    res.status(500).json({
      success: false,
      error: '獲取失敗'
    } as ApiResponse);
  }
});

/**
 * 手動發放獎勵（管理員）
 * POST /api/v1/activity/:id/award
 */
router.post('/:id/award', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rankOrTier } = req.body;

    const activityId = parseInt(id, 10);

    if (isNaN(activityId)) {
      return res.status(400).json({
        success: false,
        error: '無效的活動 ID'
      } as ApiResponse);
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '缺少 user_id 參數'
      } as ApiResponse);
    }

    const result = await activityService.awardPrize({
      activityId,
      userId,
      rankOrTier
    });

    res.json({
      success: true,
      data: result,
      message: '獎勵發放成功'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('發放獎勵失敗', { error: error.message });
    const statusCode = error.message === '活動不存在' || error.message === '用戶未參與此活動'
      ? 404
      : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message || '發放獎勵失敗'
    } as ApiResponse);
  }
});

/**
 * 觸發定時任務（管理員/內部）
 * POST /api/v1/activity/run-tasks
 */
router.post('/run-tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const results = await activityService.runScheduledTasks();

    res.json({
      success: true,
      data: results,
      message: '任務執行完成'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('執行定時任務失敗', { error: error.message });
    res.status(500).json({
      success: false,
      error: '任務執行失敗'
    } as ApiResponse);
  }
});

export { router as activityRoutes };
