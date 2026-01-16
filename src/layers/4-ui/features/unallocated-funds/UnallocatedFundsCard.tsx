/**
 * TimeBar - 未分配資金卡片組件
 * Layer 4 (UI Layer) - 功能組件
 *
 * 顯示用戶本月尚未分配的資金，提供「一鍵轉存」功能
 */

import { useState } from 'react';
import { Formatters } from '@/utils/financeCalc';
import './UnallocatedFundsCard.css';

export interface UnallocatedFundsCardProps {
  /** 未分配資金金額 */
  unallocatedFunds: number;
  /** 預估可提早退休的天數 */
  estimatedDaysSaved?: number;
  /** 一鍵轉存回調 */
  onConvertToSavings: (amount: number) => void;
}

/**
 * 未分配資金卡片
 */
export function UnallocatedFundsCard({
  unallocatedFunds,
  estimatedDaysSaved,
  onConvertToSavings,
}: UnallocatedFundsCardProps) {
  const [isConverting, setIsConverting] = useState(false);

  // 只在有正餘額時顯示
  if (unallocatedFunds <= 0) {
    return null;
  }

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      await onConvertToSavings(unallocatedFunds);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="unallocated-funds-card">
      <div className="unallocated-funds-card__header">
        <span className="unallocated-funds-card__icon">💰</span>
        <span className="unallocated-funds-card__title">未分配資金</span>
      </div>

      <div className="unallocated-funds-card__content">
        <p className="unallocated-funds-card__label">本月還有</p>
        <p className="unallocated-funds-card__amount">
          {Formatters.formatCurrency(unallocatedFunds)} 元
        </p>
        <p className="unallocated-funds-card__hint">
          閒置中，尚未計入退休進度
        </p>
      </div>

      <button
        className="unallocated-funds-card__cta"
        onClick={handleConvert}
        disabled={isConverting}
      >
        {isConverting ? '轉存中...' : '⏳ 一鍵轉存到退休基金'}
      </button>

      {estimatedDaysSaved && estimatedDaysSaved > 0 && (
        <p className="unallocated-funds-card__benefit">
          💡 轉存後可提早 {Math.round(estimatedDaysSaved)} 天退休
        </p>
      )}
    </div>
  );
}

export default UnallocatedFundsCard;
