import { Telegraf, Context } from 'telegraf';
import { config } from '@/core/config';
import { logger } from '@/core/utils/logger';
import { messageMiddleware, callbackMiddleware, errorMiddleware } from './middlewares';
import { setupCommands } from './commands';
import { registerHandler, dispatchHandler } from '@/shared/events/handlerRegistry';

// 創建 Bot 實例
export const bot = new Telegraf<Context>(config.telegram.token, {
  client: {} // options
});

// 全局上下文類型擴展
declare module 'telegraf' {
  interface Context {
    userDb?: any;        // 數據庫用戶 objects
    groupDb?: any;       // 數據庫群組對象
    state?: any;         // 會話狀態（适用于骰子遊戲）
  }
}

/**
 * Bot 初始化
 */
export async function initBot() {
  logger.info('🤖 Initializing Telegram Bot...');

  // 1. 配置 Middleware
  setupMiddlewares();

  // 2. 設置指令
  setupCommands(bot);

  // 3. 設置回調查詢處理器
  await setupCallbacks();

  // 4. 全局錯誤處理
  bot.catch(errorMiddleware);

  // 5. 啟動 Bot
  if (config.telegram.polling) {
    logger.info('🚀 Starting bot in polling mode...');
    await bot.launch();
  } else {
    // Webhook 模式
    const webhookUrl = `${config.telegram.webhookUrl}/api/telegram/webhook`;
    logger.info(`🔗 Setting webhook: ${webhookUrl}`);
    await bot.telegram.setWebhook(webhookUrl);
    logger.info('✅ Webhook set successfully');
  }

  logger.info('✅ Telegram Bot initialized');
}

/**
 * 配置 Middleware 鏈
 */
function setupMiddlewares() {
  // 請求日誌
  bot.use((ctx, next) => {
    logger.debug('Update received', { 
      type: ctx.updateType,
      userId: ctx.from?.id 
    });
    return next();
  });

  // 用戶授權 Middleware（查詢數據庫）
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      try {
        // TODO: 從數據庫加載用戶信息
        // ctx.userDb = await getUser(ctx.from.id);
      } catch (error) {
        logger.error('Failed to load user', { userId: ctx.from.id, error });
      }
    }
    return next();
  });

  // 消息 Middleware
  bot.use(messageMiddleware);

  // 回調查詢 Middleware
  bot.use(callbackMiddleware);
}

/**
 * 註冊回調查詢處理器（按鈕點擊）
 */
async function setupCallbacks() {
  // 延遲導入避免循環依賴
  const { registerDiceHandlers } = await import('@/bot/callbacks/diceHandlers');
  const { registerCheckinHandlers } = await import('@/bot/callbacks/checkinHandlers');

  try {
    registerDiceHandlers();
    logger.info('Dice handlers registered');
  } catch (e) {
    logger.error('Failed to register dice handlers', { error: e });
  }

  try {
    registerCheckinHandlers();
    logger.info('Checkin handlers registered');
  } catch (e) {
    logger.error('Failed to register checkin handlers', { error: e });
  }

  // 全局回調處理
  bot.on('callback_query', async (ctx: any) => {
    const { data } = ctx.callbackQuery;
    const [module, ...handlerParts] = data.split(':');
    const handlerKey = handlerParts.join(':');

    if (!module || !handlerKey) {
      await ctx.answerCbQuery('無效的按鈕配置');
      return;
    }

    const context = {
      ...ctx,
      bot: ctx.bot,
      userId: ctx.from.id,
      chatId: ctx.message?.chat.id || ctx.from.id,
      module,
      handlerKey,
      reply: ctx.reply.bind(ctx),
      answerCbQuery: ctx.answerCbQuery.bind(ctx)
    };

    const success = await dispatchHandler(module, handlerKey, context);
    
    if (!success) {
      logger.warn('Handler dispatch failed', { module, handlerKey });
    }
  });

  logger.info('✅ Callback handlers setup complete');
}

/**
 * 停止 Bot（優雅關閉）
 */
export async function stopBot() {
  logger.info('🛑 Stopping Telegram Bot...');
  await bot.stop('SIGINT');
  logger.info('✅ Bot stopped');
}

/**
 * 工具：發送 HTML 格式消息（UTF-8 安全）
 */
export async function sendHtmlMessage(
  ctx: Context,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'MarkdownV2';
    reply_markup?: any;
    disable_notification?: boolean;
  }
) {
  try {
    await ctx.reply(text, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options
    });
  } catch (error) {
    logger.error('Failed to send message', { error });
  }
}

/**
 * 工具：編輯 UTF-8 消息（避免乱码）
 */
export async function editHtmlMessage(
  ctx: Context,
  text: string,
  options?: any
) {
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...options
      });
    } else {
      await ctx.reply(text, { parse_mode: 'HTML' });
    }
  } catch (error) {
    logger.error('Failed to edit message', { error });
  }
}
