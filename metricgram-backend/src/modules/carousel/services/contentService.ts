import prisma from '@/core/database/client';
import { ContentItem, ButtonConfig, ButtonType } from '@metricgram/shared-types';
import { logger } from '@/core/utils/logger';

export class ContentService {
  /**
   * 獲取單個內容配置
   * @param groupId 群組 ID（NULL 獲取全局配置）
   * @param contentKey 內容唯一標識
   */
  async getContent(groupId: number | null, contentKey: string): Promise<ContentItem | null> {
    try {
      const record = await prisma.carouselContent.findFirst({
        where: {
          contentKey,
          ...(groupId ? { groupId } : { groupId: null })
        },
        orderBy: { sortOrder: 'asc' }
      });

      if (!record) return null;

      return this.mapRecordToContentItem(record);
    } catch (error) {
      logger.error('Failed to get content', { groupId, contentKey, error });
      return null;
    }
  }

  /**
   * 批量獲取內容（根據模塊和群組）
   */
  async getContentsByModule(groupId: number | null, module: string, activeOnly: boolean = true): Promise<ContentItem[]> {
    try {
      const where: any = {
        module,
        ...(activeOnly ? { isActive: true } : {})
      };

      if (groupId !== null) {
        where.OR = [
          { groupId },
          { groupId: null } // 同時獲取全局配置
        ];
      }

      const records = await prisma.carouselContent.findMany({
        where,
        orderBy: [
          { sortOrder: 'asc' },
          { priority: 'desc' }
        ]
      });

      return records.map(r => this.mapRecordToContentItem(r));
    } catch (error) {
      logger.error('Failed to get contents by module', { groupId, module, error });
      return [];
    }
  }

   /**
    * 創建/更新內容配置
    * 注意：UTF-8 編碼確保
    */
   async upsertContent(data: {
     groupId?: number;
     contentKey: string;
     module: string;
     contentType: string;
     contentJson: any;
     triggerType?: string;
     triggerConfig?: any;
     isActive?: boolean;
     sortOrder?: number;
   }): Promise<ContentItem> {
     try {
       const where = {
         contentKey: data.contentKey,
         groupId: data.groupId ?? null
       };

       // 先查詢是否存在
       const existing = await prisma.carouselContent.findFirst({
         where
       });

       if (existing) {
         // 更新現有記錄
         const record = await prisma.carouselContent.update({
           where: { id: existing.id },
           data: {
             module: data.module,
             contentType: data.contentType,
             contentJson: data.contentJson,
             triggerType: data.triggerType,
             triggerConfig: data.triggerConfig ?? null,
             isActive: data.isActive ?? true,
             sortOrder: data.sortOrder ?? 0,
             updatedAt: new Date()
           }
         });
         logger.info('Content updated', { contentKey: data.contentKey, module: data.module });
         return this.mapRecordToContentItem(record);
       } else {
         // 創建新記錄
         const record = await prisma.carouselContent.create({
           data: {
             groupId: data.groupId ?? null,
             contentKey: data.contentKey,
             module: data.module,
             contentType: data.contentType,
             contentJson: data.contentJson,
             triggerType: data.triggerType,
             triggerConfig: data.triggerConfig ?? null,
             isActive: data.isActive ?? true,
             sortOrder: data.sortOrder ?? 0
           }
         });
         logger.info('Content created', { contentKey: data.contentKey, module: data.module });
         return this.mapRecordToContentItem(record);
       }
     } catch (error) {
       logger.error('Failed to upsert content', { error, data });
       throw new Error('Content upsert failed');
     }
   }

  /**
   * 批量更新排序
   */
  async updateSortOrder(groupId: number | null, items: { contentKey: string; sortOrder: number }[]): Promise<void> {
    try {
      for (const item of items) {
        await prisma.carouselContent.updateMany({
          where: {
            contentKey: item.contentKey,
            groupId: groupId ?? null
          },
          data: {
            sortOrder: item.sortOrder
          }
        });
      }

      logger.info('Sort order updated', { groupId, count: items.length });
    } catch (error) {
      logger.error('Failed to update sort order', { error });
      throw error;
    }
  }

  /**
   * 刪除內容配置
   */
  async deleteContent(groupId: number | null, contentKey: string): Promise<boolean> {
    try {
      const result = await prisma.carouselContent.deleteMany({
        where: {
          contentKey,
          groupId: groupId ?? null
        }
      });

      logger.info('Content deleted', { groupId, contentKey, count: result.count });

      return result.count > 0;
    } catch (error) {
      logger.error('Failed to delete content', { error });
      return false;
    }
  }

  /**
   * 遞增發送計數
   */
  async incrementSendCount(contentId: number): Promise<void> {
    try {
      await prisma.carouselContent.update({
        where: { id: contentId },
        data: {
          sendCount: { increment: 1 },
          lastSentAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to increment send count', { error });
    }
  }

  /**
   * 將數據庫記錄映射為 ContentItem 接口
   * 確保 UTF-8 字符串正確解析
   */
   private mapRecordToContentItem(record: any): ContentItem {
     // Prisma 自動將 JSON 欄位解析為物件
     const contentJson = record.contentJson || {};
     const triggerConfig = record.triggerConfig || {};

     // 按鈕類型映射（確保類型正確）
     const buttons: ButtonConfig[] = (contentJson.buttons || []).map((btn: any) => ({
       text: btn.text,
       type: this.mapButtonType(btn.type),
       value: btn.value,
       row: btn.row
     }));

     return {
       id: record.contentKey,
       module: record.module as any,
       category: record.contentType as any,
       groupId: record.groupId ?? undefined,
       content: {
         image: contentJson.image,
         text: contentJson.text || '',
         buttons
       },
       action: contentJson.action ? {
         type: contentJson.action.type as any,
         value: contentJson.action.value,
         handler: contentJson.action.handler
       } : undefined,
       trigger: {
         type: (record.triggerType || 'timer') as any,
         groupId: record.groupId ?? undefined,
         keywords: triggerConfig.keywords,
         schedule: triggerConfig.schedule
       },
       display: {
         isActive: record.isActive,
         startTime: triggerConfig.startTime,
         endTime: triggerConfig.endTime,
         priority: record.priority || 0
       },
       metadata: triggerConfig.metadata || {},
       createdAt: record.createdAt,
       updatedAt: record.updatedAt
     };
   }

  /**
   * 數據庫按鈕類型 → 枚舉類型映射
   */
  private mapButtonType(type: string): ButtonType {
    const typeMap: Record<string, ButtonType> = {
      'link': ButtonType.LINK,
      'callback': ButtonType.CALLBACK,
      'webapp': ButtonType.WEBAPP,
      'url_jump': ButtonType.URL_JUMP,
      'private_callback': ButtonType.PRIVATE_CALLBACK
    };

    return typeMap[type] || ButtonType.CALLBACK;
  }

  /**
   * 檢查內容是否應發送（時間窗口、激活狀態）
   */
  async shouldSend(content: ContentItem, groupId: number): Promise<boolean> {
    // 1. 檢查是否激活
    if (!content.display.isActive) return false;

    // 2. 檢查時間窗口（如有配置）
    if (content.display.startTime || content.display.endTime) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (content.display.startTime && currentTime < content.display.startTime) return false;
      if (content.display.endTime && currentTime > content.display.endTime) return false;
    }

    return true;
  }
}

export const contentService = new ContentService();
