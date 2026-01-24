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
   * 計算經過的完整週數（用於穩定的目標儲蓄計算）
   * 避免目標儲蓄數字每秒變動
   *
   * @param startDate - ISO 8601 格式的起點日期
   * @returns 經過的完整週數（整數）
   */
  static calculateWeeksElapsed(startDate: string): number {
    const start = new Date(startDate);
    const now = Date.now();
    const diffMs = now - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays / 7);
  }

  /**
   * 計算實際累積儲蓄 (Explicit Logic)
   * 只計算明確記錄的 type='save' 記錄總和
   *
   * @param userData - 用戶資料
   * @param records - 所有記錄
   * @param monthsElapsed - 經過的月數（未使用，保留參數兼容性）
   * @returns 實際累積儲蓄金額
   */
  static calculateActualSavings(
    _userData: UserData,
    records: Record[],
    _monthsElapsed: number
  ): number {
    // Explicit Logic: 只計算明確記錄的儲蓄
    const totalSaved = records
      .filter((r) => r.type === 'save')
      .reduce((sum, r) => sum + r.amount, 0);

    return totalSaved;
  }

  /**
   * 計算未分配資金
   * 公式：估算收入 - 支出 - 已記錄儲蓄
   *
   * @param userData - 用戶資料
   * @param records - 所有記錄
   * @param monthsElapsed - 經過的月數
   * @returns 未分配資金（正=有餘額，負=透支）
   */
  static calculateUnallocatedFunds(
    userData: UserData,
    records: Record[],
    monthsElapsed: number
  ): number {
    const { salary } = userData;

    // 推算總收入
    const estimatedIncome = salary * monthsElapsed;

    // 實際支出（排除已終止的訂閱）
    const totalSpent = records
      .filter((r) => r.type === 'spend')
      .filter((r) => r.recurringStatus !== 'ended')
      .reduce((sum, r) => sum + r.amount, 0);

    // 已記錄儲蓄
    const totalSaved = records
      .filter((r) => r.type === 'save')
      .reduce((sum, r) => sum + r.amount, 0);

    return estimatedIncome - totalSpent - totalSaved;
  }

  /**
   * 計算用戶相對於目標軌跡的偏差
   *
   * @param params.userData - 用戶資料
   * @param params.records - 所有記錄
   * @returns 偏差計算結果
   */
  static calculateDeviation(params: {
    userData: UserData;
    records: Record[];
  }): DeviationResult {
    const { userData, records } = params;

    // 1. 確定起點
    let startDate = userData.trajectoryStartDate;
    if (!startDate) {
      startDate = this.calculateStartDate(userData, records);
    }

    // 2. 計算經過月數和週數
    const monthsElapsed = this.calculateMonthsElapsed(startDate);
    const weeksElapsed = this.calculateWeeksElapsed(startDate);

    // 3. 計算目標累積儲蓄（以「完整週」為单位，避免數字不斷變動）
    // 公式: (每月儲蓄目標 / 4) * (週數 + 1)
    // 第 0 週 = 1 週目標，第 1 週 = 2 週目標，以此類推
    const weeklyTarget = userData.monthlySavings / 4;
    const targetAccumulatedSavings = Math.round(weeklyTarget * (weeksElapsed + 1));

    // 計算實質報酬率和距離退休年數（用於時間成本轉換）
    const realRate = FinanceCalculator.realRate(
      userData.inflationRate,
      userData.roiRate
    );
    const yearsToRetire = userData.retireAge - userData.age;

    // 4. 計算理想的每月儲蓄額（用於參考，基於退休金目標）
    const targetRetirementFund =
      userData.targetRetirementFund ||
      FinanceCalculator.monthlyToFund(userData.salary - userData.monthlySavings);

    const requiredMonthlySavings = FinanceCalculator.requiredMonthlySavings({
      currentSavings: userData.currentSavings,
      targetAmount: targetRetirementFund,
      years: yearsToRetire,
      rate: realRate,
    });

    // 5. 計算實際累積儲蓄
    const actualAccumulatedSavings = this.calculateActualSavings(
      userData,
      records,
      monthsElapsed
    );

    // 6. 計算偏差金額
    const deviation = actualAccumulatedSavings - targetAccumulatedSavings;

    // 7. 轉換當前偏差為時間成本（工作小時）
    const hourlyRate = FinanceCalculator.hourlyRate(userData.salary);
    const futureValueOfDeviation =
      deviation * Math.pow(1 + realRate, yearsToRetire);
    const currentDeviationHours = futureValueOfDeviation / hourlyRate;

    // 8. 加上歷史偏差（歷史偏差已經是工作小時數）
    const deviationHours =
      currentDeviationHours + (userData.historicalDeviationHours || 0);

    return {
      targetAccumulatedSavings,
      actualAccumulatedSavings,
      deviation,
      deviationHours,
      deviationDays: FinanceCalculator.hoursToDays(deviationHours),
      deviationYears: FinanceCalculator.hoursToYears(deviationHours),
      isOnTrack: Math.abs(deviationHours) < CONSTANTS.WORKING_HOURS_PER_DAY,
      isAhead: deviationHours > CONSTANTS.WORKING_HOURS_PER_DAY,
      isBehind: deviationHours < -CONSTANTS.WORKING_HOURS_PER_DAY,
      monthsElapsed,
      weeksElapsed,
      requiredMonthlySavings,
      startDate,
    };
  }
}
