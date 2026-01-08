/**
 * TimeBar - 時間計算與格式化
 * Layer 2 (Domain Layer) - 時間相關計算
 *
 * 重構自：src/utils/lifeCostCalc.ts
 */

import { CONSTANTS } from './constants';
import type { FormatTimeResult, FormatAgeDiffResult } from '../types/calculator.types';

/**
 * 時間計算與格式化工具
 */
export class TimeCalculator {
  /**
   * 將工作小時轉換成易讀的時間格式
   *
   * @param workingHours - 工作小時數
   * @returns 格式化結果 { value, unit, color }
   *
   * @example
   * TimeCalculator.formatTime(30) // => { value: 3.8, unit: '天', color: 'text-yellow-400' }
   */
  static formatTime(workingHours: number): FormatTimeResult {
    const absHours = Math.abs(workingHours);
    const {
      WORKING_HOURS_PER_DAY,
      WORKING_DAYS_PER_MONTH,
      WORKING_HOURS_PER_YEAR,
    } = CONSTANTS;
    const hoursPerMonth = WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH; // 176

    if (absHours < 1) {
      return {
        value: Math.round(absHours * 60),
        unit: '分鐘',
        color: 'text-emerald-400',
      };
    } else if (absHours < WORKING_HOURS_PER_DAY) {
      return {
        value: Math.round(absHours * 10) / 10,
        unit: '小時',
        color: 'text-emerald-400',
      };
    } else if (absHours < WORKING_HOURS_PER_DAY * 5) {
      return {
        value: Math.round((absHours / WORKING_HOURS_PER_DAY) * 10) / 10,
        unit: '天',
        color: 'text-yellow-400',
      };
    } else if (absHours < hoursPerMonth) {
      return {
        value: Math.round((absHours / WORKING_HOURS_PER_DAY) * 10) / 10,
        unit: '天',
        color: 'text-orange-400',
      };
    } else if (absHours < WORKING_HOURS_PER_YEAR) {
      return {
        value: Math.round((absHours / hoursPerMonth) * 10) / 10,
        unit: '個月',
        color: 'text-orange-500',
      };
    } else {
      return {
        value: Math.round((absHours / WORKING_HOURS_PER_YEAR) * 100) / 100,
        unit: '年',
        color: 'text-red-500',
      };
    }
  }

  /**
   * 格式化年齡差異
   *
   * @param diff - 年齡差異（年）
   * @returns 格式化結果 { value, unit }
   */
  static formatAgeDiff(diff: number): FormatAgeDiffResult {
    const absDiff = Math.abs(diff);
    const absDays = Math.round(absDiff * 365);

    if (absDays < 1) return { value: '0', unit: '天' };
    if (absDays < 30) return { value: absDays.toString(), unit: '天' };
    if (absDays < 365)
      return { value: Math.round(absDays / 30).toString(), unit: '個月' };

    return { value: absDiff.toFixed(1), unit: '年' };
  }

  /**
   * 將小時轉換為天數
   */
  static hoursToDays(hours: number): number {
    return hours / CONSTANTS.WORKING_HOURS_PER_DAY;
  }

  /**
   * 將小時轉換為月數
   */
  static hoursToMonths(hours: number): number {
    return hours / CONSTANTS.WORKING_HOURS_PER_MONTH;
  }

  /**
   * 將小時轉換為年數
   */
  static hoursToYears(hours: number): number {
    return hours / CONSTANTS.WORKING_HOURS_PER_YEAR;
  }

  /**
   * 將天數轉換為小時
   */
  static daysToHours(days: number): number {
    return days * CONSTANTS.WORKING_HOURS_PER_DAY;
  }

  /**
   * 計算時間成本的「生動比喻」
   * 用於給用戶更直觀的理解
   *
   * @param hours - 工作小時數
   * @param monthlySalary - 月薪 (用於計算薪水比喻)
   * @returns 生動比喻文字
   */
  static getVividComparison(hours: number, monthlySalary?: number): string {
    const days = this.hoursToDays(hours);
    const {
      WORKING_HOURS_PER_DAY,
      WORKING_DAYS_PER_MONTH,
      WORKING_HOURS_PER_YEAR,
    } = CONSTANTS;

    // 基於時間的比喻
    if (hours < WORKING_HOURS_PER_DAY) {
      if (hours < 1) {
        return '一杯咖啡的時間';
      } else if (hours < 2) {
        return '一場電影的時間';
      } else if (hours < 4) {
        return '半個工作日';
      } else {
        return '一個工作日';
      }
    } else if (hours < WORKING_HOURS_PER_DAY * 5) {
      const roundedDays = Math.round(days);
      if (roundedDays <= 2) {
        return '一個週末的時間';
      } else {
        return `${roundedDays} 天的人生時間`;
      }
    } else if (hours < WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH) {
      const weeks = Math.round(days / 5);
      if (weeks === 1) {
        return '一週的薪水';
      } else {
        return `${weeks} 週的薪水`;
      }
    } else if (hours < WORKING_HOURS_PER_YEAR) {
      const months = Math.round(this.hoursToMonths(hours));
      return `${months} 個月的薪水`;
    } else {
      const years = this.hoursToYears(hours).toFixed(1);
      return `${years} 年的人生時間`;
    }
  }

  /**
   * 計算退休影響比喻
   */
  static getRetirementImpact(hours: number, isSpend: boolean): string {
    const days = Math.round(Math.abs(this.hoursToDays(hours)));
    const action = isSpend ? '延後' : '提早';

    if (days === 0) return '對退休計劃幾乎沒有影響';
    if (days < 7) return `${action}退休 ${days} 天`;
    if (days < 30) return `${action}退休約 ${Math.round(days / 7)} 週`;
    if (days < 365) return `${action}退休約 ${Math.round(days / 30)} 個月`;

    const years = (days / 365).toFixed(1);
    return `${action}退休 ${years} 年`;
  }
}
