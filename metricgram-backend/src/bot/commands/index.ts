import { Telegraf, Context } from 'telegraf';
import { command, CommandContainer } from 'telegraf/typings/telegram-typings';
import { bot } from '../index';
import { logger } from '@/core/utils/logger';

/**
 * 全局指令註冊表
 */
const commands: CommandContainer = {
  start: startCommand,
  help: helpCommand,
  menu: menuCommand,
  checkin: checkinCommand,
  profile: profileCommand,
  dice: diceCommand,
  rules: rulesCommand,
  blacklist: blacklistCommand,
  stats: statsCommand
};

/**
 * 註冊所有指令
 */
export function setupCommands(bot: Telegraf) {
  for (const [command, handler] of Object.entries(commands)) {
    bot.command(command, handler);
    logger.info('Command registered', { command });
  }

  logger.info('✅ All commands registered');
}

/**
 * /start 指令
 */
async function startCommand(ctx: Context) {
  const user = ctx.from;
  const chatId = ctx.chat?.id;

  // 記錄用戶到數據庫
  // await userService.upsertUser({
  //   telegramId: user.id,
  //   username: user.username,
  //   firstName: user.first_name,
  //   lastName: user.last_name
  // });

  const welcome = `
<b>👋 歡迎使用 Metricgram Bot</b>

您已經成功啟動機器人！

<b>功能列表：</b>
• /checkin - 每日簽到
• /profile - 個人詳情  
• /dice - 骰子遊戲
• /rules - 遊戲規則
• /blacklist - 黑單查詢

<b>管理員指令：</b>
/admin - 管理後台（需授權）
`;
  
  await ctx.reply(welcome, { parse_mode: 'HTML' });
}

/**
 * /help 指令
 */
async function helpCommand(ctx: Context) {
  const help = `
<b>📖 幫助信息</b>

所有指令列表：
/start - 開始使用
/checkin - 每日簽到 +1 積分
/profile - 查看個人資料
/dice - 骰子遊戲
/rules - 遊戲規則說明
/blacklist - 誠信黑名單
/stats - 個人戰績統計

如有問題請聯繫管理員。
`;
  await ctx.reply(help, { parse_mode: 'HTML' });
}

/**
 * /menu 指令 - 顯示主選單
 */
async function menuCommand(ctx: Context) {
  // 顯示主功能鍵盤
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '📆 今日簽到' }, { text: '👤 個人詳情' }],
        [{ text: '🎲 幸運輪盤' }, { text: '🎰 骰子遊戲' }],
        [{ text: '📊 我的戰績' }, { text: '📜 遊戲規則' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };

  await ctx.reply('請選擇功能：', keyboard);
}

/**
 * /checkin 指令
 */
async function checkinCommand(ctx: Context) {
  // 觸發簽到按鈕的回調
  await ctx.reply('請點擊下方按鈕進行簽到：', {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📆 立即簽到', callback_data: 'checkin:do_signin' }]
      ]
    }
  });
}

/**
 * /profile 指令
 */
async function profileCommand(ctx: Context) {
  const userId = ctx.from!.id;
  
  // 獲取用戶數據
  // const user = await userService.getUserWithStats(userId);
  
  const profile = `
✅<b>個人詳情</b>
-
🌟${new Date().toLocaleDateString('zh-TW')}

👛<code>此次積分 1 點</code>
📆<code>連續簽到 1 日</code>
⚡️<code>目前總分 3 點</code>

<i>今日尚未完成簽到，請點擊下方今日簽到領取積分！</i>
`;
  
  await ctx.reply(profile, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '📆今日簽到', callback_data: 'checkin:do_signin' }],
        [{ text: '🎲幸運輪盤', callback_data: 'checkin:spin_wheel' }],
        [{ text: '👤個人詳情', callback_data: 'checkin:profile' }],
        [{ text: '🎁輪盤獎勵', callback_data: 'checkin:wheel_prizes' }],
        [{ text: '🔙返回主選單', callback_data: 'checkin:back_to_main' }]
      ]
    }
  });
}

/**
 * /dice 指令 - 骰子遊戲菜單
 */
async function diceCommand(ctx: Context) {
  const menu = `
🎲 <b>OSC 骰子競技大廳</b>
-
準備好展現你的運氣了嗎？
目前房間狀態：<b>等待開啟</b>

請選擇下方功能開始遊戲或查詢資料：
`;
  
  await ctx.reply(menu, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 創建對戰', callback_data: 'dice:cmd_create_room' }],
        [{ text: '🚫 黑單查詢', callback_data: 'dice:callback_blacklist_check' }],
        [{ text: '📈 歷史戰績', callback_data: 'dice:callback_history_data' }],
        [{ text: '📜 規則說明', callback_data: 'dice:callback_rules_show' }],
        [{ text: '🔙 返回主選單', callback_data: 'checkin:back_to_main' }]
      ]
    }
  });
}

/**
 * /rules 指令
 */
async function rulesCommand(ctx: Context) {
  const rules = `📜 <b>妞妞午夜場・完整規則詳解</b>
-
1. <b>點數計算：</b>五顆骰子組合，最高點數為妞妞。
2. <b>特殊牌型：</b>鐵支 > 順子 > 妞妞 > 點數。
3. <b>賠率說明：</b>最高 5 倍賠付。
4. <b>公積金：</b>每局抽取 5% 作為獎池儲備。

🎯 速查表：
• 牛牛 → 5倍
• 牛9-7 → 4倍  
• 牛6-1 → 2倍
• 鐵支順子 → 5倍
• 對子 → 2倍

⚠️ 平點莊家贏
⚠️ 鐵支順子不看點，莊同型則莊贏`;
  
  await ctx.reply(rules, { parse_mode: 'HTML' });
}

/**
 * /blacklist 指令
 */
async function blacklistCommand(ctx: Context) {
  const blacklist = `🚫 <b>誠信玩家公示名單</b>
-
以下用戶因違規行為已被列入黑名單：
● @aaa_123567 (十七)
● @Apple_0857 (傑森)
● @qp_528888 (九尾)
● @wealth_77777 (與世無爭)

⚠️ 以上人員涉及逃跑/違規，請各管理注意。`;
  
  await ctx.reply(blacklist, { parse_mode: 'HTML' });
}

/**
 * /stats 指令
 */
async function statsCommand(ctx: Context) {
  await ctx.reply('📊 您的最近戰績摘要\n\n勝場：10\n敗場：5\n總盈虧：+100 USDT\n\n點擊下方查看詳細局數報告：', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📑 查看詳細報告', url: 'https://osc168.com/user/stats' }]
      ]
    }
  });
}
