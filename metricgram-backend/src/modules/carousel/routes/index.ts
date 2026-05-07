import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { authMiddleware } from '@/core/middleware/auth';
import { errorHandler } from '@/core/middleware/error';
import { z } from 'zod';
import { logger } from '@/core/utils/logger';
import { contentService } from '@/modules/carousel/services/contentService';

const router = Router();

/**
 * 配置验证 Schema（Zod）
 */
const createConfigSchema = z.object({
  contentKey: z.string().min(1),
  contentType: z.enum(['advertisement', 'chat', 'signin', 'gambling', 'dice']),
  contentJson: z.object({
    image: z.string().optional(),
    text: z.string().min(1),
    buttons: z.array(z.object({
      text: z.string(),
      type: z.enum(['link', 'callback', 'webapp', 'url_jump', 'private_callback']),
      value: z.string()
    }))
  }),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0)
});

// ============================================
// 保健-content 模組 CRUD（配置化核心）
// ============================================

/**
 * 獲取所有輪播內容
 * GET /api/v1/carousel/content?groupId=1&module=carousel
 */
router.get('/content', authMiddleware, async (req, res) => {
  try {
    const { groupId, module, activeOnly } = req.query;
    
    // 參數處理...
    const contents = await contentService.getContentsByModule(
      groupId as any,
      module as string,
      activeOnly !== 'false'
    );

    res.json({ success: true, data: contents });
  } catch (error: any) {
    logger.error('Get carousel content failed', { error });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch content' 
    });
  }
});

/**
 * 獲取單個內容配置
 * GET /api/v1/carousel/content/:contentKey
 */
router.get('/content/:contentKey', authMiddleware, async (req, res) => {
  try {
    const { contentKey } = req.params;
    const { groupId } = req.query;

    const content = await contentService.getContent(
      groupId as any,
      contentKey
    );

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        error: 'Content not found' 
      });
    }

    res.json({ success: true, data: content });
  } catch (error) {
    logger.error('Get content by key failed', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch content' });
  }
});

/**
 * 創建/更新內容配置（Upsert）
 * 注意：所有文字均以 UTF-8 存儲
 * PUT /api/v1/carousel/content/:contentKey
 */
router.put('/content/:contentKey', authMiddleware, [
  body('contentJson').isJSON().withMessage('contentJson must be valid JSON')
], async (req, res) => {
  try {
    const { contentKey } = req.params;
    const { groupId, module, contentType, contentJson, triggerType, triggerConfig, isActive, sortOrder } = req.body;

    // 使用 Zod 做運行時驗證
    const validated = createConfigSchema.parse({
      contentKey,
      module: module || 'carousel',
      contentType,
      contentJson,
      isActive,
      sortOrder
    });

    // 存儲（確保 UTF-8）
    const result = await contentService.upsertContent({
      groupId,
      contentKey: validated.contentKey,
      module: validated.module,
      contentType: validated.contentType,
      contentJson: validated.contentJson,
      isActive: validated.isActive,
      sortOrder: validated.sortOrder
    });

    logger.info('Content created/updated', { 
      contentKey: validated.contentKey,
      module: validated.module
    });

    res.json({ success: true, data: result, message: 'Content saved' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }

    logger.error('Upsert content failed', { error });
    res.status(500).json({ success: false, error: 'Failed to save content' });
  }
});

/**
 * 刪除內容配置
 * DELETE /api/v1/carousel/content/:contentKey
 */
router.delete('/content/:contentKey', authMiddleware, async (req, res) => {
  try {
    const { contentKey } = req.params;
    const { groupId } = req.query;

    const deleted = await contentService.deleteContent(
      groupId as any,
      contentKey
    );

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        error: 'Content not found' 
      });
    }

    res.json({ success: true, message: 'Content deleted' });
  } catch (error) {
    logger.error('Delete content failed', { error });
    res.status(500).json({ success: false, error: 'Failed to delete content' });
  }
});

/**
 * 更新排序
 * PATCH /api/v1/carousel/content/sort-order
 */
router.patch('/content/sort-order', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body; // [{ contentKey, sortOrder }]

    if (!Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid items array' 
      });
    }

    await contentService.updateSortOrder(null, items);
    res.json({ success: true, message: 'Sort order updated' });
  } catch (error) {
    logger.error('Update sort order failed', { error });
    res.status(500).json({ success: false, error: 'Failed to update sort order' });
  }
});

/**
 * 獲取輪播配置（單個群組）
 * GET /api/v1/carousel/config/:groupId
 */
router.get('/config/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    // 查詢群組輪播配置
    // const group = await groupService.getGroup(parseInt(groupId));
    
    res.json({ success: true, data: {/* config */} });
  } catch (error) {
    logger.error('Get carousel config failed', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch config' });
  }
});

/**
 * 更新輪播配置（時間窗口、間隔）
 * PUT /api/v1/carousel/config/:groupId
 */
router.put('/config/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { intervalSeconds, startIndex, timeWindows } = req.body;

    // 更新群組輪播配置
    // await groupService.updateCarouselConfig(parseInt(groupId), { ... });

    res.json({ success: true, message: 'Config updated' });
  } catch (error) {
    logger.error('Update carousel config failed', { error });
    res.status(500).json({ success: false, error: 'Failed to update config' });
  }
});

export { router as carouselRoutes };
