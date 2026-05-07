import { registerHandler, dispatchHandler } from '@/shared/events/handlerRegistry';
import { logger } from '@/core/utils/logger';

/**
 * 回调查詢處理器註冊中心
 */

export async function setupCallbacks(bot: any) {
  // 延遲動態導入避免循環依賴
  const { registerDiceHandlers } = await import('@/bot/callbacks/diceHandlers');
  const { registerCheckinHandlers } = await import('@/bot/callbacks/checkinHandlers');

  // 註冊處理器
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
