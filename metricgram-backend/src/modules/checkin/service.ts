import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 簽到服務
 */
export class CheckinService {
  /**
   * 執行簽到
   */
  async checkin(userId: number, groupId: number): Promise<{
    pointsEarned: number;
    streak: number;
    totalPoints: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 檢查今日是否已簽到
    const existing = await prisma.checkin.findFirst({
      where: {
        userId,
        checkedAt: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing) {
      throw new Error('已經簽到過了');
    }

    // 2. 獲取用戶信息
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new Error('User not found');

    // 3. 計算連續簽到天數
    let streak = user.checkinStreak;
    const lastCheckin = user.lastCheckinAt;

    if (lastCheckin) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastCheckin >= yesterday) {
        // 昨天有簽到 → 連續天數 +1
        streak += 1;
      } else {
        // 中斷了 → 重設為 1
        streak = 1;
      }
    } else {
      streak = 1;
    }

    // 4. 計算本日獲得積分（固定 1 分 + 連續獎勵）
    let pointsEarned = 1; // 基礎

    // 連續簽到獎勵（每 3、5、7 天有額外獎勵）
    if (streak >= 3 && streak < 5) pointsEarned += 1;
    else if (streak >= 5 && streak < 7) pointsEarned += 2;
    else if (streak >= 7) pointsEarned += 3;

    // 5. 創建簽到記錄
    await prisma.checkin.create({
      data: {
        userId,
        groupId,
        pointsEarned,
        streakBefore: user.checkinStreak,
        streakAfter: streak
      }
    });

    // 6. 更新用戶
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: pointsEarned },
        lastCheckinAt: new Date(),
        checkinStreak: streak,
        checkinCount: { increment: 1 },
        totalPointsEarned: { increment: pointsEarned }
      }
    });

    // 7. 創建積分流水
    await prisma.pointsTransaction.create({
      data: {
        userId,
        type: 'checkin',
        amount: pointsEarned,
        balanceAfter: user.points + pointsEarned,
        metadata: { streak, groupId }
      }
    });

    logger.info('Checkin completed', { userId, streak, pointsEarned });

    return {
      pointsEarned,
      streak,
      totalPoints: user.points + pointsEarned
    };
  }

  /**
   * 獲取個人詳情
   */
  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        checkinStreak: true,
        checkinCount: true,
        lastCheckinAt: true,
        walletAddress: true,
        balanceUsdt: true,
        isBlacklisted: true
      }
    });

    return user;
  }
}

export const checkinService = new CheckinService();
