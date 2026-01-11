/**
 * TimeBar - 時間成本顯示組件
 * Layer 4 (UI Layer) - 功能組件
 *
 * 超大字體顯示時間成本，配合生動比喻
 */

import { useMemo } from 'react';
import { TimeCalculator } from '@domain/calculators';
import './TimeCostDisplay.css';

export interface TimeCostDisplayProps {
  /** 時間成本 (工作小時) */
  hours: number;
  /** 是否顯示 (amount > 0) */
  visible?: boolean;
  /** 是否為消費 (影響退休影響描述) */
  isSpend?: boolean;
  /** 月薪 (用於生動比喻) */
  monthlySalary?: number;
  /** 是否顯示生動比喻 */
  showComparison?: boolean;
  /** 是否顯示退休影響 */
  showRetirementImpact?: boolean;
  /** 動畫延遲 (ms) */
  animationDelay?: number;
}

/**
 * 時間成本顯示組件
 */
export function TimeCostDisplay({
  hours,
  visible = true,
  isSpend = true,
  monthlySalary,
  showComparison = true,
  showRetirementImpact = true,
  animationDelay = 0,
}: TimeCostDisplayProps) {
  // 格式化時間
  const formattedTime = useMemo(() => {
    return TimeCalculator.formatTime(hours);
  }, [hours]);

  // 生動比喻
  const vividComparison = useMemo(() => {
    if (!showComparison) return null;
    return TimeCalculator.getVividComparison(hours, monthlySalary);
  }, [hours, monthlySalary, showComparison]);

  // 退休影響
  const retirementImpact = useMemo(() => {
    if (!showRetirementImpact) return null;
    return TimeCalculator.getRetirementImpact(hours, isSpend);
  }, [hours, isSpend, showRetirementImpact]);

  if (!visible || hours <= 0) {
    return (
      <div className="time-cost-display time-cost-display--empty">
        <div className="time-cost-display__prompt">
          ⏰ 這筆花費會影響你的自由多久？
        </div>
      </div>
    );
  }

  return (
    <div
      className="time-cost-display time-cost-display--visible"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* 標題 */}
      <div className="time-cost-display__label">
        ⏰ 這會花掉你：
      </div>

      {/* 主數值 */}
      <div className="time-cost-display__value-container">
        <span className={`time-cost-display__value ${formattedTime.color}`}>
          {formattedTime.value}
        </span>
        <span className="time-cost-display__unit">
          {formattedTime.unit}
        </span>
      </div>

      {/* 副標題 */}
      <div className="time-cost-display__subtitle">
        的人生自由時間
      </div>

      {/* 額外說明 */}
      <div className="time-cost-display__details">
        {vividComparison && (
          <div className="time-cost-display__comparison">
            = {vividComparison}
          </div>
        )}
        {retirementImpact && (
          <div className="time-cost-display__impact">
            = {retirementImpact}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeCostDisplay;
