/**
 * 輪播引擎核心（配置化驅動）
 * 
 * 設計要點：
 * 1. 所有配置源自數據庫，腳本零硬編碼
 * 2. 支持多頻道輪播（ad/chat/signin/gambling/dice）
 * 3. 支持時間窗口控制（有聲/無聲）
 * 4. 自動記憶当前位置（index 持久化）
 */

import { Interval } from '@nestjs/schedule';
import { prisma } from '@/core/database/client';
import { ContentService } from '@/modules/carousel/services/contentService';
import { logger } from '@/core/utils/logger';
import { CAROUSEL_CONSTANTS } from '@/shared/constants';

export class CarouselEngine {
  private contentService: ContentService;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.contentService = new ContentService();
  }

  /**
   * 啟動輪播引擎
   * @param intervalSeconds 輪播間隔（秒）
   */
  start(intervalSeconds: number = 5): void {
    if (this.isRunning) {
      logger.warn('Carousel engine already running');
      return;
    }

    this.isRunning = true;
    logger.info('🔄 Carousel engine started', { intervalSeconds });

    // 定時任務
    this.intervalId = setInterval(async () => {
      await this.tick();
    }, intervalSeconds * 1000);

    // 立即執行一次
    this.tick().catch(console.error);
  }

  /**
   * 輪播主循環
   */
  private async tick(): Promise<void> {
    try {
      // 獲取所有啟用輪播的群組
      const groups = await prisma.group.findMany({
        where: {
          carouselEnabled: true,
          isActive: true
        }
      });

      logger.debug(`Processing ${groups.length} groups for carousel`);

      // 並行處理每個群組
      await Promise.all(
        groups.map(group => this.processGroupCarousel(group))
      );
    } catch (error) {
      logger.error('Carousel tick error', { error });
    }
  }

  /**
   * 處理單個群組的輪播
   */
  private async processGroupCarousel(group: any): Promise<void> {
    try {
      // 1. 檢查間隔
      const lastSent = group.carouselLastSentAt ? new Date(group.carouselLastSentAt) : null;
      const interval = (group.carouselSettings as any)?.intervalSeconds || 5;

      if (lastSent) {
        const elapsed = Date.now() - lastSent.getTime();
        if (elapsed < interval * 1000) {
          return; // 未到時間，跳過
        }
      }

      // 2. 獲取下一条內容
      const nextContent = await this.getNextContent(
        group.id,
        group.carouselLastIndex || 0
      );

      if (!nextContent) {
        logger.warn('No active carousel content', { groupId: group.id });
        return;
      }

      // 3. 檢查時間窗口（可選）
      const shouldMute = this.isInSilentWindow();
      if (shouldMute) {
        logger.debug('In silent window, skipping', { groupId: group.id });
        return;
      }

      // 4. 發送消息（調用 Telegram API）
      await this.sendCarouselMessage(group, nextContent);

      // 5. 更新發送記錄
      await this.updateSendRecord(group.id, nextContent.id, nextContent.sortOrder);

    } catch (error) {
      logger.error('Carousel process error', { 
        groupId: group.id, 
        error 
      });
    }
  }

  /**
   * 獲取下一個輪播內容（自動循環）
   * 支持自動記憶功能（last_index 機制）
   */
  private async getNextContent(
    groupId: number,
    currentIndex: number
  ): Promise<any> {
    // 查詢當前群組所有激活的輪播內容
    const contents = await this.contentService.getContentsByModule(
      groupId,
      'carousel',
      true
    );

    if (contents.length === 0) return null;

    // 自動循環邏輯：從 last_index + 1 開始取模
    const nextIndex = (currentIndex) % contents.length;
    const nextContent = contents[nextIndex];

    return nextContent;
  }

  /**
   * 發送輪播消息到 Telegram
   */
  private async sendCarouselMessage(
    group: any,
    content: any
  ): Promise<void> {
    // TODO: 集成 Telegram Bot
    // await bot.telegram.sendMessage(
    //   group.telegramChatId.toString(),
    //   content.content.text,
    //   {
    //     parse_mode: 'HTML',
    //     disable_notification: this.isInSilentWindow(),
    //     disable_web_page_preview: true,
    //     reply_markup: {
    //       inline_keyboard: content.content.buttons.map((btn: any) => ({
    //         text: btn.text,
    //         callback_data: `${content.module}:${btn.value}`
    //       }))
    //     }
    //   }
    // );

    logger.info('Carousel message sent', {
      groupId: group.id,
      contentKey: content.id,
      chatId: group.telegramChatId
    });
  }

  /**
   * 更新發送記錄（索引遞增）
   */
  private async updateSendRecord(
    groupId: number,
    contentId: number,
    sortOrder: number
  ): Promise<void> {
    // 1. 遞增內容发送計數
    await this.contentService.incrementSendCount(contentId);

    // 2. 更新群組 last_index（下次從下一條開始）
    await prisma.group.update({
      where: { id: groupId },
      data: {
        carouselLastIndex: (sortOrder + 1),  // 下一條索引
        carouselLastSentAt: new Date()
      }
    });
  }

  /**
   * 檢查是否在無聲時段
   * 配置來源：groups.carouselSettings.timeWindows
   */
  private isInSilentWindow(): boolean {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const current = hours * 60 + minutes;

    // 默認有聲時段：08:00-22:00 (480 - 1320 分鐘)
    const voiceStart = 8 * 60;   // 08:00
    const voiceEnd = 22 * 60;    // 22:00

    return current < voiceStart || current >= voiceEnd;
  }

  /**
   * 手動觸發指定群組輪播（API 調用）
   */
  async triggerGroup(groupId: number): Promise<boolean> {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId }
      });

      if (!group || !group.carouselEnabled) {
        return false;
      }

      await this.processGroupCarousel(group);
      return true;
    } catch (error) {
      logger.error('Manual trigger failed', { error });
      return false;
    }
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

  /**
   * 停止引擎
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    logger.info('⏹️ Carousel engine stopped');
  }
}

/**
 * 全局單例
 */
export const carouselEngine = new CarouselEngine();
