import { Context } from 'telegraf';
import { bot, sendHtmlMessage, editHtmlMessage } from '../index';
import { logger } from '@/core/utils/logger';
import { prisma } from '@/core/database/client';

/**
 * 消息 Middleware
 * 處理所有普通消息（非指令）
 */
export async function messageMiddleware(ctx: Context, next: () => Promise<void>) {
  // 1. 記錄消息日誌（確保 UTF-8）
  if (ctx.message?.text) {
    logger.info('Message received', {
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
      text: ctx.message.text.substring(0, 100)
    });
  }

  // 2. 檢查群組是否啟用對應模塊（基礎過濾）
  if (ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup') {
    const group = await prisma.group.findFirst({
      where: { telegramChatId: ctx.chat.id }
    });
    
    if (group) {
      ctx.groupDb = group;
      
      // 全局禁用檢查
      if (!group.isActive) {
        return next();
      }
    }
  }

  // 3. 處理骰子消息（獲取 Telegram 骰子數值）
  if (ctx.message?.dice) {
    // TODO: 轉發給骰子模塊處理
    // await diceService.handleDiceMessage(ctx);
    return next();
  }

  // 4. 處理普通文本消息（關鍵詞觸發）
  if (ctx.message?.text) {
    // TODO: 關鍵詞檢測與轉發
    // await forwardService.checkKeywords(ctx);
  }

  return next();
}

/**
 * 回調查詢 Middleware
 * 處理所有按鈕點擊
 */
export async function callbackMiddleware(ctx: Context, next: () => Promise<void>) {
  const query = ctx.callbackQuery;
  if (!query) return next();

  const { data, from, message } = query;
  const userId = from.id;
  const chatId = message?.chat.id || from.id;

  logger.info('Callback received', { 
    data, 
    userId, 
    chatId 
  });

  // 1. 基礎驗證（黑名單、頻率限制等）
  // TODO: 檢查黑名單
  
  // 2. 解析 handler_key（配置化）
  // 格式：模塊名稱:handler_key
  // 例如：checkin:do_signin
  const [module, handlerKey] = data.split(':');

  if (!module || !handlerKey) {
    await ctx.answerCbQuery('無效的按鈕配置');
    return next();
  }

  // 3. 檢查模塊是否啟用
  // const group = await groupService.getGroup(chatId);
  // if (!group?.modulesEnabled[module]) { ... }

  // 4. 執行處理器（動態映射）
  try {
    const context = {
      bot: ctx.bot,
      userId,
      chatId,
      messageId: message?.message_id,
      query,
      module,
      handlerKey
    };

    const success = await dispatchHandler(module, handlerKey, context);
    
    if (success) {
      await ctx.answerCbQuery('✅ 操作成功');
    } else {
      await ctx.answerCbQuery('❌ 操作失敗');
    }
  } catch (error) {
    logger.error('Callback handling error', { error, data });
    await ctx.answerCbQuery('❌ 出錯了，請稍後再試');
  }

  // 5. 防止浏览器重新加载页面
  return next();
}

/**
 * 錯誤處理 Middleware
 */
export function errorMiddleware(error: Error, ctx: Context) {
  logger.error('Bot error', {
    error: error.message,
    stack: error.stack,
    userId: ctx.from?.id
  });

  // 通知管理員（可選）
  // notifyAdmin(`Bot error: ${error.message}`);

  // 通知用戶（可選）
  ctx.reply('⚠️ 系統錯誤，請稍後再試');
}
