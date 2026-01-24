/**
 * TimeBar - 財務計算引擎
 * Layer 2 (Domain Layer) - 純函數計算，無副作用
 *
 * 重構自：src/utils/financeCalc.ts
 */

import { CONSTANTS } from './constants';
import type {
  TimeCostParams,
  FutureValueParams,
  AnnuityFVParams,
  YearsToTargetParams,
  TargetFundParams,
  RequiredSavingsParams,
} from '../types/calculator.types';

/**
 * 財務計算引擎 - 所有方法都是純函數
 */
export class FinanceCalculator {
  /**
   * 計算實質報酬率
   * 公式: (1 + 名目報酬率) / (1 + 通膨率) - 1
   *
   * @param inflation - 通膨率 (%)
   * @param roi - 投資報酬率 (%)
   * @returns 實質報酬率 (小數，例如 0.0341)
   *
   * @example
   * FinanceCalculator.realRate(2.5, 6) // => 0.0341 (3.41%)
   */
  static realRate(inflation: number, roi: number): number {
    return (1 + roi / 100) / (1 + inflation / 100) - 1;
  }

  /**
   * 計算複利終值 (Future Value)
   * 公式: PV × (1 + r)^n
   *
   * @param params.pv - 現值 (Present Value)
   * @param params.rate - 年利率 (小數)
   * @param params.years - 年數
   * @returns 終值
   *
   * @example
   * FinanceCalculator.futureValue({ pv: 10000, rate: 0.06, years: 10 })
   * // => 17908.48
   */
  static futureValue(params: FutureValueParams): number {
    const { pv, rate, years } = params;
    if (years <= 0) return pv;
    return pv * Math.pow(1 + rate, years);
  }

  /**
   * 計算年金終值 (每月投入的複利累積)
   * 公式: PMT × ((1 + r)^n - 1) / r
   *
   * @param params.monthly - 每月投入金額
   * @param params.rate - 年利率 (小數)
   * @param params.years - 年數
   * @returns 年金終值
   */
  static annuityFV(params: AnnuityFVParams): number {
    const { monthly, rate, years } = params;
    const monthlyRate = rate / 12;
    const months = years * 12;

    if (months <= 0) return 0;
    if (monthlyRate === 0) return monthly * months;

    return monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  /**
   * 計算達成目標金額需要幾年
   * 使用二分搜尋法求解
   */
  static yearsToTarget(params: YearsToTargetParams): number {
    const { currentSavings, monthlySavings, targetAmount, rate } = params;

    if (currentSavings >= targetAmount) return 0;

    let low = 0;
    let high = 100;

    while (high - low > 0.01) {
      const mid = (low + high) / 2;
      const fv =
        this.futureValue({ pv: currentSavings, rate, years: mid }) +
        this.annuityFV({ monthly: monthlySavings, rate, years: mid });

      if (fv < targetAmount) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return (low + high) / 2;
  }

  /**
   * 計算目標退休金（基於目標退休年齡）
   */
  static targetFundByAge(params: TargetFundParams): number {
    const { currentSavings, monthlySavings, yearsToRetire, rate } = params;

    return (
      this.futureValue({ pv: currentSavings, rate, years: yearsToRetire }) +
      this.annuityFV({ monthly: monthlySavings, rate, years: yearsToRetire })
    );
  }

  /**
   * 4% 法則：月領金額 → 需要多少退休金
   * 公式: 月領 × 12 / 0.04 = 月領 × 300
   */
  static monthlyToFund(monthlyExpense: number): number {
    return monthlyExpense * 300;
  }

  /**
   * 4% 法則：退休金 → 可以月領多少
   */
  static fundToMonthly(fund: number): number {
    return fund / 300;
  }

  /**
   * 計算每月需儲蓄多少才能達成目標
   */
  static requiredMonthlySavings(params: RequiredSavingsParams): number {
    const { currentSavings, targetAmount, years, rate } = params;
    const monthlyRate = rate / 12;
    const months = years * 12;

    const fvCurrent = this.futureValue({ pv: currentSavings, rate, years });
    const remaining = targetAmount - fvCurrent;

    if (remaining <= 0) return 0;
    if (monthlyRate === 0) return remaining / months;

    return remaining / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  /**
   * 計算一筆消費/儲蓄的時間成本（工作小時）
   *
   * @param params.amount - 金額
   * @param params.isRecurring - 是否每月固定
   * @param params.hourlyRate - 時薪
   * @param params.realRate - 實質報酬率 (小數)
   * @param params.yearsToRetire - 距離退休年數
   * @returns 時間成本（工作小時）
   *
   * @example
   * FinanceCalculator.calculateTimeCost({
   *   amount: 5000,
   *   isRecurring: false,
   *   hourlyRate: 500,
   *   realRate: 0.0341,
   *   yearsToRetire: 35,
   * }) // => 31.2 小時
   */
  static calculateTimeCost(params: TimeCostParams): number {
    const { amount, isRecurring, hourlyRate, realRate, yearsToRetire, monthsDuration } = params;

    let futureValue: number;
    const monthlyRate = realRate / 12;
    const monthsToRetire = yearsToRetire * 12;

    if (isRecurring) {
      if (monthsDuration !== undefined) {
        // 有限期訂閱
        if (monthsDuration <= 0) {
          futureValue = 0;
        } else {
          // 先計算 n 期年金終值，再複利到退休
          const effectiveMonths = Math.min(monthsDuration, monthsToRetire);
          const remainingMonths = monthsToRetire - effectiveMonths;
          
          if (effectiveMonths <= 0) {
            futureValue = 0;
          } else if (monthlyRate === 0) {
            // 無利率：單純累加，再複利到退休
            const annuityFV = amount * effectiveMonths;
            futureValue = remainingMonths > 0 
              ? annuityFV * Math.pow(1 + monthlyRate, remainingMonths)
              : annuityFV;
          } else {
            // 年金終值公式：FV = PMT × ((1+r)^n - 1) / r
            const annuityFV = amount * ((Math.pow(1 + monthlyRate, effectiveMonths) - 1) / monthlyRate);
            // 將終值複利成長到退休
            futureValue = remainingMonths > 0
              ? annuityFV * Math.pow(1 + monthlyRate, remainingMonths)
              : annuityFV;
          }
        }
      } else {
        // 無限期訂閱：年金終值直到退休
        if (monthsToRetire <= 0) {
          futureValue = 0;
        } else if (monthlyRate === 0) {
          futureValue = amount * monthsToRetire;
        } else {
          futureValue =
            amount *
            ((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate);
        }
      }
    } else {
      // 單筆複利終值
      if (yearsToRetire <= 0) {
        futureValue = amount;
      } else {
        futureValue = amount * Math.pow(1 + realRate, yearsToRetire);
      }
    }

    return futureValue / hourlyRate;
  }

  /**
   * 計算時薪
   */
  static hourlyRate(salary: number): number {
    return (
      salary / CONSTANTS.WORKING_DAYS_PER_MONTH / CONSTANTS.WORKING_HOURS_PER_DAY
    );
  }

  /**
   * 將時間成本（小時）轉換為天數
   */
  static hoursToDays(hours: number): number {
    return hours / CONSTANTS.WORKING_HOURS_PER_DAY;
  }

  /**
   * 將時間成本（小時）轉換為年數
   */
  static hoursToYears(hours: number): number {
    return hours / CONSTANTS.WORKING_HOURS_PER_YEAR;
  }
}
