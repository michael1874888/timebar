/**
 * TimeBar - 決策按鈕組件
 * Layer 4 (UI Layer) - 功能組件
 *
 * 「我買了」和「我忍住了」的雙按鈕設計
 */

import { useState } from 'react';
import './DecisionButtons.css';

export interface DecisionButtonsProps {
  /** 點擊「我買了」的回調 */
  onBought: () => void;
  /** 點擊「我忍住了」的回調 */
  onSkipped: () => void;
  /** 是否禁用 (金額為 0 時) */
  disabled?: boolean;
  /** 是否正在處理 */
  loading?: boolean;
  /** 「我買了」按鈕文字 */
  boughtLabel?: string;
  /** 「我忍住了」按鈕文字 */
  skippedLabel?: string;
}

/**
 * 決策按鈕組件
 */
export function DecisionButtons({
  onBought,
  onSkipped,
  disabled = false,
  loading = false,
  boughtLabel = '💸 我買了',
  skippedLabel = '💪 我忍住了',
}: DecisionButtonsProps) {
  const [activeButton, setActiveButton] = useState<'bought' | 'skipped' | null>(null);

  const handleBought = () => {
    if (disabled || loading) return;
    setActiveButton('bought');
    onBought();
    // 重置狀態
    setTimeout(() => setActiveButton(null), 300);
  };

  const handleSkipped = () => {
    if (disabled || loading) return;
    setActiveButton('skipped');
    onSkipped();
    // 重置狀態
    setTimeout(() => setActiveButton(null), 300);
  };

  return (
    <div className="decision-buttons">
      {/* 我買了按鈕 */}
      <button
        type="button"
        onClick={handleBought}
        disabled={disabled || loading}
        className={`decision-buttons__btn decision-buttons__btn--bought ${
          activeButton === 'bought' ? 'decision-buttons__btn--active' : ''
        }`}
      >
        {loading && activeButton === 'bought' ? (
          <span className="decision-buttons__spinner" />
        ) : (
          boughtLabel
        )}
      </button>

      {/* 我忍住了按鈕 */}
      <button
        type="button"
        onClick={handleSkipped}
        disabled={disabled || loading}
        className={`decision-buttons__btn decision-buttons__btn--skipped ${
          activeButton === 'skipped' ? 'decision-buttons__btn--active' : ''
        }`}
      >
        {loading && activeButton === 'skipped' ? (
          <span className="decision-buttons__spinner" />
        ) : (
          skippedLabel
        )}
      </button>
    </div>
  );
}

export default DecisionButtons;
