/**
 * TimeBar - 新版首頁
 * Layer 4 (UI Layer) - 頁面組件
 *
 * 根據 UI-UX-ANALYSIS-AND-REDESIGN.md 重新設計的主畫面
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useFinance, useGPS } from '@business/hooks';
import {
  RetirementProgress,
  AmountInput,
  TimeCostDisplay,
  DecisionButtons,
  Celebration,
} from '@ui/features';
import type { RecordItem } from '@domain/types';
import { useToast } from '@/components/common/Toast';
import { CategorySelectModal } from '@/components/dashboard/CategorySelectModal';
import { AwarenessParticles } from '@/components/AwarenessParticles';
import { Confetti } from '@/components/Confetti';
import { UnlockNotification } from '@/components/common/UnlockNotification';
import { PointsParticles } from '@/components/common/PointsParticles';
import { DailyChallenge, ChallengeCompleteResult } from '@/components/dashboard/DailyChallenge';
import { QuickActionsBar, QuickAction } from '@/components/dashboard/QuickActionsBar';
import { Modal } from '@/components/common/Modal';
import { QuickActionsSettingsPage } from '@/components/settings/QuickActionsSettingsPage';
import { PointsSystem } from '@/utils/pointsSystem';
import { FinanceCalc } from '@/utils/financeCalc';
import { getUnlockStatus, checkNewUnlock, getFeatureUnlockMessage } from '@/utils/progressiveDisclosure';
import type { Record as RecordType, UserData, ChallengeDefinition } from '@/types';
import './HomePage.css';

export interface HomePageProps {
  /** 用戶數據 */
  userData: {
    age: number;
    monthlySalary: number;
    targetRetireAge: number;
  };
  /** 完整用戶數據 (包含 createdAt 等，用於漸進式揭露) */
  fullUserData?: UserData;
  /** 記錄列表 */
  records: RecordItem[];
  /** 添加記錄回調 - 支持完整 RecordType 或簡化格式 */
  onAddRecord?: (record: {
    type: 'save' | 'spend';
    amount: number;
    timeCost: number;
    isRecurring: boolean;
    category?: string;
    note?: string;
  } | RecordType) => void;
  // 積分參數已整合到 fullUserData.pointsBalance
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
  fullUserData,
  records,
  onAddRecord,

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

  // Toast 系統
  const { showToast, ToastContainer } = useToast();

  // 分類選擇 Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{ amount: number; isRecurring: boolean; timeCost: number } | null>(null);

  // 覺察提醒動畫
  const [showAwareness, setShowAwareness] = useState(false);

  // Confetti 動畫
  const [showConfetti, setShowConfetti] = useState(false);

  // 漸進式揭露
  const [showUnlockNotification, setShowUnlockNotification] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<{ title: string; description: string; icon: string } | null>(null);
  const previousRecordCount = useRef<number>(records.length);

  // 積分系統
  const [pointsBalance, setPointsBalance] = useState<number>(0);

  // 積分粒子效果
  const [showPointsParticles, setShowPointsParticles] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // 快速記帳設定 Modal
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false);

  // Hooks
  const finance = useFinance(userData);

  // 計算時間成本 (必須在 previewRecords 之前)
  const timeCost = finance.calculateTimeCost(amount, isRecurring);

  // 計算功能解鎖狀態 (如果有 fullUserData)
  const unlockStatus = useMemo(() => {
    if (!fullUserData) return { quickActions: false, challenges: false, gamification: false };
    // Convert RecordItem[] to RecordType[] for unlock status calculation
    const recordsForUnlock = records.map(r => ({
      ...r,
      id: String(r.timeCost), // Use timeCost as fallback id
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      category: r.type === 'save' ? '主動儲蓄' : '一般消費',
      note: '',
    })) as RecordType[];
    return getUnlockStatus(fullUserData, recordsForUnlock);
  }, [fullUserData, records]);

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

  // 載入積分
  useEffect(() => {
    const balance = PointsSystem.load();
    setPointsBalance(balance);
  }, []);

  // 檢測功能解鎖
  useEffect(() => {
    if (!fullUserData) return;

    const currentCount = records.length;
    const previousCount = previousRecordCount.current;

    // 檢查是否有新功能解鎖
    const newUnlock = checkNewUnlock(previousCount, currentCount, fullUserData);

    if (newUnlock) {
      const message = getFeatureUnlockMessage(newUnlock);
      setUnlockMessage(message);
      setShowUnlockNotification(true);
    }

    // 更新記錄數量
    previousRecordCount.current = currentCount;
  }, [records.length, fullUserData]);

  // 處理「我買了」- 打開分類選擇 Modal
  const handleBought = useCallback(() => {
    if (amount <= 0 || loading) return;

    // 立即設置 loading 防止重複點擊 (fix: 歷史回歸 commit fcea505)
    setLoading(true);
    // 保存當前的購買信息
    setPendingPurchase({ amount, isRecurring, timeCost });
    // 打開分類選擇 Modal
    setShowCategoryModal(true);
  }, [amount, isRecurring, timeCost, loading]);

  // 處理分類選擇完成
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    // 注意：不檢查 loading，因為 handleBought 已經設置 loading=true
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

      // 觸發覺察提醒動畫
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

    // 觸發 Confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    // 重置金額
    setAmount(0);
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

      // 觸發慶祝效果
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      showToast('已記錄儲蓄 💰', 'success');
      // 重置
      setAmount(0);
      setIsRecurring(false);
    } finally {
      setLoading(false);
    }
  }, [amount, timeCost, isRecurring, onAddRecord, showToast]);

  // 確認儲蓄 (從慶祝畫面)
  const handleConfirmSave = useCallback(() => {
    if (!onAddRecord) return;

    onAddRecord({
      type: 'save',
      amount: celebrationData.amount,
      timeCost: celebrationData.timeCost, // 這裡的 timeCost 代表「省下的時間」
      isRecurring: isRecurring,
    });

    showToast('已記入儲蓄 💰', 'success');

    // 重置
    setAmount(0);
    setIsRecurring(false);
    setShowCelebration(false);
  }, [celebrationData, isRecurring, onAddRecord, showToast]);

  // 只是不記錄 (從慶祝畫面)
  const handleSkipRecord = useCallback(() => {
    setAmount(0);
    setIsRecurring(false);
    setShowCelebration(false);
  }, []);

  // 處理每日挑戰完成
  const handleChallengeComplete = useCallback((
    challenge: ChallengeDefinition,
    result: ChallengeCompleteResult
  ) => {
    // 增加積分
    const newBalance = PointsSystem.addPoints(result.points, 'daily_challenge');
    setPointsBalance(newBalance);

    // 觸發粒子效果
    setEarnedPoints(result.points);
    setShowPointsParticles(true);
    setTimeout(() => setShowPointsParticles(false), 1600);

    // 計算時間成本 (如果有金額)
    const challengeTimeCost = result.amount > 0
      ? FinanceCalc.calculateTimeCost(
          result.amount,
          false,
          FinanceCalc.hourlyRate(userData.monthlySalary),
          FinanceCalc.realRate(fullUserData?.inflationRate || 0.025, fullUserData?.roiRate || 0.06),
          userData.targetRetireAge - userData.age
        )
      : 0;

    // 顯示積分 Toast 並詢問是否記帳
    if (result.showRecordPrompt && result.amount > 0) {
      const promptData = {
        challenge,
        amount: result.amount,
        timeCost: challengeTimeCost
      };

      showToast(
        `獲得 ${challenge.energyReward} ⏳ 時間沙！`,
        'points',
        {
          subMessage: `要把省下的 $${result.amount} 記下來嗎？`,
          action: {
            label: '💰 記一筆',
            onClick: async () => {
              if (!onAddRecord) return;
              const record: RecordType = {
                id: Date.now().toString(),
                type: 'save',
                amount: promptData.amount,
                isRecurring: false,
                timeCost: promptData.timeCost,
                category: '每日挑戰',
                note: promptData.challenge.name,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
              };
              await onAddRecord(record);
              showToast(`已記錄省下 $${promptData.amount} 💰`, 'success');
            }
          }
        }
      );
    } else {
      // 沒有記帳提示，只顯示積分獲得
      showToast(`獲得 ${challenge.energyReward} ⏳ 時間沙！`, 'points');
    }
  }, [userData, fullUserData, showToast, onAddRecord]);

  return (
    <div className="home-page">
      {/* Toast 佇列容器 */}
      <ToastContainer />

      {/* Confetti 動畫 */}
      <Confetti active={showConfetti} />

      {/* 覺察提醒動畫 */}
      <AwarenessParticles active={showAwareness} />

      {/* 積分粒子效果 */}
      <PointsParticles active={showPointsParticles} amount={earnedPoints} x={50} y={30} />

      {/* Header */}
      <header className="home-page__header">
        <div className="home-page__logo">
          <span className="home-page__logo-icon">⏳</span>
          <span className="home-page__logo-text">TimeBar</span>
        </div>
        <div className="home-page__header-actions">
          {/* 顯示積分餘額 (遊戲化功能解鎖後) */}
          {unlockStatus.gamification && pointsBalance > 0 && (
            <span className="home-page__points">
              ⏳ {pointsBalance}
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

        {/* 每日挑戰 - 根據解鎖狀態顯示 */}
        {unlockStatus.challenges && (
          <section className="home-page__section">
            <DailyChallenge
              totalPoints={pointsBalance}
              onCompleteChallenge={handleChallengeComplete}
            />
          </section>
        )}

        {/* 快速記帳按鈕列 - 根據解鎖狀態顯示 */}
        {unlockStatus.quickActions && fullUserData && (
          <section className="home-page__section">
            <QuickActionsBar
              onQuickAdd={(action: QuickAction) => {
                if (!onAddRecord) return;
                // 快速記帳
                const timeCost = FinanceCalc.calculateTimeCost(
                  action.amount,
                  action.isRecurring,
                  FinanceCalc.hourlyRate(userData.monthlySalary),
                  FinanceCalc.realRate(fullUserData.inflationRate, fullUserData.roiRate),
                  userData.targetRetireAge - userData.age
                );
                const record: RecordType = {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  type: 'spend',
                  amount: action.amount,
                  isRecurring: action.isRecurring,
                  timeCost,
                  category: action.categoryId,
                  note: action.name,
                  timestamp: new Date().toISOString(),
                  date: new Date().toISOString().split('T')[0],
                  createdAt: Date.now()
                };
                onAddRecord(record);
                showToast(`✅ 已記錄 ${action.name} $${action.amount}`);
              }}
              onOpenSettings={() => setShowQuickActionsModal(true)}
            />
          </section>
        )}

        {/* 追趕提示（簡化版）- 落後時顯示 */}
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
                      // 滾動到金額輸入區
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

      {/* 分類選擇 Modal */}
      <CategorySelectModal
        open={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setPendingPurchase(null);
          setLoading(false); // 重置 loading 狀態
        }}
        onSelect={handleCategorySelect}
      />

      {/* 功能解鎖通知 */}
      {unlockMessage && (
        <UnlockNotification
          isOpen={showUnlockNotification}
          onClose={() => setShowUnlockNotification(false)}
          title={unlockMessage.title}
          description={unlockMessage.description}
          icon={unlockMessage.icon}
        />
      )}

      {/* 快速記帳設定 Modal */}
      <Modal
        open={showQuickActionsModal}
        onClose={() => setShowQuickActionsModal(false)}
        title="快速記帳設定"
        size="xl"
      >
        <QuickActionsSettingsPage onBack={() => setShowQuickActionsModal(false)} />
      </Modal>
    </div>
  );
}

export default HomePage;
