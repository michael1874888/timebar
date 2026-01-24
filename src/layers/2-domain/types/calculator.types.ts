/**
 * TimeBar - 計算器類型定義
 * Layer 2 (Domain Layer) - 類型定義
 */

/**
 * 時間成本計算參數
 */
export interface TimeCostParams {
  /** 金額 */
  amount: number;
  /** 是否每月固定 (訂閱) */
  isRecurring: boolean;
  /** 時薪 */
  hourlyRate: number;
  /** 實質報酬率 (小數，例如 0.0341) */
  realRate: number;
  /** 距離退休年數 */
  yearsToRetire: number;
  /** 訂閱期數（月），undefined = 持續到退休 */
  monthsDuration?: number;
}

/**
 * 複利終值計算參數
 */
export interface FutureValueParams {
  /** 現值 */
  pv: number;
  /** 年利率 (小數) */
  rate: number;
  /** 年數 */
  years: number;
}

/**
 * 年金終值計算參數
 */
export interface AnnuityFVParams {
  /** 每月投入金額 */
  monthly: number;
  /** 年利率 (小數) */
  rate: number;
  /** 年數 */
  years: number;
}

/**
 * 達成目標所需年數計算參數
 */
export interface YearsToTargetParams {
  /** 目前存款 */
  currentSavings: number;
  /** 每月儲蓄 */
  monthlySavings: number;
  /** 目標金額 */
  targetAmount: number;
  /** 年利率 (小數) */
  rate: number;
}

/**
 * 目標退休金計算參數
 */
export interface TargetFundParams {
  /** 目前存款 */
  currentSavings: number;
  /** 每月儲蓄 */
  monthlySavings: number;
  /** 距離退休年數 */
  yearsToRetire: number;
  /** 年利率 (小數) */
  rate: number;
}

/**
 * 所需每月儲蓄計算參數
 */
export interface RequiredSavingsParams {
  /** 目前存款 */
  currentSavings: number;
  /** 目標金額 */
  targetAmount: number;
  /** 年數 */
  years: number;
  /** 年利率 (小數) */
  rate: number;
}

/**
 * 格式化時間結果
 */
export interface FormatTimeResult {
  /** 數值 */
  value: number;
  /** 單位 (分鐘/小時/天/個月/年) */
  unit: string;
  /** 顏色 class */
  color: string;
}

/**
 * 格式化年齡差結果
 */
export interface FormatAgeDiffResult {
  /** 數值字串 */
  value: string;
  /** 單位 */
  unit: string;
}

/**
 * GPS 狀態類型
 */
export type GPSStatus = 'ahead' | 'onTrack' | 'behind';

/**
 * 預估退休年齡計算結果
 */
export interface EstimatedAgeResult {
  /** 預估退休年齡 */
  estimatedAge: number;
  /** 與目標的差距 (年) */
  ageDiff: number;
  /** 與目標的差距 (天) */
  ageDiffDays: number;
  /** 是否領先 */
  isAhead: boolean;
  /** 是否落後 */
  isBehind: boolean;
  /** 是否剛好 */
  isOnTrack: boolean;
  /** GPS 狀態 */
  status: GPSStatus;
  /** 總節省時數 */
  totalSavedHours: number;
  /** 總花費時數 */
  totalSpentHours: number;
}

/**
 * 累計金額結果
 */
export interface TotalsResult {
  /** 總儲蓄金額 */
  totalSaved: number;
  /** 總消費金額 */
  totalSpent: number;
  /** 淨值 (儲蓄 - 消費) */
  netAmount: number;
}

/**
 * 記錄類型
 */
export type RecordType = 'save' | 'spend';

/**
 * 訂閱狀態
 */
export type RecurringStatus = 'active' | 'ended';

/**
 * 記錄項目 (簡化版，用於計算)
 */
export interface RecordItem {
  /** 類型 */
  type: RecordType;
  /** 金額 */
  amount: number;
  /** 時間成本 (小時) */
  timeCost?: number;
  /** 是否為循環支出 */
  isRecurring?: boolean;
  /** 訂閱狀態 */
  recurringStatus?: RecurringStatus;
}
