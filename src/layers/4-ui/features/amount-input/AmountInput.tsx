/**
 * TimeBar - 金額輸入組件
 * Layer 4 (UI Layer) - 功能組件
 * v4.2 - 新增訂閱期數選項
 *
 * 用於輸入消費/儲蓄金額，包含快速金額按鈕、訂閱切換和期數選項
 */

import { useState, useRef, useEffect } from 'react';
import './AmountInput.css';

/** 預設期數選項 */
const DURATION_OPTIONS = [
  { value: undefined, label: '持續' },
  { value: 3, label: '3月' },
  { value: 6, label: '6月' },
  { value: 12, label: '12月' },
] as const;

export interface AmountInputProps {
  /** 金額值 */
  value: number;
  /** 值變更回調 */
  onChange: (value: number) => void;
  /** 是否為訂閱 (每月持續) */
  isRecurring?: boolean;
  /** 訂閱狀態變更回調 */
  onRecurringChange?: (isRecurring: boolean) => void;
  /** 訂閱期數（月） */
  monthsDuration?: number;
  /** 訂閱期數變更回調 */
  onMonthsDurationChange?: (months: number | undefined) => void;
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
  monthsDuration,
  onMonthsDurationChange,
  quickAmounts = DEFAULT_QUICK_AMOUNTS,
  placeholder = '輸入金額',
  disabled = false,
  autoFocus = false,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);

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
            onChange={(e) => {
              onRecurringChange(e.target.checked);
              // 關閉訂閱時重置期數
              if (!e.target.checked && onMonthsDurationChange) {
                onMonthsDurationChange(undefined);
                setShowCustomDate(false);
              }
            }}
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

      {/* 期數選項 - 只在訂閱模式下顯示 */}
      {isRecurring && onMonthsDurationChange && (
        <div className="amount-input__duration">
          <span className="amount-input__duration-label">持續期間：</span>
          <div className="amount-input__duration-options">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  onMonthsDurationChange(option.value);
                  setShowCustomDate(false);
                }}
                className={`amount-input__duration-btn ${
                  !showCustomDate && monthsDuration === option.value
                    ? 'amount-input__duration-btn--active'
                    : ''
                }`}
                disabled={disabled}
              >
                {option.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustomDate(!showCustomDate)}
              className={`amount-input__duration-btn ${
                showCustomDate ? 'amount-input__duration-btn--active' : ''
              }`}
              disabled={disabled}
            >
              自訂
            </button>
          </div>

          {/* 自訂年月選擇器 */}
          {showCustomDate && (
            <div className="amount-input__custom-date">
              <select
                value={customYear}
                onChange={(e) => {
                  setCustomYear(Number(e.target.value));
                  // 計算從現在到目標日期的月數
                  const months = calculateMonthsFromNow(Number(e.target.value), customMonth);
                  onMonthsDurationChange(months > 0 ? months : undefined);
                }}
                className="amount-input__date-select"
                disabled={disabled}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
              <select
                value={customMonth}
                onChange={(e) => {
                  setCustomMonth(Number(e.target.value));
                  const months = calculateMonthsFromNow(customYear, Number(e.target.value));
                  onMonthsDurationChange(months > 0 ? months : undefined);
                }}
                className="amount-input__date-select"
                disabled={disabled}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>{month}月</option>
                ))}
              </select>
              {monthsDuration && monthsDuration > 0 && (
                <span className="amount-input__duration-preview">
                  ≈ {monthsDuration} 個月
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 計算從現在到目標年月的月數
 */
function calculateMonthsFromNow(targetYear: number, targetMonth: number): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return (targetYear - currentYear) * 12 + (targetMonth - currentMonth);
}

export default AmountInput;
