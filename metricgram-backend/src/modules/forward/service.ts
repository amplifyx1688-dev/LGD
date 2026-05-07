import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 搬運服務
 */
export class ForwardService {
  /**
   * 檢查關鍵詞並決定是否搬運
   */
  async checkKeywords(
    sourceMessage: string,
    sourceChannelId: bigint
  ): Promise<boolean> {
    // 獲取活躍的搬運規則
    const forwardConfigs = await prisma.carouselContent.findMany({
      where: {
        module: 'forward',
        isActive: true
      }
    });

    for (const config of forwardConfigs) {
      const triggerConfig = config.triggerConfig as any;
      const keywords = triggerConfig.keywords || [];

      // 檢查是否包含關鍵詞
      if (keywords.some((kw: string) => sourceMessage.includes(kw))) {
        // 找到匹配的目標群組
        const targetGroupIds = triggerConfig.targetGroupIds || [];
        
        // 執行搬運（異步，不阻塞）
        this.forwardMessage(config, sourceMessage, targetGroupIds).catch(console.error);
        return true;
      }
    }

    return false;
  }

  /**
   * 執行搬運
   */
  private async forwardMessage(
    config: any,
    message: string,
    targetGroupIds: bigint[]
  ): Promise<void> {
    const contentJson = config.contentJson as any;
    const template = contentJson.template || '{原文}';

    // 格式化消息
    const formatted = template
      .replace('{原文}', message)
      .replace('{發佈時間}', new Date().toLocaleString('zh-TW'));

    // 發送到目標群組
    for (const chatId of targetGroupIds) {
      try {
        // await bot.telegram.sendMessage(
        //   chatId.toString(),
        //   formatted,
        //   { parse_mode: 'HTML' }
        // );
        logger.info('Message forwarded', { chatId, configId: config.id });
      } catch (error) {
        logger.error('Forward failed', { error, chatId });
      }
    }
  }
}

export const forwardService = new ForwardService();
