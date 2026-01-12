/**
 * TimeBar - 軌跡偏差計算 Hook
 * Layer 3 (Business Layer) - 封裝目標軌跡偏差計算邏輯
 */

import { useMemo } from 'react';
import {
  TrajectoryCalculator,
  type TrajectoryResult,
  type TrajectoryParams,
} from '@domain/calculators';
import type { Record as RecordType } from '@/types';

/**
 * 軌跡計算所需的用戶資料
 */
export interface TrajectoryUserData {
  /** 年齡 */
  age: number;
  /** 月薪 */
  salary: number;
  /** 目標退休年齡 */
  retireAge: number;
  /** 目前存款 */
  currentSavings?: number;
  /** 目標退休金（可選） */
  targetRetirementFund?: number;
  /** 通膨率 (%) */
  inflationRate: number;
  /** 投資報酬率 (%) */
  roiRate: number;
}

/**
 * 軌跡計算 Hook 結果
 */
export interface UseTrajectoryResult extends TrajectoryResult {
  /** 每日可消費額度 */
  dailyBudget: number;
  /** 本月剩餘天數 */
  remainingDays: number;
  /** 是否達標 */
  isOnTarget: boolean;
  /** 是否嚴重落後（> 30 天） */
  isCritical: boolean;
}

/**
 * 過濾當月記錄
 */
function filterCurrentMonthRecords(records: RecordType[]): RecordType[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return records.filter(record => {
    if (!record.date) return false;
    const recordDate = new Date(record.date);
    return recordDate.getFullYear() === year && recordDate.getMonth() === month;
  });
}

/**
 * 軌跡偏差計算 Hook
 *
 * 核心概念：
 * 退休時間的推移，不由單筆消費決定，而是由「實際儲蓄率」與「目標儲蓄率」的差額決定。
 *
 * @example
 * const trajectory = useTrajectory(userData, records);
 *
 * // 本月儲蓄達成率
 * trajectory.monthlySavings.progressPercent // 85%
 *
 * // 是否達標
 * trajectory.isOnTarget // false
 *
 * // 退休延後天數
 * trajectory.daysDiff // 15 天
 */
export function useTrajectory(
  userData: TrajectoryUserData,
  records: RecordType[]
): UseTrajectoryResult {
  // 過濾當月記錄
  const currentMonthRecords = useMemo(() => {
    return filterCurrentMonthRecords(records);
  }, [records]);

  // 轉換為計算器需要的參數格式
  const params: TrajectoryParams = useMemo(() => ({
    salary: userData.salary,
    currentSavings: userData.currentSavings ?? 0,
    targetRetireAge: userData.retireAge,
    currentAge: userData.age,
    targetRetirementFund: userData.targetRetirementFund,
    inflationRate: userData.inflationRate,
    roiRate: userData.roiRate,
  }), [userData]);

  // 計算軌跡偏差
  const trajectoryResult = useMemo(() => {
    // 轉換 RecordType 為 RecordItem（計算器需要的簡化格式）
    const recordItems = currentMonthRecords.map((r: RecordType) => ({
      type: r.type,
      amount: r.amount,
      timeCost: r.timeCost,
      guiltFree: r.guiltFree,
      isRecurring: r.isRecurring,
      recurringStatus: r.recurringStatus,
    }));

    return TrajectoryCalculator.calculateTrajectoryDeviation(params, recordItems);
  }, [params, currentMonthRecords]);

  // 計算每日預算
  const remainingDays = useMemo(() => {
    return TrajectoryCalculator.getRemainingDaysInMonth();
  }, []);

  const dailyBudget = useMemo(() => {
    return TrajectoryCalculator.calculateDailyBudget(
      trajectoryResult.monthlySavings.remainingBudget,
      remainingDays
    );
  }, [trajectoryResult.monthlySavings.remainingBudget, remainingDays]);

  // 狀態判定
  const isOnTarget = trajectoryResult.monthlySavings.progressPercent >= 100;
  const isCritical = trajectoryResult.daysDiff > 30;

  return {
    ...trajectoryResult,
    dailyBudget,
    remainingDays,
    isOnTarget,
    isCritical,
  };
}

export default useTrajectory;
