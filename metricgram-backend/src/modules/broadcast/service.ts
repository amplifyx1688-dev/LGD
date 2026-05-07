import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 廣播服務
 */
export class BroadcastService {
  /**
   * 創建廣播任務
   */
  async createBroadcast(params: {
    messageType: string;
    contentJson: any;
    targetGroupIds?: bigint[];
    scheduledAt?: Date;
  }) {
    const { messageType, contentJson, targetGroupIds, scheduledAt } = params;

    const broadcast = await prisma.broadcastQueue.create({
      data: {
        messageType,
        contentJson: JSON.stringify(contentJson),
        scheduledAt: scheduledAt || new Date(),
        status: 'pending'
      }
    });

    logger.info('Broadcast created', { id: broadcast.id, type: messageType });

    return broadcast;
  }

  /**
   * 發送廣播
   */
  async sendBroadcast(broadcastId: number): Promise<boolean> {
    try {
      const broadcast = await prisma.broadcastQueue.findUnique({
        where: { id: broadcastId }
      });

      if (!broadcast || broadcast.status === 'sent') {
        return false;
      }

      const contentJson = JSON.parse(broadcast.contentJson);

      // TODO: 發送消息到目標群組
      // const targetGroups = await this.getTargetGroups();

      // 更新狀態
      await prisma.broadcastQueue.update({
        where: { id: broadcastId },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });

      logger.info('Broadcast sent', { id: broadcastId, type: broadcast.messageType });
      return true;

    } catch (error) {
      logger.error('Send broadcast failed', { error });
      await prisma.broadcastQueue.update({
        where: { id: broadcastId },
        data: {
          status: 'failed',
          errorMessage: error.message
        }
      });
      return false;
    }
  }
}

export const broadcastService = new BroadcastService();
