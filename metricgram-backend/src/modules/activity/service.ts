import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 活動服務
 */
export class ActivityService {
  /**
   * 創建活動
   */
  async createActivity(params: {
    groupId: number;
    activityType: 'evening' | 'second_sign';
    scheduleTime: string; // "19:45"
    content: any;
  }) {
    const { groupId, activityType, scheduleTime, content } = params;

    // 活動配置存儲在 carousel_content 表中（配置化）
    const configKey = activityType === 'evening' 
      ? `活動-晚間-${groupId}` 
      : `活動-二簽-${groupId}`;

    await prisma.carouselContent.upsert({
      where: { contentKey: configKey },
      update: {
        contentJson: JSON.stringify(content),
        triggerConfig: JSON.stringify({
          schedule: `0 ${scheduleTime.split(':')[1]} * * *` // Cron expression
        }),
        isActive: true
      },
      create: {
        groupId,
        module: 'activity',
        contentType: 'gambling',
        contentKey: configKey,
        contentJson: JSON.stringify(content),
        triggerType: 'timer',
        triggerConfig: JSON.stringify({
          schedule: `0 ${scheduleTime.split(':')[1]} * * *`
        }),
        isActive: true,
        sortOrder: 0
      }
    });

    logger.info('Activity created', { groupId, activityType });
  }
}

export const activityService = new ActivityService();
