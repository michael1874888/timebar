/**
 * TimeBar - Features 入口
 * Layer 4 (UI Layer) - 功能組件統一導出
 */

// 退休進度條
export { RetirementProgress } from './retirement-progress';
export type { RetirementProgressProps } from './retirement-progress';

// 軌跡進度（新的目標軌跡偏差視覺化）
export { TrajectoryProgress, MonthlyBudgetCard } from './trajectory-progress';
export type { TrajectoryProgressProps, MonthlyBudgetCardProps } from './trajectory-progress';

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


