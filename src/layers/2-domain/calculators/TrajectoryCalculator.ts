/**
 * TimeBar - 目標軌跡偏差計算器
 * Layer 2 (Domain Layer) - 純函數計算，無副作用
 *
 * 核心概念：
 * 退休時間的推移，不由單筆消費決定，而是由「實際儲蓄率」與「目標儲蓄率」的差額決定。
 */

import { FinanceCalculator } from './FinanceCalculator';
import type { RecordItem } from '../types/calculator.types';

/**
 * 軌跡狀態類型
 */
export type TrajectoryStatus = 'ahead' | 'onTrack' | 'behind';

/**
 * 軌跡偏差計算參數
 */
export interface TrajectoryParams {
  /** 月薪 */
  salary: number;
  /** 目前存款 */
  currentSavings: number;
  /** 目標退休年齡 */
  targetRetireAge: number;
  /** 目前年齡 */
  currentAge: number;
  /** 目標退休金 (可選，默認使用 4% 法則計算) */
  targetRetirementFund?: number;
  /** 通膨率 (%) */
  inflationRate: number;
  /** 投資報酬率 (%) */
  roiRate: number;
}

/**
 * 本月儲蓄狀態
 */
export interface MonthlySavingsStatus {
  /** 目標每月儲蓄 */
  requiredMonthlySavings: number;
  /** 實際每月儲蓄 */
  actualMonthlySavings: number;
  /** 儲蓄缺口（正數=落後，負數=超標） */
  savingsGap: number;
  /** 本月儲蓄達成率 (0-100+) */
  progressPercent: number;
  /** 本月可消費額度 (月薪 - 目標儲蓄) */
  monthlyBudget: number;
  /** 本月已消費 */
  totalSpent: number;
  /** 本月剩餘可消費 */
  remainingBudget: number;
}

/**
 * 軌跡偏差結果
 */
export interface TrajectoryResult {
  /** 軌跡狀態 */
  status: TrajectoryStatus;
  /** 預估退休年齡 */
  estimatedRetireAge: number;
  /** 目標退休年齡 */
  targetRetireAge: number;
  /** 與目標的差距（年）正數=延後，負數=提早 */
  yearsDiff: number;
  /** 與目標的差距（天）正數=延後，負數=提早 */
  daysDiff: number;
  /** 偏差轉換為工時（小時） */
  deviationHours: number;
  /** 本月儲蓄狀態 */
  monthlySavings: MonthlySavingsStatus;
  /** 目標退休金 */
  targetRetirementFund: number;
  /** 每月需儲蓄金額 */
  requiredMonthlySavings: number;
}

/**
 * 目標軌跡偏差計算器
 */
export class TrajectoryCalculator {
  /**
   * 計算目標退休金
   * 若未提供，則使用 4% 法則（假設退休後維持 70% 生活水準）
   */
  static calculateTargetRetirementFund(
    salary: number,
    targetRetirementFund?: number
  ): number {
    if (targetRetirementFund && targetRetirementFund > 0) {
      return targetRetirementFund;
    }
    // 4% 法則：退休後每月花費 = 月薪 * 70%
    const monthlyExpenseAfterRetire = salary * 0.7;
    return FinanceCalculator.monthlyToFund(monthlyExpenseAfterRetire);
  }

  /**
   * 計算達成退休目標所需的每月儲蓄
   */
  static calculateRequiredMonthlySavings(params: TrajectoryParams): number {
    const { salary, currentSavings, targetRetireAge, currentAge, inflationRate, roiRate } = params;
    const yearsToRetire = targetRetireAge - currentAge;

    if (yearsToRetire <= 0) return 0;

    const realRate = FinanceCalculator.realRate(inflationRate, roiRate);
    const targetFund = this.calculateTargetRetirementFund(salary, params.targetRetirementFund);

    return FinanceCalculator.requiredMonthlySavings({
      currentSavings,
      targetAmount: targetFund,
      years: yearsToRetire,
      rate: realRate,
    });
  }

  /**
   * 過濾指定月份的記錄
   */
  static getMonthlyRecords(
    records: RecordItem[],
    _year: number,
    _month: number
  ): RecordItem[] {
    // 需要完整的 Record 類型來過濾日期
    // 這裡假設 RecordItem 有 date 欄位
    return records; // 暫時返回所有記錄，後續整合時修正
  }

  /**
   * 計算本月實際儲蓄
   * 實際儲蓄 = 月薪 - 本月總消費
   */
  static calculateActualMonthlySavings(
    salary: number,
    monthlyRecords: RecordItem[]
  ): number {
    const totalSpent = monthlyRecords
      .filter(r => r.type === 'spend')
      .reduce((sum, r) => sum + r.amount, 0);

    // 主動儲蓄記錄
    const totalSaved = monthlyRecords
      .filter(r => r.type === 'save')
      .reduce((sum, r) => sum + r.amount, 0);

    // 實際儲蓄 = 月薪 - 消費 + 額外儲蓄
    return salary - totalSpent + totalSaved;
  }

  /**
   * 計算本月儲蓄狀態
   */
  static calculateMonthlySavingsStatus(
    params: TrajectoryParams,
    monthlyRecords: RecordItem[]
  ): MonthlySavingsStatus {
    const { salary } = params;
    const requiredMonthlySavings = this.calculateRequiredMonthlySavings(params);
    const actualMonthlySavings = this.calculateActualMonthlySavings(salary, monthlyRecords);
    const savingsGap = requiredMonthlySavings - actualMonthlySavings;

    // 本月可消費額度 = 月薪 - 目標儲蓄
    const monthlyBudget = Math.max(0, salary - requiredMonthlySavings);

    // 本月已消費
    const totalSpent = monthlyRecords
      .filter(r => r.type === 'spend')
      .reduce((sum, r) => sum + r.amount, 0);

    // 剩餘可消費
    const remainingBudget = monthlyBudget - totalSpent;

    // 達成率
    const progressPercent = requiredMonthlySavings > 0
      ? (actualMonthlySavings / requiredMonthlySavings) * 100
      : 100;

    return {
      requiredMonthlySavings,
      actualMonthlySavings,
      savingsGap,
      progressPercent,
      monthlyBudget,
      totalSpent,
      remainingBudget,
    };
  }

  /**
   * 計算軌跡偏差
   * 核心方法：根據本月儲蓄缺口計算退休時間偏差
   */
  static calculateTrajectoryDeviation(
    params: TrajectoryParams,
    monthlyRecords: RecordItem[]
  ): TrajectoryResult {
    const { salary, targetRetireAge, currentAge, inflationRate, roiRate } = params;
    const yearsToRetire = targetRetireAge - currentAge;
    const realRate = FinanceCalculator.realRate(inflationRate, roiRate);
    const hourlyRate = FinanceCalculator.hourlyRate(salary);
    const targetFund = this.calculateTargetRetirementFund(salary, params.targetRetirementFund);
    const requiredMonthlySavings = this.calculateRequiredMonthlySavings(params);
    const monthlySavings = this.calculateMonthlySavingsStatus(params, monthlyRecords);

    // 計算缺口對應的時間成本
    const gap = monthlySavings.savingsGap;
    const deviationHours = gap !== 0
      ? FinanceCalculator.calculateTimeCost({
          amount: Math.abs(gap),
          isRecurring: false,
          hourlyRate,
          realRate,
          yearsToRetire,
        })
      : 0;

    // 將時間成本轉換為年數
    const deviationYears = FinanceCalculator.hoursToYears(deviationHours);
    const yearsDiff = gap > 0 ? deviationYears : -deviationYears;
    const daysDiff = Math.round(yearsDiff * 365);

    // 預估退休年齡
    const estimatedRetireAge = targetRetireAge + yearsDiff;

    // 判定狀態
    let status: TrajectoryStatus;
    if (Math.abs(yearsDiff) < 0.01) {
      status = 'onTrack';
    } else if (yearsDiff > 0) {
      status = 'behind';
    } else {
      status = 'ahead';
    }

    return {
      status,
      estimatedRetireAge,
      targetRetireAge,
      yearsDiff,
      daysDiff,
      deviationHours: gap > 0 ? deviationHours : -deviationHours,
      monthlySavings,
      targetRetirementFund: targetFund,
      requiredMonthlySavings,
    };
  }

  /**
   * 計算累積軌跡偏差
   * 考慮多個月份的累積缺口
   */
  static calculateCumulativeDeviation(
    params: TrajectoryParams,
    allRecords: RecordItem[],
    _monthsCount: number = 1
  ): TrajectoryResult {
    // 目前簡化版本：只考慮當月
    // 未來可擴展為多月累積
    return this.calculateTrajectoryDeviation(params, allRecords);
  }

  /**
   * 計算每日可消費額度
   */
  static calculateDailyBudget(
    remainingBudget: number,
    remainingDays: number
  ): number {
    if (remainingDays <= 0) return 0;
    return Math.max(0, remainingBudget / remainingDays);
  }

  /**
   * 計算本月剩餘天數
   */
  static getRemainingDaysInMonth(date: Date = new Date()): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const currentDay = date.getDate();
    return lastDay - currentDay;
  }
}
