import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 驗證類型
 */
export type VerificationType = 'join' | 'private' | 'channel';

/**
 * 驗證服務
 * 負責用戶驗證流程管理
 */
export class VerifyService {
  private readonly CODE_LENGTH = 6;
  private readonly EXPIRY_MINUTES = 5;

  /**
   * 檢查用戶是否已通過驗證
   */
  async isUserVerified(userId: number, groupId?: number): Promise<boolean> {
    const where: any = { userId };

    if (groupId !== undefined) {
      where.groupId = groupId;
    }

    const count = await prisma.verification.count({
      where: {
        ...where,
        isUsed: true,
        verifiedAt: { not: null }
      }
    });

    return count > 0;
  }

  /**
   * 創建驗證記錄
   * @returns 驗證記錄對象（包含驗證碼）
   */
  async createVerification(
    userId: number,
    groupId: number | null,
    type: VerificationType
  ): Promise<{
    id: number;
    code: string;
    expiresAt: Date;
  }> {
    // 生成隨機驗證碼
    const code = this.generateCode();

    // 計算過期時間
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

    // 創建記錄
    const verification = await prisma.verification.create({
      data: {
        userId,
        groupId: groupId || null,
        type,
        code,
        expiresAt
      }
    });

    logger.info('Verification created', {
      verificationId: verification.id,
      userId,
      groupId,
      type,
      code
    });

    return {
      id: verification.id,
      code: verification.code,
      expiresAt: verification.expiresAt
    };
  }

  /**
   * 驗證碼核對
   */
  async verifyCode(userId: number, code: string): Promise<{
    success: boolean;
    verification?: any;
    message: string;
  }> {
    // 查找未過期且未使用的驗證記錄
    const verification = await prisma.verification.findFirst({
      where: {
        userId,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return {
        success: false,
        message: '驗證碼錯誤或已過期'
      };
    }

    // 標記為已使用
    await prisma.verification.update({
      where: { id: verification.id },
      data: {
        isUsed: true,
        verifiedAt: new Date()
      }
    });

    logger.info('Code verified', {
      verificationId: verification.id,
      userId,
      groupId: verification.groupId
    });

    return {
      success: true,
      verification,
      message: '驗證成功'
    };
  }

  /**
   * 根據驗證碼核對（由 Bot 處理器調用）
   */
  async verifyByCode(code: string): Promise<{
    success: boolean;
    verification?: any;
    message: string;
  }> {
    const verification = await prisma.verification.findFirst({
      where: {
        code,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!verification) {
      return {
        success: false,
        message: '驗證碼錯誤或已過期'
      };
    }

    return {
      success: true,
      verification,
      message: '驗證成功'
    };
  }

  /**
   * 獲取待驗證列表
   */
  async getPendingVerifications(groupId?: number): Promise<any[]> {
    const where: any = {
      isUsed: false,
      expiresAt: { gt: new Date() }
    };

    if (groupId !== undefined) {
      where.groupId = groupId;
    }

    const verifications = await prisma.verification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        group: groupId === undefined ? true : false
      },
      orderBy: { createdAt: 'desc' }
    });

    return verifications;
  }

  /**
   * 撤銷驗證
   */
  async revokeVerification(verificationId: number): Promise<boolean> {
    const verification = await prisma.verification.findUnique({
      where: { id: verificationId }
    });

    if (!verification) {
      return false;
    }

    await prisma.verification.delete({
      where: { id: verificationId }
    });

    logger.info('Verification revoked', { verificationId });

    return true;
  }

  /**
   * 清理過期驗證記錄
   */
  async cleanupExpired(): Promise<number> {
    const result = await prisma.verification.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isUsed: true }
        ]
      }
    });

    if (result.count > 0) {
      logger.info('Expired verifications cleaned up', { count: result.count });
    }

    return result.count;
  }

  /**
   * 獲取用戶有效的驗證記錄
   */
  async getUserActiveVerification(
    userId: number,
    groupId: number | null,
    type?: VerificationType
  ): Promise<any | null> {
    const where: any = {
      userId,
      groupId: groupId || null,
      isUsed: false,
      expiresAt: { gt: new Date() }
    };

    if (type) {
      where.type = type;
    }

    const verification = await prisma.verification.findFirst({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return verification;
  }

  /**
   * 生成隨機驗證碼（4-6位數字）
   */
  private generateCode(): string {
    const min = Math.pow(10, this.CODE_LENGTH - 1);
    const max = Math.pow(10, this.CODE_LENGTH) - 1;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code.toString();
  }
}

export const verifyService = new VerifyService();
