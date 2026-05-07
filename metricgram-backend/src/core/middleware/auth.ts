import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ApiResponse } from '@metricgram/shared-types';

const prisma = new PrismaClient();

/**
 * JWT 認證 Middleware
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided'
      } as ApiResponse);
    }

    const token = authHeader.substring(7);

    // 驗證 JWT
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // 查詢用戶是否存在
    // (異步 check 需要在 middleware 中處理，這裡簡化為異步調用)
    // 實際應該在 service 層驗證，但這裡為了演示先放過

    // 將用戶信息附加到 request 對象
    (req as any).user = {
      userId: decoded.userId,
      telegramId: decoded.telegramId
    };

    next();
  } catch (error) {
    logger.warn('Auth failed', { error: error.message });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token'
    } as ApiResponse);
  }
}

/**
 * 可選認證（不強制要求登入）
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      (req as any).user = {
        userId: decoded.userId,
        telegramId: decoded.telegramId
      };
    }
  } catch (error) {
    // 忽略錯誤，不認證
  }

  next();
}

/**
 *  management 權限檢查（僅管理員）
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  // TODO: 查詢是否為管理員（目前先跳過，以後可在 User 表加 is_admin 欄位）
  // const user = await prisma.user.findUnique({ where: { id: userId } });
  // if (!user?.isAdmin) { ... }

  next();
}
