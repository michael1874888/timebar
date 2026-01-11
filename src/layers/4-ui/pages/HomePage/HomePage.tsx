/**
 * TimeBar - 新版首頁
 * Layer 4 (UI Layer) - 頁面組件
 *
 * 根據 UI-UX-ANALYSIS-AND-REDESIGN.md 重新設計的主畫面
 */

import { useState, useCallback, useMemo } from 'react';
import { useFinance, useGPS } from '@business/hooks';
import {
  RetirementProgress,
  AmountInput,
  TimeCostDisplay,
  DecisionButtons,
  Celebration,
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
  /** 歷史點擊回調 */
  onHistoryClick?: () => void;
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
  onHistoryClick,
}: HomePageProps) {
  // 狀態
  const [amount, setAmount] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recordMode, setRecordMode] = useState<'spend' | 'save'>('spend'); // 記錄模式：消費或儲蓄
  const [showGPSDetail, setShowGPSDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ amount: 0, timeCost: 0 });

  // Hooks
  const finance = useFinance(userData);
  
  // 計算時間成本 (必須在 previewRecords 之前)
  const timeCost = finance.calculateTimeCost(amount, isRecurring);

  // 預覽記錄 (用於即時更新進度條)
  // 根據記錄模式預覽：消費模式展示負面影響，儲蓄模式展示正面影響
  const previewRecords = useMemo(() => {
    if (amount <= 0) return records;
    return [...records, {
      type: recordMode,
      amount,
      timeCost,
      isRecurring,
    }];
  }, [records, amount, timeCost, isRecurring, recordMode]);

  // Hook - 使用預覽記錄來計算 GPS
  const gps = useGPS({
    targetRetireAge: userData.targetRetireAge,
    records: previewRecords,
  });

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
  const handleSkipped = useCallback(() => {
    if (amount <= 0) return;
    setCelebrationData({ amount, timeCost });
    setShowCelebration(true);
  }, [amount, timeCost]);

  // 處理「存下來了」- 儲蓄模式專用
  const handleSaved = useCallback(async () => {
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

  // 確認儲蓄 (從慶祝畫面)
  const handleConfirmSave = useCallback(() => {
    if (!onAddRecord) return;
    
    onAddRecord({
      type: 'save',
      amount: celebrationData.amount,
      timeCost: celebrationData.timeCost, // 這裡的 timeCost 代表「省下的時間」
      isRecurring: isRecurring,
    });
    
    // 重置
    setAmount(0);
    setIsRecurring(false);
    setShowCelebration(false);
  }, [celebrationData, isRecurring, onAddRecord]);

  // 只是不記錄 (從慶祝畫面)
  const handleSkipRecord = useCallback(() => {
    setAmount(0);
    setIsRecurring(false);
    setShowCelebration(false);
  }, []);

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
            onClick={onHistoryClick}
            aria-label="歷史"
          >
            📊
          </button>
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

        {/* 模式切換 Toggle */}
        <section className="home-page__section">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => setRecordMode('spend')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                transition: 'all 200ms',
                backgroundColor: recordMode === 'spend' ? '#f97316' : 'rgba(55, 65, 81, 0.5)',
                color: recordMode === 'spend' ? '#111827' : '#d1d5db',
                border: 'none',
                cursor: 'pointer',
                boxShadow: recordMode === 'spend' ? '0 10px 15px -3px rgba(249, 115, 22, 0.25)' : 'none',
              }}
            >
              💸 記錄消費
            </button>
            <button
              onClick={() => setRecordMode('save')}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                fontWeight: 500,
                fontSize: '0.875rem',
                transition: 'all 200ms',
                backgroundColor: recordMode === 'save' ? '#10b981' : 'rgba(55, 65, 81, 0.5)',
                color: recordMode === 'save' ? '#111827' : '#d1d5db',
                border: 'none',
                cursor: 'pointer',
                boxShadow: recordMode === 'save' ? '0 10px 15px -3px rgba(16, 185, 129, 0.25)' : 'none',
              }}
            >
              💰 記錄儲蓄
            </button>
          </div>
        </section>

        {/* 核心問句 */}
        <section className="home-page__section home-page__question">
          <h2>{recordMode === 'spend' ? '這筆花費會影響你的自由多久？' : '這筆儲蓄讓你贏回多少自由？'}</h2>
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
            isSpend={recordMode === 'spend'}
            monthlySalary={userData.monthlySalary}
            showComparison={true}
            showRetirementImpact={true}
          />
        </section>
      </main>

      {/* 決策按鈕 - 固定在底部 */}
      <footer className="home-page__footer">
        {recordMode === 'spend' ? (
          <DecisionButtons
            onBought={handleBought}
            onSkipped={handleSkipped}
            disabled={amount <= 0}
            loading={loading}
          />
        ) : (
          <button
            onClick={handleSaved}
            disabled={amount <= 0 || loading}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '1rem',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              transition: 'all 300ms',
              backgroundColor: amount <= 0 || loading ? 'rgba(16, 185, 129, 0.3)' : '#10b981',
              color: amount <= 0 || loading ? 'rgba(31, 41, 55, 0.3)' : '#1f2937',
              border: 'none',
              cursor: amount <= 0 || loading ? 'not-allowed' : 'pointer',
              boxShadow: amount > 0 && !loading ? '0 10px 15px -3px rgba(16, 185, 129, 0.25)' : 'none',
            }}
          >
            {loading ? '記錄中...' : '存下來了 💰'}
          </button>
        )}
      </footer>

      {/* 慶祝動畫 */}
      <Celebration
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
        amount={celebrationData.amount}
        timeSavedDays={celebrationData.timeCost / 24} // timeCost 是小時
        onSave={handleConfirmSave}
        onSkip={handleSkipRecord}
      />
    </div>
  );
}

export default HomePage;
