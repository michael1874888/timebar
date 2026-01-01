// TimeBar - 生命成本計算擴展模組
import { CONSTANTS, FinanceCalc, Formatters } from './financeCalc';

const { WORKING_HOURS_PER_DAY, WORKING_DAYS_PER_MONTH, WORKING_HOURS_PER_YEAR } = CONSTANTS;

export interface VividComparison {
  workTime: string;
  workTimeDetail: string;
  salaryEquivalent: string;
  lifeEquivalent: string;
}

/**
 * 將工作小時轉換為具象的生命成本比喻
 */
export const getVividComparison = (
  workingHours: number,
  salary: number,
  isSpend: boolean
): VividComparison => {
  const absHours = Math.abs(workingHours);
  
  // 計算工作時間單位
  const workTime = formatWorkTimeDetailed(absHours);
  
  // 計算薪資等價
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const dailySalary = salary / WORKING_DAYS_PER_MONTH;
  const weeklySalary = dailySalary * 5;
  
  const salaryEquivalent = getSalaryEquivalent(absHours, salary);
  
  // 生活化比喻
  const lifeEquivalent = getLifeEquivalent(absHours, isSpend);
  
  return {
    workTime: workTime.short,
    workTimeDetail: workTime.detail,
    salaryEquivalent,
    lifeEquivalent
  };
};

interface WorkTimeFormat {
  short: string;
  detail: string;
}

/**
 * 格式化工作時間（詳細版）
 */
const formatWorkTimeDetailed = (hours: number): WorkTimeFormat => {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return { short: `${mins} 分鐘`, detail: `需要工作 ${mins} 分鐘` };
  }
  if (hours < WORKING_HOURS_PER_DAY) {
    const h = Math.round(hours * 10) / 10;
    return { short: `${h} 小時`, detail: `需要工作 ${h} 小時` };
  }
  if (hours < WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH) {
    const days = Math.round(hours / WORKING_HOURS_PER_DAY * 10) / 10;
    if (days < 7) {
      return { short: `${days} 天`, detail: `需要工作 ${days} 天` };
    }
    const weeks = Math.round(days / 5 * 10) / 10;
    return { short: `${weeks} 週`, detail: `需要工作約 ${weeks} 週` };
  }
  if (hours < WORKING_HOURS_PER_YEAR) {
    const months = Math.round(hours / (WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH) * 10) / 10;
    return { short: `${months} 個月`, detail: `需要工作 ${months} 個月` };
  }
  const years = Math.round(hours / WORKING_HOURS_PER_YEAR * 10) / 10;
  if (years < 2) {
    const months = Math.round((hours % WORKING_HOURS_PER_YEAR) / (WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH));
    if (months > 0) {
      return { short: `1 年 ${months} 個月`, detail: `需要工作 1 年 ${months} 個月` };
    }
    return { short: `1 年`, detail: `需要工作整整 1 年` };
  }
  return { short: `${years} 年`, detail: `需要工作 ${years} 年` };
};

/**
 * 薪資等價描述
 */
const getSalaryEquivalent = (hours: number, salary: number): string => {
  const dailySalary = salary / WORKING_DAYS_PER_MONTH;
  const weeklySalary = dailySalary * 5;
  const hourlyRate = FinanceCalc.hourlyRate(salary);

  const value = hours * hourlyRate;
  
  if (value < dailySalary * 0.5) {
    return `半天薪水`;
  }
  if (value < dailySalary * 1.5) {
    return `1 天薪水`;
  }
  if (value < weeklySalary * 0.8) {
    const days = Math.round(value / dailySalary);
    return `${days} 天薪水`;
  }
  if (value < salary * 0.8) {
    const weeks = Math.round(value / weeklySalary * 10) / 10;
    return `${weeks} 週薪水`;
  }
  if (value < salary * 3) {
    const months = Math.round(value / salary * 10) / 10;
    return `${months} 個月薪水`;
  }
  const months = Math.round(value / salary);
  return `${months} 個月薪水`;
};

/**
 * 生活化比喻
 */
const getLifeEquivalent = (hours: number, isSpend: boolean): string => {
  const hoursPerDay = WORKING_HOURS_PER_DAY;
  const hoursPerWeek = hoursPerDay * 5;
  const hoursPerMonth = hoursPerDay * WORKING_DAYS_PER_MONTH;
  
  if (isSpend) {
    // 花費比喻
    if (hours < hoursPerDay * 0.5) return '一頓好吃的午餐';
    if (hours < hoursPerDay) return '一整天的工作';
    if (hours < hoursPerDay * 3) return '週末兩天加班';
    if (hours < hoursPerWeek) return '一週的辛苦工作';
    if (hours < hoursPerMonth * 0.5) return '半個月的拼命';
    if (hours < hoursPerMonth) return '一個月的努力';
    if (hours < hoursPerMonth * 3) return '一季的汗水';
    if (hours < hoursPerMonth * 6) return '半年的時光';
    return '好幾年的人生';
  } else {
    // 儲蓄比喻
    if (hours < hoursPerDay * 0.5) return '多睡一個懶覺';
    if (hours < hoursPerDay) return '多一天睡到自然醒';
    if (hours < hoursPerDay * 3) return '多一個悠閒週末';
    if (hours < hoursPerWeek) return '多一週的自由';
    if (hours < hoursPerMonth * 0.5) return '多半個月的假期';
    if (hours < hoursPerMonth) return '多一個月去旅行';
    if (hours < hoursPerMonth * 3) return '多一季追劇的時光';
    if (hours < hoursPerMonth * 6) return '多半年陪伴家人';
    return '人生多了無限可能';
  }
};

/**
 * 計算退休影響天數
 */
export const calculateRetirementImpactDays = (workingHours: number): number => {
  // 每 8 小時工作 = 1 天退休影響
  return Math.round(workingHours / WORKING_HOURS_PER_DAY);
};

/**
 * 格式化退休影響
 */
export const formatRetirementImpact = (workingHours: number, isSpend: boolean): string => {
  const days = calculateRetirementImpactDays(workingHours);
  
  if (days === 0) {
    return isSpend ? '幾乎不影響' : '每一分都有意義';
  }
  
  if (days < 7) {
    return isSpend ? `退休延後 ${days} 天` : `退休提早 ${days} 天`;
  }
  
  if (days < 30) {
    const weeks = Math.round(days / 7 * 10) / 10;
    return isSpend ? `退休延後約 ${weeks} 週` : `退休提早約 ${weeks} 週`;
  }
  
  if (days < 365) {
    const months = Math.round(days / 30 * 10) / 10;
    return isSpend ? `退休延後 ${months} 個月` : `退休提早 ${months} 個月`;
  }
  
  const years = Math.round(days / 365 * 10) / 10;
  return isSpend ? `退休延後 ${years} 年` : `退休提早 ${years} 年`;
};
