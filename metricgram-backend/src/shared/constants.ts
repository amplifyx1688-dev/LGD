/**
 * 共享常量（所有模塊使用）
 * 所有中文文本應存儲於數據庫，此處僅保留鍵值映射
 */

export { 
  DICE_CONSTANTS, 
  DEFAULT_MULTIPLIERS, 
  RANK_ORDER,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CAROUSEL_CONSTANTS,
  CHECKIN_CONSTANTS,
  WHEEL_CONSTANTS,
  BROADCAST_CONSTANTS,
  CLEAN_CONSTANTS,
  BUTTON_HANDLER_MAP,
  MODULE_DISPLAY_NAMES,
  PERMISSION_LEVELS
} from '@/shared/constants';

// 重新導出以便其他模塊使用
export * from '@/shared/constants';
