import { Router } from 'express';
import { body, query } from 'express-validator';
import { nightService, NightConfig } from './service';
import { logger } from '@/core/utils/logger';

const router = Router();

/**
 * 夜間模塊路由
 */

/**
 * 獲取群組夜間配置
 * GET /api/v1/night/config?groupId=<groupId>
 */
router.get('/config', [
  query('groupId').isInt({ min: 1 }).withMessage('groupId 必須為大於 0 的整數')
], async (req, res) => {
  try {
    const groupId = parseInt(req.query.groupId as string, 10);

    const config = await nightService.getNightConfig(groupId);

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('獲取夜間配置失敗', { error: error.message, query: req.query });
    res.status(500).json({
      success: false,
      error: '獲取夜間配置失敗',
      details: error.message
    });
  }
});

/**
 * 更新群組夜間配置
 * PUT /api/v1/night/config
 * Body: { groupId, enabled?, startTime?, endTime?, muteModules?, allowAdminOverride? }
 */
router.put('/config', [
  body('groupId').isInt({ min: 1 }).withMessage('groupId 必須為大於 0 的整數'),
  body('enabled').optional().isBoolean(),
  body('startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('startTime 格式應為 HH:mm'),
  body('endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('endTime 格式應為 HH:mm'),
  body('muteModules').optional().isArray(),
  body('muteModules.*').optional().isString(),
  body('allowAdminOverride').optional().isBoolean()
], async (req, res) => {
  try {
    const { groupId, enabled, startTime, endTime, muteModules, allowAdminOverride } = req.body;

    const updateData: Partial<NightConfig> = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (muteModules !== undefined) updateData.muteModules = muteModules;
    if (allowAdminOverride !== undefined) updateData.allowAdminOverride = allowAdminOverride;

    await nightService.updateNightConfig(groupId, updateData);

    const updatedConfig = await nightService.getNightConfig(groupId);

    res.json({
      success: true,
      message: '配置已更新',
      data: updatedConfig
    });
  } catch (error: any) {
    logger.error('更新夜間配置失敗', { error: error.message, body: req.body });

    if (error.message.includes('群組不存在')) {
      return res.status(404).json({
        success: false,
        error: '群組不存在'
      });
    }

    res.status(500).json({
      success: false,
      error: '更新夜間配置失敗',
      details: error.message
    });
  }
});

/**
 * 獲取當前夜間狀態
 * GET /api/v1/night/status?groupId=<groupId>
 */
router.get('/status', [
  query('groupId').isInt({ min: 1 }).withMessage('groupId 必須為大於 0 的整數')
], async (req, res) => {
  try {
    const groupId = parseInt(req.query.groupId as string, 10);

    const status = await nightService.getNightStatus(groupId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    logger.error('獲取夜間狀態失敗', { error: error.message, query: req.query });

    if (error.message.includes('群組不存在')) {
      return res.status(404).json({
        success: false,
        error: '群組不存在'
      });
    }

    res.status(500).json({
      success: false,
      error: '獲取夜間狀態失敗',
      details: error.message
    });
  }
});

/**
 * 測試夜間檢查（手動觸發）
 * POST /api/v1/night/test
 * Body: { groupId, overrideStartTime?, overrideEndTime? }
 */
router.post('/test', [
  body('groupId').isInt({ min: 1 }).withMessage('groupId 必須為大於 0 的整數'),
  body('overrideStartTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('覆蓋開始時間格式應為 HH:mm'),
  body('overrideEndTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('覆蓋結束時間格式應為 HH:mm')
], async (req, res) => {
  try {
    const { groupId, overrideStartTime, overrideEndTime } = req.body;

    const result = await nightService.testNightCheck(
      groupId,
      overrideStartTime,
      overrideEndTime
    );

    res.json({
      success: true,
      data: result,
      message: result.isNight ? '夜間模式啟用中' : '夜間模式未啟用'
    });
  } catch (error: any) {
    logger.error('夜間測試失敗', { error: error.message, body: req.body });

    if (error.message.includes('群組不存在')) {
      return res.status(404).json({
        success: false,
        error: '群組不存在'
      });
    }

    res.status(500).json({
      success: false,
      error: '測試失敗',
      details: error.message
    });
  }
});

export { router as nightRoutes };
