/**
 * TimeBar - 常數定義
 * Layer 2 (Domain Layer) - 共用常數
 */

export const CONSTANTS = {
  /** 預設通膨率 % */
  DEFAULT_INFLATION_RATE: 2.5,
  /** 預設投資報酬率 % */
  DEFAULT_ROI_RATE: 6,
  /** 每月工作天數 */
  WORKING_DAYS_PER_MONTH: 22,
  /** 每日工作小時 */
  WORKING_HOURS_PER_DAY: 8,
  /** 每年工作小時 = 22 * 8 * 12 = 2112 */
  WORKING_HOURS_PER_YEAR: 22 * 8 * 12,
  /** 每月工作小時 = 22 * 8 = 176 */
  WORKING_HOURS_PER_MONTH: 22 * 8,
} as const;

export type Constants = typeof CONSTANTS;
