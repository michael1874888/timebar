// UI 工具函數
import { CONSTANTS } from './financeCalc';

const { WORKING_HOURS_PER_DAY, WORKING_DAYS_PER_MONTH } = CONSTANTS;

export const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const getEquivalent = (workingHours: number, isSpend: boolean): string => {
  const absHours = Math.abs(workingHours);
  const hoursPerDay = WORKING_HOURS_PER_DAY; // 8
  const hoursPerWeek = hoursPerDay * 5; // 40
  const hoursPerMonth = hoursPerDay * WORKING_DAYS_PER_MONTH; // 176

  if (isSpend) {
    // 花費描述 - 根據工作小時
    if (absHours < 1) return '不到 1 小時的工作';
    if (absHours < hoursPerDay * 0.5) return '幾小時的工作';
    if (absHours < hoursPerDay) return '半天的工作';
    if (absHours < hoursPerDay * 1.5) return '一整天的工作';
    if (absHours < hoursPerWeek * 0.8) return `${Math.round(absHours / hoursPerDay)} 天的工作`;
    if (absHours < hoursPerMonth * 0.8) return `${Math.round(absHours / hoursPerWeek * 10) / 10} 週的工作`;
    if (absHours < hoursPerMonth * 3) return `${Math.round(absHours / hoursPerMonth * 10) / 10} 個月的工作`;
    return `${Math.round(absHours / hoursPerMonth)} 個月的辛苦`;
  } else {
    // 儲蓄描述
    if (absHours < hoursPerDay * 0.5) return '多睡一個懶覺';
    if (absHours < hoursPerDay) return '多一天睡到自然醒';
    if (absHours < hoursPerDay * 3) return '多一個悠閒週末';
    if (absHours < hoursPerWeek) return '多一週的自由';
    if (absHours < hoursPerMonth * 0.5) return '多半個月的假期';
    if (absHours < hoursPerMonth) return '多一個月去旅行';
    return '人生多了無限可能';
  }
};

export const getMotivationalQuote = (): string => getRandomItem([
  '每一分錢都是你未來自由的磚塊 🧱',
  '今天的忍耐，是明天的自由 ✨',
  '少買一個，多活一天 💪',
  '自由不是免費的，是省出來的 🎯',
  '你正在買回自己的時間 ⏰',
  '退休後的你會感謝現在的決定 🙏',
]);
