/**
 * TimeBar - 新版首頁
 * Layer 4 (UI Layer) - 頁面組件
 *
 * 根據 UI-UX-ANALYSIS-AND-REDESIGN.md 重新設計的主畫面
 */

import { useState, useCallback } from 'react';
import { useFinance, useGPS } from '@business/hooks';
import {
  RetirementProgress,
  AmountInput,
  TimeCostDisplay,
  DecisionButtons,
} from '@ui/features';
import type { RecordItem } from '@domain/types';
import './HomePage.css';

export interface HomePageProps {
  /** 用戶數據 */
  userData: {
    age: number;
    monthlySalary: number;
    targetRetireAge: number;
  };
  /** 記錄列表 */
  records: RecordItem[];
  /** 添加記錄回調 */
  onAddRecord?: (record: {
    type: 'save' | 'spend';
    amount: number;
    timeCost: number;
    isRecurring: boolean;
  }) => void;
  /** 積分 */
  points?: number;
  /** 設定點擊回調 */
  onSettingsClick?: () => void;
}

/**
 * 新版首頁
 */
export function HomePage({
  userData,
  records,
  onAddRecord,
  points = 0,
  onSettingsClick,
}: HomePageProps) {
  // 狀態
  const [amount, setAmount] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showGPSDetail, setShowGPSDetail] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hooks
  const finance = useFinance(userData);
  const gps = useGPS({
    targetRetireAge: userData.targetRetireAge,
    records,
  });

  // 計算時間成本
  const timeCost = finance.calculateTimeCost(amount, isRecurring);

  // 處理「我買了」
  const handleBought = useCallback(async () => {
    if (amount <= 0 || !onAddRecord) return;

    setLoading(true);
    try {
      onAddRecord({
        type: 'spend',
        amount,
        timeCost,
        isRecurring,
      });
      // 重置
      setAmount(0);
      setIsRecurring(false);
    } finally {
      setLoading(false);
    }
  }, [amount, timeCost, isRecurring, onAddRecord]);

  // 處理「我忍住了」
  const handleSkipped = useCallback(async () => {
    if (amount <= 0 || !onAddRecord) return;

    setLoading(true);
    try {
      onAddRecord({
        type: 'save',
        amount,
        timeCost,
        isRecurring,
      });
      // 重置
      setAmount(0);
      setIsRecurring(false);
    } finally {
      setLoading(false);
    }
  }, [amount, timeCost, isRecurring, onAddRecord]);

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-page__header">
        <div className="home-page__logo">
          <span className="home-page__logo-icon">⏳</span>
          <span className="home-page__logo-text">TimeBar</span>
        </div>
        <div className="home-page__header-actions">
          {points > 0 && (
            <span className="home-page__points">
              🎯 {points}
            </span>
          )}
          <button
            className="home-page__settings-btn"
            onClick={onSettingsClick}
            aria-label="設定"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* 主內容 */}
      <main className="home-page__main">
        {/* 退休進度條 */}
        <section className="home-page__section">
          <RetirementProgress
            targetAge={userData.targetRetireAge}
            estimatedAge={gps.estimatedAge}
            currentAge={userData.age}
            totalSavedHours={gps.totalSavedHours}
            totalSpentHours={gps.totalSpentHours}
            showDetail={showGPSDetail}
            onDetailClick={() => setShowGPSDetail(true)}
            onCloseDetail={() => setShowGPSDetail(false)}
          />
        </section>

        {/* 核心問句 */}
        <section className="home-page__section home-page__question">
          <h2>這筆花費會影響你的自由多久？</h2>
        </section>

        {/* 金額輸入 */}
        <section className="home-page__section">
          <AmountInput
            value={amount}
            onChange={setAmount}
            isRecurring={isRecurring}
            onRecurringChange={setIsRecurring}
            autoFocus
          />
        </section>

        {/* 時間成本顯示 */}
        <section className="home-page__section">
          <TimeCostDisplay
            hours={timeCost}
            visible={amount > 0}
            isSpend={true}
            monthlySalary={userData.monthlySalary}
            showComparison={true}
            showRetirementImpact={true}
          />
        </section>
      </main>

      {/* 決策按鈕 - 固定在底部 */}
      <footer className="home-page__footer">
        <DecisionButtons
          onBought={handleBought}
          onSkipped={handleSkipped}
          disabled={amount <= 0}
          loading={loading}
        />
      </footer>
    </div>
  );
}

export default HomePage;
