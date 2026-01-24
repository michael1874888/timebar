/**
 * TimeBar - Features 入口
 * Layer 4 (UI Layer) - 功能組件統一導出
 */

// 退休進度條 (Legacy - 用於 HistoryPage, DashboardScreen)
export { RetirementProgress } from './retirement-progress';
export type { RetirementProgressProps } from './retirement-progress';

// 金額輸入
export { AmountInput } from './amount-input';
export type { AmountInputProps } from './amount-input';

// 時間成本顯示
export { TimeCostDisplay } from './time-cost-display';
export type { TimeCostDisplayProps } from './time-cost-display';

// 決策按鈕
export { DecisionButtons } from './decision-buttons';
export type { DecisionButtonsProps } from './decision-buttons';

// 慶祝效果
export { Celebration } from './celebration';
export type { CelebrationProps } from './celebration';

// GPS Header Badge（v4.2 主版本 - Header 內嵌）
export { GPSHeaderBadge } from './retirement-gps/GPSHeaderBadge';
export type { GPSHeaderBadgeProps } from './retirement-gps/GPSHeaderBadge';

// 儲蓄進度卡片（v4.2 新版 - 整合未分配資金）
export { SavingsProgressCard } from './savings-progress/SavingsProgressCard';
export type { SavingsProgressCardProps } from './savings-progress/SavingsProgressCard';
