import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';
import { ActivityType } from '@metricgram/shared-types';

export interface CreateActivityParams {
  title: string;
  type: ActivityType;
  startDate: Date;
  endDate: Date;
  rules: any;
  rewards: any;
  isActive?: boolean;
}

export interface UpdateActivityParams {
  title?: string;
  startDate?: Date;
  endDate?: Date;
  rules?: any;
  rewards?: any;
  isActive?: boolean;
}

export interface ParticipantJoinParams {
  userId: number;
  activityId: number;
  extra?: any;
}

export interface AwardPrizeParams {
  activityId: number;
  userId: number;
  rankOrTier?: number;
}

export interface UserActivityStatus {
  activityId: number;
  userId: number;
  progress: Record<string, any>;
  joinedAt: Date;
  completedAt: Date | null;
  rewardGiven: boolean;
}

export interface LeaderboardEntry {
  userId: number;
  rank: number;
  score: number;
  progress: Record<string, any>;
}

/**
 * 活動服務
 * 管理限時活動（抽獎、累計登入、排行榜、累積任務）
 */
export class ActivityService {
  /**
   * 創建活動
   */
  async createActivity(params: CreateActivityParams) {
    const {
      title,
      type,
      startDate,
      endDate,
      rules,
      rewards,
      isActive = true
    } = params;

    // 參數驗證
    if (!title || !type || !startDate || !endDate) {
      throw new Error('缺少必要參數: title, type, startDate, endDate');
    }

    if (startDate >= endDate) {
      throw new Error('開始日期必須早於結束日期');
    }

    // 創建活動
    const activity = await prisma.activity.create({
      data: {
        title,
        type,
        startDate,
        endDate,
        rules: JSON.stringify(rules),
        rewards: JSON.stringify(rewards),
        isActive
      }
    });

    logger.info('Activity created', { activityId: activity.id, type });
    return activity;
  }

  /**
   * 獲取當前進行中的活動
   */
  async getActiveActivities() {
    const now = new Date();

    const activities = await prisma.activity.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      orderBy: { createdAt: 'desc' }
    });

    return activities.map(a => this.serializeActivity(a));
  }

  /**
   * 獲取所有活動（可選過濾）
   */
  async getActivities(filters?: {
    type?: ActivityType;
    status?: 'active' | 'upcoming' | 'ended' | 'all';
    isActive?: boolean;
  }) {
    const now = new Date();
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        where.startDate = { lte: now };
        where.endDate = { gte: now };
      } else if (filters.status === 'upcoming') {
        where.startDate = { gt: now };
      } else if (filters.status === 'ended') {
        where.endDate = { lt: now };
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return activities.map(a => this.serializeActivity(a));
  }

  /**
   * 獲取單個活動詳情
   */
  async getActivityById(id: number) {
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      throw new Error('活動不存在');
    }

    return this.serializeActivity(activity);
  }

  /**
   * 更新活動
   */
  async updateActivity(id: number, updates: UpdateActivityParams) {
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      throw new Error('活動不存在');
    }

    // 準備更新數據
    const updateData: any = {};
    const fields: (keyof UpdateActivityParams)[] = ['title', 'startDate', 'endDate', 'rules', 'rewards', 'isActive'];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field] instanceof Date
          ? updates[field]
          : JSON.stringify(updates[field]);
      }
    }

    // 驗證日期邏輯
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        throw new Error('開始日期必須早於結束日期');
      }
    } else if (updateData.startDate) {
      if (updateData.startDate >= activity.endDate) {
        throw new Error('開始日期必須早於結束日期');
      }
    } else if (updateData.endDate) {
      if (activity.startDate >= updateData.endDate) {
        throw new Error('開始日期必須早於結束日期');
      }
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: updateData
    });

    logger.info('Activity updated', { activityId: id });
    return this.serializeActivity(updated);
  }

  /**
   * 刪除活動
   */
  async deleteActivity(id: number) {
    const activity = await prisma.activity.findUnique({
      where: { id }
    });

    if (!activity) {
      throw new Error('活動不存在');
    }

    await prisma.activity.delete({
      where: { id }
    });

    logger.info('Activity deleted', { activityId: id });
    return { success: true };
  }

  /**
   * 用戶參與活動
   */
  async participantJoin(params: ParticipantJoinParams) {
    const { userId, activityId, extra } = params;

    // 驗證活動是否存在且進行中
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new Error('活動不存在');
    }

    const now = new Date();
    if (now < activity.startDate || now > activity.endDate) {
      throw new Error('活動未在進行中');
    }

    if (!activity.isActive) {
      throw new Error('活動已停用');
    }

    // 檢查是否已參與
    const existing = await prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId } }
    });

    if (existing) {
      throw new Error('您已參與此活動');
    }

    // 根據活動類型驗證 eligibility
    await this.validateEligibility(userId, activityId, activity.type, activity.rules);

    // 創建參與記錄
    const participant = await prisma.activityParticipant.create({
      data: {
        activityId,
        userId,
        progress: JSON.stringify(extra || {}),
        joinedAt: now
      }
    });

    // 針對不同活動類型初始化進度
    await this.initializeProgress(activityId, userId, activity.type);

    logger.info('User joined activity', { userId, activityId, type: activity.type });
    return participant;
  }

  /**
   * 獲取排行榜（ranking 類型）
   */
  async getLeaderboard(activityId: number) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new Error('活動不存在');
    }

    if (activity.type !== 'ranking') {
      throw new Error('此活動類型不支持排行榜');
    }

    // 獲取所有參與者，按 progress 中的 score 字段排序
    const participants = await prisma.activityParticipant.findMany({
      where: { activityId },
      orderBy: { joinedAt: 'asc' } // 先按時間排序，之後會重新排序
    });

    // 解析 progress 並排序
    const entries: LeaderboardEntry[] = [];
    for (const p of participants) {
      const progress = typeof p.progress === 'string' ? JSON.parse(p.progress) : p.progress;
      const score = progress.score || 0;
      entries.push({
        userId: p.userId,
        rank: 0,
        score,
        progress
      });
    }

    // 按分數降序排序
    entries.sort((a, b) => b.score - a.score);

    // 賦予排名
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  /**
   * 手動發放獎勵（管理員）
   */
  async awardPrize(params: AwardPrizeParams) {
    const { activityId, userId, rankOrTier } = params;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      throw new Error('活動不存在');
    }

    // 獲取參與者
    const participant = await prisma.activityParticipant.findFirst({
      where: { activityId, userId }
    });

    if (!participant) {
      throw new Error('用戶未參與此活動');
    }

    if (participant.rewardGiven) {
      throw new Error('獎勵已發放');
    }

    // 根據活動類型和獎勵配置計算獎勵
    const reward = await this.calculateReward(activity, rankOrTier);

    // 發放獎勵到錢包
    if (reward.usdtAmount > 0) {
      try {
        // 動態导入 walletService 避免循環依賴
        const { walletService } = await import('@/modules/wallet/service');
        await walletService.deposit(userId, reward.usdtAmount, `Activity reward: ${activity.title}`);
      } catch (err) {
        logger.error('Failed to deposit reward', { userId, activityId, error: err });
        throw new Error('獎勵發放失敗');
      }
    }

    // 標記已發獎
    await prisma.activityParticipant.update({
      where: { id: participant.id },
      data: {
        rewardGiven: true,
        completedAt: new Date(),
        progress: JSON.stringify({
          ...(typeof participant.progress === 'string' ? JSON.parse(participant.progress) : participant.progress),
          reward,
          awardedAt: new Date().toISOString()
        })
      }
    });

    // 記錄獎勵流水（可選）
    await this.recordRewardTransaction(userId, activityId, reward);

    logger.info('Prize awarded', { userId, activityId, reward });
    return { success: true, reward };
  }

  /**
   * 查詢用戶參與進度
   */
  async getUserActivityStatus(userId: number, activityId: number): Promise<UserActivityStatus | null> {
    const participant = await prisma.activityParticipant.findFirst({
      where: {
        activityId,
        userId
      }
    });

    if (!participant) {
      return null;
    }

    return {
      activityId,
      userId,
      progress: typeof participant.progress === 'string' ? JSON.parse(participant.progress) : participant.progress,
      joinedAt: participant.joinedAt,
      completedAt: participant.completedAt,
      rewardGiven: participant.rewardGiven
    };
  }

  /**
   * 獲取用戶參與的所有活動
   */
  async getUserActivities(userId: number) {
    const participants = await prisma.activityParticipant.findMany({
      where: { userId },
      include: {
        activity: true
      },
      orderBy: { joinedAt: 'desc' }
    });

    return participants.map(p => ({
      activity: this.serializeActivity(p.activity),
      status: this.serializeParticipant(p)
    }));
  }

  /**
   * 追蹤簽到連貫（供 checkin module 鉤子调用）
   */
  async trackStreak(userId: number, currentStreak: number) {
    // 查找進行中的 streak 活動
    const now = new Date();
    const activities = await prisma.activity.findMany({
      where: {
        type: 'streak',
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    for (const activity of activities) {
      // 檢查是否已參與
      const participant = await prisma.activityParticipant.findFirst({
        where: { activityId: activity.id, userId }
      });

      if (participant) {
        // 更新進度
        const progress = typeof participant.progress === 'string'
          ? JSON.parse(participant.progress)
          : participant.progress;

        progress.currentStreak = currentStreak;
        progress.lastUpdatedAt = now.toISOString();

        await prisma.activityParticipant.update({
          where: { id: participant.id },
          data: { progress: JSON.stringify(progress) }
        });

        // 檢查是否達成目標（從 rules 中讀取目標天數）
        const rules = typeof activity.rules === 'string'
          ? JSON.parse(activity.rules)
          : activity.rules;
        const targetDays = rules.targetDays || 7;

        if (currentStreak >= targetDays && !participant.rewardGiven) {
          logger.info('Streak target reached', { userId, activityId: activity.id, streak: currentStreak });
          // 觸發自動發獎邏輯（可選）
          // await this.autoAward(activity.id, userId);
        }
      }
    }
  }

  /**
   * 追蹤贏利（供 dice module 鉤子调用）
   */
  async trackWinnings(userId: number, amount: number) {
    // 查找进行中的 ranking 或 accumulative 活動
    const now = new Date();
    const activities = await prisma.activity.findMany({
      where: {
        type: { in: ['ranking', 'accumulative'] },
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    for (const activity of activities) {
      const participant = await prisma.activityParticipant.findFirst({
        where: { activityId: activity.id, userId }
      });

      if (participant) {
        const progress = typeof participant.progress === 'string'
          ? JSON.parse(participant.progress)
          : participant.progress;

        // 累積贏利或次數
        if (!progress.totalWinnings) progress.totalWinnings = 0;
        progress.totalWinnings += amount;

        if (!progress.winCount) progress.winCount = 0;
        if (amount > 0) progress.winCount += 1;

        progress.lastUpdatedAt = now.toISOString();

        await prisma.activityParticipant.update({
          where: { id: participant.id },
          data: { progress: JSON.stringify(progress) }
        });
      }
    }
  }

  /**
   * 自動執行活動檢查（定時任務調用）
   */
  async runScheduledTasks() {
    const now = new Date();
    const activities = await prisma.activity.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    const results = [];

    for (const activity of activities) {
      try {
        await this.processActivity(activity);
        results.push({ activityId: activity.id, success: true });
      } catch (error: any) {
        logger.error('Activity processing failed', { activityId: activity.id, error: error.message });
        results.push({ activityId: activity.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // ================= 私有方法 =================

  /**
   * 解析活動為對外格式
   */
  private serializeActivity(activity: any) {
    const rules = typeof activity.rules === 'string' ? JSON.parse(activity.rules) : activity.rules;
    const rewards = typeof activity.rewards === 'string' ? JSON.parse(activity.rewards) : activity.rewards;

    return {
      id: activity.id,
      title: activity.title,
      type: activity.type,
      startDate: activity.startDate,
      endDate: activity.endDate,
      rules,
      rewards,
      isActive: activity.isActive,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt
    };
  }

  /**
   * 解析參與者為對外格式
   */
  private serializeParticipant(participant: any) {
    return {
      id: participant.id,
      activityId: participant.activityId,
      userId: participant.userId,
      progress: typeof participant.progress === 'string' ? JSON.parse(participant.progress) : participant.progress,
      joinedAt: participant.joinedAt,
      completedAt: participant.completedAt,
      rewardGiven: participant.rewardGiven
    };
  }

  /**
   * 驗證參與資格
   */
  private async validateEligibility(userId: number, activityId: number, type: ActivityType, rulesJson: any) {
    const rules = typeof rulesJson === 'string' ? JSON.parse(rulesJson) : rulesJson;

    // 檢查最小連續簽到天數（如要求）
    if (rules.minStreak) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { checkinStreak: true }
      });

      if (!user || user.checkinStreak < rules.minStreak) {
        throw new Error(`需要至少 ${rules.minStreak} 天連續簽到才能參與`);
      }
    }

    // 檢查最小積分
    if (rules.minPoints) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      });

      if (!user || user.points < rules.minPoints) {
        throw new Error(`需要至少 ${rules.minPoints} 積分才能參與`);
      }
    }

    // 檢查已參與次數限制
    if (rules.maxParticipants) {
      const count = await prisma.activityParticipant.count({
        where: { activityId }
      });

      if (count >= rules.maxParticipants) {
        throw new Error('活動人數已滿');
      }
    }
  }

  /**
   * 初始化進度數據
   */
  private async initializeProgress(activityId: number, userId: number, type: ActivityType) {
    const defaultProgress: Record<string, any> = {
      joinedAt: new Date().toISOString()
    };

    // 根據類型設置默認字段
    if (type === 'lottery') {
      defaultProgress.tickets = 0;
      defaultProgress.eligible = true;
    } else if (type === 'streak') {
      defaultProgress.currentStreak = 0;
      defaultProgress.targetDays = 7;
    } else if (type === 'ranking') {
      defaultProgress.score = 0;
      defaultProgress.rank = 0;
    } else if (type === 'accumulative') {
      defaultProgress.count = 0;
      defaultProgress.target = 10;
    }

    await prisma.activityParticipant.update({
      where: { activityId_userId: { activityId, userId } },
      data: { progress: JSON.stringify(defaultProgress) }
    });
  }

  /**
   * 計算獎勵
   */
  private async calculateReward(activity: any, rankOrTier?: number) {
    const rewards = typeof activity.rewards === 'string'
      ? JSON.parse(activity.rewards)
      : activity.rewards;

    let reward: any = {};

    if (activity.type === 'lottery') {
      // 抽獎：隨機命中一個獎項
      reward = this.pickLotteryPrize(rewards);
    } else if (activity.type === 'streak') {
      // 連貫：直接取得配置的獎勵
      reward = rewards.tiers?.[0] || rewards;
    } else if (activity.type === 'ranking') {
      // 排行榜：根據排名取獎勵
      const tiers = rewards.tiers || [];
      reward = tiers.find((t: any) => rankOrTier <= t.maxRank) || tiers[tiers.length - 1];
    } else if (activity.type === 'accumulative') {
      // 累積：完成即發放
      reward = rewards;
    }

    return reward;
  }

  /**
   * 隨機選取抽獎獎項（按概率）
   */
  private pickLotteryPrize(rewards: any) {
    const prizes = rewards.prizes || [];
    const totalWeight = prizes.reduce((sum: number, p: any) => sum + p.probability, 0);
    let random = Math.random() * totalWeight;

    for (const prize of prizes) {
      random -= prize.probability;
      if (random <= 0) {
        return prize;
      }
    }

    return prizes[prizes.length - 1];
  }

  /**
   * 記錄獎勵流水
   */
  private async recordRewardTransaction(userId: number, activityId: number, reward: any) {
    await prisma.pointsTransaction.create({
      data: {
        userId,
        type: 'activity',
        amount: reward.amount || 0,
        balanceAfter: 0, // TODO: calculate
        metadata: { activityId, reward }
      }
    });
  }

  /**
   * 處理單個活動（定時任務）
   */
  private async processActivity(activity: any) {
    const now = new Date();

    switch (activity.type) {
      case 'lottery':
        await this.processLottery(activity);
        break;
      case 'streak':
        // streak 類型在用戶簽到時觸發，不需定時處理
        break;
      case 'ranking':
        // ranking 可能在結束時結算
        if (now >= activity.endDate) {
          await this.finalizeRanking(activity);
        }
        break;
      case 'accumulative':
        // 檢查哪些用戶已完成
        await this.checkAccumulativeCompletion(activity);
        break;
    }
  }

  /**
   * 處理抽獎活動
   */
  private async processLottery(activity: any) {
    const participants = await prisma.activityParticipant.findMany({
      where: { activityId: activity.id },
      include: { user: true }
    });

    const rules = typeof activity.rules === 'string' ? JSON.parse(activity.rules) : activity.rules;
    const winnersCount = rules.winnersCount || 1;

    // 隨機選取 winnersCount 個獲獎者
    const winners = this.shuffleArray(participants).slice(0, winnersCount);

    for (const winner of winners) {
      if (!winner.rewardGiven) {
        const reward = await this.calculateReward(activity);
        await this.applyReward(winner.userId, activity.id, reward);
      }
    }

    logger.info('Lottery processed', { activityId: activity.id, winners: winners.length });
  }

  /**
   * 最終化排行榜（發放獎勵）
   */
  private async finalizeRanking(activity: any) {
    const leaderboard = await this.getLeaderboard(activity.id);
    const rewards = typeof activity.rewards === 'string'
      ? JSON.parse(activity.rewards)
      : activity.rewards;
    const tiers = rewards.tiers || [];

    for (const entry of leaderboard) {
      const tier = tiers.find((t: any) => entry.rank <= t.maxRank);
      if (tier && !entry.rewardGiven) {
        await this.awardPrize({
          activityId: activity.id,
          userId: entry.userId,
          rankOrTier: entry.rank
        });
      }
    }
  }

  /**
   * 檢查累積任務完成情況
   */
  private async checkAccumulativeCompletion(activity: any) {
    const participants = await prisma.activityParticipant.findMany({
      where: { activityId: activity.id }
    });

    const rules = typeof activity.rules === 'string' ? JSON.parse(activity.rules) : activity.rules;
    const target = rules.target || 10;

    for (const p of participants) {
      const progress = typeof p.progress === 'string' ? JSON.parse(p.progress) : p.progress;
      if ((progress.count || 0) >= target && !p.rewardGiven) {
        await this.awardPrize({
          activityId: activity.id,
          userId: p.userId
        });
      }
    }
  }

  /**
   * 應用獎勵
   */
  private async applyReward(userId: number, activityId: number, reward: any) {
    if (reward.usdtAmount > 0) {
      const { walletService } = await import('@/modules/wallet/service');
      await walletService.deposit(userId, reward.usdtAmount, `Activity reward`);
    }

    await prisma.activityParticipant.updateMany({
      where: { activityId, userId },
      data: {
        rewardGiven: true,
        completedAt: new Date()
      }
    });
  }

  /**
   * 洗牌算法
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export const activityService = new ActivityService();
