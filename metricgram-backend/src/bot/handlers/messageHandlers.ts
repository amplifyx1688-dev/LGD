/**
 * Telegram 消息處理器（主入口）
 * 處理所有 Telegram 更新（消息、按鈕、頻道事件）
 */

import { Telegraf, Context } from 'telegraf';
import { logger } from '@/core/utils/logger';
import { diceMessageHandler } from './diceMessageHandler';
import { verifyTrigger } from '@/modules/verify/trigger';
import { bot } from '../index';
import { prisma } from '@/core/database/client';

/**
 * 注冊所有消息處理器
 */
export function setupMessageHandlers(bot: Telegraf) {
  // 1. 普通文本消息
  bot.on('text', handleTextMessage);

  // 2. 骰子動畫消息
  bot.on('dice', diceMessageHandler);

  // 3. 新成員加入
  bot.on('my_chat_member', handleMyChatMember);
  bot.on('chat_member', handleChatMember);

  // 4. 頻道消息
  bot.on('channel_post', handleChannelPost);
  bot.on('edited_channel_post', handleEditedChannelPost);

  // 5. 內聯查詢
  bot.on('inline_query', handleInlineQuery);

  // 6. 回調查詢（已在 callbacks/index 處理）
  // bot.on('callback_query', handleCallbackQuery);

  logger.info('✅ Message handlers registered');
}

/**
 * 處理文本消息
 */
async function handleTextMessage(ctx: Context) {
  const { message, from, chat } = ctx;
  const text = message?.text;
  const userId = from?.id;
  const chatId = chat?.id;

  logger.debug('Text message received', {
    userId,
    chatId,
    text: text?.substring(0, 50)
  });

  // 1. 檢查是否為私聊（Private Chat）
  if (chatId === userId) {
    await handlePrivateMessage(ctx);
    return;
  }

  // 2. 群組消息處理
  await handleGroupMessage(ctx);
}

/**
 * 處理私聊消息
 */
async function handlePrivateMessage(ctx: Context) {
  // 私聊逻辑：主要用於用戶數據查詢
  // 例如：/profile, /myinfo
  const text = ctx.message?.text?.toLowerCase();

  if (text?.includes('profile') || text?.includes('個人')) {
    await ctx.reply('📊 您的個人詳情：\n積分：...\nUSDT：...');
    return;
  }

  // 默認回覆
  await ctx.reply('👋 請使用開啟機器人以查看功能菜單');
}

/**
 * 處理群組消息
 */
async function handleGroupMessage(ctx: Context) {
  const text = ctx.message?.text || '';
  const chatId = ctx.chat?.id;

  // 1. 檢查是否為搬運觸發（關鍵詞匹配）
  // if (await forwardService.checkKeywords(text, chatId)) return;

  // 2. 檢查是否為指令
  if (text.startsWith('/')) {
    await handleCommand(ctx);
    return;
  }

  // 3. 檢查是否包含特定按钮 callback_data（如 spin_wheel）
  // 可在消息中檢測用户發送了 "spin_wheel"，觸發對應邏輯
}

/**
 * 處理機器人性狀變更（加入/離開群組）
 */
async function handleMyChatMember(ctx: Context) {
  const { my_chat_member, from } = ctx.update;
  
  // 機器人被加入群組
  if (my_chat_member.new_chat_member.status === 'member') {
    logger.info('Bot added to group', { 
      groupId: my_chat_member.chat.id,
      addedBy: from?.id 
    });
    
    // 記錄群組綁定（如果管理員已授權）
    // TODO
  }

  // 機器人被踢出群組
  if (my_chat_member.new_chat_member.status === 'left') {
    logger.info('Bot removed from group', { groupId: my_chat_member.chat.id });
    // 更新群組狀態為禁用
    await prisma.group.updateMany({
      where: { telegramChatId: my_chat_member.chat.id },
      data: { isActive: false }
    });
  }
}

/**
 * 處理成員變化
 */
async function handleChatMember(ctx: Context) {
  const { chat_member, from } = ctx.update;

  // 限制只處理用戶加入群組（而非機器人）
  if (chat_member.from === undefined) {
    return;
  }

  // 用戶加入群組 → 觸發驗證流程
  if (
    chat_member.new_chat_member.status === 'member' &&
    chat_member.old_chat_member.status !== 'member'
  ) {
    const userId = chat_member.from.id;
    const chatId = chat_member.chat.id;

    logger.info('User joined group', { userId, chatId });

    // 1. 查找群組數據庫記錄
    const group = await prisma.group.findFirst({
      where: { telegramChatId: chatId.toString() }
    });

    if (!group) {
      logger.debug('Group not found in database', { chatId });
      return;
    }

    // 2. 檢查群組是否啟用入群驗證
    if (!group.verifyJoinEnabled) {
      logger.debug('Group verification not enabled', { groupId: group.id });
      return;
    }

    // 3. 觸發驗證流程
    const result = await verifyTrigger.triggerJoinVerification(
      userId,
      group.id,
      bot
    );

    if (result.triggered) {
      // 在群組發送提示消息
      try {
        await bot.telegram.sendMessage(
          chatId,
          `🔐 <b>安全提示</b>\n新成員 ${ctx.from?.first_name || '用戶'} 正在接受驗證，請稍候...`,
          { parse_mode: 'HTML' }
        );
      } catch (error) {
        logger.error('Failed to send verification prompt', { error });
      }
    } else {
      logger.debug('Verification not triggered', { reason: result.message });
    }
  }
}

/**
 * 處理頻道帖子
 */
async function handleChannelPost(ctx: Context) {
  // 頻道發布的消息（用於搬運來源检测）
  const { message, channel_post } = ctx;
  const chatId = channel_post?.chat?.id;
  
  if (chatId && message?.text) {
    // 檢測是否為搬運觸發
    // await forwardService.checkKeywords(message.text, chatId);
  }
}

/**
 * 處理內聯查詢
 */
async function handleInlineQuery(ctx: Context) {
  // 內聯模式（選中消息後...）
  // 目前未使用
}

/**
 * 處理指令
 */
async function handleCommand(ctx: Context) {
  const text = ctx.message?.text || '';
  const command = text.split(' ')[0].toLowerCase();

  switch (command) {
    case '/start':
      // 已在 commands/index 註冊
      break;
    case '/help':
      // ...
      break;
    default:
      await ctx.reply('❌ 未知指令');
  }
}
