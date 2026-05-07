import { Router } from 'express';
import { body } from 'express-validator';
import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { verifyTelegramHash } from '@/core/utils/crypto';
import jwt from 'jsonwebtoken';
import { config } from '@/core/config';
import { ApiResponse } from '@metricgram/shared-types';

const router = Router();

/**
 * 認證模塊路由
 * 注意：所有響應都是 JSON UTF-8
 */

/**
 * Telegram 登錄
 * POST /api/v1/auth/telegram
 * Body: { id, first_name, last_name, username, photo_url, auth_date, hash }
 */
router.post('/telegram', [
  body('id').isInt(),
  body('first_name').notEmpty(),
  body('hash').notEmpty(),
  body('auth_date').isInt()
], async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = req.body;

    // 1. 驗證 Telegram 簽名（必需！）
    const isValid = verifyTelegramHash(req.body, config.telegram.token);
    if (!isValid) {
      logger.warn('Invalid Telegram hash', { telegramId: id });
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization data'
      } as ApiResponse);
    }

    // 2. 查找或創建用戶
    let user = await prisma.user.findUnique({
      where: { telegramId: id }
    });

    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: id,
          username: username || null,
          firstName: first_name,
          lastName: last_name || null,
          photoUrl: photo_url || null,
          points: 10, // 新用戶贈送 10 積分
          isVerified: true
        }
      });
      logger.info('New user created', { userId: user.id, telegramId: id });
    } else {
      // 更新最後登入時間等信息
      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          firstName: first_name,
          lastName: last_name,
          photoUrl: photo_url
        }
      });
    }

    // 3. 生成 JWT Token
    const token = jwt.sign(
      { userId: user.id, telegramId: id },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    // 4. 返回響應（前?端需要 user 信息和 token）
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
          points: user.points,
          isVerified: user.isVerified
        }
      },
      message: isNewUser ? 'Welcome!' : 'Login successful'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('Telegram login failed', { error });
    res.status(500).json({
      success: false,
      error: 'Login failed'
    } as ApiResponse);
  }
});

/**
 * 獲取當前用戶信息
 * GET /api/v1/auth/me
 */
router.get('/me', async (req, res) => {
  // 從 auth middleware 獲取 userId
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    } as ApiResponse);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        points: true,
        balanceUsdt: true,
        isVerified: true,
        checkinStreak: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Get user failed', { error });
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

/**
 * 刷新 Token
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  // 實現 RT
  res.json({ success: true, data: { token: 'new_token' } });
});

/**
 * 登出
 * POST /api/v1/auth/logout
 */
router.post('/logout', async (req, res) => {
  // 可以將 token 加入黑名單（可選）
  res.json({ success: true, message: 'Logged out' });
});

export { router as authRoutes };
