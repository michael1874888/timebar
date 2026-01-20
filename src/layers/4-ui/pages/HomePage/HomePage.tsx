/**
 * TimeBar - 新版首頁
 * Layer 4 (UI Layer) - 頁面組件
 * v4.2 精簡版 - 移除遊戲化功能
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFinance, useGPS } from '@business/hooks';
import {
  GPSHeaderBadge,
  SavingsProgressCard,
  AmountInput,
  TimeCostDisplay,
  DecisionButtons,
  Celebration,
  UnallocatedFundsCard,
} from '@ui/features';
import type { RecordItem } from '@domain/types';
import { useToast } from '@/components/common/Toast';
import { CategorySelectModal } from '@/components/dashboard/CategorySelectModal';
import { AwarenessParticles } from '@/components/AwarenessParticles';
import { Confetti } from '@/components/Confetti';
import { FinanceCalc } from '@/utils/financeCalc';
import type { Record as RecordType, UserData } from '@/types';
import './HomePage.css';

export interface HomePageProps {
  /** 用戶數據 */
  userData: {
    age: number;
    monthlySalary: number;
    targetRetireAge: number;
  };
  /** 完整用戶數據 */
  fullUserData?: UserData;
  /** 記錄列表 */
  records: RecordItem[];
  /** 添加記錄回調 */
  onAddRecord?: (record: {
    type: 'save' | 'spend';
    amount: number;
    timeCost: number;
    isRecurring: boolean;
    category?: string;
    note?: string;
  } | RecordType) => void;
  /** 設定點擊回調 */
  onSettingsClick?: () => void;
  /** 歷史點擊回調 */
  onHistoryClick?: () => void;
  /** 更新用戶數據回調 */
  onUpdateUserData?: (updates: Partial<UserData>) => void;
}

/**
 * 新版首頁
 */
export function HomePage({
  userData,
  fullUserData,
  records,
  onAddRecord,
  onSettingsClick,
  onHistoryClick,
  onUpdateUserData,
}: HomePageProps) {
  // 狀態
  const [amount, setAmount] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recordMode, setRecordMode] = useState<'spend' | 'save'>('spend');
  const [showGPSDetail, setShowGPSDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({ amount: 0, timeCost: 0 });

  // Toast 系統
  const { showToast, ToastContainer } = useToast();

  // 分類選擇 Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{ amount: number; isRecurring: boolean; timeCost: number } | null>(null);

  // 覺察提醒動畫
  const [showAwareness, setShowAwareness] = useState(false);

  // Confetti 動畫
  const [showConfetti, setShowConfetti] = useState(false);

  // Hooks
  const finance = useFinance(userData);

  // 計算時間成本
  const timeCost = finance.calculateTimeCost(amount, isRecurring);

  // 預覽記錄
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
    userData: {
      age: userData.age,
      salary: userData.monthlySalary,
      retireAge: userData.targetRetireAge,
      currentSavings: fullUserData?.currentSavings || 0,
      monthlySavings: fullUserData?.monthlySavings || 0,
      inflationRate: fullUserData?.inflationRate || 2.5,
      roiRate: fullUserData?.roiRate || 6,
      targetRetirementFund: fullUserData?.targetRetirementFund,
      createdAt: fullUserData?.createdAt,
      trajectoryStartDate: fullUserData?.trajectoryStartDate,
      historicalDeviationHours: fullUserData?.historicalDeviationHours,
    },
    records: previewRecords,
  });

  // 持久化 trajectoryStartDate
  useEffect(() => {
    if (gps.startDate && !fullUserData?.trajectoryStartDate && onUpdateUserData) {
      onUpdateUserData({ trajectoryStartDate: gps.startDate });
    }
  }, [gps.startDate, fullUserData?.trajectoryStartDate, onUpdateUserData]);

  // 處理「我買了」
  const handleBought = useCallback(() => {
    if (amount <= 0 || loading) return;
    setLoading(true);
    setPendingPurchase({ amount, isRecurring, timeCost });
    setShowCategoryModal(true);
  }, [amount, isRecurring, timeCost, loading]);

  // 處理分類選擇完成
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    if (!pendingPurchase || !onAddRecord) return;

    try {
      const record: RecordType = {
        id: Date.now().toString(),
        type: 'spend',
        amount: pendingPurchase.amount,
        isRecurring: pendingPurchase.isRecurring,
        timeCost: pendingPurchase.timeCost,
        category: categoryId,
        note: '',
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      };

      await onAddRecord(record);

      setShowAwareness(true);
      setTimeout(() => setShowAwareness(false), 2500);

      showToast('已記錄消費 📝', 'success');
      setAmount(0);
      setIsRecurring(false);
      setPendingPurchase(null);
      setShowCategoryModal(false);
    } finally {
      setLoading(false);
    }
  }, [pendingPurchase, onAddRecord, showToast]);

  // 處理「我忍住了」
  const handleSkipped = useCallback(() => {
    if (amount <= 0) return;
    setCelebrationData({ amount, timeCost });
    setShowCelebration(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    setAmount(0);
  }, [amount, timeCost]);

  // 處理「存下來了」
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

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      showToast('已記錄儲蓄 💰', 'success');
      setAmount(0);
      setIsRecurring(false);
    } finally {
      setLoading(false);
    }
  }, [amount, timeCost, isRecurring, onAddRecord, showToast]);

  // 確認儲蓄
  const handleConfirmSave = useCallback(() => {
    if (!onAddRecord) return;

    onAddRecord({
      type: 'save',
      amount: celebrationData.amount,
      timeCost: celebrationData.timeCost,
      isRecurring: isRecurring,
    });

    showToast('已記入儲蓄 💰', 'success');
    setAmount(0);
    setIsRecurring(false);
    setShowCelebration(false);
  }, [celebrationData, isRecurring, onAddRecord, showToast]);

  // 只是不記錄
  const handleSkipRecord = useCallback(() => {
    setAmount(0);
    setIsRecurring(false);
    setShowCelebration(false);
  }, []);

  return (
    <div className="home-page">
      {/* Toast 佇列容器 */}
      <ToastContainer />

      {/* Confetti 動畫 */}
      <Confetti active={showConfetti} />

      {/* 覺察提醒動畫 */}
      <AwarenessParticles active={showAwareness} />

      {/* Header with integrated GPS */}
      <header className="home-page__header">
        <div className="home-page__logo">
          <span className="home-page__logo-icon">⏳</span>
          <span className="home-page__logo-text">TimeBar</span>
        </div>

        {/* GPS Status Badge - 中央 */}
        <GPSHeaderBadge
          targetAge={userData.targetRetireAge}
          estimatedAge={gps.estimatedAge}
          status={gps.status}
        />

        <div className="home-page__header-actions">
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

        {/* 儲蓄進度卡片 - 顯示累積儲蓄 vs 目標 */}
        <section className="home-page__section">
          <SavingsProgressCard
            targetAccumulatedSavings={gps.targetAccumulatedSavings}
            actualAccumulatedSavings={gps.actualAccumulatedSavings}
            deviation={gps.deviation}
            monthsElapsed={gps.monthsElapsed}
            requiredMonthlySavings={gps.requiredMonthlySavings}
          />
        </section>

        {/* 未分配資金卡片 */}
        {gps.unallocatedFunds > 0 && (
          <section className="home-page__section">
            <UnallocatedFundsCard
              unallocatedFunds={gps.unallocatedFunds}
              onConvertToSavings={(amount) => {
                if (!onAddRecord || !fullUserData) return;
                const timeCost = FinanceCalc.calculateTimeCost(
                  amount,
                  false,
                  FinanceCalc.hourlyRate(userData.monthlySalary),
                  FinanceCalc.realRate(fullUserData.inflationRate, fullUserData.roiRate),
                  userData.targetRetireAge - userData.age
                );
                const record: RecordType = {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'save',
                  amount,
                  isRecurring: false,
                  timeCost,
                  category: '一鍵轉存',
                  note: '從未分配資金轉存',
                  timestamp: new Date().toISOString(),
                  date: new Date().toISOString().split('T')[0],
                };
                onAddRecord(record);
                showToast('🎉 已轉存到退休基金！');
                setShowConfetti(true);
              }}
            />
          </section>
        )}

        {/* 追趕提示 - 落後時顯示 */}
        {gps.isBehind && (
          <section className="home-page__section">
            <div style={{
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '0.75rem',
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.125rem' }}>⏰</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fb923c', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    目前會延後 {Math.abs((gps.estimatedAge - userData.targetRetireAge)).toFixed(1)} 年退休，
                    建議每月多存 ${Math.round(userData.monthlySalary * 0.1).toLocaleString()}
                  </p>
                  <button
                    onClick={() => {
                      const suggestedAmount = Math.round(userData.monthlySalary * 0.1);
                      setAmount(suggestedAmount);
                      setRecordMode('save');
                      setIsRecurring(true);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: '#10b981',
                      color: '#111827',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#34d399'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                  >
                    💰 立即記錄儲蓄
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

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

      {/* 決策按鈕 */}
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
        timeSavedDays={celebrationData.timeCost / 24}
        onSave={handleConfirmSave}
        onSkip={handleSkipRecord}
      />

      {/* 分類選擇 Modal */}
      <CategorySelectModal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setPendingPurchase(null);
          setLoading(false);
        }}
        onSelect={handleCategorySelect}
      />
    </div>
  );
}

export default HomePage;
