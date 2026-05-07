import { prisma } from '@/core/database/client';
import { ContentService } from '@/modules/carousel/services/contentService';
import { logger } from '@/core/utils/logger';

const contentService = new ContentService();

/**
 * 群組服務
 */
export class GroupService {
  /**
   * 獲取用戶所有綁定群組
   */
  async getUserGroups(userId: number) {
    return await prisma.group.findMany({
      where: { ownerUserId: userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 綁定群組
   */
  async bindGroup(userId: number, data: {
    telegramChatId: bigint;
    title: string;
    username?: string;
  }) {
    // 檢查是否已綁定其他群組
    const existing = await prisma.group.findFirst({
      where: { 
        OR: [
          { telegramChatId: data.telegramChatId },
          { ownerUserId: userId }
        ]
      }
    });

    if (existing) {
      throw new Error('Group already bound or user already has a group');
    }

    return await prisma.group.create({
      data: {
        telegramChatId: data.telegramChatId,
        title: data.title,
        username: data.username,
        ownerUserId: userId,
        modulesEnabled: {
          boot: true,
          activity: false,
          broadcast: false,
          night: false,
          verify: false,
          checkin: false,
          forward: false,
          dice: false,
          carousel: false,
          clean: false
        }
      }
    });
  }

  /**
   * 獲取群組完整配置（包含所有內容）
   */
  async getGroupWithConfig(groupId: number, userId: number) {
    const group = await prisma.group.findFirst({
      where: { id: groupId, ownerUserId: userId },
      include: {
        contentItems: {
          where: { module: 'carousel' },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    return group;
  }

  /**
   * 更新群組模塊開關
   */
  async updateModules(groupId: number, userId: number, modulesEnabled: any) {
    const group = await prisma.group.findFirst({
      where: { id: groupId, ownerUserId: userId }
    });

    if (!group) throw new Error('Group not found');

    await prisma.group.update({
      where: { id: groupId },
      data: { modulesEnabled }
    });

    logger.info('Group modules updated', { groupId, modulesEnabled });
  }

  /**
   * 獲取群組車輪播配置
   */
  async getCarouselConfig(groupId: number) {
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    return group?.carouselSettings;
  }

  /**
   * 更新輪播配置
   */
  async updateCarouselConfig(groupId: number, config: any) {
    await prisma.group.update({
      where: { id: groupId },
      data: { carouselSettings: config }
    });
  }
}

export const groupService = new GroupService();
