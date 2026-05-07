import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

const router = Router();

/**
 * 群組模塊路由
 * 管理 Telegram 群組綁定、配置
 */

/**
 * 獲取用戶綁定的所有群組
 * GET /api/v1/groups
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.userId;

    const groups = await prisma.group.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: groups });
  } catch (error) {
    logger.error('Get groups failed', { error });
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

/**
 * 綁定新群組
 * POST /api/v1/groups/bind
 */
router.post('/bind', [
  body('telegramChatId').isInt(),
  body('title').notEmpty()
], async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { telegramChatId, title, username } = req.body;

    // 檢查是否已綁定
    const existing = await prisma.group.findFirst({
      where: { 
        OR: [
          { telegramChatId },
          { ownerUserId: userId }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Group already bound'
      });
    }

    // 創建綁定
    const group = await prisma.group.create({
      data: {
        telegramChatId,
        title,
        username: username || null,
        ownerUserId: userId,
        modulesEnabled: {
          boot: true,
          activity: false,
          broadcast: false,
          night: false,
          verify: false,
          checkin: false,
          forward: false,
          dice: false,
          carousel: false,
          clean: false
        }
      }
    });

    logger.info('Group bound', { groupId: group.id, chatId: telegramChatId });

    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    logger.error('Bind group failed', { error });
    res.status(500).json({ success: false, error: 'Failed to bind group' });
  }
});

/**
 * 更新群組模塊開關
 * PATCH /api/v1/groups/:id/modules
 */
router.patch('/:id/modules', async (req, res) => {
  try {
    const { id } = req.params;
    const { modulesEnabled } = req.body;

    // 檢查權限（用戶必須是群組所有者）
    const userId = (req as any).user?.userId;
    const group = await prisma.group.findFirst({
      where: { id: parseInt(id), ownerUserId: userId }
    });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // 更新模塊開關
    await prisma.group.update({
      where: { id: parseInt(id) },
      data: { modulesEnabled }
    });

    res.json({ success: true, message: 'Modules updated' });
  } catch (error) {
    logger.error('Update modules failed', { error });
    res.status(500).json({ success: false, error: 'Failed to update modules' });
  }
});

/**
 * 獲取單個群組詳細配置
 * GET /api/v1/groups/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const group = await prisma.group.findFirst({
      where: { id: parseInt(id), ownerUserId: userId },
      include: {
        contentItems: {
          where: { module: 'carousel' },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    res.json({ success: true, data: group });
  } catch (error) {
    logger.error('Get group failed', { error });
    res.status(500).json({ success: false, error: 'Failed to get group' });
  }
});

export { router as groupRoutes };
