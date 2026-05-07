import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { WalletTransaction } from '@metricgram/shared-types';

export class WalletService {
  /**
   * 獲取用戶餘額
   */
  async getBalance(userId: number): Promise<number> {
    const wallet = await prisma.userWallet.findUnique({
      where: { userId }
    });

    return wallet?.balanceUsdt || 0;
  }

  /**
   * 充值（手動）
   */
  async deposit(userId: number, amount: number, note?: string): Promise<void> {
    await this.transaction(userId, 'deposit', amount, {
      note: note || 'Manual deposit'
    });
  }

  /**
   * 提現
   */
  async withdraw(userId: number, amount: number, txHash?: string): Promise<void> {
    // 檢查餘額是否足夠
    const balance = await this.getBalance(userId);
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }

    await this.transaction(userId, 'withdraw', -amount, {
      txHash,
      note: 'Withdrawal to OKPay'
    });
  }

  /**
   * 內部交易（統一）
   */
  private async transaction(
    userId: number,
    type: WalletTransaction['type'],
    amount: number,
    meta: { txHash?: string; note?: string; gameId?: number } = {}
  ): Promise<void> {
    const balanceBefore = await this.getBalance(userId);
    const balanceAfter = balanceBefore + amount;

    await prisma.walletTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        txHash: meta.txHash,
        note: meta.note,
        gameId: meta.gameId,
        status: 'completed'
      }
    });

    // 更新用戶餘額（直接更新 wallet 或 user 表）
    await prisma.user.update({
      where: { id: userId },
      data: { balanceUsdt: balanceAfter }
    });

    logger.info('Wallet transaction', { userId, type, amount, balanceAfter });
  }

  /**
   * 遊戲贏錢
   */
  async addWinnings(userId: number, amount: number, gameId: number): Promise<void> {
    await this.transaction(userId, 'win', amount, { 
      gameId,
      note: `Game win: room ${gameId}` 
    });
  }

  /**
   * 遊戲輸錢
   */
  async addLoss(userId: number, amount: number, gameId: number): Promise<void> {
    await this.transaction(userId, 'lose', -amount, { 
      gameId,
      note: `Game loss: room ${gameId}` 
    });
  }
}

export const walletService = new WalletService();
