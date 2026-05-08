/**
 * 模块類型枚舉
 */
export enum ModuleType {
  BOOT = 'boot',
  ACTIVITY = 'activity',
  BROADCAST = 'broadcast',
  NIGHT = 'night',
  VERIFY = 'verify',
  CHECKIN = 'checkin',
  FORWARD = 'forward',
  DICE = 'dice',
  CAROUSEL = 'carousel',
  CLEAN = 'clean'
}

/**
 * 內容類型枚舉
 */
export enum ContentType {
  ADVERTISEMENT = 'advertisement',
  Chat = 'chat',
  SIGNIN = 'signin',
  GAMBLING = 'gambling',
  DICE = 'dice'
}

/**
 * 按鈕類型枚舉
 */
export enum ButtonType {
  LINK = 'link',
  CALLBACK = 'callback',
  WEBAPP = 'webapp',
  URL_JUMP = 'url_jump',
  PRIVATE_CALLBACK = 'private_callback'
}

/**
 * 按鈕配置介面
 */
export interface ButtonConfig {
  text: string;
  type: ButtonType;
  value: string;
  row?: number;
}

/**
 * 通用內容配置（所有模塊使用）
 */
export interface ContentItem {
  id: string;                    // 唯一標識（如：廣告版-001）
  module: ModuleType;           // 所屬模塊
  category: ContentType;        // 分類
  groupId?: number;             // 所屬群組 ID（NULL = 全局）

  // 內容本體
  content: {
    image?: string;
    text: string;               // HTML 格式
    buttons: ButtonConfig[];
  };

  // 執行配置
  action?: {
    type: 'callback' | 'link' | 'webapp' | 'url_jump' | 'private_callback';
    value: string;              // 回調值或連結 URL
    handler?: string;           // 處理器函數名（可選）
  };

  // 觸發條件
  trigger: {
    type: 'button_click' | 'user_join' | 'timer' | 'message_keyword';
    groupId?: number;
    keywords?: string[];
    schedule?: string;          // Cron 表達式
  };

  // 顯示控制
  display: {
    isActive: boolean;
    startTime?: string;         // HH:mm 格式
    endTime?: string;
    priority: number;
  };

  // 元數據（遊戲規則、賠率等擴展字段）
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 骰子遊戲狀態
 */
export enum DiceGameStatus {
  WAITING = 'waiting',
  BETTING = 'betting',
  ROLLING = 'rolling',
  SETTLING = 'settling',
  CLOSED = 'closed'
}

/**
 * 骰子遊戲類型
 */
export enum DiceGameType {
  NIUNIU = 'niuniu',
  CLASSIC = 'classic'
}

/**
 * 骰子點數結果
 */
export interface DiceResult {
  dice: number[];               // [1,2,3,4,5]
  sum: number;                  // 總和
  remainder: number;            // 取餘數（點數）
  type: DicePointType;          // 牌型
  multiplier: number;           // 賠率倍數
}

/**
 * 骰子點數類型（牛牛規則）
 */
export enum DicePointType {
  NIU_NIU = 'niu_niu',          // 牛牛 5倍
  NIU_9 = 'niu_9',             // 牛9 4倍
  NIU_8 = 'niu_8',             // 牛8 4倍
  NIU_7 = 'niu_7',             // 牛7 4倍
  NIU_6 = 'niu_6',             // 牛6 2倍
  NIU_5 = 'niu_5',
  NIU_4 = 'niu_4',
  NIU_3 = 'niu_3',
  NIU_2 = 'niu_2',
  NIU_1 = 'niu_1',
  IRON_STRAIGHT = 'iron_straight', // 鐵支順子 5倍
  PAIR = 'pair'                 // 對子 2倍
}

/**
 * 骰子遊戲房間
 */
export interface DiceGame {
  id: number;
  roomId: string;
  groupId: number;

  gameType: DiceGameType;
  betMode: 'normal' | 'double';
  minBetUsdt: number;
  maxBetUsdt?: number;

  // 莊家
  hostUserId: number;
  hostBetUsdt: number;
  hostDice: number[];
  hostResult: DiceResult;
  hostPayoutMultiplier: number;

  // 狀態
  status: DiceGameStatus;
  startedAt?: Date;
  settledAt?: Date;

  participants: DiceParticipant[];
  createdAt: Date;
}

/**
 * 骰子參與者
 */
export interface DiceParticipant {
  id: number;
  gameId: number;
  userId: number;

  betUsdt: number;
  betMultiplier: 1 | 2;         // 1=平倍, 2=翻倍

  playerDice?: number[];
  playerResult?: DiceResult;
  payoutUsdt?: number;
  result?: 'win' | 'lose' | 'tie';

  joinedAt: Date;
}

/**
 * 用戶實例
 */
export interface User {
  id: number;
  telegramId: bigint;
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;

  // 積分
  points: number;
  totalPointsEarned: number;
  totalPointsSpent: number;

  // 簽到
  lastCheckinAt?: Date;
  checkinStreak: number;
  checkinCount: number;

  // 錢包
  balanceUsdt: number;
  walletAddress?: string;

  // 狀態
  isVerified: boolean;
  isBlacklisted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 群組實例
 */
export interface Group {
  id: number;
  telegramChatId: bigint;
  title: string;
  username?: string;

  ownerUserId: number;

  // 模塊開關（JSON）
  modulesEnabled: {
    boot: boolean;
    activity: boolean;
    broadcast: boolean;
    night: boolean;
    verify: boolean;
    checkin: boolean;
    forward: boolean;
    dice: boolean;
    carousel: boolean;
    clean: boolean;
  };

  // 骰子設置
  diceSettings: {
    commissionRate: number;      // 5%
    minBet: number;
    maxBet: number;
    gameType: DiceGameType;
  };

  // 輪播設置
  carouselSettings: {
    intervalSeconds: number;     // 5秒
    startIndex: number;
    enabledChannels: ContentType[];
  };

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 簽到記錄
 */
export interface Checkin {
  id: number;
  userId: number;
  groupId: number;
  telegramMessageId?: bigint;

  pointsEarned: number;
  streakBefore: number;
  streakAfter: number;

  checkedAt: Date;
}

/**
 * 積分流水
 */
export interface PointsTransaction {
  id: number;
  userId: number;
  type: 'checkin' | 'win' | 'lose' | 'commission' | 'transfer' | 'wheel';
  amount: number;
  balanceAfter: number;

  gameId?: number;
  referenceId?: number;
  metadata: Record<string, any>;

  createdAt: Date;
}

/**
 * 錢包流水
 */
export interface WalletTransaction {
  id: number;
  userId: number;

  type: 'deposit' | 'withdraw' | 'win' | 'lose' | 'commission' | 'checkin';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;

  gameId?: number;
  txHash?: string;

  status: 'pending' | 'completed' | 'failed';
  note?: string;

  createdAt: Date;
}

/**
 * 輪盤記錄
 */
export interface WheelSpin {
  id: number;
  userId: number;
  groupId: number;

  prizeType: string;             // 一等獎、二等獎...
  prizeAmount: number | null;    // USDT 金額

  createdAt: Date;
}

/**
 * 輪播內容
 */
export interface CarouselMessage {
  id: number;
  groupId: number;
  contentType: ContentType;
  contentKey: string;            // 唯一鍵：廣告版-001
  contentJson: ContentItem['content'];
  triggerType: string;
  triggerConfig: Record<string, any>;

  isActive: boolean;
  sortOrder: number;
  sendCount: number;
  lastSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * 系統日誌
 */
export interface SystemLog {
  id: number;
  module: string;
  source: 'frontend' | 'backend' | 'bot';
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  action?: string;
  message: string;
  metadata: Record<string, any>;

  userId?: number;
  groupId?: number;
  telegramChatId?: bigint;
  telegramMessageId?: bigint;

  ipAddress?: string;
  userAgent?: string;

  createdAt: Date;
}

/**
 * API 響應通用格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分頁響應
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * JWT Token Payload
 */
export interface TokenPayload {
  userId: number;
  telegramId: bigint;
  iat?: number;
  exp?: number;
}

/**
 * 認證請求
 */
export interface AuthRequest {
  id: bigint;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * 遊戲設置
 */
export interface GameSettings {
  commissionRate: number;          // 5%
  multipliers: Record<string, number>;  // 賠率表
  minBet: number;
  maxBet: number;
  allowDoubleBet: boolean;
}

/**
 * 默認骰子賠率表
 */
export const DEFAULT_MULTIPLIERS: Record<string, number> = {
  niu_niu: 5,
  niu_9: 4,
  niu_8: 4,
  niu_7: 4,
  niu_6: 2,
  niu_5: 2,
  niu_4: 2,
  niu_3: 2,
  niu_2: 2,
  niu_1: 2,
  iron_straight: 5,
  pair: 2
};

/**
 * 骰子賠率排序（用於比較大小）
 */
export const RANK_ORDER: DicePointType[] = [
  DicePointType.NIU_NIU,
  DicePointType.IRON_STRAIGHT,
  DicePointType.NIU_9,
  DicePointType.NIU_8,
  DicePointType.NIU_7,
  DicePointType.NIU_6,
  DicePointType.NIU_5,
  DicePointType.NIU_4,
  DicePointType.NIU_3,
  DicePointType.NIU_2,
  DicePointType.NIU_1,
  DicePointType.PAIR
];

/**
 * 活動類型枚舉
 */
export enum ActivityType {
  LOTTERY = 'lottery',
  STREAK = 'streak',
  RANKING = 'ranking',
  ACCUMULATIVE = 'accumulative'
}

/**
 * 活動參與者狀態
 */
export interface Activity {
  id: number;
  title: string;
  type: ActivityType;
  startDate: Date;
  endDate: Date;
  rules: Record<string, any>;
  rewards: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 活動參與記錄
 */
export interface ActivityParticipant {
  id: number;
  activityId: number;
  userId: number;
  progress: Record<string, any>;
  joinedAt: Date;
  completedAt?: Date;
  rewardGiven: boolean;
}
