/**
 * TimeBar - Feature Flags 配置
 * 用於漸進式遷移新舊版本
 */

/**
 * Feature Flag 定義
 */
export interface FeatureFlagsConfig {
  /** 使用新版首頁 */
  useNewHomePage: boolean;
  /** 使用新版歷史頁面 */
  useNewHistoryPage: boolean;
  /** 使用新版設定頁面 */
  useNewSettingsPage: boolean;
  /** 使用新版存儲層 */
  useNewStorage: boolean;
  /** 使用新版 API 層 */
  useNewAPI: boolean;
  /** 啟用調試模式 */
  debugMode: boolean;
}

/**
 * 從環境變數讀取 Feature Flags
 */
function getEnvFlag(key: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
}

/**
 * Feature Flags 配置
 * 可透過環境變數或 localStorage 覆蓋
 */
export const FeatureFlags: FeatureFlagsConfig = {
  // 預設啟用新版首頁 (透過「試用新版」按鈕)
  useNewHomePage: getEnvFlag('VITE_NEW_HOME', false),
  useNewHistoryPage: getEnvFlag('VITE_NEW_HISTORY', false),
  useNewSettingsPage: getEnvFlag('VITE_NEW_SETTINGS', false),
  useNewStorage: getEnvFlag('VITE_NEW_STORAGE', true),
  useNewAPI: getEnvFlag('VITE_NEW_API', true),
  debugMode: getEnvFlag('VITE_DEBUG', false),
};

/**
 * 動態覆蓋 Feature Flag (用於開發/測試)
 */
export function overrideFeatureFlag<K extends keyof FeatureFlagsConfig>(
  key: K,
  value: FeatureFlagsConfig[K]
): void {
  (FeatureFlags as FeatureFlagsConfig)[key] = value;
}

/**
 * 從 localStorage 載入 Feature Flags 覆蓋
 */
export function loadFeatureFlagsOverrides(): void {
  try {
    const stored = localStorage.getItem('timebar_feature_flags');
    if (stored) {
      const overrides = JSON.parse(stored) as Partial<FeatureFlagsConfig>;
      Object.assign(FeatureFlags, overrides);
    }
  } catch (e) {
    console.warn('Failed to load feature flags overrides:', e);
  }
}

/**
 * 儲存 Feature Flags 覆蓋到 localStorage
 */
export function saveFeatureFlagsOverrides(
  overrides: Partial<FeatureFlagsConfig>
): void {
  try {
    localStorage.setItem('timebar_feature_flags', JSON.stringify(overrides));
    Object.assign(FeatureFlags, overrides);
  } catch (e) {
    console.warn('Failed to save feature flags overrides:', e);
  }
}

// 啟動時載入覆蓋設定
loadFeatureFlagsOverrides();

export default FeatureFlags;
