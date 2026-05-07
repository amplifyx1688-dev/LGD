/**
 * 骰子消息处理器
 * 处理 Telegram 骰子动画消息并更新游戏状态
 */

import { Context } from 'telegraf';
import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { diceService } from '@/modules/dice/services/gameService';

/**
 * 处理骰子消息（官方动画）
 * 用户在点击"擲骰"按钮后，Telegram 发送骰子动画
 */
export async function diceMessageHandler(ctx: Context) {
  const { message, from } = ctx;
  const userId = from?.id;
  const diceValue = message?.dice?.value; // 1-6
  const emoji = message?.dice?.emoji;

  if (!userId || !diceValue) {
    return;
  }

  logger.info('Dice rolled', { userId, diceValue, emoji });

  try {
    // 1. 查找该用户参与的活跃游戏（status = betting/rolling）
    const participant = await prisma.diceParticipant.findFirst({
      where: { userId },
      include: {
        game: {
          where: {
            status: { in: ['betting', 'rolling'] }
          }
        }
      }
    });

    if (!participant || !participant.game) {
      // 用户未参与游戏，忽略
      logger.debug('Dice from non-participant', { userId });
      return;
    }

    const game = participant.game;

    // 2. 判断是莊家还是闲家
    if (game.hostUserId === userId) {
      // 莊家擲骰
      await handleHostDice(game.id, userId, diceValue);
    } else {
      // 閑家擲骰
      await handlePlayerDice(game.id, userId, diceValue);
    }

  } catch (error) {
    logger.error('Dice handler error', { error, userId, diceValue });
  }
}

/**
 * 处理莊家掷骰
 */
async function handleHostDice(gameId: number, userId: number, diceValue: number) {
  // 生成 5 顆骰子（第一条消息是预览，实际需要5次 or 一次性接收）
  // Telegram dice 一次只返回一个值，需要连续发送5次
  // 这里简化：假设已经发送了5次骰子动画，我们等待所有骰子
  
  // TODO: 实现骰子收集状态机
  // 状态：rolling → 收集5个骰子 → 计算结果 → 等待闲家
  
  // 临时方案：假设莊家只掷一次（实际需要5骰）
  logger.info('Host dice roll collected', { gameId, diceValue });
  
  // 更新游戏状态为等待闲家
  // await prisma.diceGame.update({
  //   where: { id: gameId },
  //   data: { status: 'waiting_players' }
  // });
  
  // 通知闲家开始掷骰
  // await sendMessageToParticipants(gameId, '莊家已擲骰，請各位閒家點擊按鈕擲骰！');
}

/**
 * 处理闲家掷骰
 */
async function handlePlayerDice(gameId: number, userId: number, diceValue: number) {
  // 查找该玩家在此游戏中的参与记录
  const participant = await prisma.diceParticipant.findFirst({
    where: { gameId, userId }
  });

  if (!participant) {
    logger.warn('Player not in game', { gameId, userId });
    return;
  }

  // 获取当前骰子记录（JSON 数组）
  const currentDice = participant.playerDiceJson as number[] || [];
  
  // 添加新骰子（最多5个）
  if (currentDice.length < 5) {
    currentDice.push(diceValue);
    
    await prisma.diceParticipant.update({
      where: { id: participant.id },
      data: { playerDiceJson: currentDice }
    });

    logger.info('Player dice collected', { 
      gameId, 
      userId, 
      diceCount: currentDice.length 
    });

    // 检查是否已完成5个骰子
    if (currentDice.length === 5) {
      // 计算点数
      const result = diceService.calculateDiceResult(currentDice);
      
      await prisma.diceParticipant.update({
        where: { id: participant.id },
        data: { 
          playerResult: JSON.stringify(result),
          // 此时尚未结算，payoutUsdt 暂不填写
        }
      });

      logger.info('Player completed dice roll', { 
        gameId, 
        userId, 
        result: result.type 
      });

      // 检查是否所有玩家都已完成掷骰
      await checkAllPlayersRolled(gameId);
    }
  }
}

/**
 * 检查所有玩家是否完成掷骰
 */
async function checkAllPlayersRolled(gameId: number) {
  const game = await prisma.diceGame.findUnique({
    where: { id: gameId },
    include: { participants: true }
  });

  if (!game) return;

  const allRolled = game.participants.every(p => 
    p.playerDiceJson && p.playerDiceJson.length === 5
  );

  if (allRolled) {
    // 所有玩家掷完 → 自动结算
    logger.info('All players rolled, settling game', { gameId });
    await diceService.settleGame(gameId);
  }
}

/**
 * 向所有参与者发送消息
 */
async function sendToParticipants(gameId: number, text: string) {
  const game = await prisma.diceGame.findUnique({
    where: { id: gameId },
    include: { participants: true }
  });

  if (!game) return;

  for (const p of game.participants) {
    // await bot.telegram.sendMessage(p.userId.toString(), text);
  }
}
