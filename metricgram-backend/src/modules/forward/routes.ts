import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { prisma } from '@/core/database/client';
import { forwardService } from './service';
import { logger } from '@/core/utils/logger';

const router = Router();

/**
 * 關鍵詞管理 API 路由
 */

/**
 * 獲取群組的關鍵詞列表
 * GET /api/v1/forward/keywords?groupId=
 */
router.get(
  '/keywords',
  [
    query('groupId')
      .isInt({ min: 1 })
      .withMessage('groupId 必填且必須大於 0')
  ],
  async (req, res) => {
    try {
      const { groupId } = req.query;
      const parsedGroupId = parseInt(groupId as string);

      const keywords = await forwardService.getKeywords(parsedGroupId);

      res.json({
        success: true,
        data: keywords
      });
    } catch (error: any) {
      logger.error('Get keywords failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '獲取關鍵詞失敗'
      });
    }
  }
);

/**
 * 添加關鍵詞規則
 * POST /api/v1/forward/keywords
 */
router.post(
  '/keywords',
  [
    body('groupId').isInt({ min: 1 }).withMessage('groupId 必填且必須大於 0'),
    body('keyword')
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('關鍵詞長度需在 1-100 字符之間'),
    body('action')
      .isIn(['forward', 'reply', 'ban', 'delete'])
      .withMessage('action 必須是 forward/reply/ban/delete'),
    body('target')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('target 最大長度 500 字符')
  ],
  async (req, res) => {
    try {
      const { groupId, keyword, action, target } = req.body;

      // 檢查是否已存在相同關鍵詞
      const existing = await forwardService.getKeywordByKeywordAndGroup(
        keyword.trim(),
        parseInt(groupId)
      );
      if (existing) {
        return res.status(409).json({
          success: false,
          message: '關鍵詞已存在'
        });
      }

      const rule = await forwardService.addKeyword({
        groupId: parseInt(groupId),
        keyword: keyword.trim(),
        action,
        target: target?.trim() || undefined
      });

      res.status(201).json({
        success: true,
        data: rule,
        message: '關鍵詞添加成功'
      });
    } catch (error: any) {
      logger.error('Add keyword failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '添加關鍵詞失敗'
      });
    }
  }
);

/**
 * 批量添加關鍵詞
 * POST /api/v1/forward/keywords/bulk
 */
router.post(
  '/keywords/bulk',
  [
    body('groupId').isInt({ min: 1 }).withMessage('groupId 必填且必須大於 0'),
    body('keywords').isArray({ min: 1 }).withMessage('keywords 必須為陣列'),
    body('keywords.*.keyword').notEmpty().withMessage('關鍵詞不能為空'),
    body('keywords.*.action')
      .isIn(['forward', 'reply', 'ban', 'delete'])
      .withMessage('action 無效'),
    body('defaultAction')
      .optional()
      .isIn(['forward', 'reply', 'ban', 'delete'])
  ],
  async (req, res) => {
    try {
      const { groupId, keywords, defaultAction, defaultTarget } = req.body;

      const results = [];
      for (const item of keywords) {
        try {
          const action = item.action || defaultAction;
          if (!action) {
            results.push({
              success: false,
              error: '缺少 action（需在項目或 defaultAction 中指定）',
              keyword: item.keyword
            });
            continue;
          }

          const rule = await forwardService.addKeyword({
            groupId: parseInt(groupId),
            keyword: item.keyword.trim(),
            action,
            target: item.target || defaultTarget
          });
          results.push({ success: true, data: rule });
        } catch (err: any) {
          // 跳過重複關鍵詞，繼續處理其他
          if (err.message === '關鍵詞已存在') {
            logger.warn('Duplicate keyword skipped', { keyword: item.keyword });
            continue;
          }
          results.push({ success: false, error: err.message, keyword: item.keyword });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: true,
        message: `成功添加 ${successCount} 個關鍵詞`,
        data: results
      });
    } catch (error: any) {
      logger.error('Bulk add keywords failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '批量添加失敗'
      });
    }
  }
);

/**
 * 更新關鍵詞規則
 * PUT /api/v1/forward/keywords/:id
 */
router.put(
  '/keywords/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('無效的 ID'),
    body('keyword').optional().trim().isLength({ min: 1, max: 100 }),
    body('action')
      .optional()
      .isIn(['forward', 'reply', 'ban', 'delete']),
    body('target').optional().isString().isLength({ max: 500 }),
    body('isActive').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates: any = {};

      if (req.body.keyword !== undefined) updates.keyword = req.body.keyword.trim();
      if (req.body.action !== undefined) updates.action = req.body.action;
      if (req.body.target !== undefined) updates.target = req.body.target?.trim() || null;
      if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

      const rule = await forwardService.updateKeyword(parseInt(id), updates);

      if (!rule) {
        return res.status(404).json({
          success: false,
          message: '關鍵詞不存在'
        });
      }

      res.json({
        success: true,
        data: rule,
        message: '關鍵詞更新成功'
      });
    } catch (error: any) {
      logger.error('Update keyword failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '更新關鍵詞失敗'
      });
    }
  }
);

/**
 * 刪除關鍵詞規則
 * DELETE /api/v1/forward/keywords/:keyword
 */
router.delete(
  '/keywords/:keyword',
  [
    param('keyword').notEmpty().withMessage('關鍵詞不能為空'),
    query('groupId').isInt({ min: 1 }).withMessage('groupId 必填')
  ],
  async (req, res) => {
    try {
      const { keyword } = req.params;
      const { groupId } = req.query;

      const deleted = await forwardService.removeKeyword(keyword, parseInt(groupId as string));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '關鍵詞不存在'
        });
      }

      res.json({
        success: true,
        message: '關鍵詞已刪除'
      });
    } catch (error: any) {
      logger.error('Delete keyword failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '刪除關鍵詞失敗'
      });
    }
  }
);

/**
 * 測試關鍵詞匹配
 * POST /api/v1/forward/test
 */
router.post(
  '/test',
  [
    body('text').notEmpty().withMessage('測試文本必填'),
    body('groupId').optional().isInt({ min: 1 }).withMessage('groupId 必須為整數')
  ],
  async (req, res) => {
    try {
      const { text, groupId } = req.body;

      if (!groupId) {
        // 測試所有群組
        const allRules = await prisma.forwardKeyword.findMany({
          where: { isActive: true },
          include: {
            group: {
              select: { id: true, title: true, telegramChatId: true }
            }
          },
          orderBy: [{ groupId: 'asc' }]
        });

        const matches: any[] = [];
        for (const rule of allRules) {
          const pattern = forwardService.wildcardToRegExp(rule.keyword);
          if (pattern.test(text)) {
            matches.push({
              keyword: rule.keyword,
              action: rule.action,
              target: rule.target,
              groupId: rule.groupId,
              groupTitle: rule.group.title
            });
          }
        }

        return res.json({
          success: true,
          data: {
            text,
            matched: matches.length > 0,
            matches
          }
        });
      }

      // 測試特定群組
      const rules = await forwardService.getKeywords(parseInt(groupId));
      // 找出第一個匹配的規則
      const matchedRule = rules.find(rule => {
        const pattern = forwardService.wildcardToRegExp(rule.keyword);
        return pattern.test(text);
      }) || null;

      res.json({
        success: true,
        data: {
          text,
          matched: !!matchedRule,
          rule: matchedRule
        }
      });
    } catch (error: any) {
      logger.error('Test keyword failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '測試失敗'
      });
    }
  }
);

/**
 * 獲取所有關鍵詞（跨群組，用於管理）
 * GET /api/v1/forward/keywords/all
 */
router.get(
  '/keywords/all',
  async (req, res) => {
    try {
      const rules = await prisma.forwardKeyword.findMany({
        include: {
          group: {
            select: {
              id: true,
              title: true,
              telegramChatId: true
            }
          }
        },
        orderBy: [
          { groupId: 'asc' },
          { id: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: rules.map(rule => ({
          id: rule.id,
          keyword: rule.keyword,
          action: rule.action,
          target: rule.target,
          isActive: rule.isActive,
          groupId: rule.groupId,
          group: rule.group
        }))
      });
    } catch (error: any) {
      logger.error('Get all keywords failed', { error });
      res.status(500).json({
        success: false,
        message: '獲取失敗'
      });
    }
  }
);

/**
 * 切換關鍵詞狀態
 * PATCH /api/v1/forward/keywords/:id/status
 */
router.patch(
  '/keywords/:id/status',
  [
    param('id').isInt({ min: 1 }).withMessage('無效的 ID'),
    body('isActive').isBoolean().withMessage('isActive 必须為布林值')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const rule = await prisma.forwardKeyword.update({
        where: { id: parseInt(id) },
        data: { isActive },
        include: {
          group: {
            select: {
              id: true,
              title: true,
              telegramChatId: true
            }
          }
        }
      });

      logger.info('Keyword status toggled', {
        id: rule.id,
        isActive: rule.isActive
      });

      res.json({
        success: true,
        data: {
          id: rule.id,
          keyword: rule.keyword,
          isActive: rule.isActive
        },
        message: `關鍵詞已${isActive ? '啟用' : '禁用'}`
      });
    } catch (error: any) {
      logger.error('Toggle keyword status failed', { error });
      res.status(500).json({
        success: false,
        message: error.message || '操作失敗'
      });
    }
  }
);

export { router as forwardRoutes };
