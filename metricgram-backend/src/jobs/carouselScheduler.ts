import { logger } from '@/core/utils/logger';
import { ContentService } from '@/modules/carousel/services/contentService';
import { prisma } from '@/core/database/client';
import { CAROUSEL_CONSTANTS } from '@/shared/constants';

/**
 * 轮播调度器（可配置化）
 *
 * 核心逻辑：
 * 1. 遍历所有启用轮播的群组
 * 2. 根据上次发送记录，轮到下一条内容
 * 3. 检查时间窗口（有声/无声）
 * 4. 发送消息并更新索引
 *
 * 配置存储在数据库：
 * - groups.carouselSettings: 群组配置
 * - groups.carouselLastIndex: 当前索引位置
 * - groups.carouselLastSentAt: 上次发送时间
 * - carousel_content: 轮播内容列表
 */
export class CarouselScheduler {
  private contentService: ContentService;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private bot?: any;  // Telegraf<Context>

  constructor() {
    this.contentService = new ContentService();
  }

  /**
   * 設置 Bot 實例（用於發送消息）
   */
  setBot(bot: any): void {
    this.bot = bot;
  }

  /**
   * 啟動調度器（每5秒執行一次）
   */
  start(intervalSeconds: number = 5): void {
    if (this.isRunning) return;

    this.isRunning = true;
    logger.info('🚀 Carousel scheduler started', { intervalSeconds });

    this.intervalId = setInterval(async () => {
      await this.tick();
    }, intervalSeconds * 1000);

    // 立即執行一次
    this.tick().catch(console.error);
  }

  /**
   * 停止調度器
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    logger.info('⏹️ Carousel scheduler stopped');
  }

  /**
   * 定時任務（遍歷所有群組）
   */
  private async tick(): Promise<void> {
    try {
      const groups = await prisma.group.findMany({
        where: {
          carouselEnabled: true,
          isActive: true
        }
      });

      for (const group of groups) {
        await this.processGroup(group);
      }
    } catch (error) {
      logger.error('Carousel tick failed', { error });
    }
  }

  /**
   * 處理單個群組的輪播
   */
  private async processGroup(group: any): Promise<void> {
    try {
      const carouselConfig = group.carouselSettings as any;
      const interval = carouselConfig?.intervalSeconds || CAROUSEL_CONSTANTS.DEFAULT_INTERVAL_SECONDS;

      // 檢查是否達到發送間隔
      const lastSent = group.carouselLastSentAt ? new Date(group.carouselLastSentAt) : null;
      if (lastSent) {
        const diffMs = Date.now() - lastSent.getTime();
        if (diffMs < interval * 1000) {
          return;
        }
      }

      // 獲取下一条輪播內容
      const nextContent = await this.getNextContent(
        group.id,
        group.carouselLastIndex || 0
      );

      if (!nextContent) {
        logger.warn('No carousel content available', { groupId: group.id });
        return;
      }

      // 檢查時間窗口
      this.checkTimeWindow(group, nextContent);

      // 發送消息
      if (!this.bot) {
        throw new Error('Bot not set in carouselScheduler');
      }
      await this.sendContent(this.bot, group.telegramChatId.toString(), nextContent);

      // 更新發送記錄
      await prisma.group.update({
        where: { id: group.id },
        data: {
          carouselLastIndex: nextContent.sortOrder + 1,
          carouselLastSentAt: new Date()
        }
      });

      await this.contentService.incrementSendCount(nextContent.id);

      logger.info('Carousel message sent', {
        groupId: group.id,
        contentKey: nextContent.contentKey,
        chatId: group.telegramChatId
      });

    } catch (error: any) {
      // 跳過時間窗口不記錄為錯誤
      if (error.message === 'SKIPPED_BEFORE_START' || error.message === 'SKIPPED_AFTER_END') {
        return;
      }
      logger.error('Process group carousel failed', {
        groupId: group.id,
        error
      });
    }
  }

  /**
   * 檢查時間窗口（有聲/無聲）
   * 如果不在時間窗口内，跳過發送
   */
  private checkTimeWindow(group: any, content: any): void {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const startTime = content.display?.startTime;
    const endTime = content.display?.endTime;

    if (startTime && currentTime < startTime) {
      logger.debug('Carousel skipped - before start time', {
        groupId: group.id,
        startTime,
        currentTime
      });
      throw new Error('SKIPPED_BEFORE_START');
    }

    if (endTime && currentTime > endTime) {
      logger.debug('Carousel skipped - after end time', {
        groupId: group.id,
        endTime,
        currentTime
      });
      throw new Error('SKIPPED_AFTER_END');
    }
  }

  /**
   * 發送輪播內容到群組
   */
  private async sendContent(bot: any, chatId: string, content: any): Promise<void> {
    try {
      const { image, text, buttons } = content.content;

      const markup = buttons && buttons.length > 0 ? {
        inline_keyboard: this.buildButtons(buttons)
      } : undefined;

      if (image) {
        await bot.telegram.sendPhoto(chatId, {
          photo: image,
          caption: text,
          parse_mode: 'HTML',
          ...(markup && { reply_markup: markup })
        });
      } else {
        await bot.telegram.sendMessage(chatId, {
          text,
          parse_mode: 'HTML',
          ...(markup && { reply_markup: markup })
        });
      }

    } catch (error: any) {
      if (error.message === 'SKIPPED_BEFORE_START' || error.message === 'SKIPPED_AFTER_END') {
        throw error;
      }
      throw error;
    }
  }

  /**
   * 構建 Telegram 按格式
   */
  private buildButtons(buttons: any[]): any[] {
    const rows: Record<number, any[]> = {};

    buttons.forEach(btn => {
      const row = btn.row || 0;
      if (!rows[row]) rows[row] = [];

      rows[row].push({
        text: btn.text,
        callback_data: btn.value
      });
    });

    return Object.keys(rows)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => rows[key]);
  }

  /**
   * 獲取下一条應該發送的內容
   * 支持自動記憶功能（配置化）
   */
  private async getNextContent(
    groupId: number,
    currentIndex: number
  ): Promise<any> {
    const contents = await this.contentService.getContentsByModule(
      groupId,
      'carousel',
      true
    );

    if (contents.length === 0) return null;

    let nextIndex = currentIndex % contents.length;

    for (let i = 0; i < contents.length; i++) {
      const candidate = contents[nextIndex];
      if (candidate.display.isActive) {
        return candidate;
      }
      nextIndex = (nextIndex + 1) % contents.length;
    }

    return contents[0];
  }

  /**
   * 手動觸發某個群組的下一條輪播（測試用）
   */
  async triggerGroup(groupId: number): Promise<void> {
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new Error('Group not found');
    }

    await this.processGroup(group);
  }

  /**
   * 重置群組輪播索引
   */
  async resetGroupIndex(groupId: number): Promise<void> {
    await prisma.group.update({
      where: { id: groupId },
      data: {
        carouselLastIndex: 0,
        carouselLastSentAt: null
      }
    });

    logger.info('Carousel index reset', { groupId });
  }
}

/**
 * 全局輪播調度器單例
 */
export const carouselScheduler = new CarouselScheduler();

/**
 * 手動觸發輪播（API 調用）
 */
export async function triggerCarousel(groupId: number): Promise<boolean> {
  try {
    await carouselScheduler.triggerGroup(groupId);
    return true;
  } catch (error) {
    logger.error('Failed to trigger carousel', { error });
    return false;
  }
}

// 如果直接運行
if (require.main === module) {
  carouselScheduler.start(5);
}
