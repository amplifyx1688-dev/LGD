import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 清潔服務
 */
export class CleanService {
  /**
   * 執行即時清理
   */
  async cleanNow(groupId: number, types: string[]): Promise<number> {
    let cleaned = 0;

    for (const type of types) {
      // 根據類型查詢並刪除消息
      // 注意：需要 Telegram Bot API 支持
      // 這裡只是示例邏輯
      logger.info('Cleaning messages', { groupId, type });
      cleaned += 1;
    }

    return cleaned;
  }

  /**
   * 定時清理任務
   */
  async scheduledClean(intervalMinutes: number = 5): Promise<void> {
    const groups = await prisma.group.findMany({
      where: { cleanEnabled: true, isActive: true }
    });

    for (const group of groups) {
      await this.cleanNow(group.id, ['member_join', 'member_leave']);
    }
  }
}

export const cleanService = new CleanService();
