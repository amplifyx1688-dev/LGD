import { prisma } from '@/core/database/client';
import { verifyTelegramHash } from '@/core/utils/crypto';
import jwt from 'jsonwebtoken';
import { config } from '@/core/config';
import { ApiResponse } from '@metricgram/shared-types';
import { Logger } from '@/core/utils/logger';

const logger = new Logger('AuthService');

export class AuthService {
  /**
   * Telegram 登錄校驗
   */
  async telegramLogin(data: any): Promise<{ token: string; user: any }> {
    const { id, first_name, last_name, username, photo_url, auth_date, hash } = data;

    // 1. 驗證 Telegram 簽名
    const isValid = verifyTelegramHash(data, config.telegram.token);
    if (!isValid) {
      logger.warn('Invalid Telegram auth attempt', { telegramId: id });
      throw new Error('Invalid authorization');
    }

    // 2. 查找或創建用戶
    let user = await prisma.user.findUnique({
      where: { telegramId: id }
    });

    const isNew = !user;

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: id,
          username: username || null,
          firstName: first_name,
          lastName: last_name || null,
          photoUrl: photo_url || null,
          points: 10, // 新人獎勵
          isVerified: true
        }
      });
      logger.info('New user registered', { userId: user.id });
    } else {
      // 更新最後登錄信息
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

    // 3. 生成 JWT
    const token = jwt.sign(
      { userId: user.id, telegramId: id },
      config.jwt.secret,
      { expiresIn: config.jwt.expire }
    );

    return {
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
    };
  }

  /**
   * 獲取用戶詳情
   */
  async getUserById(userId: number) {
    return await prisma.user.findUnique({
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
        checkinStreak: true,
        checkinCount: true,
        createdAt: true
      }
    });
  }

  /**
   * 驗證 JWT Token
   */
  verifyToken(token: string): any {
    return jwt.verify(token, config.jwt.secret);
  }
}

export const authService = new AuthService();
