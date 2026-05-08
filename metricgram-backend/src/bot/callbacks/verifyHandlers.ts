import { Context } from 'telegraf';
import { registerHandler } from '@/shared/events/handlerRegistry';
import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { bot } from '@/bot';

/**
 * 驗證模塊回調處理器
 * 處理用戶輸入驗證碼流程
 */

// 用戶會話狀態
const userSession: Record<number, { step: string; verificationId: number }> = {};

/**
 * 處理輸入驗證碼（來自私信）
 */
async function handleInputVerificationCode(ctx: Context) {
  const userId = ctx.from!.id;
  const text = ctx.message?.text?.trim();

  if (!text || !/^\d{4,6}$/.test(text)) {
    await ctx.reply('❌ 驗證碼格式錯誤，請輸入 4-6 位數字');
    return;
  }

  // 查找待處理的驗證記錄
  const verification = await prisma.verification.findFirst({
    where: {
      userId,
      code: text,
      isUsed: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!verification) {
    await ctx.reply('❌ 驗證碼錯誤或已過期，請重新輸入');
    return;
  }

  // 標記為已使用
  await prisma.verification.update({
    where: { id: verification.id },
    data: {
      isUsed: true,
      verifiedAt: new Date()
    }
  });

  logger.info('User verified successfully', {
    userId,
    groupId: verification.groupId,
    type: verification.type
  });

  // 如果有群組，發送通知並解禁
  if (verification.groupId) {
    // 獲取群組信息
    const group = await prisma.group.findUnique({
      where: { id: verification.groupId }
    });

    if (group) {
      try {
        // 通知群組管理員
        await bot.telegram.sendMessage(
          group.telegramChatId,
          `✅ 用戶 ${ctx.from!.first_name} 已通過驗證`
        );

        // 解除用戶禁言（Telegram API）
        // 注意：Bot 必須是群組管理員且有權限解禁
        try {
          await bot.telegram.unbanChatMember(
            group.telegramChatId,
            userId,
            true // 僅解禁消息發送權限
          );
          logger.info('User unbanned', { userId, groupId: verification.groupId });
        } catch (unbanError) {
          logger.warn('Failed to unban user', {
            userId,
            groupId: verification.groupId,
            error: unbanError
          });
        }
      } catch (error) {
        logger.error('Failed to send group notification', { error });
      }
    }
  }

  await ctx.reply('✅ 驗證成功！');

  // 清除會話狀態
  delete userSession[userId];
}

/**
 * 處理驗證按鈕點擊
 */
async function handleVerifyButton(ctx: Context) {
  const userId = ctx.from!.id;

  // 查找該用戶最新的待驗證記錄
  const pendingVerification = await prisma.verification.findFirst({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!pendingVerification) {
    await ctx.reply('⚠️ 目前沒有待處理的驗證請求');
    return;
  }

  // 發送驗證碼提示（私信）
  try {
    await bot.telegram.sendMessage(
      userId,
      `📋 <b>驗證流程</b>\n\n請向 bot 發送以下驗證碼：\n🔢 <code>${pendingVerification.code}</code>\n\n（有效時間：${Math.ceil(
        (new Date(pendingVerification.expiresAt).getTime() - Date.now()) /
          (1000 * 60)
      )} 分鐘）`,
      { parse_mode: 'HTML' }
    );

    await ctx.reply('✅ 驗證碼已發送至您的私信，請查看');
  } catch (error) {
    logger.error('Failed to send verification code', { error });
    await ctx.reply('❌ 無法發送私信，請先與 bot 建立聯絡');
  }
}

/**
 * 處理驗證類型選擇（私聊/頻道）
 */
async function handleSelectVerificationType(ctx: Context) {
  const { data } = ctx.callbackQuery!;
  const [module, type] = data.split(':');
  const userId = ctx.from!.id;

  // 創建對應類型的驗證記錄
  try {
    const verification = await prisma.verification.create({
      data: {
        userId,
        groupId: null, // 私聊/頻道驗證不綁定群組
        type: type as 'private' | 'channel',
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5分鐘
      }
    });

    // 發送驗證碼
    try {
      await bot.telegram.sendMessage(
        userId,
        `📋 <b>${type === 'private' ? '私聊' : '頻道'}驗證</b>\n\n您的驗證碼：\n🔢 <code>${verification.code}</code>\n\n請在 5 分鐘內回覆此訊息完成驗證`,
        { parse_mode: 'HTML' }
      );

      await ctx.answerCbQuery('驗證碼已發送', { show_alert: false });
      await ctx.reply('✅ 驗證碼已發送至您的私信');
    } catch (error) {
      await ctx.answerCbQuery('請先與 bot 建立私信聯絡', { show_alert: true });
    }
  } catch (error) {
    logger.error('Create private verification failed', { error });
    await ctx.answerCbQuery('驗證失敗', { show_alert: true });
  }
}

/**
 * 處理重新獲取驗證碼
 */
async function handleResendCode(ctx: Context) {
  const userId = ctx.from!.id;

  // 查找最新的待驗證記錄
  const pending = await prisma.verification.findFirst({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!pending) {
    await ctx.reply('⚠️ 沒有待處理的驗證請求');
    return;
  }

  // 發送新驗證碼
  try {
    await bot.telegram.sendMessage(
      userId,
      `🔁 <b>重新發送驗證碼</b>\n\n您的驗證碼：\n🔢 <code>${pending.code}</code>\n\n剩餘時間：${Math.ceil(
        (new Date(pending.expiresAt).getTime() - Date.now()) / (1000 * 60)
      )} 分鐘`,
      { parse_mode: 'HTML' }
    );

    await ctx.answerCbQuery('驗證碼已重新發送');
  } catch (error) {
    await ctx.answerCbQuery('請先與 bot 建立聯絡', { show_alert: true });
  }
}

/**
 * 處理取消驗證
 */
async function handleCancelVerification(ctx: Context) {
  const userId = ctx.from!.id;

  // 查找待驗證記錄
  const pending = await prisma.verification.findFirst({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (pending) {
    await prisma.verification.delete({
      where: { id: pending.id }
    });
    logger.info('Verification cancelled', { verificationId: pending.id });
  }

  await ctx.answerCbQuery('已取消驗證');
  await ctx.reply('❌ 驗證已取消');
}

// 註冊處理器
export function registerVerifyHandlers() {
  // 輸入驗證碼
  registerHandler('verify', 'input_code', handleInputVerificationCode);

  // 按鈕觸發
  registerHandler('verify', 'request_verify', handleVerifyButton);
  registerHandler('verify', 'resend_code', handleResendCode);
  registerHandler('verify', 'cancel_verify', handleCancelVerification);
  registerHandler('verify', 'select_type_private', handleSelectVerificationType);
  registerHandler('verify', 'select_type_channel', handleSelectVerificationType);

  logger.info('Verify handlers registered');
}
