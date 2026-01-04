/**
 * SettingsSystem - 统一设置管理系统
 * v2.3: 重構為依賴注入架構，提升可測試性和維護性
 *
 * 设计原则：
 * - 读取：优先本地缓存，启动时从云端同步
 * - 写入：立即写本地，延迟同步云端 (debounce 1秒)
 * - 批量：多个设置变更合并为一次 API 调用
 * - 冲突：云端优先 (last-write-wins)
 */

import type { Category, ChallengeDefinition } from '@/types'
import { IStorage, ICloudSync, Debouncer } from './interfaces'
import { StorageAdapter, GoogleSheetsAdapter } from './adapters'

// ==================== 类型定义 ====================

export interface BudgetSettings {
  method: 'auto' | 'custom'
  customDailyBudget?: number // 自定义每日预算
}

export interface AppSettings {
  // 分类设置
  customCategories?: Category[]
  hiddenCategories?: string[]

  // 挑战设置
  customChallenges?: ChallengeDefinition[]
  deletedDefaultChallenges?: string[]
  modifiedDefaultChallenges?: Record<string, ChallengeDefinition>

  // 预算设置
  budgetSettings?: BudgetSettings
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
} as const

// ==================== 核心服務類 ====================

/**
 * SettingsService - 設置管理服務
 * 使用依賴注入，方便測試和擴展
 */
export class SettingsService {
  private debouncer: Debouncer

  constructor(
    private storage: IStorage,
    private cloudSync: ICloudSync,
    debounceDelay: number = 1000
  ) {
    this.debouncer = new Debouncer(debounceDelay)
  }

  /**
   * 获取所有设置（本地）
   */
  getAllSettings(): AppSettings {
    return {
      customCategories: this.storage.load(SETTING_KEYS.CUSTOM_CATEGORIES) || [],
      hiddenCategories: this.storage.load(SETTING_KEYS.HIDDEN_CATEGORIES) || [],
      customChallenges: this.storage.load(SETTING_KEYS.CUSTOM_CHALLENGES) || [],
      deletedDefaultChallenges:
        this.storage.load(SETTING_KEYS.DELETED_CHALLENGES) || [],
      modifiedDefaultChallenges:
        this.storage.load(SETTING_KEYS.MODIFIED_CHALLENGES) || {},
      budgetSettings: this.storage.load(SETTING_KEYS.BUDGET_SETTINGS) || {
        method: 'auto',
      },
    }
  }

  /**
   * 保存设置（本地 + 云端）
   */
  saveSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    // 映射到具体的 localStorage key
    const storageKey = this.getStorageKey(key)
    if (!storageKey) {
      console.warn(`[SettingsSystem] Unknown setting key: ${String(key)}`)
      return
    }

    // 立即保存到本地
    this.storage.save(storageKey, value)

    // 延迟同步到云端 (使用 debouncer)
    this.debouncer.schedule(() => this.syncToCloud())
  }

  /**
   * 获取单个设置
   */
  getSetting<K extends keyof AppSettings>(
    key: K,
    defaultValue?: AppSettings[K]
  ): AppSettings[K] {
    const storageKey = this.getStorageKey(key)
    if (!storageKey) return defaultValue as AppSettings[K]

    const saved = this.storage.load(storageKey)
    return (saved ?? defaultValue) as AppSettings[K]
  }

  /**
   * 从云端同步所有设置
   */
  async syncFromCloud(): Promise<boolean> {
    try {
      const result = await this.cloudSync.getUserData()

      if (result.success && result.data) {
        const cloudData = result.data

        // 同步各个设置到本地
        if (cloudData.customCategories) {
          this.storage.save(SETTING_KEYS.CUSTOM_CATEGORIES, cloudData.customCategories)
        }
        if (cloudData.hiddenCategories) {
          this.storage.save(SETTING_KEYS.HIDDEN_CATEGORIES, cloudData.hiddenCategories)
        }
        if (cloudData.customChallenges) {
          this.storage.save(SETTING_KEYS.CUSTOM_CHALLENGES, cloudData.customChallenges)
        }
        if (cloudData.deletedDefaultChallenges) {
          this.storage.save(
            SETTING_KEYS.DELETED_CHALLENGES,
            cloudData.deletedDefaultChallenges
          )
        }
        if (cloudData.modifiedDefaultChallenges) {
          this.storage.save(
            SETTING_KEYS.MODIFIED_CHALLENGES,
            cloudData.modifiedDefaultChallenges
          )
        }
        if (cloudData.budgetSettings) {
          this.storage.save(SETTING_KEYS.BUDGET_SETTINGS, cloudData.budgetSettings)
        }

        console.log('[SettingsSystem] Settings synced from cloud')
        return true
      }

      return false
    } catch (err) {
      console.error('[SettingsSystem] Failed to sync from cloud:', err)
      return false
    }
  }

  /**
   * 立即同步到云端（不等待 debounce）
   */
  async forceSyncToCloud(): Promise<void> {
    // 取消任何待處理的 debounce 任務
    this.debouncer.cancel()
    // 立即執行同步
    await this.syncToCloud()
  }

  /**
   * 同步所有设置到云端（內部方法）
   */
  private async syncToCloud(): Promise<void> {
    if (!this.cloudSync.isConfigured()) return

    const settings = this.getAllSettings()

    try {
      // 通过 saveUserData 一次性保存所有设置
      await this.cloudSync.saveUserData({
        customCategories: settings.customCategories,
        hiddenCategories: settings.hiddenCategories,
        customChallenges: settings.customChallenges,
        deletedDefaultChallenges: settings.deletedDefaultChallenges,
        modifiedDefaultChallenges: settings.modifiedDefaultChallenges,
        budgetSettings: settings.budgetSettings,
      })

      console.log('[SettingsSystem] Settings synced to cloud')
    } catch (err) {
      console.error('[SettingsSystem] Failed to sync settings to cloud:', err)
      // 失败不影响本地使用，下次同步时会重试
    }
  }

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
    }
    return mapping[key] || null
  }
}

// ==================== 向後兼容的靜態導出 ====================

/**
 * 預設實例 - 使用真實的適配器
 * 保持向後兼容，所有現有代碼無需修改
 */
const defaultService = new SettingsService(
  new StorageAdapter(),
  new GoogleSheetsAdapter()
)

/**
 * SettingsSystem - 統一設置管理系統
 * 向後兼容的靜態對象導出
 */
export const SettingsSystem = {
  getAllSettings: () => defaultService.getAllSettings(),
  saveSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    defaultService.saveSetting(key, value),
  getSetting: <K extends keyof AppSettings>(
    key: K,
    defaultValue?: AppSettings[K]
  ) => defaultService.getSetting(key, defaultValue),
  syncFromCloud: () => defaultService.syncFromCloud(),
  forceSyncToCloud: () => defaultService.forceSyncToCloud(),
  getStorageKey: (key: keyof AppSettings) => defaultService.getStorageKey(key),
}
