import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FinanceCalc, GPSCalc, Formatters } from '@/utils/financeCalc';
import { getVividComparison, formatRetirementImpact } from '@/utils/lifeCostCalc';
import { Confetti } from '../Confetti';
import { AwarenessParticles } from '../AwarenessParticles';
import { CelebrationModal } from '../common/CelebrationModal';
import { UnlockNotification } from '../common/UnlockNotification';
import { useToast } from '../common/Toast';
import { PointsParticles } from '../common/PointsParticles';
import { RetirementProgress } from '@ui/features/retirement-progress';
import { DailyChallenge, ChallengeCompleteResult } from './DailyChallenge';
import { QuickActionsBar, QuickAction } from './QuickActionsBar';
import { CategorySelectModal } from './CategorySelectModal';
import { Modal } from '@/components/common/Modal';
import { QuickActionsSettingsPage } from '@/components/settings/QuickActionsSettingsPage';
import { UserData, Record as RecordType, ChallengeDefinition } from '@/types';
import { PointsSystem } from '@/utils/pointsSystem';
import { getUnlockStatus, checkNewUnlock, getFeatureUnlockMessage } from '@/utils/progressiveDisclosure';

const { formatCurrencyFull, formatCurrency } = Formatters;

interface DashboardScreenProps {
  userData: UserData;
  records: RecordType[];
  onAddRecord: (record: RecordType) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  // Phase 2: onOpenQuickActionsSettings 已移除，改用 Modal
}

export function DashboardScreen({
  userData,
  records,
  onAddRecord,
  onOpenHistory,
  onOpenSettings,
}: DashboardScreenProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recordMode, setRecordMode] = useState<'spend' | 'save'>('spend'); // 記錄模式：消費或儲蓄
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showAwareness, setShowAwareness] = useState<boolean>(false);
  const [lastSavedAmount, setLastSavedAmount] = useState<number>(0);
  const [lastSavedHours, setLastSavedHours] = useState<number>(0);

  // v2.0: Toast 佇列系統
  const { showToast, ToastContainer } = useToast();

  // v2.0: 積分系統
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [pendingSave, setPendingSave] = useState<{ amount: number; timeCost: number } | null>(null);
  
  // v2.0: 積分粒子效果
  const [showPointsParticles, setShowPointsParticles] = useState<boolean>(false);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);

  // v2.1: 防止重複點擊
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Phase 1: 分類選擇 Modal
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [pendingPurchase, setPendingPurchase] = useState<{ amount: number; isRecurring: boolean; timeCost: number } | null>(null);

  // Phase 1: 漸進式揭露
  const [showUnlockNotification, setShowUnlockNotification] = useState<boolean>(false);
  const [unlockMessage, setUnlockMessage] = useState<{ title: string; description: string; icon: string } | null>(null);

  // Phase 2: 快速記帳設定 Modal
  const [showQuickActionsModal, setShowQuickActionsModal] = useState<boolean>(false);
  const previousRecordCount = useRef<number>(records.length);

  const { salary, retireAge, inflationRate, roiRate, age } = userData;

  const yearsToRetire = useMemo(() => retireAge - age, [retireAge, age]);
  const hourlyRate = useMemo(() => FinanceCalc.hourlyRate(salary), [salary]);
  const realRate = useMemo(() => FinanceCalc.realRate(inflationRate, roiRate), [inflationRate, roiRate]);

  // Phase 1: 計算功能解鎖狀態
  const unlockStatus = useMemo(() => getUnlockStatus(userData, records), [userData, records]);

  // 載入積分
  useEffect(() => {
    const balance = PointsSystem.load();
    setPointsBalance(balance);
  }, []);

  // Phase 1: 檢測功能解鎖
  useEffect(() => {
    const currentCount = records.length;
    const previousCount = previousRecordCount.current;

    // 檢查是否有新功能解鎖
    const newUnlock = checkNewUnlock(previousCount, currentCount, userData);

    if (newUnlock) {
      const message = getFeatureUnlockMessage(newUnlock);
      setUnlockMessage(message);
      setShowUnlockNotification(true);
    }

    // 更新記錄數量
    previousRecordCount.current = currentCount;
  }, [records.length, userData]);

  // GPS 計算
  const gpsResult = useMemo(() => GPSCalc.calculateEstimatedAge(retireAge, records), [retireAge, records]);
  const { estimatedAge, totalSavedHours, totalSpentHours } = gpsResult;

  // 計算當前金額的時間成本
  const timeCost = useMemo(() => {
    if (amount <= 0) return 0;
    return FinanceCalc.calculateTimeCost(amount, isRecurring, hourlyRate, realRate, yearsToRetire);
  }, [amount, isRecurring, hourlyRate, realRate, yearsToRetire]);

  // 生動比喻
  const vividComparison = useMemo(() => {
    if (amount <= 0) return null;
    const isSpend = recordMode === 'spend';
    return getVividComparison(timeCost, salary, isSpend);
  }, [timeCost, salary, amount, recordMode]);

  // 退休影響
  const retirementImpact = useMemo(() => {
    if (amount <= 0) return '';
    const isSpend = recordMode === 'spend';
    return formatRetirementImpact(timeCost, isSpend);
  }, [timeCost, amount, recordMode]);

  // 處理「我買了」- Phase 1: 打開分類選擇 Modal
  const handleBought = useCallback(() => {
    if (amount <= 0 || isSaving) return;

    // 保存當前的購買信息
    setPendingPurchase({ amount, isRecurring, timeCost });
    // 打開分類選擇 Modal
    setShowCategoryModal(true);
  }, [amount, isRecurring, timeCost, isSaving]);

  // Phase 1: 處理分類選擇完成
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    if (!pendingPurchase || isSaving) return;

    setIsSaving(true);
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
      setPendingPurchase(null); // 清除待處理的購買信息
      setShowCategoryModal(false); // 關閉分類選擇 Modal
    } finally {
      setIsSaving(false);
    }
  }, [pendingPurchase, onAddRecord, isSaving, showToast]);

  // 處理「我不買了」- v2.0: 不自動記帳，改為詢問
  const handleSkipped = useCallback(() => {
    if (amount <= 0) return;

    // 記住待確認的金額
    setPendingSave({ amount, timeCost });

    // 觸發慶祝
    setLastSavedAmount(amount);
    setLastSavedHours(timeCost);
    setShowConfetti(true);
    setShowCelebration(true);

    // 重置金額
    setAmount(0);

    // 3秒後關閉彩帶
    setTimeout(() => setShowConfetti(false), 3000);
  }, [amount, timeCost]);

  // 處理「存下來了」- 儲蓄模式專用
  const handleSaved = useCallback(async () => {
    if (amount <= 0 || isSaving) return;

    setIsSaving(true);
    try {
      const record: RecordType = {
        id: Date.now().toString(),
        type: 'save',
        amount: amount,
        isRecurring: isRecurring,
        timeCost: timeCost,
        category: '主動儲蓄',
        note: isRecurring ? '每月固定儲蓄' : '一次性儲蓄',
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      };

      await onAddRecord(record);

      // 觸發慶祝效果
      setLastSavedAmount(amount);
      setLastSavedHours(timeCost);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      showToast('已記錄儲蓄 💰', 'success');
      setAmount(0);
    } finally {
      setIsSaving(false);
    }
  }, [amount, isRecurring, timeCost, isSaving, onAddRecord, showToast]);

  // v2.0: 確認儲蓄
  const handleConfirmSave = useCallback(async () => {
    if (!pendingSave) return;

    const record: RecordType = {
      id: Date.now().toString(),
      type: 'save',
      amount: pendingSave.amount,
      isRecurring: false,
      timeCost: pendingSave.timeCost,
      category: '忍住不買',
      note: '決定不買，省下這筆錢',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    await onAddRecord(record);
    setPendingSave(null);
    setShowCelebration(false);

    showToast('已記入儲蓄 💰', 'success');
  }, [pendingSave, onAddRecord]);

  // v2.0: 處理每日挑戰完成
  const handleChallengeComplete = useCallback((
    challenge: ChallengeDefinition,
    result: ChallengeCompleteResult
  ) => {
    // 增加積分
    const newBalance = PointsSystem.addPoints(result.points, 'daily_challenge');
    setPointsBalance(newBalance);

    // v2.0: 觸發粒子效果
    setEarnedPoints(result.points);
    setShowPointsParticles(true);
    setTimeout(() => setShowPointsParticles(false), 1600);

    // 計算時間成本
    const challengeTimeCost = FinanceCalc.calculateTimeCost(
      result.amount,
      false,
      hourlyRate,
      realRate,
      yearsToRetire
    );

    // 顯示積分 Toast 並詢問是否記帳
    if (result.showRecordPrompt) {
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
  }, [hourlyRate, realRate, yearsToRetire, showToast, onAddRecord]);

  const quickAmounts = [100, 300, 500, 1000, 3000, 5000];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* v2.0: Toast 佇列容器 */}
      <ToastContainer />

      {/* v2.0: 積分粒子效果 */}
      <PointsParticles active={showPointsParticles} amount={earnedPoints} x={50} y={30} />
      
      <Confetti active={showConfetti} />
      <AwarenessParticles active={showAwareness} />
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setPendingSave(null);
        }}
        savedAmount={lastSavedAmount}
        savedHours={lastSavedHours}
        showSaveOption={!!pendingSave}
        onConfirmSave={handleConfirmSave}
      />

      {/* Header */}
      <div className="pt-4 pb-2 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="text-xl font-black text-white">
                Time<span className="text-emerald-400">Bar</span>
              </div>
              {/* 顯示積分餘額 */}
              {pointsBalance > 0 && (
                <div className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span>⏳</span>
                  <span className="font-medium">{pointsBalance}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Phase 2: 新版 UI 預覽按鈕已移除 */}
              <button
                onClick={onOpenSettings}
                className="text-gray-400 hover:text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 退休進度條 */}
          <RetirementProgress
            targetAge={retireAge}
            estimatedAge={estimatedAge}
            currentAge={age}
            totalSavedHours={totalSavedHours}
            totalSpentHours={totalSpentHours}
          />
        </div>
      </div>

      {/* 每日挑戰 - Phase 1: 根據解鎖狀態顯示 */}
      {unlockStatus.challenges && (
        <div className="px-4 py-2">
          <div className="max-w-lg mx-auto">
            <DailyChallenge
              totalPoints={pointsBalance}
              onCompleteChallenge={handleChallengeComplete}
            />
          </div>
        </div>
      )}

      {/* Phase 3: 追趕提示（簡化版） - 落後時顯示 */}
      {gpsResult.isBehind && (
        <div className="px-4 py-2">
          <div className="max-w-lg mx-auto">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">⏰</span>
                <div className="flex-1">
                  <p className="text-orange-400 text-sm mb-2">
                    目前會延後 {Math.abs((estimatedAge - retireAge)).toFixed(1)} 年退休，建議每月多存 ${Math.round(salary * 0.1).toLocaleString()}
                  </p>
                  <button
                    onClick={() => {
                      const suggestedAmount = Math.round(salary * 0.1);
                      setAmount(suggestedAmount);
                      setRecordMode('save');
                      setIsRecurring(true);
                      // 滾動到金額輸入區
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-900 text-xs font-medium rounded-lg transition-all"
                  >
                    💰 立即記錄儲蓄
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* v2.1: 快速記帳按鈕列 - Phase 1: 根據解鎖狀態顯示 */}
      {unlockStatus.quickActions && (
        <div className="px-4 py-2">
          <div className="max-w-lg mx-auto">
            <QuickActionsBar
              onQuickAdd={(action: QuickAction) => {
                // 快速記帳
                const timeCost = FinanceCalc.calculateTimeCost(
                  action.amount,
                  action.isRecurring,
                  FinanceCalc.hourlyRate(userData.salary),
                  FinanceCalc.realRate(userData.inflationRate, userData.roiRate),
                  userData.retireAge - userData.age
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
          </div>
        </div>
      )}

      {/* 金額輸入區 */}
      <div className="px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50">
            {/* 模式切換 Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setRecordMode('spend')}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  recordMode === 'spend'
                    ? 'bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💸 記錄消費
              </button>
              <button
                onClick={() => setRecordMode('save')}
                className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  recordMode === 'save'
                    ? 'bg-emerald-500 text-gray-900 shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💰 記錄儲蓄
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-gray-400 text-sm mb-2">
                {recordMode === 'spend' ? '這筆花費會影響你的自由多久？' : '這筆儲蓄讓你贏回多少自由？'}
              </div>
              <div className="text-5xl font-black text-white tabular-nums">
                {formatCurrencyFull(amount)}
              </div>
            </div>

            {/* Slider */}
            <div className="mb-4 px-2">
              <input
                type="range"
                min="0"
                max="50000"
                step={amount < 1000 ? 50 : amount < 10000 ? 100 : 500}
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="slider orange w-full"
              />
              <div className="flex justify-between text-gray-600 text-xs mt-1">
                <span>$0</span>
                <span>$5萬</span>
              </div>
            </div>

            {/* Quick Amounts */}
            <div className="flex gap-2 justify-center flex-wrap mb-4">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  onClick={() => setAmount(qa)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    amount === qa
                      ? 'bg-orange-500 text-gray-900'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {formatCurrency(qa)}
                </button>
              ))}
            </div>

            {/* 每月固定 Toggle */}
            <div className="flex justify-center mb-4">
              <button
                onClick={() => setIsRecurring(!isRecurring)}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                  isRecurring
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {isRecurring ? '🔄 每月固定支出' : '☝️ 僅此一次'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 生命成本顯示區（金額 > 0 時） */}
      {amount > 0 && vividComparison && (
        <div className="px-4 py-2 animate-fade-in">
          <div className="max-w-lg mx-auto">
            <div className={`backdrop-blur-sm rounded-3xl p-6 border ${
              recordMode === 'spend'
                ? 'bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30'
                : 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30'
            }`}>
              <div className="text-center">
                {/* 工作時間成本 / 贏回的自由時間 */}
                <div className="mb-4">
                  <div className={`text-sm mb-1 ${recordMode === 'spend' ? 'text-orange-300' : 'text-emerald-300'}`}>
                    {recordMode === 'spend' ? '⏰ 工作時間成本' : '⏰ 贏回的自由時間'}
                  </div>
                  <div className={`text-3xl font-black ${recordMode === 'spend' ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {vividComparison.workTime}
                  </div>
                  <div className="text-gray-400 text-sm">{vividComparison.workTimeDetail}</div>
                </div>

                {/* 分隔線 */}
                <div className={`border-t my-4 ${recordMode === 'spend' ? 'border-orange-500/20' : 'border-emerald-500/20'}`}></div>

                {/* 退休影響 */}
                <div className="mb-4">
                  <div className={`text-sm mb-1 ${recordMode === 'spend' ? 'text-red-300' : 'text-emerald-300'}`}>
                    📅 退休影響
                  </div>
                  <div className={`text-2xl font-bold ${recordMode === 'spend' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {retirementImpact}
                  </div>
                </div>

                {/* 分隔線 */}
                <div className={`border-t my-4 ${recordMode === 'spend' ? 'border-orange-500/20' : 'border-emerald-500/20'}`}></div>

                {/* 生動比喻 */}
                <div className="bg-gray-900/50 rounded-xl p-3">
                  <div className="text-gray-400 text-sm mb-1">💡 相當於</div>
                  <div className="text-white font-medium">
                    {vividComparison.salaryEquivalent} / {vividComparison.lifeEquivalent}
                  </div>
                </div>

                {/* 每月固定提示 */}
                {isRecurring && (
                  <div className={`mt-4 rounded-xl p-3 ${
                    recordMode === 'spend'
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-emerald-500/10 border border-emerald-500/30'
                  }`}>
                    <div className={`text-sm ${recordMode === 'spend' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {recordMode === 'spend'
                        ? '⚠️ 每月訂閱的複利威力驚人！長期累積更可怕'
                        : '✨ 每月固定儲蓄的複利威力驚人！長期累積更強大'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 決策按鈕區 */}
      <div className="px-4 py-4 pb-24">
        <div className="max-w-lg mx-auto">
          {recordMode === 'spend' ? (
            // 消費模式：兩個按鈕
            <div className="grid grid-cols-2 gap-4">
              {/* 我買了 */}
              <button
                onClick={handleBought}
                disabled={amount <= 0 || isSaving}
                className="py-4 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-95 disabled:opacity-30 bg-gray-700 hover:bg-gray-600 text-gray-300"
              >
                {isSaving ? '記錄中...' : '我買了 💸'}
              </button>

              {/* 我不買了 */}
              <button
                onClick={handleSkipped}
                disabled={amount <= 0}
                className="py-4 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-95 disabled:opacity-30 bg-emerald-500 hover:bg-emerald-400 text-gray-900 shadow-lg shadow-emerald-500/25"
              >
                我不買了 💪
              </button>
            </div>
          ) : (
            // 儲蓄模式：單一按鈕
            <button
              onClick={handleSaved}
              disabled={amount <= 0 || isSaving}
              className="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-95 disabled:opacity-30 bg-emerald-500 hover:bg-emerald-400 text-gray-900 shadow-lg shadow-emerald-500/25"
            >
              {isSaving ? '記錄中...' : '存下來了 💰'}
            </button>
          )}

          {amount <= 0 && (
            <div className="text-center mt-4 text-gray-500 text-sm">
              {recordMode === 'spend'
                ? '👆 輸入金額來看看這個東西值多少生命'
                : '👆 輸入金額來記錄這筆儲蓄'
              }
            </div>
          )}
        </div>
      </div>

      {/* Phase 1: 分類選擇 Modal */}
      <CategorySelectModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSelect={handleCategorySelect}
      />

      {/* Phase 1: 功能解鎖通知 */}
      {unlockMessage && (
        <UnlockNotification
          isOpen={showUnlockNotification}
          onClose={() => setShowUnlockNotification(false)}
          title={unlockMessage.title}
          description={unlockMessage.description}
          icon={unlockMessage.icon}
        />
      )}

      {/* Phase 2: 快速記帳設定 Modal */}
      <Modal
        open={showQuickActionsModal}
        onClose={() => setShowQuickActionsModal(false)}
        title="快速記帳設定"
        size="xl"
      >
        <QuickActionsSettingsPage onBack={() => setShowQuickActionsModal(false)} />
      </Modal>

      {/* Bottom Nav - Phase 1: 簡化為 2 個按鈕 (首頁、歷史) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800">
        <div className="max-w-lg mx-auto flex justify-around py-3">
          <button className="flex flex-col items-center text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1 font-medium">首頁</span>
          </button>
          <button onClick={onOpenHistory} className="flex flex-col items-center text-gray-500 hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">歷史</span>
          </button>
        </div>
      </div>
    </div>
  );
}
