// UI 工具函數
import { CONSTANTS } from './financeCalc';

const { WORKING_HOURS_PER_DAY, WORKING_DAYS_PER_MONTH, WORKING_HOURS_PER_YEAR } = CONSTANTS;

export const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const getEquivalent = (workingHours: number, isSpend: boolean): string => {
  const absHours = Math.abs(workingHours);
  const hoursPerDay = WORKING_HOURS_PER_DAY; // 8
  const hoursPerWeek = hoursPerDay * 5; // 40
  const hoursPerMonth = hoursPerDay * WORKING_DAYS_PER_MONTH; // 176
  const hoursPerYear = WORKING_HOURS_PER_YEAR; // 2112

  const items = isSpend ? [
    { max: hoursPerDay, texts: ['一杯咖啡的時間', '一頓午餐'] },
    { max: hoursPerDay * 3, texts: ['一天的工作', '一次電影約會'] },
    { max: hoursPerWeek, texts: ['一週的上班時間', '一頓高級餐廳'] },
    { max: hoursPerMonth, texts: ['一個月的假期', '一趟國內旅行'] },
    { max: hoursPerMonth * 3, texts: ['一季的自由', '一趟日本旅行'] },
    { max: hoursPerYear, texts: ['一整年的時光', '環遊世界的機會'] },
    { max: Infinity, texts: ['好幾年的退休生活', '財務自由的關鍵'] },
  ] : [
    { max: hoursPerDay * 3, texts: ['多睡幾天懶覺', '退休後的悠閒早晨'] },
    { max: hoursPerWeek, texts: ['多一週去爬山', '陪家人的時光'] },
    { max: hoursPerMonth, texts: ['多一個月的旅行', '學一項新技能'] },
    { max: hoursPerMonth * 3, texts: ['多一季的自由', '完成一個小夢想'] },
    { max: Infinity, texts: ['人生多了好多可能', '離財務自由更近一步'] },
  ];
  return getRandomItem((items.find(i => absHours <= i.max) || items[items.length - 1]).texts);
};

export const getMotivationalQuote = (): string => getRandomItem([
  '每一分錢都是你未來自由的磚塊 🧱',
  '今天的忍耐，是明天的自由 ✨',
  '少買一個，多活一天 💪',
  '自由不是免費的，是省出來的 🎯',
  '你正在買回自己的時間 ⏰',
  '退休後的你會感謝現在的決定 🙏',
]);
