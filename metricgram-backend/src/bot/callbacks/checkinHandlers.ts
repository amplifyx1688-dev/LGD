import { Context } from 'telegraf';
import { registerHandler } from '@/shared/events/handlerRegistry';

/**
 * 簽到模塊回調處理器
 * 所有字符串均為 UTF-8 編碼
 */

// 1. 簽到
async function handleCheckin(ctx: Context) {
  const { userId, chatId } = ctx;
  
  // 調用簽到服務
  // const result = await checkinService.checkin(userId, chatId);
  // await ctx.reply(`✅ 簽到成功！\n此次積分 ${result.points} 點\n目前總分 ${result.totalPoints} 點`);
  
  await ctx.reply('✅ 簽到成功！\n此次積分 1 點\n目前總分 3 點');
}

// 2. 個人詳情
async function handleProfile(ctx: Context) {
  const userId = ctx.from!.id;
  
  // const user = await userService.getUser(userId);
  // const stats = await statsService.getUserStats(userId);
  
  const profile = `✅<b>個人詳情</b>\n-\n🌟${new Date().toLocaleDateString('zh-TW')}\n\n👛<code>此次積分 1 點</code>\n📆<code>連續簽到 1 日</code>\n⚡️<code>目前總分 3 點</code>`;
  
  await ctx.reply(profile, { parse_mode: 'HTML' });
}

// 3. 輪盤
async function handleSpinWheel(ctx: Context) {
  const userId = ctx.from!.id;
  
  // 檢查積分是否足夠（≥20）
  // const user = await userService.getUser(userId);
  // if (user.points < 20) {
  //   await ctx.reply('❌ 積分不足，需要 20 積分才能轉輪盤');
  //   return;
  // }
  
  // 扣除積分
  // await userService.deductPoints(userId, 20);
  
  // 隨機算法
  // const prize = calculateWheelPrize();
  // await userService.addPoints(userId, prize.points);
  // await wheelService.recordSpin(userId, prize);
  
  // 發獎勵
  await ctx.reply('🎰 <b>幸運輪盤結果</b>\n\n🍀 恭喜獲得：10 體驗 USDT\n\n獎勵將自動發放，請留意系統消息。', { parse_mode: 'HTML' });
}

// 4. 輪盤獎項
async function handleWheelPrizes(ctx: Context) {
  const prizes = `🎰 <b>幸運輪盤獎項機率公示</b>\n\n🥇 一等獎｜0.01%｜8888 錢包USDT\n🥈 二等獎｜0.10%｜888 錢包USDT\n🥉 三等獎｜0.50%｜588 錢包USDT\n✨ 四等獎｜1.00%｜188 錢包USDT\n💎 五等獎｜3.00%｜88 錢包USDT\n🎁 六等獎｜7.00%｜10 體驗USDT\n🧧 七等獎｜15.00%｜5 體驗USDT\n🎫 八等獎｜29.39%｜3 體驗USDT\n🎫 九等獎｜29.39%｜1 體驗USDT\n☁️ 再接再厲｜40.00%｜再接再厲\n\n⚠️ 獎勵將自動發放，抽中體驗金請截圖私訊客服。`;
  
  await ctx.reply(prizes, { parse_mode: 'HTML' });
}

// 5. 返回主選單
async function handleBackToMain(ctx: Context) {
  // 返回主菜单消息
  await ctx.reply('🔙 已返回主選單\n\n請選擇功能：\n/start - 主選單\n/checkin - 簽到\n/profile - 個人詳情');
}

// 註冊
export function registerCheckinHandlers() {
  registerHandler('checkin', 'do_signin', handleCheckin);
  registerHandler('checkin', 'profile', handleProfile);
  registerHandler('checkin', 'spin_wheel', handleSpinWheel);
  registerHandler('checkin', 'wheel_prizes', handleWheelPrizes);
  registerHandler('checkin', 'back_to_main', handleBackToMain);
}
