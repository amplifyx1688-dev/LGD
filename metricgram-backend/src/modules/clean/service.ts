import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { bot } from '@/bot';
import { CLEAN_CONSTANTS } from '@/shared/constants';

/**
 * 清潔模塊設置接口
 */
export interface CleanSettings {
  enabled: boolean;
  intervalMinutes: number;
  messageTypes: string[]; // 要清理的類型，如 member_join, member_leave...
  deleteWithinMinutes?: number; // 僅清理指定時間內的消息
}

export class CleanService {
  private defaultMessageTypes = Object.values(CLEAN_CONSTANTS.MESSAGE_TYPES);

  /**
   * 獲取群組清理設置
   */
  async getCleanSettings(groupId: number): Promise<CleanSettings> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        cleanEnabled: true,
        cleanIntervalMinutes: true,
        cleanSettings: true
      }
    });

    if (!group) {
      throw new Error('群組不存在');
    }

    const base: CleanSettings = {
      enabled: group.cleanEnabled ?? false,
      intervalMinutes: group.cleanIntervalMinutes ?? 5,
      messageTypes: this.defaultMessageTypes
    };

    // 合併 JSON 設置（如果存在）
    const rawSettings = (group as any).cleanSettings;
    if (rawSettings) {
      const extra = typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings;
      return { ...base, ...extra } as CleanSettings;
    }

    return base;
  }

  /**
   * 更新群組清理設置
   */
  async updateCleanSettings(groupId: number, updates: Partial<CleanSettings>): Promise<void> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { cleanSettings: true, cleanEnabled: true, cleanIntervalMinutes: true }
    });

    if (!group) {
      throw new Error('群組不存在');
    }

    // 驗證消息類型（如果提供）
    if (updates.messageTypes) {
      const valid = this.defaultMessageTypes;
      const invalid = updates.messageTypes.filter((t: string) => !valid.includes(t));
      if (invalid.length > 0) {
        throw new Error(`無效的消息類型: ${invalid.join(', ')}`);
      }
    }

    const updateData: any = {};

    // 更新頂層布欄位
    if (updates.enabled !== undefined) updateData.cleanEnabled = updates.enabled;
    if (updates.intervalMinutes !== undefined) updateData.cleanIntervalMinutes = updates.intervalMinutes;

    // 合併 JSON 設置
    const rawCurrent = (group as any).cleanSettings;
    let currentJson: Record<string, any> = {};
    if (rawCurrent) {
      currentJson = typeof rawCurrent === 'string' ? JSON.parse(rawCurrent) : rawCurrent;
    }

    const { enabled, intervalMinutes, ...jsonUpdates } = updates;
    const newJson = { ...currentJson, ...jsonUpdates };
    updateData.cleanSettings = JSON.stringify(newJson);

    await prisma.group.update({
      where: { id: groupId },
      data: updateData
    });

    logger.info('Clean settings updated', { groupId, settings: newJson });
  }

  /**
   * 立即執行清理
   * @param groupId 群組 ID
   * @param options.types 要清理的類型數組（覆蓋設置）
   * @param options.deleteWithinMinutes 時間窗口（分鐘），僅清理此時間內的消息
   */
  async cleanNow(groupId: number, options?: { types?: string[], deleteWithinMinutes?: number }): Promise<number> {
    // 獲取群組基本信息
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { telegramChatId: true, cleanEnabled: true }
    });

    if (!group) {
      throw new Error('群組不存在');
    }

    if (!group.cleanEnabled) {
      logger.info('Clean module disabled for group', { groupId });
      return 0;
    }

    // 獲取完整設置
    const settings = await this.getCleanSettings(groupId);
    const types = options?.types ?? settings.messageTypes;

    if (!types || types.length === 0) {
      logger.info('No message types specified for cleaning', { groupId });
      return 0;
    }

    // 驗證類型
    const validTypes = this.defaultMessageTypes;
    const filteredTypes = types.filter(t => validTypes.includes(t));
    if (filteredTypes.length === 0) {
      logger.warn('No valid message types', { groupId, types });
      return 0;
    }

    // 時間窗口
    const deleteWithin = options?.deleteWithinMinutes ?? settings.deleteWithinMinutes;
    const cutoff = deleteWithin ? new Date(Date.now() - deleteWithin * 60 * 1000) : null;

    // 查詢待清理的追蹤記錄（使用 SystemLog 作為追蹤存儲）
    const where: any = {
      groupId,
      module: 'clean',
      action: { in: filteredTypes },
      telegramMessageId: { not: null }
    };
    if (cutoff) {
      where.createdAt = { gte: cutoff };
    }

    const trackedMessages = await prisma.systemLog.findMany({
      where,
      select: {
        id: true,
        telegramMessageId: true,
        telegramChatId: true
      }
    });

    let cleaned = 0;

    for (const msg of trackedMessages) {
      try {
        await bot.telegram.deleteMessage(
          msg.telegramChatId.toString(),
          msg.telegramMessageId.toString()
        );
        cleaned++;
        // 刪除追蹤記錄（避免重複清理）
        await prisma.systemLog.delete({ where: { id: msg.id } });
      } catch (error: any) {
        logger.warn('Failed to delete message', {
          chatId: msg.telegramChatId,
          messageId: msg.telegramMessageId,
          error: error.message
        });
        // 若消息不存在，移除追蹤以避免重試
        const errMsg = (error.message || '').toLowerCase();
        if (errMsg.includes('message to delete not found') || errMsg.includes('message not found')) {
          await prisma.systemLog.delete({ where: { id: msg.id } });
        }
      }
    }

    // 記錄清理操作日誌（可選 clean_log，此處用 SystemLog）
    try {
      await prisma.systemLog.create({
        data: {
          module: 'clean',
          source: 'service',
          level: 'INFO',
          action: 'clean_run',
          message: `Cleaned ${cleaned} messages`,
          groupId,
          metadata: {
            cleaned,
            types: filteredTypes,
            deleteWithinMinutes: deleteWithin ?? null,
            totalFound: trackedMessages.length
          }
        }
      });
    } catch (logErr) {
      logger.error('Failed to log clean operation', { error: logErr });
    }

    logger.info('Clean completed', { groupId, cleaned, types: filteredTypes });
    return cleaned;
  }

  /**
   * 定時清理任務（由 scheduler 調用）
   * 遍歷所有啟用 clean 的群組，檢查間隔並執行清理
   */
  async scheduleClean(): Promise<void> {
    const groups = await prisma.group.findMany({
      where: { cleanEnabled: true, isActive: true },
      select: { id: true, cleanIntervalMinutes: true }
    });

    const now = new Date();

    for (const group of groups) {
      try {
        // 獲取上次清理時間（從 SystemLog 中查找最近一次 clean_run）
        const lastLog = await prisma.systemLog.findFirst({
          where: {
            groupId: group.id,
            module: 'clean',
            action: 'clean_run'
          },
          orderBy: { createdAt: 'desc' }
        });

        const lastCleanTime = lastLog?.createdAt ? new Date(lastLog.createdAt) : null;
        const intervalMs = (group.cleanIntervalMinutes ?? 5) * 60 * 1000;

        if (!lastCleanTime || (now.getTime() - lastCleanTime.getTime() >= intervalMs)) {
          await this.cleanNow(group.id);
        } else {
          logger.debug('Clean interval not reached', {
            groupId: group.id,
            remainingMs: intervalMs - (now.getTime() - lastCleanTime.getTime())
          });
        }
      } catch (error: any) {
        logger.error('Scheduled clean failed for group', {
          groupId: group.id,
          error: error.message
        });
      }
    }
  }
}

export const cleanService = new CleanService();
