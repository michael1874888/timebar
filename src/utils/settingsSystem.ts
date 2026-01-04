/**
 * SettingsSystem - 统一设置管理系统
 * v2.2: 提供统一的本地/云端双写接口，支持批量同步和版本控制
 *
 * 设计原则：
 * - 读取：优先本地缓存，启动时从云端同步
 * - 写入：立即写本地，延迟同步云端 (debounce 1秒)
 * - 批量：多个设置变更合并为一次 API 调用
 * - 冲突：云端优先 (last-write-wins)
 */

import { Storage } from './storage';
import { GoogleSheetsAPI } from '@/services/googleSheets';
import type { Category, ChallengeDefinition } from '@/types';

// ==================== 类型定义 ====================

export interface BudgetSettings {
  method: 'auto' | 'custom';
  customDailyBudget?: number;    // 自定义每日预算
}

export interface AppSettings {
  // 分类设置
  customCategories?: Category[];
  hiddenCategories?: string[];

  // 挑战设置
  customChallenges?: ChallengeDefinition[];
  deletedDefaultChallenges?: string[];
  modifiedDefaultChallenges?: Record<string, ChallengeDefinition>;

  // 预算设置
  budgetSettings?: BudgetSettings;
}

// ==================== 设置键映射 ====================

const SETTING_KEYS = {
  // 分类
  CUSTOM_CATEGORIES: 'timebar_custom_categories',
  HIDDEN_CATEGORIES: 'timebar_hidden_categories',

  // 挑战
  CUSTOM_CHALLENGES: 'timebar_custom_challenges',
  DELETED_CHALLENGES: 'timebar_deleted_default_challenges',
  MODIFIED_CHALLENGES: 'timebar_modified_default_challenges',

  // 预算
  BUDGET_SETTINGS: 'timebar_daily_budget',
} as const;

// ==================== 同步队列管理 ====================

let syncTimer: NodeJS.Timeout | null = null;
let pendingSync = false;

/**
 * 延迟同步到云端 (debounce 1秒)
 */
function scheduleSyncToCloud(): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  pendingSync = true;

  syncTimer = setTimeout(async () => {
    if (!pendingSync) return;

    try {
      await syncAllToCloud();
      pendingSync = false;
      console.log('[SettingsSystem] Settings synced to cloud');
    } catch (err) {
      console.error('[SettingsSystem] Failed to sync settings to cloud:', err);
      // 失败不影响本地使用，下次同步时会重试
    }
  }, 1000);
}

/**
 * 同步所有设置到云端
 */
async function syncAllToCloud(): Promise<void> {
  if (!GoogleSheetsAPI.isConfigured()) return;

  const settings = getAllSettings();

  // 通过 saveUserData 一次性保存所有设置
  // UserData 会在云端包含这些设置字段
  await GoogleSheetsAPI.saveUserData({
    // 只保存设置相关字段，其他字段由 UserData 本身管理
    customCategories: settings.customCategories,
    hiddenCategories: settings.hiddenCategories,
    customChallenges: settings.customChallenges,
    deletedDefaultChallenges: settings.deletedDefaultChallenges,
    modifiedDefaultChallenges: settings.modifiedDefaultChallenges,
    budgetSettings: settings.budgetSettings,
  } as any);
}

// ==================== 核心 API ====================

export const SettingsSystem = {
  /**
   * 获取所有设置（本地）
   */
  getAllSettings(): AppSettings {
    return {
      customCategories: Storage.load(SETTING_KEYS.CUSTOM_CATEGORIES) || [],
      hiddenCategories: Storage.load(SETTING_KEYS.HIDDEN_CATEGORIES) || [],
      customChallenges: Storage.load(SETTING_KEYS.CUSTOM_CHALLENGES) || [],
      deletedDefaultChallenges: Storage.load(SETTING_KEYS.DELETED_CHALLENGES) || [],
      modifiedDefaultChallenges: Storage.load(SETTING_KEYS.MODIFIED_CHALLENGES) || {},
      budgetSettings: Storage.load(SETTING_KEYS.BUDGET_SETTINGS) || { method: 'auto' },
    };
  },

  /**
   * 保存设置（本地 + 云端）
   */
  saveSetting<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): void {
    // 映射到具体的 localStorage key
    const storageKey = this.getStorageKey(key);
    if (!storageKey) {
      console.warn(`[SettingsSystem] Unknown setting key: ${String(key)}`);
      return;
    }

    // 立即保存到本地
    Storage.save(storageKey, value);

    // 延迟同步到云端
    scheduleSyncToCloud();
  },

  /**
   * 获取单个设置
   */
  getSetting<K extends keyof AppSettings>(
    key: K,
    defaultValue?: AppSettings[K]
  ): AppSettings[K] {
    const storageKey = this.getStorageKey(key);
    if (!storageKey) return defaultValue as AppSettings[K];

    const saved = Storage.load(storageKey);
    return (saved ?? defaultValue) as AppSettings[K];
  },

  /**
   * 从云端同步所有设置
   */
  async syncFromCloud(): Promise<boolean> {
    try {
      const result = await GoogleSheetsAPI.getUserData();

      if (result.success && result.data) {
        const cloudData = result.data;

        // 同步各个设置到本地
        if (cloudData.customCategories) {
          Storage.save(SETTING_KEYS.CUSTOM_CATEGORIES, cloudData.customCategories);
        }
        if (cloudData.hiddenCategories) {
          Storage.save(SETTING_KEYS.HIDDEN_CATEGORIES, cloudData.hiddenCategories);
        }
        if (cloudData.customChallenges) {
          Storage.save(SETTING_KEYS.CUSTOM_CHALLENGES, cloudData.customChallenges);
        }
        if (cloudData.deletedDefaultChallenges) {
          Storage.save(SETTING_KEYS.DELETED_CHALLENGES, cloudData.deletedDefaultChallenges);
        }
        if (cloudData.modifiedDefaultChallenges) {
          Storage.save(SETTING_KEYS.MODIFIED_CHALLENGES, cloudData.modifiedDefaultChallenges);
        }
        if (cloudData.budgetSettings) {
          Storage.save(SETTING_KEYS.BUDGET_SETTINGS, cloudData.budgetSettings);
        }

        console.log('[SettingsSystem] Settings synced from cloud');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[SettingsSystem] Failed to sync from cloud:', err);
      return false;
    }
  },

  /**
   * 立即同步到云端（不等待 debounce）
   */
  async forceSyncToCloud(): Promise<void> {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    await syncAllToCloud();
    pendingSync = false;
  },

  /**
   * 映射设置键到 localStorage 键
   */
  getStorageKey(key: keyof AppSettings): string | null {
    const mapping: Record<keyof AppSettings, string> = {
      customCategories: SETTING_KEYS.CUSTOM_CATEGORIES,
      hiddenCategories: SETTING_KEYS.HIDDEN_CATEGORIES,
      customChallenges: SETTING_KEYS.CUSTOM_CHALLENGES,
      deletedDefaultChallenges: SETTING_KEYS.DELETED_CHALLENGES,
      modifiedDefaultChallenges: SETTING_KEYS.MODIFIED_CHALLENGES,
      budgetSettings: SETTING_KEYS.BUDGET_SETTINGS,
    };
    return mapping[key] || null;
  },
};

// 导出内部函数供测试使用
function getAllSettings(): AppSettings {
  return SettingsSystem.getAllSettings();
}
