/**
 * TimeBar - 金額輸入組件
 * Layer 4 (UI Layer) - 功能組件
 *
 * 用於輸入消費/儲蓄金額，包含快速金額按鈕和訂閱切換
 */

import { useState, useRef, useEffect } from 'react';
import './AmountInput.css';

export interface AmountInputProps {
  /** 金額值 */
  value: number;
  /** 值變更回調 */
  onChange: (value: number) => void;
  /** 是否為訂閱 (每月持續) */
  isRecurring?: boolean;
  /** 訂閱狀態變更回調 */
  onRecurringChange?: (isRecurring: boolean) => void;
  /** 快速金額選項 */
  quickAmounts?: number[];
  /** 佔位文字 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自動聚焦 */
  autoFocus?: boolean;
}

const DEFAULT_QUICK_AMOUNTS = [100, 500, 1000, 5000];

/**
 * 金額輸入組件
 */
export function AmountInput({
  value,
  onChange,
  isRecurring = false,
  onRecurringChange,
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  placeholder = '輸入金額',
  disabled = false,
  autoFocus = false,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(Math.max(0, newValue));
  };

  const handleQuickAmount = (amount: number) => {
    onChange(amount);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    onChange(0);
    inputRef.current?.focus();
  };

  const formatQuickAmount = (amount: number): string => {
    if (amount >= 10000) {
      return `${amount / 10000}萬`;
    }
    return amount.toLocaleString();
  };

  return (
    <div className={`amount-input ${disabled ? 'amount-input--disabled' : ''}`}>
      {/* 主輸入區 */}
      <div className={`amount-input__field ${isFocused ? 'amount-input__field--focused' : ''}`}>
        <span className="amount-input__currency">$</span>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className="amount-input__input"
          aria-label="金額輸入"
        />
        {value > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="amount-input__clear"
            aria-label="清除金額"
          >
            ✕
          </button>
        )}
        <span className="amount-input__unit">元</span>
      </div>

      {/* 快速金額按鈕 */}
      <div className="amount-input__quick-amounts">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handleQuickAmount(amount)}
            className={`amount-input__quick-btn ${value === amount ? 'amount-input__quick-btn--active' : ''}`}
            disabled={disabled}
          >
            {formatQuickAmount(amount)}
          </button>
        ))}
      </div>

      {/* 訂閱切換 */}
      {onRecurringChange && (
        <label className="amount-input__recurring">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            disabled={disabled}
            className="amount-input__recurring-checkbox"
          />
          <span className="amount-input__recurring-toggle">
            <span className="amount-input__recurring-toggle-thumb" />
          </span>
          <span className="amount-input__recurring-label">
            每月持續（訂閱）
          </span>
        </label>
      )}
    </div>
  );
}

export default AmountInput;
