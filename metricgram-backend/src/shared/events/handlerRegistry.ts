import { Module } from '@/shared/constants';
import { logger } from '@/core/utils/logger';

/**
 * 按鈕處理器註冊表
 * 動態映射：handler_key → 處理函數
 * 
 * 設計原則：
 * 1. 所有處理函數必須是 async 函數
 * 2. 參數統一為 HandlerContext
 * 3. 錯誤處理在wrapHandler中統一捕獲
 */

export interface HandlerContext {
  bot: any;                    // Telegram Bot 實例
  userId: number;
  chatId: number;
  messageId?: number;
  query?: any;                 // CallbackQuery
  args?: string[];            // 指令參數
  text?: string;              // 消息文本
}

export type CallbackHandler = (ctx: any) => Promise<void>;

/**
 * 骰子模塊按鈕處理器映射
 */
export const DICE_HANDLERS: Record<string, CallbackHandler> = {};

/**
 * 簽到模塊按鈕處理器映射
 */
export const CHECKIN_HANDLERS: Record<string, CallbackHandler> = {};

/**
 * 註冊處理器（模塊初始化時調用）
 */
export function registerHandler(module: string, key: string, handler: CallbackHandler) {
  const targetMap = getHandlerMap(module);
  if (targetMap[key]) {
    logger.warn('Handler already registered', { module, key });
  }
  targetMap[key] = handler;
  logger.info('Handler registered', { module, key });
}

/**
 * 獲取處理器
 */
export function getHandler(module: string, key: string): CallbackHandler | undefined {
  const targetMap = getHandlerMap(module);
  return targetMap[key];
}

/**
 * 統一處理按鈕點擊（配置化入口）
 * 根據數據庫中的 handler_key 查找對應函數
 */
export async function dispatchHandler(module: string, handlerKey: string, ctx: any): Promise<boolean> {
  try {
    const handler = getHandler(module, handlerKey);

    if (!handler) {
      logger.warn('Handler not found', { module, handlerKey });
      // 發送默認錯誤消息（可配置）
      await ctx.bot.answerCallbackQuery?.(ctx.query?.id, {
        text: '功能開發中',
        show_alert: false
      });
      return false;
    }

    // 包裝錯誤處理
    await wrapHandler(handler, ctx);
    return true;
  } catch (error) {
    logger.error('Handler dispatch failed', { module, handlerKey, error });
    
    // 通知用戶
    try {
      await ctx.bot.answerCallbackQuery?.(ctx.query?.id, {
        text: '操作失敗，請稍後再試',
        show_alert: true
      });
    } catch (e) {
      // 忽略
    }
    return false;
  }
}

/**
 * 處理器包裝器（統一錯誤處理 + 日誌）
 */
async function wrapHandler(handler: CallbackHandler, ctx: any): Promise<void> {
  const start = Date.now();

  try {
    logger.info('Handler start', {
      module: ctx.module,
      handler: ctx.handlerKey,
      userId: ctx.userId,
      chatId: ctx.chatId
    });

    await handler(ctx);

    const duration = Date.now() - start;
    logger.info('Handler success', {
      module: ctx.module,
      handler: ctx.handlerKey,
      duration: `${duration}ms`
    });
  } catch (error: any) {
    logger.error('Handler error', {
      module: ctx.module,
      handler: ctx.handlerKey,
      error: error.message,
      stack: error.stack
    });

    // 抛出錯誤讓上層捕獲
    throw error;
  }
}

/**
 * 根據模塊名稱獲取處理器映射表
 */
function getHandlerMap(module: string): Record<string, CallbackHandler> {
  switch (module) {
    case 'dice':
      return DICE_HANDLERS;
    case 'checkin':
      return CHECKIN_HANDLERS;
    default:
      return {};
  }
}

/**
 * 初始化所有處理器（模塊加載時自動註冊）
 */
export function initializeHandlers() {
  // 1. 骰子處理器（動態導入）
  // 延遲導入避免循環依賴
  
  // 2. 簽到處理器
  // registerHandler('checkin', 'do_signin', require('./checkin/handlers').handleCheckin)
  
  logger.info('Button handlers initialized');
}
