/**
 * TimeBar - 財務計算模組 v2.4
 * 
 * 這個檔案包含所有核心財務計算邏輯，可以：
 * 1. 在瀏覽器中透過 <script> 載入（全域變數）
 * 2. 在 Node.js 中透過 require() 載入（單元測試）
 */

(function(root, factory) {
  // UMD (Universal Module Definition) 模式
  if (typeof module === 'object' && module.exports) {
    // Node.js 環境
    module.exports = factory();
  } else {
    // 瀏覽器環境
    root.TimeBarFinance = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // ==================== 常數 ====================
  const CONSTANTS = {
    DEFAULT_INFLATION_RATE: 2.5,      // 預設通膨率 %
    DEFAULT_ROI_RATE: 6,              // 預設投資報酬率 %
    WORKING_DAYS_PER_MONTH: 22,       // 每月工作天數
    WORKING_HOURS_PER_DAY: 8,         // 每日工作小時
    WORKING_HOURS_PER_YEAR: 22 * 8 * 12,  // 每年工作小時 = 2112
  };

  // ==================== 財務計算 ====================
  const FinanceCalc = {
    /**
     * 計算實質報酬率
     * 公式: (1 + 名目報酬率) / (1 + 通膨率) - 1
     * @param {number} inflation - 通膨率 (%)
     * @param {number} roi - 投資報酬率 (%)
     * @returns {number} 實質報酬率 (小數，例如 0.0341)
     */
    realRate(inflation, roi) {
      return (1 + roi / 100) / (1 + inflation / 100) - 1;
    },

    /**
     * 計算複利終值 (Future Value)
     * 公式: PV × (1 + r)^n
     * @param {number} pv - 現值 (Present Value)
     * @param {number} rate - 年利率 (小數)
     * @param {number} years - 年數
     * @returns {number} 終值
     */
    futureValue(pv, rate, years) {
      return pv * Math.pow(1 + rate, years);
    },

    /**
     * 計算年金終值 (每月投入的複利累積)
     * 公式: PMT × ((1 + r)^n - 1) / r
     * @param {number} monthly - 每月投入金額
     * @param {number} rate - 年利率 (小數)
     * @param {number} years - 年數
     * @returns {number} 年金終值
     */
    annuityFV(monthly, rate, years) {
      const monthlyRate = rate / 12;
      const months = years * 12;
      if (monthlyRate === 0) return monthly * months;
      return monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    },

    /**
     * 計算達成目標金額需要幾年
     * 使用二分搜尋法求解
     * @param {number} currentSavings - 目前存款
     * @param {number} monthlySavings - 每月儲蓄
     * @param {number} targetAmount - 目標金額
     * @param {number} rate - 年利率 (小數)
     * @returns {number} 需要的年數
     */
    yearsToTarget(currentSavings, monthlySavings, targetAmount, rate) {
      if (currentSavings >= targetAmount) return 0;
      
      // Binary search for years
      let low = 0, high = 100;
      while (high - low > 0.01) {
        const mid = (low + high) / 2;
        const fv = this.futureValue(currentSavings, rate, mid) + 
                   this.annuityFV(monthlySavings, rate, mid);
        if (fv < targetAmount) {
          low = mid;
        } else {
          high = mid;
        }
      }
      return (low + high) / 2;
    },

    /**
     * 計算目標退休金（基於目標退休年齡）
     * @param {number} currentSavings - 目前存款
     * @param {number} monthlySavings - 每月儲蓄
     * @param {number} yearsToRetire - 距離退休年數
     * @param {number} rate - 年利率 (小數)
     * @returns {number} 退休時可累積的金額
     */
    targetFundByAge(currentSavings, monthlySavings, yearsToRetire, rate) {
      return this.futureValue(currentSavings, rate, yearsToRetire) + 
             this.annuityFV(monthlySavings, rate, yearsToRetire);
    },

    /**
     * 4% 法則：月領金額 → 需要多少退休金
     * 公式: 月領 × 12 / 0.04 = 月領 × 300
     * @param {number} monthlyExpense - 每月支出
     * @returns {number} 所需退休金
     */
    monthlyToFund(monthlyExpense) {
      return monthlyExpense * 300;
    },

    /**
     * 4% 法則：退休金 → 可以月領多少
     * @param {number} fund - 退休金
     * @returns {number} 每月可領金額
     */
    fundToMonthly(fund) {
      return fund / 300;
    },

    /**
     * 計算每月需儲蓄多少才能達成目標
     * @param {number} currentSavings - 目前存款
     * @param {number} targetAmount - 目標金額
     * @param {number} years - 年數
     * @param {number} rate - 年利率 (小數)
     * @returns {number} 每月需儲蓄金額
     */
    requiredMonthlySavings(currentSavings, targetAmount, years, rate) {
      const monthlyRate = rate / 12;
      const months = years * 12;
      const fvCurrent = this.futureValue(currentSavings, rate, years);
      const remaining = targetAmount - fvCurrent;
      
      if (remaining <= 0) return 0;
      if (monthlyRate === 0) return remaining / months;
      
      return remaining / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    },

    /**
     * 計算一筆消費/儲蓄的時間成本（工作小時）
     * @param {number} amount - 金額
     * @param {boolean} isRecurring - 是否每月固定
     * @param {number} hourlyRate - 時薪
     * @param {number} realRate - 實質報酬率 (小數)
     * @param {number} yearsToRetire - 距離退休年數
     * @returns {number} 時間成本（工作小時）
     */
    calculateTimeCost(amount, isRecurring, hourlyRate, realRate, yearsToRetire) {
      let futureValue;
      const monthlyRate = realRate / 12;
      const monthsToRetire = yearsToRetire * 12;
      
      if (isRecurring) {
        // 年金終值：每月持續支出的複利累積
        if (monthsToRetire <= 0) {
          futureValue = 0;
        } else if (monthlyRate === 0) {
          futureValue = amount * monthsToRetire;
        } else {
          futureValue = amount * ((Math.pow(1 + monthlyRate, monthsToRetire) - 1) / monthlyRate);
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
    },

    /**
     * 計算時薪
     * @param {number} salary - 月薪
     * @returns {number} 時薪
     */
    hourlyRate(salary) {
      return salary / CONSTANTS.WORKING_DAYS_PER_MONTH / CONSTANTS.WORKING_HOURS_PER_DAY;
    },
  };

  // ==================== 格式化工具 ====================
  const Formatters = {
    /**
     * 將工作小時轉換成易讀的時間格式
     * @param {number} workingHours - 工作小時數
     * @returns {object} { value, unit, color }
     */
    formatTime(workingHours) {
      const absHours = Math.abs(workingHours);
      const { WORKING_HOURS_PER_DAY, WORKING_DAYS_PER_MONTH, WORKING_HOURS_PER_YEAR } = CONSTANTS;
      const hoursPerMonth = WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH; // 176
      
      if (absHours < 1) {
        return { value: Math.round(absHours * 60), unit: '分鐘', color: 'text-emerald-400' };
      } else if (absHours < WORKING_HOURS_PER_DAY) {
        return { value: Math.round(absHours * 10) / 10, unit: '小時', color: 'text-emerald-400' };
      } else if (absHours < WORKING_HOURS_PER_DAY * 5) {
        return { value: Math.round(absHours / WORKING_HOURS_PER_DAY * 10) / 10, unit: '天', color: 'text-yellow-400' };
      } else if (absHours < hoursPerMonth) {
        return { value: Math.round(absHours / WORKING_HOURS_PER_DAY * 10) / 10, unit: '天', color: 'text-orange-400' };
      } else if (absHours < WORKING_HOURS_PER_YEAR) {
        return { value: Math.round(absHours / hoursPerMonth * 10) / 10, unit: '個月', color: 'text-orange-500' };
      } else {
        return { value: Math.round(absHours / WORKING_HOURS_PER_YEAR * 100) / 100, unit: '年', color: 'text-red-500' };
      }
    },

    /**
     * 格式化貨幣（簡短版）
     * @param {number} amount - 金額
     * @returns {string} 格式化字串
     */
    formatCurrency(amount) {
      if (Math.abs(amount) >= 100000000) return `${(amount / 100000000).toFixed(2)}億`;
      if (Math.abs(amount) >= 10000) return `${(amount / 10000).toFixed(amount % 10000 === 0 ? 0 : 1)}萬`;
      return amount.toLocaleString();
    },

    /**
     * 格式化貨幣（完整版）
     * @param {number} amount - 金額
     * @returns {string} 格式化字串
     */
    formatCurrencyFull(amount) {
      return `NT$ ${amount.toLocaleString()}`;
    },

    /**
     * 格式化年齡差異
     * @param {number} diff - 年齡差異（年）
     * @returns {object} { value, unit }
     */
    formatAgeDiff(diff) {
      const absDiff = Math.abs(diff);
      const absDays = Math.round(absDiff * 365);
      if (absDays < 1) return { value: '0', unit: '天' };
      if (absDays < 30) return { value: absDays.toString(), unit: '天' };
      if (absDays < 365) return { value: Math.round(absDays / 30).toString(), unit: '個月' };
      return { value: absDiff.toFixed(1), unit: '年' };
    },
  };

  // ==================== GPS 計算 ====================
  const GPSCalc = {
    /**
     * 根據記錄計算預估退休年齡
     * @param {number} targetRetireAge - 目標退休年齡
     * @param {Array} records - 消費/儲蓄記錄陣列
     * @returns {object} { estimatedAge, ageDiff, isAhead, isBehind, isOnTrack }
     */
    calculateEstimatedAge(targetRetireAge, records) {
      const totalSavedHours = records
        .filter(r => r.type === 'save')
        .reduce((sum, r) => sum + (r.timeCost || 0), 0);
      
      const totalSpentHours = records
        .filter(r => r.type === 'spend')
        .reduce((sum, r) => sum + (r.timeCost || 0), 0);
      
      const netHoursImpact = totalSpentHours - totalSavedHours;
      const estimatedAge = targetRetireAge + netHoursImpact / CONSTANTS.WORKING_HOURS_PER_YEAR;
      
      const ageDiff = targetRetireAge - estimatedAge;
      const isAhead = ageDiff > 0.001;
      const isBehind = ageDiff < -0.001;
      const isOnTrack = !isAhead && !isBehind;
      
      return {
        estimatedAge,
        ageDiff,
        ageDiffDays: Math.round(ageDiff * 365),
        isAhead,
        isBehind,
        isOnTrack,
        totalSavedHours,
        totalSpentHours,
      };
    },

    /**
     * 計算記錄的累積金額
     * @param {Array} records - 消費/儲蓄記錄陣列
     * @returns {object} { totalSaved, totalSpent }
     */
    calculateTotals(records) {
      const totalSaved = records
        .filter(r => r.type === 'save')
        .reduce((sum, r) => sum + r.amount, 0);
      
      const totalSpent = records
        .filter(r => r.type === 'spend')
        .reduce((sum, r) => sum + r.amount, 0);
      
      return { totalSaved, totalSpent };
    },
  };

  // ==================== 匯出 ====================
  return {
    CONSTANTS,
    FinanceCalc,
    Formatters,
    GPSCalc,
  };

}));
