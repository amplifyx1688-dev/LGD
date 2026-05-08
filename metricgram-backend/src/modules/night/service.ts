import { prisma } from '@/core/database/client';
import { logger } from '@/core/utils/logger';

/**
 * 夜間配置介面
 */
export interface NightConfig {
  enabled: boolean;
  startTime: string; // HH:mm, e.g. "22:00"
  endTime: string;   // HH:mm, e.g. "06:00"
  muteModules: string[]; // 夜間禁用的模組列表
  allowAdminOverride: boolean;
}

/**
 * 夜間模式服務
 */
export class NightService {
  /**
   * 獲取群組的夜間配置
   * @param groupId 群組 ID
   * @returns 夜間配置物件
   */
  async getNightConfig(groupId: number): Promise<NightConfig> {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { nightSettings: true }
    });

    const defaultConfig: NightConfig = {
      enabled: false,
      startTime: '22:00',
      endTime: '06:00',
      muteModules: ['broadcast', 'carousel'],
      allowAdminOverride: true
    };

    if (!group?.nightSettings) {
      return defaultConfig;
    }

    try {
      const settings = typeof group.nightSettings === 'string'
        ? JSON.parse(group.nightSettings)
        : group.nightSettings;

      return { ...defaultConfig, ...settings } as NightConfig;
    } catch (error) {
      logger.error('解析夜間配置失敗', { groupId, error: error as any });
      return defaultConfig;
    }
  }

  /**
   * 更新群組夜間配置
   * @param groupId 群組 ID
   * @param config 新配置
   */
  async updateNightConfig(groupId: number, config: Partial<NightConfig>): Promise<void> {
    const existing = await prisma.group.findUnique({
      where: { id: groupId },
      select: { nightSettings: true }
    });

    let currentSettings: Record<string, any> = {};
    if (existing?.nightSettings) {
      try {
        currentSettings = typeof existing.nightSettings === 'string'
          ? JSON.parse(existing.nightSettings)
          : existing.nightSettings;
      } catch (error) {
        logger.warn('現有夜間配置解析失敗，使用空物件', { groupId, error: error as any });
      }
    }

    const newSettings = { ...currentSettings, ...config };

    await prisma.group.update({
      where: { id: groupId },
      data: { nightSettings: JSON.stringify(newSettings) }
    });

    logger.info('夜間配置已更新', { groupId, config: newSettings });
  }

  /**
   * 靜態方法：判斷當前時間是否在夜間窗口內
   * @param startTime 開始時間 HH:mm
   * @param endTime 結束時間 HH:mm
   * @returns 是否為夜間時段
   */
  static isNightNow(startTime: string = '22:00', endTime: string = '06:00'): boolean {
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const start = startH * 60 + startM;
    const end = endH * 60 + endM;

    if (start < end) {
      // 同一日內，例如 08:00 - 18:00
      return current >= start && current < end;
    } else {
      // 跨午夜，例如 22:00 - 06:00
      return current >= start || current < end;
    }
  }

  /**
   * 獲取當前應啟用的模組列表（排除夜間禁用的）
   * @param groupId 群組 ID（可選，若不提供則使用全域規則）
   * @returns 應該啟用的模組名稱列表
   */
  async getActiveModules(groupId?: number): Promise<string[]> {
    // 所有可用模組列表
    const allModules = [
      'boot', 'activity', 'broadcast', 'night',
      'verify', 'checkin', 'forward', 'dice',
      'carousel', 'clean'
    ];

    if (!groupId) {
      // 若未指定群組，僅根據全域模組啟用狀態判斷
      const globalEnabled = await this.getGloballyEnabledModules();
      return allModules.filter(m => globalEnabled[m]);
    }

    // 獲取群組配置
    const [group, nightConfig] = await Promise.all([
      prisma.group.findUnique({
        where: { id: groupId },
        select: { modulesEnabled: true, nightSettings: true }
      }),
      this.getNightConfig(groupId)
    ]);

    if (!group) {
      throw new Error('群組不存在');
    }

    const modulesEnabled = group.modulesEnabled as Record<string, boolean> || {};
    const isNight = nightConfig.enabled && NightService.isNightNow(
      nightConfig.startTime,
      nightConfig.endTime
    );

    // 若為夜間且禁用了某些模組，則過濾
    if (isNight && nightConfig.muteModules.length > 0) {
      return allModules.filter(module => {
        if (!modulesEnabled[module]) return false; // 模組未啟用
        if (nightConfig.muteModules.includes(module)) return false; // 夜間禁用
        return true;
      });
    }

    // 白天或無夜間限制：返回所有已啟用的模組
    return allModules.filter(module => modulesEnabled[module]);
  }

  /**
   * 檢查某模組在夜間是否允許運行
   * @param moduleName 模組名稱
   * @param nightConfig 夜間配置
   * @returns true=允許, false=禁用
   */
  checkModuleAllowed(moduleName: string, nightConfig: NightConfig): boolean {
    if (!nightConfig.enabled) {
      return true; // 夜間模式未開啟，全部允許
    }

    const isNight = NightService.isNightNow(
      nightConfig.startTime,
      nightConfig.endTime
    );

    if (!isNight) {
      return true; // 不是夜間時間，允許運行
    }

    // 夜間時間：檢查模組是否在禁用列表中
    return !nightConfig.muteModules.includes(moduleName);
  }

  /**
   * 獲取全域啟用的模組列表（從 modules 表）
   */
  private async getGloballyEnabledModules(): Promise<Record<string, boolean>> {
    const modules = await prisma.module.findMany({
      select: { name: true, isGlobalEnabled: true }
    });

    const result: Record<string, boolean> = {};
    modules.forEach(m => {
      result[m.name] = m.isGlobalEnabled;
    });

    return result;
  }

  /**
   * 獲取完整的夜間狀態（供 status 端點使用）
   * @param groupId 群組 ID
   */
  async getNightStatus(groupId: number): Promise<{
    isNight: boolean;
    nightConfig: NightConfig;
    disabledModules: string[];
    activeModules: string[];
  }> {
    const [nightConfig, activeModules] = await Promise.all([
      this.getNightConfig(groupId),
      this.getActiveModules(groupId)
    ]);

    const isNight = nightConfig.enabled && NightService.isNightNow(
      nightConfig.startTime,
      nightConfig.endTime
    );

    const allModules = [
      'boot', 'activity', 'broadcast', 'night',
      'verify', 'checkin', 'forward', 'dice',
      'carousel', 'clean'
    ];

    const disabledModules = isNight
      ? allModules.filter(m => nightConfig.muteModules.includes(m))
      : [];

    return { isNight, nightConfig, disabledModules, activeModules };
  }

  /**
   * 測試端點：手動觸發夜間檢查（用於調試）
   * @param groupId 群組 ID
   * @param overrideStartTime 可選：覆蓋開始時間
   * @param overrideEndTime 可選：覆蓋結束時間
   */
  async testNightCheck(
    groupId: number,
    overrideStartTime?: string,
    overrideEndTime?: string
  ): Promise<{
    isNight: boolean;
    message: string;
    activeModules: string[];
  }> {
    const nightConfig = await this.getNightConfig(groupId);

    const startTime = overrideStartTime || nightConfig.startTime;
    const endTime = overrideEndTime || nightConfig.endTime;

    const isNight = nightConfig.enabled && NightService.isNightNow(startTime, endTime);
    const activeModules = await this.getActiveModules(groupId);

    const message = isNight
      ? `當前為夜間時段 (${startTime}-${endTime})，${nightConfig.muteModules.length} 個模組被禁用`
      : `當前為日間時段，所有啟用模組均可運行`;

    return { isNight, message, activeModules };
  }
}

export const nightService = new NightService();
