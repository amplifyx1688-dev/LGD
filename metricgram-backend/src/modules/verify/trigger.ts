import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { VerifyService } from './service';

/**
 * 驗證觸發器
 * 由群組消息處理器調用，當用戶加入群組時自動觸發驗證流程
 */
export class VerifyTrigger {
  private verifyService: VerifyService;

  constructor() {
    this.verifyService = new VerifyService();
  }

  /**
   * 觸發群組加入驗證
   * 當用戶加入群組時調用
   */
  async triggerJoinVerification(
    userId: number,
    groupId: number,
    bot: any
  ): Promise<{
    triggered: boolean;
    message: string;
  }> {
    // 1. 檢查群組是否啟用驗證
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return {
        triggered: false,
        message: '群組不存在'
      };
    }

    // 檢查是否啟用入群驗證
    if (!group.verifyJoinEnabled) {
      return {
        triggered: false,
        message: '群組未啟用入群驗證'
      };
    }

    // 2. 檢查用戶是否已經驗證過此群組
    const isVerified = await this.verifyService.isUserVerified(userId, groupId);
    if (isVerified) {
      return {
        triggered: false,
        message: '用戶已完成驗證'
      };
    }

    // 3. 檢查是否已有待處理的驗證
    const pending = await this.verifyService.getUserActiveVerification(
      userId,
      groupId,
      'join'
    );

    if (pending) {
      return {
        triggered: false,
        message: '已有待處理的驗證請求'
      };
    }

    // 4. 創建驗證記錄
    const verification = await this.verifyService.createVerification(
      userId,
      groupId,
      'join'
    );

    // 5. 發送驗證消息到用戶（私信）
    try {
      await bot.telegram.sendMessage(
        userId,
        `🔐 <b>歡迎加入 ${group.title}</b>\n\n請輸入驗證碼完成入群驗證：\n🔢 <code>${verification.code}</code>\n\n⏰ 驗證碼有效期：5 分鐘\n\n💡 請直接向 bot 回覆此訊息即可`,
        {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        }
      );

      logger.info('Join verification message sent', {
        userId,
        groupId,
        verificationId: verification.id
      });

      return {
        triggered: true,
        message: '已發送驗證消息'
      };
    } catch (error: any) {
      logger.error('Failed to send verification message', { error });

      // 無法發送私信（用戶未開啟與 bot 對話）
      return {
        triggered: false,
        message: '無法向用戶發送私信，請先與 bot 建立聯絡'
      };
    }
  }

  /**
   * 批量檢測待處理驗證（定時任務）
   */
  async checkPendingVerifications(): Promise<{
    total: number;
    expired: number;
    pending: number;
  }> {
    // 清理過期記錄
    const expiredCount = await this.verifyService.cleanupExpired();

    // 獲取待處理數量
    const pending = await this.verifyService.getPendingVerifications();
    const pendingCount = pending.filter((v) => !v.isUsed).length;

    return {
      total: pending.length,
      expired: expiredCount,
      pending: pendingCount
    };
  }
}

export const verifyTrigger = new VerifyTrigger();
