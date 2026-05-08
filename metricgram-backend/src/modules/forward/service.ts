import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

export type KeywordAction = 'forward' | 'reply' | 'ban' | 'delete';

export interface KeywordRule {
  id: number;
  groupId: number;
  keyword: string;
  action: KeywordAction;
  target: string | null;
  isActive: boolean;
}

export interface KeywordMatchResult {
  matched: boolean;
  rule: KeywordRule;
}

/**
 * 搬運(關鍵詞)服務
 * 負責關鍵詞匹配與自動處理
 */
export class ForwardService {
  /**
   * 檢查消息是否匹配關鍵詞規則
   * @param ctx Telegraf Context，包含消息和聊天資訊
   * @returns 是否執行了 prevented 動作（如 ban/delete），返回 true
   */
  async checkKeywords(ctx: any): Promise<boolean> {
    const message = ctx.message;
    if (!message || !message.text) {
      return false;
    }

    const text = message.text;
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;
    const messageId = message.message_id;

    if (!chatId || !userId) {
      return false;
    }

    // 查找聊天室對應的 groupId
    const group = await prisma.group.findFirst({
      where: { telegramChatId: chatId }
    });

    if (!group) {
      logger.debug('Group not found for chatId', { chatId });
      return false;
    }

    // 獲取該群組所有啟用的關鍵詞規則
    const dbRules = await prisma.forwardKeyword.findMany({
      where: {
        groupId: group.id,
        isActive: true
      },
      orderBy: { id: 'asc' }
    });

    if (dbRules.length === 0) {
      return false;
    }

    // 找出所有匹配的規則
    const matchedRules: KeywordRule[] = [];
    for (const rule of dbRules) {
      const pattern = this.wildcardToRegExp(rule.keyword);
      if (pattern.test(text)) {
        matchedRules.push({
          id: rule.id,
          groupId: rule.groupId,
          keyword: rule.keyword,
          action: rule.action as KeywordAction,
          target: rule.target,
          isActive: rule.isActive
        });
      }
    }

    if (matchedRules.length === 0) {
      return false;
    }

    logger.info('Keywords matched', {
      count: matchedRules.length,
      keywords: matchedRules.map(r => r.keyword),
      actions: matchedRules.map(r => r.action),
      chatId,
      userId,
      messageId
    });

    // 根據優先級選擇最高優先級的動作：ban > delete > forward > reply
    const priorityOrder = { ban: 0, delete: 1, forward: 2, reply: 3 };
    const selectedRule = matchedRules.sort((a, b) => {
      return priorityOrder[a.action] - priorityOrder[b.action];
    })[0];

    // 執行對應動作
    const action = selectedRule.action;

    switch (action) {
      case 'ban':
        await this.handleBan(ctx, userId, chatId);
        break;

      case 'delete':
        await this.handleDelete(ctx, messageId);
        break;

      case 'forward':
        if (selectedRule.target) {
          await this.handleForward(ctx, messageId, selectedRule.target);
        } else {
          logger.warn('Forward action missing target', { ruleId: selectedRule.id });
        }
        break;

      case 'reply':
        if (selectedRule.target) {
          await this.handleReply(ctx, selectedRule.target);
        } else {
          logger.warn('Reply action missing target content', { ruleId: selectedRule.id });
        }
        break;

      default:
        logger.warn('Unknown keyword action', { action, ruleId: selectedRule.id });
        return false;
    }

    // 記錄操作日誌
    await this.logAction(selectedRule, {
      chatId,
      userId,
      messageId,
      text: text.substring(0, 200),
      action
    });

    return true;
  }

  /**
   * 查找第一條匹配的規則
   * 支援 ? 和 * 萬用字元
   */
  private findFirstMatch(text: string, rules: KeywordRule[]): KeywordRule | null {
    for (const rule of rules) {
      const pattern = this.wildcardToRegExp(rule.keyword);
      if (pattern.test(text)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * 將萬用字元 Pattern 轉換為 RegExp
   * 支援 * (任意多字符)、? (單字符)、% (SQL LIKE 任意多字符)、_ (SQL LIKE 單字符)
   * 返回包含匹配（關鍵詞出現在文本任意位置），不区分大小写
   */
  wildcardToRegExp(pattern: string): RegExp {
    // 1. 轉義 regex 特殊字元，但保留 * ? % _ 作為萬用字元
    // 需要轉義的 regex 元字符：. + ^ $ { } ( ) | [ ] \
    let escaped = pattern
      .toLowerCase()
      .replace(/[.+^${}()|[\]\\]/g, '\\$&'); // 不包含 * ? % _

    // 2. 將萬用字元轉為 regex 對應模式
    // * => .*  (匹配任意多個字符)
    // ? => .   (匹配單個字符)
    // % => .*  (SQL LIKE 通配符)
    // _ => .   (SQL LIKE 通配符)
    escaped = escaped
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/%/g, '.*')
      .replace(/_/g, '.');

    // 3. 包含匹配（關鍵詞出現在任意位置）
    return new RegExp(escaped, 'i');
  }

  /**
   * 測試文本是否匹配某關鍵詞（用於外部測試，不修改規則）
   * @returns 匹配的關鍵詞名稱或 null
   */
  matchKeyword(text: string, groupId: number): KeywordRule | null {
    const rules = this.getKeywordsSync(groupId);
    return this.findFirstMatch(text, rules);
  }

  /**
   * 同步版本：獲取群組關鍵詞（用於內部方法）
   */
  private async getKeywordsSync(groupId: number): Promise<KeywordRule[]> {
    const rules = await prisma.forwardKeyword.findMany({
      where: { groupId, isActive: true },
      orderBy: { id: 'asc' }
    });

    return rules.map(rule => ({
      id: rule.id,
      groupId: rule.groupId,
      keyword: rule.keyword,
      action: rule.action as KeywordAction,
      target: rule.target,
      isActive: rule.isActive
    }));
  }

  /**
   * 處理封禁動作
   */
  private async handleBan(ctx: any, userId: number, chatId: number | string): Promise<void> {
    try {
      await ctx.bot.telegram.banChatMember(chatId, userId);
      logger.info('User banned', { userId, chatId });
    } catch (error) {
      logger.error('Ban failed', { error, userId, chatId });
    }
  }

  /**
   * 處理刪除消息動作
   */
  private async handleDelete(ctx: any, messageId: number): Promise<void> {
    try {
      await ctx.bot.telegram.deleteMessage(ctx.chat.id, messageId);
      logger.info('Message deleted', { messageId });
    } catch (error) {
      logger.error('Delete failed', { error, messageId });
    }
  }

  /**
   * 處理轉發消息動作
   */
  private async handleForward(ctx: any, messageId: number, targetChatId: string): Promise<void> {
    try {
      const fromChatId = ctx.chat.id;
      await ctx.bot.telegram.forwardMessage(
        targetChatId,
        fromChatId,
        messageId
      );
      logger.info('Message forwarded', { fromChatId, targetChatId, messageId });
    } catch (error) {
      logger.error('Forward failed', { error, messageId });
    }
  }

  /**
   * 處理回覆動作
   */
  private async handleReply(ctx: any, content: string): Promise<void> {
    try {
      await ctx.reply(content);
      logger.info('Reply sent', { chatId: ctx.chat.id });
    } catch (error) {
      logger.error('Reply failed', { error });
    }
  }

  /**
   * 記錄動作到系統日誌
   */
  private async logAction(rule: KeywordRule, context: any): Promise<void> {
    try {
      // 根據 Telegram 用戶ID查詢User.id
      let dbUserId: number | null = null;
      if (context.userId) {
        const user = await prisma.user.findFirst({
          where: { telegramId: context.userId },
          select: { id: true }
        });
        dbUserId = user?.id || null;
      }

      // 獲取群組ID
      let dbGroupId: number | null = null;
      if (context.chatId) {
        dbGroupId = await this.getGroupIdByChatId(context.chatId);
      }

      await prisma.systemLog.create({
        data: {
          module: 'forward',
          source: 'bot',
          level: 'INFO',
          action: `keyword_${rule.action}`,
          message: `關鍵詞觸發: ${rule.keyword} -> ${rule.action}`,
          metadata: {
            ruleId: rule.id,
            keyword: rule.keyword,
            action: rule.action,
            target: rule.target,
            ...context
          },
          userId: dbUserId,
          groupId: dbGroupId,
          telegramChatId: typeof context.chatId === 'bigint' ? context.chatId : BigInt(context.chatId || 0),
          telegramMessageId: context.messageId ? BigInt(context.messageId) : null
        }
      });
    } catch (error) {
      logger.error('Log action failed', { error });
    }
  }

  /**
   * 根據 telegramChatId 獲取 groupId
   */
  private async getGroupIdByChatId(chatId: bigint | number | string): Promise<number | null> {
    try {
      // 將 chatId 統一轉為 bigint
      const bigintChatId = typeof chatId === 'bigint' ? chatId : BigInt(chatId);
      const group = await prisma.group.findFirst({
        where: { telegramChatId: bigintChatId }
      });
      return group?.id || null;
    } catch {
      return null;
    }
  }

  // ============================================
  // CRUD 操作
  // ============================================

  /**
   * 添加關鍵詞規則
   */
  async addKeyword(data: {
    keyword: string;
    action: KeywordAction;
    target?: string;
    groupId: number;
  }): Promise<KeywordRule> {
    // 檢查是否已存在相同關鍵詞
    const existing = await this.getKeywordByKeywordAndGroup(
      data.keyword.trim(),
      data.groupId
    );

    if (existing) {
      throw new Error('關鍵詞已存在');
    }

    const rule = await prisma.forwardKeyword.create({
      data: {
        groupId: data.groupId,
        keyword: data.keyword.trim(),
        action: data.action,
        target: data.target?.trim() || null,
        isActive: true
      }
    });

    logger.info('Keyword added', { id: rule.id, keyword: rule.keyword });

    return {
      id: rule.id,
      groupId: rule.groupId,
      keyword: rule.keyword,
      action: rule.action as KeywordAction,
      target: rule.target,
      isActive: rule.isActive
    };
  }

  /**
   * 移除關鍵詞規則
   */
  async removeKeyword(keyword: string, groupId: number): Promise<boolean> {
    const result = await prisma.forwardKeyword.deleteMany({
      where: {
        keyword,
        groupId
      }
    });

    const deleted = result.count > 0;
    if (deleted) {
      logger.info('Keyword removed', { keyword, groupId });
    }

    return deleted;
  }

  /**
   * 獲取群組的所有關鍵詞規則
   */
  async getKeywords(groupId: number): Promise<KeywordRule[]> {
    const rules = await prisma.forwardKeyword.findMany({
      where: { groupId },
      orderBy: [
        { isActive: 'desc' },
        { id: 'asc' }
      ]
    });

    return rules.map(rule => ({
      id: rule.id,
      groupId: rule.groupId,
      keyword: rule.keyword,
      action: rule.action as KeywordAction,
      target: rule.target,
      isActive: rule.isActive
    }));
  }

  /**
   * 根據關鍵詞和群組ID獲取規則
   */
  async getKeywordByKeywordAndGroup(keyword: string, groupId: number): Promise<KeywordRule | null> {
    const rule = await prisma.forwardKeyword.findFirst({
      where: {
        keyword,
        groupId
      }
    });

    if (!rule) return null;

    return {
      id: rule.id,
      groupId: rule.groupId,
      keyword: rule.keyword,
      action: rule.action as KeywordAction,
      target: rule.target,
      isActive: rule.isActive
    };
  }

  /**
   * 獲取單條規則详情
   */
  async getKeywordById(id: number): Promise<KeywordRule | null> {
    const rule = await prisma.forwardKeyword.findUnique({
      where: { id }
    });

    if (!rule) return null;

    return {
      id: rule.id,
      groupId: rule.groupId,
      keyword: rule.keyword,
      action: rule.action as KeywordAction,
      target: rule.target,
      isActive: rule.isActive
    };
  }

  /**
   * 更新關鍵詞規則
   */
  async updateKeyword(id: number, data: {
    keyword?: string;
    action?: KeywordAction;
    target?: string;
    isActive?: boolean;
  }): Promise<KeywordRule | null> {
    const rule = await prisma.forwardKeyword.findUnique({
      where: { id }
    });

    if (!rule) return null;

    const updated = await prisma.forwardKeyword.update({
      where: { id },
      data: {
        ...(data.keyword && { keyword: data.keyword }),
        ...(data.action && { action: data.action }),
        ...(data.target !== undefined && { target: data.target }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });

    logger.info('Keyword updated', { id, changes: data });

    return {
      id: updated.id,
      groupId: updated.groupId,
      keyword: updated.keyword,
      action: updated.action as KeywordAction,
      target: updated.target,
      isActive: updated.isActive
    };
  }

  /**
   * 批量啟用/禁用規則
   */
  async setKeywordsActive(ids: number[], isActive: boolean): Promise<number> {
    const result = await prisma.forwardKeyword.updateMany({
      where: { id: { in: ids } },
      data: { isActive }
    });

    logger.info('Keywords bulk update', { count: result.count, isActive });

    return result.count;
  }
}

export const forwardService = new ForwardService();
