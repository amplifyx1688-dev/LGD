/**
 * 骰子游戲服務層
 * 所有邏輯封裝，避免在路由中寫業務代碼
 */

import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { DICE_CONSTANTS, DEFAULT_MULTIPLIERS, RANK_ORDER } from '@/shared/constants';
import { DiceGameStatus, DiceGameType } from '@metricgram/shared-types';

export interface CreateGameParams {
  hostId: number;
  groupId: number;
  gameType?: DiceGameType;
  minBetUsdt?: number;
  maxBetUsdt?: number;
}

export class DiceService {
  /**
   * 從群組設定中獲取骰子配置（帶預設值）
   */
  private getDiceSettings(group: any): {
    commissionRate: number;
    multipliers: Record<string, number>;
    minBet: number;
    maxBet: number;
    allowDoubleBet: boolean;
  } {
    const settings = group.diceSettings || {};

    return {
      commissionRate: settings.commissionRate ?? DICE_CONSTANTS.COMMISSION_RATE,
      multipliers: settings.multipliers ?? DEFAULT_MULTIPLIERS,
      minBet: settings.minBet ?? DICE_CONSTANTS.MIN_BET,
      maxBet: settings.maxBet ?? DICE_CONSTANTS.MAX_BET,
      allowDoubleBet: settings.allowDoubleBet ?? false
    };
  }

  /**
   * 生成房間號（格式：ROOM_YYYYMMDD_001）
   */
  private generateRoomId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ROOM_${dateStr}_${random}`;
  }

  /**
   * 創建房間
   */
  async createRoom(params: CreateGameParams): Promise<any> {
    const {
      hostId,
      groupId,
      gameType = DICE_CONSTANTS.DEFAULT_GAME_TYPE,
      minBetUsdt = DICE_CONSTANTS.MIN_BET,
      maxBetUsdt = DICE_CONSTANTS.MAX_BET
    } = params;

    // 1. 生成房間號（可自定義格式）
    const roomId = this.generateRoomId();

    // 2. 創建記錄
    const game = await prisma.diceGame.create({
      data: {
        roomId,
        groupId,
        gameType,
        betMode: 'normal',
        minBetUsdt,
        maxBetUsdt,
        hostUserId: hostId,
        hostBetUsdt: 0, // 暫未支付
        hostDiceJson: [],
        hostResult: null,
        hostPayoutMultiplier: 0,
        status: DiceGameStatus.WAITING
      },
      include: {
        host: true
      }
    });

    logger.info('Dice room created', { roomId, hostId, groupId });

    return game;
  }

  /**
   * 加入房間
   */
  async joinGame(gameId: number, userId: number, betUsdt: number, betMultiplier: 1 | 2 = 1): Promise<any> {
    // 1. 查詢遊戲
    const game = await prisma.diceGame.findUnique({
      where: { id: gameId },
      include: ['host', 'participants']
    });

    if (!game) throw new Error('Game not found');
    if (game.status !== DiceGameStatus.WAITING) throw new Error('Game not accepting players');

    // 2. 檢查黑名單
    // TODO

    // 3. 檢查下注金額
    if (betUsdt < game.minBetUsdt) throw new Error(`Minimum bet is ${game.minBetUsdt} USDT`);
    if (game.maxBetUsdt && betUsdt > game.maxBetUsdt) throw new Error(`Maximum bet is ${game.maxBetUsdt} USDT`);

    // 4. 檢查是否已加入
    const existing = await prisma.diceParticipant.findUnique({
      where: { gameId_userId: { gameId, userId } }
    });
    if (existing) throw new Error('Already joined');

    // 5. 創建參與者記錄
    const participant = await prisma.diceParticipant.create({
      data: {
        gameId,
        userId,
        betUsdt,
        betMultiplier
      }
    });

    logger.info('Player joined game', { gameId, userId, betUsdt });

    return participant;
  }

  /**
   * 計算骰子結果（牛牛算法）
   */
  calculateDiceResult(dice: number[]): {
    sum: number;
    remainder: number;
    type: string;
    multiplier: number;
  } {
    const sum = dice.reduce((a, b) => a + b, 0);
    const remainder = sum % 10;

    // 牛牛
    if (remainder === 0) {
      return { sum, remainder, type: 'niu_niu', multiplier: DEFAULT_MULTIPLIERS.niu_niu };
    }

    // 牛X
    const key = `niu_${remainder}`;
    const multiplier = DEFAULT_MULTIPLIERS[key as keyof typeof DEFAULT_MULTIPLIERS] || 1;

    return { sum, remainder, type: key, multiplier };
  }

  /**
   * 結束遊戲並結算
   */
  async settleGame(gameId: number): Promise<any> {
    const game = await prisma.diceGame.findUnique({
      where: { id: gameId },
      include: {
        host: true,
        participants: { include: { user: true } }
      }
    });

    if (!game) throw new Error('Game not found');
    if (game.status === DiceGameStatus.SETTLING || game.status === DiceGameStatus.CLOSED) {
      throw new Error('Game already settled');
    }

    // 1. 更新狀態
    await prisma.diceGame.update({
      where: { id: gameId },
      data: { status: DiceGameStatus.SETTLING }
    });

    // 2. 計算莊家結果（如果未擲骰則自動擲）
    if (!game.hostDiceJson || game.hostDiceJson.length === 0) {
      // 自動擲骰（模擬）
      // TODO
    }

    // 3. 結算每個參與者
    for (const p of game.participants) {
      await this.settleParticipant(game, p);
    }

    // 4. 關閉遊戲
    await prisma.diceGame.update({
      where: { id: gameId },
      data: {
        status: DiceGameStatus.CLOSED,
        closedAt: new Date()
      }
    });

    logger.info('Game settled', { gameId });

    return { success: true };
  }

  /**
   * 結算單個參與者
   */
  private async settleParticipant(game: any, participant: any): Promise<void> {
    // 比較莊家 vs 閒家
    const hostResult = game.hostResult;
    const playerResult = participant.playerResult;

    if (!hostResult || !playerResult) {
      logger.warn('Missing dice result', { gameId: game.id, userId: participant.userId });
      return;
    }

    // 比較牌型大小 (簡易版本)
    const playerWin = this.compareResults(playerResult, hostResult);

    let result: 'win' | 'lose' | 'tie' = 'lose';
    let payoutUsdt = 0;

    if (playerWin) {
      result = 'win';
      // 贏家獎金 = 下注金額 × 玩家賠率
      payoutUsdt = participant.betUsdt * playerResult.multiplier;
    } else if (playerResult.type === hostResult.type && playerResult.remainder === hostResult.remainder) {
      result = 'tie'; // 平局
      payoutUsdt = participant.betUsdt; // 返還本金
    }

    // 更新參與者
    await prisma.diceParticipant.update({
      where: { id: participant.id },
      data: {
        payoutUsdt,
        result
      }
    });

    // 創建錢包流水
    await prisma.walletTransaction.create({
      data: {
        userId: participant.userId,
        type: result === 'win' ? 'win' : 'lose',
        amount: result === 'win' ? payoutUsdt : -participant.betUsdt,
        gameId: game.id,
        balanceBefore: 0, // TODO: 查詢當前餘額
        balanceAfter: 0,  // TODO: 計算
        status: 'completed',
        note: `骰子遊戲 ${result}，房間 ${game.roomId}`
      }
    });

    logger.info('Participant settled', {
      gameId: game.id,
      userId: participant.userId,
      result
    });
  }

  /**
   * 比較兩次骰子結果
   * true = 閒家贏，false = 莊家贏
   */
  private compareResults(player: any, host: any): boolean {
    const playerIndex = RANK_ORDER.indexOf(player.type);
    const hostIndex = RANK_ORDER.indexOf(host.type);

    if (playerIndex < hostIndex) return true; // index 越小牌越大
    if (playerIndex > hostIndex) return false;

    // 牌型相同 → 比點數
    return player.remainder > host.remainder;
  }

  /**
   * 獲取用戶歷史戰績
   */
  async getUserHistory(userId: number, limit: number = 10) {
    const games = await prisma.diceParticipant.findMany({
      where: { userId },
      take: limit,
      orderBy: { joinedAt: 'desc' },
      include: {
        game: {
          include: {
            host: {
              select: { username: true, firstName: true }
            }
          }
        }
      }
    });

    return games.map(p => ({
      roomId: p.game.roomId,
      bet: p.betUsdt,
      result: p.result,
      payout: p.payoutUsdt || 0,
      time: p.joinedAt
    }));
  }

  /**
   * 擲骰子
   */
  async rollDice(gameId: number, userId: number, diceValues: number[]): Promise<any> {
    // 1. 驗證遊戲
    const game = await prisma.diceGame.findUnique({
      where: { id: gameId },
      include: ['host', 'participants']
    });

    if (!game) throw new Error('Game not found');

    // 2. 確定是莊家還是閒家擲骰
    const isHost = game.hostUserId === userId;
    if (!isHost) {
      // 閒家擲骰
      const participant = await prisma.diceParticipant.findUnique({
        where: { gameId_userId: { gameId, userId } }
      });
      if (!participant) throw new Error('Player not in game');

      // 更新閒家骰子結果
      const result = this.calculateDiceResult(diceValues);

      await prisma.diceParticipant.update({
        where: { id: participant.id },
        data: {
          diceJson: diceValues,
          playerResult: result
        }
      });

      logger.info('Player rolled dice', { gameId, userId, result });

      return { result, isHost: false };
    } else {
      // 莊家擲骰
      const result = this.calculateDiceResult(diceValues);

      await prisma.diceGame.update({
        where: { id: gameId },
        data: {
          hostDiceJson: diceValues,
          hostResult: result
        }
      });

      logger.info('Host rolled dice', { gameId, result });

      return { result, isHost: true };
    }
  }
}

export const diceService = new DiceService();
