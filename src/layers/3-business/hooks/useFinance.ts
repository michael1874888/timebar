/**
 * TimeBar - 財務計算 Hook
 * Layer 3 (Business Layer) - 封裝財務計算邏輯
 */

import { useMemo, useCallback } from 'react';
import { FinanceCalculator, TimeCalculator, CONSTANTS } from '@domain/calculators';

export interface UserFinanceData {
  /** 年齡 */
  age: number;
  /** 月薪 */
  monthlySalary: number;
  /** 目標退休年齡 */
  targetRetireAge: number;
  /** 通膨率 (%) */
  inflationRate?: number;
  /** 投資報酬率 (%) */
  roiRate?: number;
}

export interface UseFinanceResult {
  /** 時薪 */
  hourlyRate: number;
  /** 實質報酬率 */
  realRate: number;
  /** 距離退休年數 */
  yearsToRetire: number;
  /** 計算時間成本 */
  calculateTimeCost: (amount: number, isRecurring?: boolean) => number;
  /** 格式化時間成本 */
  formatTimeCost: (hours: number) => { value: number; unit: string; color: string };
  /** 獲取生動比喻 */
  getVividComparison: (hours: number) => string;
  /** 獲取退休影響描述 */
  getRetirementImpact: (hours: number, isSpend?: boolean) => string;
}

/**
 * 財務計算 Hook
 *
 * @example
 * const { calculateTimeCost, formatTimeCost } = useFinance({
 *   age: 30,
 *   monthlySalary: 50000,
 *   targetRetireAge: 65,
 * });
 *
 * const hours = calculateTimeCost(5000); // 計算 5000 元的時間成本
 * const formatted = formatTimeCost(hours); // { value: 3.2, unit: '天', color: 'text-yellow-400' }
 */
export function useFinance(userData: UserFinanceData): UseFinanceResult {
  // 計算衍生值
  const hourlyRate = useMemo(() => {
    return FinanceCalculator.hourlyRate(userData.monthlySalary);
  }, [userData.monthlySalary]);

  const realRate = useMemo(() => {
    const inflation = userData.inflationRate ?? CONSTANTS.DEFAULT_INFLATION_RATE;
    const roi = userData.roiRate ?? CONSTANTS.DEFAULT_ROI_RATE;
    return FinanceCalculator.realRate(inflation, roi);
  }, [userData.inflationRate, userData.roiRate]);

  const yearsToRetire = useMemo(() => {
    return Math.max(0, userData.targetRetireAge - userData.age);
  }, [userData.targetRetireAge, userData.age]);

  // 計算時間成本
  const calculateTimeCost = useCallback(
    (amount: number, isRecurring: boolean = false): number => {
      if (amount <= 0) return 0;

      return FinanceCalculator.calculateTimeCost({
        amount,
        isRecurring,
        hourlyRate,
        realRate,
        yearsToRetire,
      });
    },
    [hourlyRate, realRate, yearsToRetire]
  );

  // 格式化時間成本
  const formatTimeCost = useCallback(
    (hours: number) => {
      return TimeCalculator.formatTime(hours);
    },
    []
  );

  // 獲取生動比喻
  const getVividComparison = useCallback(
    (hours: number) => {
      return TimeCalculator.getVividComparison(hours, userData.monthlySalary);
    },
    [userData.monthlySalary]
  );

  // 獲取退休影響描述
  const getRetirementImpact = useCallback(
    (hours: number, isSpend: boolean = true) => {
      return TimeCalculator.getRetirementImpact(hours, isSpend);
    },
    []
  );

  return {
    hourlyRate,
    realRate,
    yearsToRetire,
    calculateTimeCost,
    formatTimeCost,
    getVividComparison,
    getRetirementImpact,
  };
}

export default useFinance;
