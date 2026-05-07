import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 夜間模式服務
 */
export class NightService {
  /**
   * 獲取夜間配置
   */
  async getNightConfig(groupId: number) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { carouselSettings: true }
    });

    return group?.carouselSettings as any;
  }

  /**
   * 檢查是否為夜間時段
   */
  isNightTime(startTime: string = '00:00', endTime: string = '06:00'): boolean {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const start = startH * 60 + startM;
    const end = endH * 60 + endM;

    if (start < end) {
      return current >= start && current < end;
    } else {
      // 跨夜，例如 22:00 - 06:00
      return current >= start || current < end;
    }
  }

  /**
   * 判斷消息是否應該靜音
   */
  shouldMuteMessage(messageType: string): boolean {
    // 只有特定標記的消息可在夜間發送
    const allowedTypes = ['important', 'system', 'admin'];
    return !allowedTypes.includes(messageType);
  }
}

export const nightService = new NightService();
