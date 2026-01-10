import { useState, useEffect, useMemo } from 'react';
import { FinanceCalc, Formatters, CONSTANTS } from '@/utils/financeCalc';
import { GAS_WEB_APP_URL } from '@/constants';
import { UserData, Record as RecordType } from '@/types';
import { PointsSystem } from '@/utils/pointsSystem';
import { InventorySystem } from '@/utils/inventorySystem';
import { Modal } from '@/components/common/Modal';
import { ShopPage } from '@/components/shop/ShopPage';
import { ChallengeSettingsPage } from './ChallengeSettingsPage';
import { CategorySettingsPage } from './CategorySettingsPage';
import { SubscriptionManagerPage } from '@/components/subscription/SubscriptionManagerPage';

const { formatCurrency, formatCurrencyFull } = Formatters;
const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;

interface SettingsPageProps {
  userData: UserData;
  onUpdateUser: (data: UserData) => void;
  onClose: () => void;
  onReset: () => void;
  // Phase 2: 添加 records 用於 SubscriptionManagerPage Modal
  records?: RecordType[];
  onUpdateRecords?: (records: RecordType[]) => void;
}

export function SettingsPage({ userData, onUpdateUser, onClose, onReset, records = [], onUpdateRecords }: SettingsPageProps) {
  const [age, setAge] = useState<number>(userData.age);
  const [salary, setSalary] = useState<number>(userData.salary);
  const [retireAge, setRetireAge] = useState<number>(userData.retireAge);
  const [currentSavings, setCurrentSavings] = useState<number>(userData.currentSavings || 0);
  const [monthlySavings, setMonthlySavings] = useState<number>(userData.monthlySavings || Math.round(userData.salary * 0.2));
  const [inflationRate, setInflationRate] = useState<number>(userData.inflationRate || DEFAULT_INFLATION_RATE);
  const [roiRate, setRoiRate] = useState<number>(userData.roiRate || DEFAULT_ROI_RATE);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [calculatorMode, setCalculatorMode] = useState<'age' | 'fund' | 'lifestyle'>('age');
  const [targetFund, setTargetFund] = useState<number>(userData.targetRetirementFund || 30000000);
  const [monthlyRetirement, setMonthlyRetirement] = useState<number>(50000);

  // Phase 2: Modal 狀態管理
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [showChallengeModal, setShowChallengeModal] = useState<boolean>(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // 確保退休年齡不小於當前年齡 + 5
  useEffect(() => {
    const minRetireAge = age + 5;
    if (retireAge < minRetireAge) {
      setRetireAge(minRetireAge);
    }
  }, [age, retireAge]);

  const handleSave = (): void => {
    // 只保留用戶修改過的欄位，不強制覆蓋 targetRetirementFund
    onUpdateUser({
      age,
      salary,
      retireAge,
      currentSavings,
      monthlySavings,
      inflationRate,
      roiRate,
      // 保留原有的 targetRetirementFund，除非在計算機中明確修改
      targetRetirementFund: userData.targetRetirementFund
    });
    onClose();
  };

  const handleClear = async (): Promise<void> => {
    if (confirmText !== 'DELETE') {
      return;
    }
    setIsClearing(true);
    await onReset();
    setIsClearing(false);
  };

  const hourlyRate = useMemo(() => Math.round(FinanceCalc.hourlyRate(salary)), [salary]);
  const realRate = useMemo(() => FinanceCalc.realRate(inflationRate, roiRate), [inflationRate, roiRate]);
  const yearsToRetire = useMemo(() => retireAge - age, [retireAge, age]);

  // Calculator results
  const calcResults = useMemo(() => {
    if (calculatorMode === 'age') {
      const fund = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, Math.max(1, yearsToRetire), realRate);
      const monthly = FinanceCalc.fundToMonthly(fund);
      return { fund, monthly };
    } else if (calculatorMode === 'fund') {
      const years = FinanceCalc.yearsToTarget(currentSavings, monthlySavings, targetFund, realRate);
      const validYears = !isFinite(years) || years < 0 ? Infinity : years;
      return { years: validYears, retireAge: age + validYears };
    } else {
      const requiredFund = FinanceCalc.monthlyToFund(monthlyRetirement);
      const years = FinanceCalc.yearsToTarget(currentSavings, monthlySavings, requiredFund, realRate);
      const validYears = !isFinite(years) || years < 0 ? Infinity : years;
      const requiredSavings = yearsToRetire > 0
        ? FinanceCalc.requiredMonthlySavings(currentSavings, requiredFund, yearsToRetire, realRate)
        : 0;
      return { requiredFund, years: validYears, retireAge: age + validYears, requiredSavings };
    }
  }, [calculatorMode, currentSavings, monthlySavings, yearsToRetire, realRate, age, targetFund, monthlyRetirement]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 pb-8">
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onClose} className="text-gray-400 hover:text-white mr-4 p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">設定</h1>
          </div>
          <button onClick={handleSave}
            className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold py-2 px-4 rounded-xl text-sm">
            儲存
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* User Settings */}
        <div className="bg-gray-800/50 rounded-3xl p-6 mb-6">
          <h2 className="text-white font-bold mb-6">個人資料</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">年齡</span>
                <span className="text-white font-bold">{age} 歲</span>
              </div>
              <input type="range" min="18" max="60" value={age}
                onChange={(e) => setAge(parseInt(e.target.value))} className="slider w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">月薪</span>
                <span className="text-white font-bold">{formatCurrencyFull(salary)}</span>
              </div>
              <input type="range" min="25000" max="500000" step="5000" value={salary}
                onChange={(e) => setSalary(parseInt(e.target.value))} className="slider w-full" />
              <div className="text-gray-500 text-sm mt-1">時薪約 ${hourlyRate}</div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">🎯 目標退休年齡</span>
                <span className="text-white font-bold">{retireAge} 歲</span>
              </div>
              <input type="range" min={age + 5} max="75" value={retireAge}
                onChange={(e) => setRetireAge(parseInt(e.target.value))} className="slider w-full" />
              <div className="text-emerald-400 text-sm mt-1">還有 {yearsToRetire} 年</div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">目前存款</span>
                <span className="text-white font-bold">{formatCurrencyFull(currentSavings)}</span>
              </div>
              <input type="range" min="0" max="20000000" step="100000" value={currentSavings}
                onChange={(e) => setCurrentSavings(parseInt(e.target.value))} className="slider w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">每月儲蓄</span>
                <span className="text-white font-bold">{formatCurrencyFull(monthlySavings)}</span>
              </div>
              <input type="range" min="0" max={Math.min(salary, 200000)} step="1000" value={monthlySavings}
                onChange={(e) => setMonthlySavings(parseInt(e.target.value))} className="slider w-full" />
              <div className="text-gray-500 text-sm mt-1">佔月薪 {Math.round(monthlySavings / salary * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Retirement Calculator */}
        <div className="bg-gray-800/50 rounded-3xl p-6 mb-6">
          <h2 className="text-white font-bold mb-2">🧮 退休計算機</h2>
          <p className="text-gray-500 text-xs mb-4">換個角度看你的退休計畫</p>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
            {([
              { id: 'age' as const, label: '年齡導向' },
              { id: 'fund' as const, label: '金額導向' },
              { id: 'lifestyle' as const, label: '生活品質' },
            ]).map(m => (
              <button key={m.id} onClick={() => setCalculatorMode(m.id)}
                className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  calculatorMode === m.id ? 'bg-emerald-500 text-gray-900 font-semibold' : 'bg-gray-700 text-gray-400'
                }`}>{m.label}</button>
            ))}
          </div>

          {/* Calculator Content */}
          {calculatorMode === 'age' && (
            <div className="space-y-4">
              <div className="text-gray-400 text-sm">
                按目前設定，{retireAge} 歲退休時...
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="text-emerald-400 text-sm mb-1">可累積退休金</div>
                <div className="text-emerald-400 text-2xl font-bold">{formatCurrency(Math.round(calcResults.fund))}</div>
                <div className="text-emerald-400/70 text-xs mt-2">
                  退休後每月可領約 {formatCurrency(Math.round(calcResults.monthly))}（4%法則）
                </div>
              </div>
            </div>
          )}

          {calculatorMode === 'fund' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">目標退休金</span>
                  <span className="text-white font-bold">{formatCurrency(targetFund)}</span>
                </div>
                <input type="range" min="5000000" max="100000000" step="1000000" value={targetFund}
                  onChange={(e) => setTargetFund(parseInt(e.target.value))} className="slider w-full" />
              </div>
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="text-blue-400 text-sm mb-1">預計達成年齡</div>
                {isFinite(calcResults.years) ? (
                  <>
                    <div className="text-blue-400 text-2xl font-bold">{calcResults.retireAge.toFixed(1)} 歲</div>
                    <div className="text-blue-400/70 text-xs mt-2">
                      還需要 {calcResults.years.toFixed(1)} 年
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-orange-400 text-xl font-bold">無法達成</div>
                    <div className="text-orange-400/70 text-xs mt-2">
                      目前儲蓄進度不足，請增加每月儲蓄額
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {calculatorMode === 'lifestyle' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">退休後每月想領</span>
                  <span className="text-white font-bold">{formatCurrencyFull(monthlyRetirement)}</span>
                </div>
                <input type="range" min="20000" max="200000" step="5000" value={monthlyRetirement}
                  onChange={(e) => setMonthlyRetirement(parseInt(e.target.value))} className="slider w-full" />
              </div>
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                <div className="text-purple-400 text-sm mb-1">需要累積</div>
                <div className="text-purple-400 text-2xl font-bold">{formatCurrency(calcResults.requiredFund)}</div>
                <div className="text-purple-400/70 text-xs mt-2">
                  {isFinite(calcResults.years) ? (
                    <>按目前進度需 {calcResults.years.toFixed(1)} 年（{calcResults.retireAge.toFixed(0)}歲）</>
                  ) : (
                    <span className="text-orange-400">目前儲蓄進度不足，無法達成目標</span>
                  )}
                </div>
                {yearsToRetire > 0 && isFinite(calcResults.requiredSavings) && (
                  <div className="text-purple-400/70 text-xs mt-1">
                    若要 {retireAge} 歲達成，每月需存 {formatCurrency(Math.round(Math.max(0, calcResults.requiredSavings)))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Financial Parameters */}
        <div className="bg-gray-800/50 rounded-3xl p-6 mb-6">
          <h2 className="text-white font-bold mb-2">計算參數</h2>
          <p className="text-gray-500 text-xs mb-6">可依個人預期調整</p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">通膨率</span>
                <span className="text-white font-bold">{inflationRate}%</span>
              </div>
              <input type="range" min="0" max="10" step="0.5" value={inflationRate}
                onChange={(e) => setInflationRate(parseFloat(e.target.value))} className="slider w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">投資報酬率</span>
                <span className="text-white font-bold">{roiRate}%</span>
              </div>
              <input type="range" min="0" max="15" step="0.5" value={roiRate}
                onChange={(e) => setRoiRate(parseFloat(e.target.value))} className="slider w-full" />
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
              <div className="flex justify-between">
                <span className="text-emerald-400">實質報酬率</span>
                <span className="text-emerald-400 font-bold">≈ {(realRate * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Entry */}
        <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-3xl p-6 mb-6 border border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🛒</div>
              <div>
                <h2 className="text-white font-bold">時間沙商店</h2>
                <div className="text-gray-400 text-sm">用積分兌換道具</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-amber-400 text-sm">⏳ {PointsSystem.getBalance()}</div>
                {InventorySystem.getItemCount('guilt_free_pass') > 0 && (
                  <div className="text-emerald-400 text-xs">🎫 ×{InventorySystem.getItemCount('guilt_free_pass')}</div>
                )}
              </div>
              <button
                onClick={() => setShowShopModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-2 px-4 rounded-xl text-sm"
              >
                進入
              </button>
            </div>
          </div>
        </div>

        {/* Challenge Management Entry */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 rounded-3xl p-6 mb-6 border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎯</div>
              <div>
                <h2 className="text-white font-bold">管理每日挑戰</h2>
                <div className="text-gray-400 text-sm">新增或編輯自定義挑戰</div>
              </div>
            </div>
            <button
              onClick={() => setShowChallengeModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold py-2 px-4 rounded-xl text-sm"
            >
              管理
            </button>
          </div>
        </div>

        {/* v2.1: Subscription Manager Entry */}
        <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 rounded-3xl p-6 mb-6 border border-pink-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📱</div>
              <div>
                <h2 className="text-white font-bold">訂閱管理</h2>
                <div className="text-gray-400 text-sm">管理每月固定支出</div>
              </div>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="bg-pink-500 hover:bg-pink-400 text-gray-900 font-bold py-2 px-4 rounded-xl text-sm"
            >
              管理
            </button>
          </div>
        </div>

        {/* v2.1: Category Settings Entry */}
        <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-3xl p-6 mb-6 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏷️</div>
              <div>
                <h2 className="text-white font-bold">分類管理</h2>
                <div className="text-gray-400 text-sm">自訂消費分類</div>
              </div>
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold py-2 px-4 rounded-xl text-sm"
            >
              管理
            </button>
          </div>
        </div>

        {/* Cloud Status */}
        <div className="bg-gray-800/50 rounded-3xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">資料同步</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${GAS_WEB_APP_URL ? 'bg-emerald-400' : 'bg-gray-500'}`} />
            <span className="text-gray-300">
              {GAS_WEB_APP_URL ? 'Google Sheets 已連接' : 'Google Sheets 未設定'}
            </span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 rounded-3xl p-6 border border-red-900/30">
          <h2 className="text-red-400 font-bold mb-4">危險區域</h2>
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)} className="text-red-400 text-sm hover:text-red-300">
              清除所有資料
            </button>
          ) : (
            <div>
              <p className="text-gray-400 text-sm mb-2">
                ⚠️ 這將刪除所有記錄和設定，且<span className="text-red-400 font-bold">無法復原</span>！
              </p>
              <p className="text-gray-500 text-xs mb-3">
                請輸入 <span className="text-red-400 font-mono">DELETE</span> 以確認
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="輸入 DELETE"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded-xl text-sm mb-3 border border-gray-700 focus:border-red-500 focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleClear}
                  disabled={isClearing || confirmText !== 'DELETE'}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {isClearing ? '清除中...' : '確定清除'}
                </button>
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                  className="bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm">
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-gray-600 text-sm mt-8">TimeBar v2.5</div>
      </div>

      {/* Phase 2: Modal 渲染 */}
      <Modal
        open={showShopModal}
        onClose={() => setShowShopModal(false)}
        title="時間沙商店"
        size="lg"
      >
        <ShopPage onClose={() => setShowShopModal(false)} />
      </Modal>

      <Modal
        open={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        title="管理每日挑戰"
        size="xl"
      >
        <ChallengeSettingsPage onClose={() => setShowChallengeModal(false)} />
      </Modal>

      {onUpdateRecords && (
        <Modal
          open={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          title="訂閱管理"
          size="xl"
        >
          <SubscriptionManagerPage
            records={records}
            onUpdateRecords={onUpdateRecords}
            onClose={() => setShowSubscriptionModal(false)}
          />
        </Modal>
      )}

      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="分類管理"
        size="lg"
      >
        <CategorySettingsPage onClose={() => setShowCategoryModal(false)} />
      </Modal>
    </div>
  );
}
