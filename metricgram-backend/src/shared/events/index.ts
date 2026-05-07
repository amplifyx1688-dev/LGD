import { EventEmitter } from 'events';

/**
 * 全局事件总线
 * 用于模块间解耦通信
 */

type EventHandler = (...args: any[]) => void;

class EventBus extends EventEmitter {
  /**
   * 發射事件（异步）
   */
  async emitAsync(event: string, ...args: any[]): Promise<void> {
    // 获取所有监听器
    const listeners = this.listeners(event);
    
    // 并行执行所有监听器
    await Promise.all(listeners.map(listener => 
      this.executeSafely(listener, args)
    ));
  }

  /**
   * 安全执行事件处理器
   */
  private executeSafely(handler: EventHandler, args: any[]): Promise<void> {
    return new Promise((resolve) => {
      try {
        const result = handler(...args);
        if (result instanceof Promise) {
          result.then(resolve).catch(resolve);
        } else {
          resolve();
        }
      } catch (error) {
        console.error('Event handler error:', error);
        resolve();
      }
    });
  }

  /**
   * 订阅事件（單次）
   */
  once(event: string, listener: EventHandler): this {
    return super.once(event, listener);
  }

  /**
   * 订阅事件
   */
  on(event: string, listener: EventHandler): this {
    return super.on(event, listener);
  }

  /**
   * 取消订阅
   */
  off(event: string, listener: EventHandler): this {
    return super.off(event, listener);
  }
}

export const eventBus = new EventBus();

/**
 * 事件名稱常量（避免字符串錯誤）
 */
export const Events = {
  // 用戶事件
  USER_REGISTERED: 'user:registered',
  USER_VERIFIED: 'user:verified',
  USER_BLACKLISTED: 'user:blacklisted',

  // 骰子遊戲事件
  GAME_CREATED: 'game:created',
  GAME_STARTED: 'game:started',
  GAME_SETTLED: 'game:settled',
  GAME_CLOSED: 'game:closed',
  PLAYER_JOINED: 'player:joined',
  PLAYER_ROLLED: 'player:rolled',

  // 輪播事件
  CAROUSEL_SENT: 'carousel:sent',

  // 簽到事件
  CHECKIN_COMPLETED: 'checkin:completed',
  WHEEL_SPUN: 'wheel:spun',

  // 支付事件
  PAYMENT_RECEIVED: 'payment:received',
  PAYMENT_CONFIRMED: 'payment:confirmed',
  PAYMENT_FAILED: 'payment:failed',

  // 廣播事件
  BROADCAST_SENT: 'broadcast:sent',

  // 系統事件
  MODULE_ENABLED: 'module:enabled',
  MODULE_DISABLED: 'module:disabled'
} as const;
