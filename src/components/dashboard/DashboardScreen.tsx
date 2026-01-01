import { useState, useCallback, useMemo } from 'react';
import { FinanceCalc, GPSCalc, Formatters } from '@/utils/financeCalc';
import { getVividComparison, formatRetirementImpact } from '@/utils/lifeCostCalc';
import { Confetti } from '../Confetti';
import { CelebrationModal } from '../common/CelebrationModal';
import { LifeBattery } from './LifeBattery';
import { MilestoneDisplay } from './MilestoneDisplay';
import { DailyChallenge, Challenge } from './DailyChallenge';
import { CatchUpPlan } from './CatchUpPlan';
import { UserData, Record as RecordType } from '@/types';

const { formatCurrencyFull, formatCurrency } = Formatters;

interface DashboardScreenProps {
  userData: UserData;
  records: RecordType[];
  onAddRecord: (record: RecordType) => void;
  onOpenTracker: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export function DashboardScreen({
  userData,
  records,
  onAddRecord,
  onOpenTracker,
  onOpenHistory,
  onOpenSettings
}: DashboardScreenProps) {
  const [amount, setAmount] = useState<number>(0);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [lastSavedAmount, setLastSavedAmount] = useState<number>(0);
  const [lastSavedHours, setLastSavedHours] = useState<number>(0);

  const { salary, retireAge, inflationRate, roiRate, age } = userData;

  const yearsToRetire = useMemo(() => retireAge - age, [retireAge, age]);
  const hourlyRate = useMemo(() => FinanceCalc.hourlyRate(salary), [salary]);
  const realRate = useMemo(() => FinanceCalc.realRate(inflationRate, roiRate), [inflationRate, roiRate]);

  // GPS 計算
  const gpsResult = useMemo(() => GPSCalc.calculateEstimatedAge(retireAge, records), [retireAge, records]);
  const { estimatedAge, totalSavedHours } = gpsResult;

  // 計算當前金額的時間成本
  const timeCost = useMemo(() => {
    if (amount <= 0) return 0;
    return FinanceCalc.calculateTimeCost(amount, isRecurring, hourlyRate, realRate, yearsToRetire);
  }, [amount, isRecurring, hourlyRate, realRate, yearsToRetire]);

  // 生動比喻
  const vividComparison = useMemo(() => {
    if (amount <= 0) return null;
    return getVividComparison(timeCost, salary, true);
  }, [timeCost, salary, amount]);

  // 退休影響
  const retirementImpact = useMemo(() => {
    if (amount <= 0) return '';
    return formatRetirementImpact(timeCost, true);
  }, [timeCost, amount]);

  // 處理「我買了」
  const handleBought = useCallback(async () => {
    if (amount <= 0) return;

    const record: RecordType = {
      id: Date.now().toString(),
      type: 'spend',
      amount,
      isRecurring,
      timeCost,
      category: '一般消費',
      note: '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    await onAddRecord(record);
    setAmount(0);
  }, [amount, isRecurring, timeCost, onAddRecord]);

  // 處理「我不買了」
  const handleSkipped = useCallback(async () => {
    if (amount <= 0) return;

    // 記錄為儲蓄
    const record: RecordType = {
      id: Date.now().toString(),
      type: 'save',
      amount,
      isRecurring: false,
      timeCost,
      category: '忍住不買',
      note: '決定不買，省下這筆錢',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    await onAddRecord(record);

    // 觸發慶祝
    setLastSavedAmount(amount);
    setLastSavedHours(timeCost);
    setShowConfetti(true);
    setShowCelebration(true);

    // 重置
    setAmount(0);

    // 3秒後關閉彩帶
    setTimeout(() => setShowConfetti(false), 3000);
  }, [amount, timeCost, onAddRecord]);

  const quickAmounts = [100, 300, 500, 1000, 3000, 5000];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Confetti active={showConfetti} />
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        savedAmount={lastSavedAmount}
        savedHours={lastSavedHours}
      />

      {/* Header */}
      <div className="pt-4 pb-2 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl font-black text-white">
              Time<span className="text-emerald-400">Bar</span>
            </div>
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

          {/* 生命電池 */}
          <LifeBattery
            currentAge={age}
            retireAge={retireAge}
            estimatedRetireAge={estimatedAge}
          />
        </div>
      </div>

      {/* 里程碑顯示 */}
      <div className="px-4 py-2">
        <div className="max-w-lg mx-auto">
          <MilestoneDisplay totalSavedHours={totalSavedHours} />
        </div>
      </div>

      {/* 每日挑戰 */}
      <div className="px-4 py-2">
        <div className="max-w-lg mx-auto">
          <DailyChallenge
            onCompleteChallenge={(challenge: Challenge) => {
              // 完成挑戰時建立儲蓄記錄
              const record: RecordType = {
                id: Date.now().toString(),
                type: 'save',
                amount: challenge.targetAmount,
                isRecurring: false,
                timeCost: FinanceCalc.calculateTimeCost(
                  challenge.targetAmount,
                  false,
                  hourlyRate,
                  realRate,
                  yearsToRetire
                ),
                category: '每日挑戰',
                note: challenge.name,
                timestamp: new Date().toISOString(),
                date: new Date().toISOString().split('T')[0],
              };
              onAddRecord(record);
            }}
          />
        </div>
      </div>

      {/* 追趕計劃（落後時顯示） */}
      {gpsResult.isBehind && (
        <div className="px-4 py-2">
          <div className="max-w-lg mx-auto">
            <CatchUpPlan userData={userData} gpsResult={gpsResult} />
          </div>
        </div>
      )}

      {/* 金額輸入區 */}
      <div className="px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/50">
            <div className="text-center mb-4">
              <div className="text-gray-400 text-sm mb-2">這個東西要花多少？</div>
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
            <div className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-sm rounded-3xl p-6 border border-orange-500/30">
              <div className="text-center">
                {/* 工作時間成本 */}
                <div className="mb-4">
                  <div className="text-orange-300 text-sm mb-1">⏰ 工作時間成本</div>
                  <div className="text-3xl font-black text-orange-400">
                    {vividComparison.workTime}
                  </div>
                  <div className="text-gray-400 text-sm">{vividComparison.workTimeDetail}</div>
                </div>

                {/* 分隔線 */}
                <div className="border-t border-orange-500/20 my-4"></div>

                {/* 退休影響 */}
                <div className="mb-4">
                  <div className="text-red-300 text-sm mb-1">📅 退休影響</div>
                  <div className="text-2xl font-bold text-red-400">
                    {retirementImpact}
                  </div>
                </div>

                {/* 分隔線 */}
                <div className="border-t border-orange-500/20 my-4"></div>

                {/* 生動比喻 */}
                <div className="bg-gray-900/50 rounded-xl p-3">
                  <div className="text-gray-400 text-sm mb-1">💡 相當於</div>
                  <div className="text-white font-medium">
                    {vividComparison.salaryEquivalent} / {vividComparison.lifeEquivalent}
                  </div>
                </div>

                {/* 每月固定警告 */}
                {isRecurring && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <div className="text-red-400 text-sm">
                      ⚠️ 每月訂閱的複利威力驚人！長期累積更可怕
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
          <div className="grid grid-cols-2 gap-4">
            {/* 我買了 */}
            <button
              onClick={handleBought}
              disabled={amount <= 0}
              className="py-4 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-95 disabled:opacity-30 bg-gray-700 hover:bg-gray-600 text-gray-300"
            >
              我買了 💸
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

          {amount <= 0 && (
            <div className="text-center mt-4 text-gray-500 text-sm">
              👆 輸入金額來看看這個東西值多少生命
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800">
        <div className="max-w-lg mx-auto flex justify-around py-3">
          <button className="flex flex-col items-center text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1 font-medium">首頁</span>
          </button>
          <button onClick={onOpenTracker} className="flex flex-col items-center text-gray-500 hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1">記錄</span>
          </button>
          <button onClick={onOpenHistory} className="flex flex-col items-center text-gray-500 hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">歷史</span>
          </button>
          <button onClick={onOpenSettings} className="flex flex-col items-center text-gray-500 hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">設定</span>
          </button>
        </div>
      </div>
    </div>
  );
}
