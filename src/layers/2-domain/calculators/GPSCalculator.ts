/**
 * TimeBar - GPS 計算引擎
 * Layer 2 (Domain Layer) - 退休進度追蹤計算
 *
 * 重構自：src/utils/financeCalc.ts (GPSCalc 部分)
 */

import { CONSTANTS } from './constants';
import type {
  RecordItem,
  EstimatedAgeResult,
  TotalsResult,
  GPSStatus,
} from '../types/calculator.types';

/**
 * GPS (Goal Progress Status) 計算引擎
 * 用於計算用戶的退休進度狀態
 */
export class GPSCalculator {
  /**
   * 根據記錄計算預估退休年齡
   *
   * @param targetRetireAge - 目標退休年齡
   * @param records - 消費/儲蓄記錄陣列
   * @returns 預估退休年齡及相關數據
   *
   * @example
   * GPSCalculator.calculateEstimatedAge(65, records)
   * // => { estimatedAge: 63.2, ageDiff: 1.8, isAhead: true, ... }
   */
  static calculateEstimatedAge(
    targetRetireAge: number,
    records: RecordItem[]
  ): EstimatedAgeResult {
    const totalSavedHours = records
      .filter((r) => r.type === 'save')
      .reduce((sum, r) => sum + (r.timeCost || 0), 0);

    // 排除已終止的訂閱（不再計入未來成本）
    const totalSpentHours = records
      .filter((r) => r.type === 'spend')
      .filter((r) => r.recurringStatus !== 'ended')
      .reduce((sum, r) => sum + (r.timeCost || 0), 0);

    const netHoursImpact = totalSpentHours - totalSavedHours;
    const estimatedAge =
      targetRetireAge + netHoursImpact / CONSTANTS.WORKING_HOURS_PER_YEAR;

    const ageDiff = targetRetireAge - estimatedAge;
    const isAhead = ageDiff > 0.001;
    const isBehind = ageDiff < -0.001;
    const isOnTrack = !isAhead && !isBehind;

    const status: GPSStatus = isAhead
      ? 'ahead'
      : isBehind
        ? 'behind'
        : 'onTrack';

    return {
      estimatedAge,
      ageDiff,
      ageDiffDays: Math.round(ageDiff * 365),
      isAhead,
      isBehind,
      isOnTrack,
      status,
      totalSavedHours,
      totalSpentHours,
    };
  }

  /**
   * 計算記錄的累積金額
   *
   * @param records - 消費/儲蓄記錄陣列
   * @returns 總儲蓄、總消費和淨值
   */
  static calculateTotals(records: RecordItem[]): TotalsResult {
    const totalSaved = records
      .filter((r) => r.type === 'save')
      .reduce((sum, r) => sum + r.amount, 0);

    const totalSpent = records
      .filter((r) => r.type === 'spend')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalSaved,
      totalSpent,
      netAmount: totalSaved - totalSpent,
    };
  }

  /**
   * 計算記錄的累積時間影響 (以天為單位)
   */
  static calculateTotalDays(records: RecordItem[]): {
    savedDays: number;
    spentDays: number;
    netDays: number;
  } {
    const result = this.calculateEstimatedAge(65, records); // 使用 65 作為參考

    const savedDays = result.totalSavedHours / CONSTANTS.WORKING_HOURS_PER_DAY;
    const spentDays = result.totalSpentHours / CONSTANTS.WORKING_HOURS_PER_DAY;

    return {
      savedDays,
      spentDays,
      netDays: savedDays - spentDays,
    };
  }

  /**
   * 判斷 GPS 狀態
   */
  static getStatus(ageDiff: number): GPSStatus {
    if (ageDiff > 0.001) return 'ahead';
    if (ageDiff < -0.001) return 'behind';
    return 'onTrack';
  }

  /**
   * 計算進度百分比 (用於進度條)
   *
   * @param currentAge - 當前年齡
   * @param targetAge - 目標退休年齡
   * @param estimatedAge - 預估退休年齡
   * @returns 進度百分比 (0-100)
   */
  static calculateProgress(
    currentAge: number,
    targetAge: number,
    estimatedAge: number
  ): number {
    const totalYears = targetAge - currentAge;
    if (totalYears <= 0) return 100;

    const yearsAhead = targetAge - estimatedAge;
    const progress = (yearsAhead / totalYears) * 100 + 50; // 以 50% 為基準

    return Math.max(0, Math.min(100, progress));
  }
}
