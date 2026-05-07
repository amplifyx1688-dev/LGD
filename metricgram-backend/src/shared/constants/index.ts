/**
 * 骰子遊戲常量配置
 * 所有數值都可在數據庫中覆蓋
 */
export const DICE_CONSTANTS = {
  // 佣金比例（公積金）
  COMMISSION_RATE: 0.05, // 5%

  // 默認遊戲設置
  DEFAULT_GAME_TYPE: 'niuniu',
  DEFAULT_BET_MODE: 'normal',
  
  // 時間設置（秒）
  BETTING_TIMEOUT: 300,    // 下注時間 5 分鐘
  ROLLING_TIMEOUT: 60,     // 擲骰時間 1 分鐘
  SETTLE_TIMEOUT: 30,      // 結算時間 30 秒
  
  // 骰子類型
  DICE_EMOJI: '🎲',
  DICE_COUNT: 5,           // 每次擲 5 顆骰子
  
  // 最小/最大下注（可被群組設置覆蓋）
  MIN_BET: 1,
  MAX_BET: 1000
};

/**
 * 默認賠率表（數據庫可修改）
 * 存儲位置：game_settings 表中
 */
export const DEFAULT_MULTIPLIERS = {
  niu_niu: 5,       // 牛牛 5倍
  niu_9: 4,         // 牛9 4倍
  niu_8: 4,
  niu_7: 4,
  niu_6: 2,
  niu_5: 2,
  niu_4: 2,
  niu_3: 2,
  niu_2: 2,
  niu_1: 2,
  iron_straight: 5, // 鐵支順子 5倍
  pair: 2           // 對子 2倍
};

/**
 * 牌型比較順序（從大到小）
 */
export const RANK_ORDER = [
  'niu_niu',
  'iron_straight',
  'niu_9',
  'niu_8',
  'niu_7',
  'niu_6',
  'niu_5',
  'niu_4',
  'niu_3',
  'niu_2',
  'niu_1',
  'pair'
];

/**
 * 錯誤消息（數據庫可覆蓋為多語言）
 */
export const ERROR_MESSAGES = {
  GAME_NOT_FOUND: '遊戲房間不存在',
  GAME_ALREADY_STARTED: '遊戲已開始',
  GAME_FULL: '房間已滿',
  INSUFFICIENT_BALANCE: '餘額不足',
  BET_BELOW_MINIMUM: '下注金額低於最小值',
  BET_EXCEEDS_MAXIMUM: '下注金額超過上限',
  NOT_HOST: '僅莊家可操作',
  NOT_PARTICIPANT: '您未參與此遊戲',
  GAME_NOT_BETTING: '當前無法下注',
  ALREADY_ROLLED: '已擲過骰子',
  BLACKLISTED: '您已被列入黑名單',
  RATE_LIMIT_EXCEEDED: '操作過於頻繁，請稍後再試'
};

/**
 * 成功消息
 */
export const SUCCESS_MESSAGES = {
  ROOM_CREATED: '房間創建成功',
  JOINED_GAME: '成功加入遊戲',
  PAYMENT_CONFIRMED: '支付確認完成',
  GAME_STARTED: '遊戲開始',
  WHEEL_SPUN: '轉盤完成',
  CHECKIN_SUCCESS: '簽到成功'
};

/**
 * 輪播配置常量
 */
export const CAROUSEL_CONSTANTS = {
  DEFAULT_INTERVAL_SECONDS: 5,
  MIN_INTERVAL: 3,        // 最小間隔 3 秒
  MAX_INTERVAL: 60,       // 最大間隔 60 秒
  
  // 頻道類型
  CHANNELS: {
    ADVERTISEMENT: 'ad',
    CHAT: 'chat',
    SIGNIN: 'signin',
    GAMBLING: 'gambling',
    DICE: 'dice'
  },
  
  // 默認啟用的頻道
  DEFAULT_ENABLED_CHANNELS: ['ad', 'chat', 'signin'],
  
  // 時間窗口
  TIME_WINDOWS: {
    VOICE_ENABLED: { start: '08:00', end: '22:00' },
    SILENT_ENABLED: { start: '22:00', end: '08:00' }
  }
};

/**
 * 簽到常量
 */
export const CHECKIN_CONSTANTS = {
  DAILY_REWARD: 1,        // 每日簽到固定積分
  
  // 連續簽到獎勵（天數：獎勵積分）
  STREAK_BONUS: {
    3: 1,
    5: 2,
    7: 3,
    14: 5,
    30: 10
  },
  
  // 最大連續天數記錄
  MAX_STREAK: 365
};

/**
 * 輪盤常量
 */
export const WHEEL_CONSTANTS = {
  // 觸發門檻（積分）
  TRIGGER_THRESHOLD: 20,
  
  // 獎項配置（概率總和必須 = 1）
  PRIZES: [
    { type: '一等獎', probability: 0.0001, amount: 8888, usdtAmount: 8888 },
    { type: '二等獎', probability: 0.001,  amount: 888,  usdtAmount: 888 },
    { type: '三等獎', probability: 0.005,  amount: 588,  usdtAmount: 588 },
    { type: '四等獎', probability: 0.01,   amount: 188,  usdtAmount: 188 },
    { type: '五等獎', probability: 0.03,   amount: 88,   usdtAmount: 88 },
    { type: '六等獎', probability: 0.03,   amount: 18,   usdtAmount: 18 },
    { type: '七等獎', probability: 0.07,   amount: 10,   usdtAmount: 10 },
    { type: '八等獎', probability: 0.15,   amount: 5,    usdtAmount: 5 },
    { type: '九等獎', probability: 0.2939, amount: 3,    usdtAmount: 3 },
    { type: '十等獎', probability: 0.2939, amount: 1,    usdtAmount: 1 },
    { type: '再接再厲', probability: 0.40,  amount: 0,    usdtAmount: 0 }
  ]
};

/**
 * 廣播常量
 */
export const BROADCAST_CONSTANTS = {
  // 默認廣播時間
  NOON_TIME: '11:30',
  RED_ENVELOPE_TIME: '17:30',
  
  // 廣播類型
  TYPES: {
    NOON: 'noon',
    RED_ENVELOPE: 'red_envelope',
    TEMP: 'temp'
  }
};

/**
 * 清潔常量
 */
export const CLEAN_CONSTANTS = {
  // 要清理的消息類型
  MESSAGE_TYPES: {
    MEMBER_JOIN: 'member_join',
    MEMBER_LEAVE: 'member_leave',
    TOPIC_CREATED: 'topic_created',
    TOPIC_CLOSED: 'topic_closed',
    PINNED_MESSAGE: 'pinned_message',
    ADMIN_COMMAND: 'admin_command',
    LINK_INVITE: 'link_invite'
  },
  
  // 自動清理時間（分鐘）
  DEFAULT_CLEAN_INTERVAL: 5
};

/**
 * 按鈕處理器映射（關鍵：腳本不動原則）
 * 當新增按鈕時，只需在 database 中插入對應 mapping
 * 不需要修改代碼
 */
export const BUTTON_HANDLER_MAP: Record<string, string> = {
  // 簽到模塊
  'do_signin': 'handleCheckin',
  'profile': 'handleProfile',
  'spin_wheel': 'handleSpinWheel',
  'wheel_prizes': 'handleWheelPrizes',
  'back_to_main': 'handleBackToMain',
  
  // 骰子模塊
  'cmd_create_room': 'handleCreateRoom',
  'callback_select_niuniu': 'handleSelectNiuniu',
  'callback_game_start': 'handleGameStart',
  'callback_host_dice': 'handleHostDice',
  'callback_player_dice': 'handlePlayerDice',
  'callback_settlement': 'handleSettlement',
  'callback_back_to_game': 'handleBackToGame',
  'callback_mode_normal': 'handleModeNormal',
  'callback_mode_double': 'handleModeDouble',
  'callback_rules_show': 'handleRulesShow',
  'callback_blacklist_check': 'handleBlacklistCheck',
  'callback_history_data': 'handleHistoryData',
  
  // 新聞模塊
  'ad_summary': 'handleAdSummary',
  
  // 通用
  'close_notice': 'handleCloseNotice'
};

/**
 * 模塊顯示名稱（前端使用）
 */
export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  boot: '開機模塊',
  activity: '活動模塊',
  broadcast: '私信廣播',
  night: '夜間模塊',
  verify: '驗證模塊',
  checkin: '簽到模塊',
  forward: '搬運模塊',
  dice: '骰子模塊',
  carousel: '輪播模塊',
  clean: '清潔模塊'
};

/**
 * 權限等級
 */
export const PERMISSION_LEVELS = {
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
} as const;
