import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 儀表板統計服務
 */
export class DashboardService {
  /**
   * 獲取總覽數據
   */
  async getOverview(groupId?: number) {
    // 基本統計
    const totalUsers = await prisma.user.count();
    const totalMessages = await prisma.checkin.count(); // 示例紀錄
    const totalCheckins = await prisma.checkin.count();

    // 遊戲統計
    const totalGames = await prisma.diceGame.count();
    const totalParticipants = await prisma.diceParticipant.count();

    // 錢包統計
    const totalBalance = await prisma.user.aggregate({
      _sum: { balanceUsdt: true }
    });

    return {
      totalUsers,
      activeUsers: totalUsers, // TODO: 활성用户
      totalMessages,
      todayCheckins: totalCheckins, // TODO: 今日签到
      totalRevenue: totalBalance._sum.balanceUsdt || 0,
      totalGames,
      chartData: {
        daily: [40, 65, 30, 80, 55, 45, 70, 35, 60, 50, 75, 40, 55, 45]
      }
    };
  }

  /**
   * 獲取消息統計
   */
  async getMessageStats(days: number = 7) {
    // 按日期分組統計
    const stats = await prisma.checkin.groupBy({
      by: ['checkedAt'],
      where: {
        checkedAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      _count: { userId: true }
    });

    return stats;
  }

  /**
   * 獲取用戶行為統計
   */
  async getUserStats() {
    const stats = await prisma.user.aggregate({
      _avg: { checkinStreak: true, checkinCount: true },
      _max: { points: true }
    });

    return stats;
  }
}

export const dashboardService = new DashboardService();
