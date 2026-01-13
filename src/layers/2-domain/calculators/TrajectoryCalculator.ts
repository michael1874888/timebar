/**
 * TimeBar - 目標軌跡偏差計算引擎
 * Layer 2 (Domain Layer) - v4.1
 *
 * 計算用戶相對於退休目標的財務軌跡偏差
 */

import type { UserData, Record, DeviationResult } from '@/types';
import { FinanceCalculator } from './FinanceCalculator';
import { CONSTANTS } from './constants';

/**
 * 軌跡偏差計算引擎
 */
export class TrajectoryCalculator {
  /**
   * 計算軌跡起點（混合方案）
   * 邏輯：max(createdAt, firstRecordDate - 7天)
   *
   * @param userData - 用戶資料
   * @param records - 所有記錄
   * @returns ISO 8601 格式的起點日期
   */
  static calculateStartDate(userData: UserData, records: Record[]): string {
    const { createdAt } = userData;

    // 如果沒有記錄，從 onboarding 完成時算起
    if (!records.length) {
      return createdAt || new Date().toISOString();
    }

    // 找到第一筆記錄的日期
    const firstRecord = records.reduce((earliest, r) =>
      r.timestamp < earliest.timestamp ? r : earliest
    );
    const firstRecordDate = new Date(firstRecord.timestamp);

    // 往前推 7 天
    const sevenDaysBefore = new Date(firstRecordDate);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

    // 取較晚的日期
    if (!createdAt) {
      return sevenDaysBefore.toISOString();
    }

    const createdAtDate = new Date(createdAt);
    return createdAtDate > sevenDaysBefore
      ? createdAt
      : sevenDaysBefore.toISOString();
  }
}
