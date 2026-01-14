/**
 * TimeBar - 目標軌跡偏差計算引擎
 * Layer 2 (Domain Layer) - v4.1
 *
 * 計算用戶相對於退休目標的財務軌跡偏差
 */

import type { UserData, Record } from '@/types';

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

  /**
   * 計算經過的月數（精確到小數）
   *
   * @param startDate - ISO 8601 格式的起點日期
   * @returns 經過的月數（小數）
   */
  static calculateMonthsElapsed(startDate: string): number {
    const start = new Date(startDate);
    const now = Date.now();
    const diffMs = now - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays / 30.44; // 平均每月天數
  }

  /**
   * 計算實際累積儲蓄（推算收入 - 記錄支出）
   *
   * @param userData - 用戶資料
   * @param records - 所有記錄
   * @param monthsElapsed - 經過的月數
   * @returns 實際累積儲蓄金額
   */
  static calculateActualSavings(
    userData: UserData,
    records: Record[],
    monthsElapsed: number
  ): number {
    const { salary } = userData;

    // 推算總收入（假設月薪穩定）
    const estimatedIncome = salary * monthsElapsed;

    // 實際支出（排除已豁免和已終止的訂閱）
    const totalSpent = records
      .filter((r) => r.type === 'spend')
      .filter((r) => !r.guiltFree)
      .filter((r) => r.recurringStatus !== 'ended')
      .reduce((sum, r) => sum + r.amount, 0);

    return estimatedIncome - totalSpent;
  }
}
