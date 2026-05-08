import prisma from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { bot } from '@/bot';
import { BROADCAST_CONSTANTS } from '@/shared/constants';

/**
 * 廣播服務
 * 負責管理廣播任務的創建、發送、排程與狀態查詢
 */
export class BroadcastService {
  /**
   * 創建廣播任務
   * @param params 包含消息類型、內容、目標群組、排程時間等
   */
  async createBroadcast(params: {
    messageType: string;
    contentJson: any;
    targetGroupIds?: bigint[] | number[];
    scheduledAt?: Date;
    timeWindowStart?: string;
    timeWindowEnd?: string;
  }) {
    const { messageType, contentJson, targetGroupIds, scheduledAt, timeWindowStart, timeWindowEnd } = params;

    // 將目標群組 ID 存入 contentJson，因 broadcast_queue 僅支援單個 groupId 欄位
    // 注意：bigint 無法直接 JSON 序列化，需轉為字串
    const serializableGroupIds = targetGroupIds
      ? targetGroupIds.map(id => typeof id === 'bigint' ? id.toString() : id)
      : null;

    const enrichedContent = {
      ...contentJson,
      targetGroupIds: serializableGroupIds
    };

    const broadcast = await prisma.broadcastQueue.create({
      data: {
        messageType,
        contentJson: JSON.stringify(enrichedContent), // 存成 JSON 字串
        scheduledAt: scheduledAt || new Date(),
        status: 'pending',
        timeWindowStart: timeWindowStart || null,
        timeWindowEnd: timeWindowEnd || null
      }
    });

    logger.info('廣播任務已創建', {
      id: broadcast.id,
      type: messageType,
      targetCount: targetGroupIds?.length || 0,
      scheduledAt: broadcast.scheduledAt
    });

    return broadcast;
  }

  /**
   * 立即發送廣播（遍歷群組調用 Telegram API）
   * @param groupIds 目標群組 ID 數組
   * @param message 消息物件 { type, content, options? }
   */
  async sendNow(
    groupIds: bigint[] | number[],
    message: {
      type: 'text' | 'photo' | 'video' | 'document' | 'sticker' | 'animation';
      content: any;
      options?: any;
    }
  ) {
    const results: Array<{
      groupId: bigint;
      success: boolean;
      error?: string;
      messageId?: number;
    }> = [];

    for (const rawId of groupIds) {
      const groupId = BigInt(rawId);
      try {
        const result = await this.sendMessageToGroup(groupId, message);
        results.push({ groupId, success: true, messageId: result.message_id });
      } catch (error: any) {
        logger.error('立即廣播發送失敗', { groupId, error: error.message });
        results.push({ groupId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * 定時任務：處理到期的廣播
   * 由 cron job 定期調用（例如每分鐘）
   */
  async scheduleBroadcast() {
    const now = new Date();

    const pendingBroadcasts = await prisma.broadcastQueue.findMany({
      where: {
        status: 'pending',
        scheduledAt: { lte: now }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    for (const broadcast of pendingBroadcasts) {
      try {
        // 解析 contentJson（兼容字串或物件）
        const content = typeof broadcast.contentJson === 'string'
          ? JSON.parse(broadcast.contentJson)
          : broadcast.contentJson;

        const targetGroupIds = content.targetGroupIds as bigint[] | number[] | null;

        if (!targetGroupIds || !Array.isArray(targetGroupIds) || targetGroupIds.length === 0) {
          logger.warn('廣播任務無目標群組，自動取消', { id: broadcast.id });
          await prisma.broadcastQueue.update({
            where: { id: broadcast.id },
            data: { status: 'cancelled', errorMessage: '無目標群組' }
          });
          continue;
        }

        // 檢查時間窗口（如有）
        if (broadcast.timeWindowStart || broadcast.timeWindowEnd) {
          const hour = now.getHours();
          const minute = now.getMinutes();
          const current = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const start = broadcast.timeWindowStart || '00:00';
          const end = broadcast.timeWindowEnd || '23:59';
          if (current < start || current > end) {
            logger.info('當前時間不在發送窗口，跳過此廣播', { id: broadcast.id, window: `${start}-${end}` });
            continue; // 不更新狀態，下一次 schedule 還會嘗試
          }
        }

        let successCount = 0;
        for (const gid of targetGroupIds) {
          try {
            await this.sendMessageToGroup(BigInt(gid), {
              type: broadcast.messageType,
              content: content
            });
            successCount++;
          } catch (err: any) {
            logger.error('發送廣播到群組失敗', { broadcastId: broadcast.id, groupId: gid, error: err.message });
          }
        }

        const newStatus = successCount > 0 ? 'sent' : 'failed';
        await prisma.broadcastQueue.update({
          where: { id: broadcast.id },
          data: {
            status: newStatus,
            sentAt: new Date(),
            errorMessage: successCount === 0 ? '所有群組發送失敗' : null
          }
        });

        logger.info('定時廣播處理完成', {
          id: broadcast.id,
          total: targetGroupIds.length,
          success: successCount
        });
      } catch (error: any) {
        logger.error('處理定時廣播失敗', { id: broadcast.id, error: error.message });
        await prisma.broadcastQueue.update({
          where: { id: broadcast.id },
          data: {
            status: 'failed',
            errorMessage: error.message
          }
        });
      }
    }
  }

  /**
   * 獲取隊列狀態
   */
  async getQueueStatus() {
    const [pending, sent, failed, cancelled] = await Promise.all([
      prisma.broadcastQueue.count({ where: { status: 'pending' } }),
      prisma.broadcastQueue.count({ where: { status: 'sent' } }),
      prisma.broadcastQueue.count({ where: { status: 'failed' } }),
      prisma.broadcastQueue.count({ where: { status: 'cancelled' } })
    ]);

    const recent = await prisma.broadcastQueue.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        messageType: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        errorMessage: true,
        createdAt: true
      }
    });

    return {
      counts: {
        pending,
        sent,
        failed,
        cancelled,
        total: pending + sent + failed + cancelled
      },
      recent
    };
  }

  /**
   * 取消任務
   */
  async cancelBroadcast(broadcastId: number) {
    const result = await prisma.broadcastQueue.update({
      where: { id: broadcastId },
      data: { status: 'cancelled' }
    });
    logger.info('廣播任務已取消', { id: broadcastId });
    return result;
  }

  /**
   * 發送消息到單個群組（內部方法）
   * @param groupId 群組 ID（會轉換為 Telegram 接受的格式）
   */
  private async sendMessageToGroup(
    groupId: bigint,
    message: { type: string; content: any; options?: any }
  ) {
    const { type, content, options = {} } = message;

    // Telegram API 需要 chatId 為字串或數字，bigint 需轉為字串
    const chatId = groupId.toString();

    const sendOptions: any = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options
    };

    if (content.replyMarkup) {
      sendOptions.reply_markup = content.replyMarkup;
    }

    switch (type) {
      case 'text': {
        const text = content.text || '';
        if (!text) throw new Error('文本消息內容不能為空');
        return await bot.telegram.sendMessage(chatId, text, sendOptions);
      }

      case 'photo':
        return await bot.telegram.sendPhoto(chatId, content.photoUrl, {
          ...sendOptions,
          caption: content.caption || ''
        });

      case 'video':
        return await bot.telegram.sendVideo(chatId, content.videoUrl, {
          ...sendOptions,
          caption: content.caption || ''
        });

      case 'document':
        return await bot.telegram.sendDocument(chatId, content.documentUrl, {
          ...sendOptions,
          caption: content.caption || '',
          filename: content.filename
        });

      case 'sticker':
        return await bot.telegram.sendSticker(chatId, content.stickerFileId);

      case 'animation':
        return await bot.telegram.sendAnimation(chatId, content.animationUrl, {
          ...sendOptions,
          caption: content.caption || ''
        });

      default:
        const fallback = content.text || content.content || '';
        if (!fallback) throw new Error(`未知的消息類型: ${type}`);
        return await bot.telegram.sendMessage(chatId, fallback, sendOptions);
    }
  }

  /**
   * 獲取啟用廣播模塊的群組（從 modulesEnabled 欄位）
   */
  async getEnabledBroadcastGroups(): Promise<bigint[]> {
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      select: {
        telegramChatId: true,
        modulesEnabled: true
      }
    });

    return groups
      .filter(g => g.modulesEnabled && g.modulesEnabled.broadcast === true)
      .map(g => g.telegramChatId);
  }

  /**
   * 從 game_settings 表獲取廣播配置（若不存在則 fallback 到常數）
   */
  async getBroadcastSetting(key: string, groupId?: number): Promise<any> {
    // 先嘗試群組特定設置
    if (groupId) {
      const groupSetting = await prisma.gameSetting.findFirst({
        where: { groupId, settingsKey: key }
      });
      if (groupSetting) return groupSetting.settingsValue;
    }

    // 再嘗試全局設置
    const globalSetting = await prisma.gameSetting.findFirst({
      where: { groupId: null, settingsKey: key }
    });
    if (globalSetting) return globalSetting.settingsValue;

    // fallback 到常數
    return (BROADCAST_CONSTANTS as any)[key] ?? null;
  }
}

export const broadcastService = new BroadcastService();
