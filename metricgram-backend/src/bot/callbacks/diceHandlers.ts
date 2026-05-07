import { Context } from 'telegraf';
import { registerHandler, HandlerContext } from '@/shared/events/handlerRegistry';
import { diceService } from '@/modules/dice/services/gameService';
import { logger } from '@/core/utils/logger';

/**
 * 骰子模塊按鈕處理器註冊
 */

// 1. 創建房間
async function handleCreateRoom(ctx: HandlerContext) {
  try {
    const { chatId, userId } = ctx;

    // 檢查群組是否啟用骰子功能
    // const group = await groupService.getGroup(chatId);
    // if (!group?.diceEnabled) { ... }

    // 創建房間
    const room = await diceService.createRoom({
      hostId: userId,
      groupId: chatId,
      gameType: 'niuniu', // 从配置读取
      minBet: 1
    });

    // 發送房間創建成功消息（从内容库读取）
    // const template = await contentService.getContent(chatId, '骰子版-创建房间');
    // await sendHtmlMessage(ctx, template.text, { ... });

    await ctx.reply(`✅ 房間創建成功！\n房間號：${room.roomId}\n請點擊下方按鈕開始遊戲。`);
  } catch (error: any) {
    logger.error('Create room failed', { error });
    await ctx.reply(`❌ 創建失敗：${error.message}`);
  }
}

// 2. 選擇牛牛模式
async function handleSelectNiuniu(ctx: HandlerContext) {
  await ctx.reply('✅ 已選擇【牛牛】模式\n請設定限紅金額：');
}

// 3. 開始遊戲
async function handleGameStart(ctx: HandlerContext) {
  // 邏輯：檢查房間狀態 → 開始下注 → 發送開始消息
  await ctx.reply('🎲 遊戲即將開始，請各位閑家支付限紅金額...');
}

// 4. 莊家擲骰
async function handleHostDice(ctx: HandlerContext) {
  // 發送 Telegram 骰子（官方动画）
  // await ctx.bot.sendDice(chatId, { emoji: '🎯' });
  
  // 接收骰子结果后在 diceService 处理
  await ctx.reply('🎲 莊家正在擲骰...');
}

// 5. 閑家擲骰
async function handlePlayerDice(ctx: HandlerContext) {
  await ctx.reply('🎲 請點擊下方按鈕擲骰：');
}

// 6. 結算
async function handleSettlement(ctx: HandlerContext) {
  await ctx.reply('🔔 骰子午夜場 結算 🔔\n\n🏠 莊家：xxx\n-----------------------\n閒家結果列表...');
}

// 7. 返回遊戲
async function handleBackToGame(ctx: HandlerContext) {
  await ctx.reply('已回到遊戲介面');
}

// 8. 平倍模式
async function handleModeNormal(ctx: HandlerContext) {
  await ctx.reply('✅ 已選擇平倍模式\n請點擊下方按鈕進行支付：');
}

// 9. 翻倍模式
async function handleModeDouble(ctx: HandlerContext) {
  await ctx.reply('⚠️ 請注意：翻倍需預付 3 倍籌碼\n請點擊下方按鈕進行支付：');
}

// 10. 規則說明
async function handleRulesShow(ctx: HandlerContext) {
  // 读取骰子规则配置
  // const rules = await gameSettingsService.getRulesText(chatId);
  const rules = `📜 牛牛規則說明...`;
  await ctx.reply(rules, { parse_mode: 'HTML' });
}

// 11. 黑單查詢
async function handleBlacklistCheck(ctx: HandlerContext) {
  // 读取黑名单列表（从数据库）
  // const blacklist = await userService.getBlacklist();
  const blacklist = `🚫 黑名單:\n1. @aaa_123\n2. @bbb_456`;
  await ctx.reply(blacklist);
}

// 12. 歷史戰績
async function handleHistoryData(ctx: HandlerContext) {
  // 查询用户历史战绩
  // const history = await gameService.getUserHistory(userId);
  await ctx.reply('📊 歷史戰績：\n勝場：10\n敗場：5\n總盈虧：+100 USDT');
}

// 註冊所有處理器
export function registerDiceHandlers() {
  registerHandler('dice', 'cmd_create_room', handleCreateRoom);
  registerHandler('dice', 'callback_select_niuniu', handleSelectNiuniu);
  registerHandler('dice', 'callback_game_start', handleGameStart);
  registerHandler('dice', 'callback_host_dice', handleHostDice);
  registerHandler('dice', 'callback_player_dice', handlePlayerDice);
  registerHandler('dice', 'callback_settlement', handleSettlement);
  registerHandler('dice', 'callback_back_to_game', handleBackToGame);
  registerHandler('dice', 'callback_mode_normal', handleModeNormal);
  registerHandler('dice', 'callback_mode_double', handleModeDouble);
  registerHandler('dice', 'callback_rules_show', handleRulesShow);
  registerHandler('dice', 'callback_blacklist_check', handleBlacklistCheck);
  registerHandler('dice', 'callback_history_data', handleHistoryData);
}
