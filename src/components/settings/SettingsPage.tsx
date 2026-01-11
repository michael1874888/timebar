import { useState, useEffect, useMemo } from 'react';
import { FinanceCalc, Formatters, CONSTANTS } from '@/utils/financeCalc';
import { GAS_WEB_APP_URL } from '@/constants';
import { UserData, Record as RecordType } from '@/types';
import { PointsSystem } from '@/utils/pointsSystem';
import { InventorySystem } from '@/utils/inventorySystem';
import { Modal } from '@/components/common/Modal';
import { Collapsible } from '@/components/common/Collapsible';
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
  // Phase 3: 簡化計算機，移除多模式選擇，只保留年齡導向

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

  // Phase 3: 簡化計算機結果 - 只保留年齡導向模式
  const calcResults = useMemo(() => {
    const fund = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, Math.max(1, yearsToRetire), realRate);
    const monthly = FinanceCalc.fundToMonthly(fund);
    return { fund, monthly };
  }, [currentSavings, monthlySavings, yearsToRetire, realRate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 pb-8">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 mr-4 p-1 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-slate-900">設定</h1>
          </div>
          <button onClick={handleSave}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-sm shadow-md">
            儲存
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* User Settings */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-slate-200 shadow-sm">
          <h2 className="text-slate-900 font-bold mb-6">個人資料</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">年齡</span>
                <span className="text-slate-900 font-bold">{age} 歲</span>
              </div>
              <input type="range" min="18" max="60" value={age}
                onChange={(e) => setAge(parseInt(e.target.value))} className="slider w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">月薪</span>
                <span className="text-slate-900 font-bold">{formatCurrencyFull(salary)}</span>
              </div>
              <input type="range" min="25000" max="500000" step="5000" value={salary}
                onChange={(e) => setSalary(parseInt(e.target.value))} className="slider w-full" />
              <div className="text-slate-400 text-sm mt-1">時薪約 ${hourlyRate}</div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">🎯 目標退休年齡</span>
                <span className="text-slate-900 font-bold">{retireAge} 歲</span>
              </div>
              <input type="range" min={age + 5} max="75" value={retireAge}
                onChange={(e) => setRetireAge(parseInt(e.target.value))} className="slider w-full" />
              <div className="text-emerald-600 text-sm mt-1">還有 {yearsToRetire} 年</div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">目前存款</span>
                <span className="text-slate-900 font-bold">{formatCurrencyFull(currentSavings)}</span>
              </div>
              <input type="range" min="0" max="20000000" step="100000" value={currentSavings}
                onChange={(e) => setCurrentSavings(parseInt(e.target.value))} className="slider w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">每月儲蓄</span>
                <span className="text-slate-900 font-bold">{formatCurrencyFull(monthlySavings)}</span>
              </div>
              <input type="range" min="0" max={Math.min(salary, 200000)} step="1000" value={monthlySavings}
                onChange={(e) => setMonthlySavings(parseInt(e.target.value))} className="slider w-full" />
              <div className="text-slate-400 text-sm mt-1">佔月薪 {Math.round(monthlySavings / salary * 100)}%</div>
            </div>
          </div>
        </div>

        {/* Phase 3: 簡化退休計算機 - 只保留年齡導向模式 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-slate-200 shadow-sm">
          <h2 className="text-slate-900 font-bold mb-2">🧮 退休計算機</h2>
          <p className="text-slate-400 text-xs mb-4">按目前設定，{retireAge} 歲退休時...</p>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="text-emerald-700 text-sm mb-1">可累積退休金</div>
            <div className="text-emerald-700 text-2xl font-bold">{formatCurrency(Math.round(calcResults.fund))}</div>
            <div className="text-emerald-600/70 text-xs mt-2">
              退休後每月可領約 {formatCurrency(Math.round(calcResults.monthly))}（4%法則）
            </div>
          </div>
        </div>

        {/* Financial Parameters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-slate-200 shadow-sm">
          <h2 className="text-slate-900 font-bold mb-2">計算參數</h2>
          <p className="text-slate-400 text-xs mb-6">可依個人預期調整</p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">通膘率</span>
                <span className="text-slate-900 font-bold">{inflationRate}%</span>
              </div>
              <input type="range" min="0" max="10" step="0.5" value={inflationRate}
                onChange={(e) => setInflationRate(parseFloat(e.target.value))} className="slider w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">投資報酬率</span>
                <span className="text-slate-900 font-bold">{roiRate}%</span>
              </div>
              <input type="range" min="0" max="15" step="0.5" value={roiRate}
                onChange={(e) => setRoiRate(parseFloat(e.target.value))} className="slider w-full" />
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex justify-between">
                <span className="text-emerald-700">實質報酬率</span>
                <span className="text-emerald-700 font-bold">≈ {(realRate * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 3: 進階設定 - Collapsible（預設收合） */}
        <Collapsible
          title="進階設定"
          icon="⚙️"
          defaultOpen={false}
          storageKey="timebar_settings_advanced_open"
        >
          <div className="space-y-4">
            {/* 訂閱管理 */}
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200 hover:border-pink-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📱</div>
                  <div className="text-left">
                    <div className="text-slate-900 font-bold">訂閱管理</div>
                    <div className="text-slate-500 text-sm">管理每月固定支出</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 分類管理 */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="w-full bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200 hover:border-cyan-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🏷️</div>
                  <div className="text-left">
                    <div className="text-slate-900 font-bold">分類管理</div>
                    <div className="text-slate-500 text-sm">自訂消費分類</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </Collapsible>

        {/* Phase 3: 遊戲化設定 - Collapsible（預設收合） */}
        <Collapsible
          title="遊戲化設定"
          icon="🎮"
          defaultOpen={false}
          storageKey="timebar_settings_gamification_open"
        >
          <div className="space-y-4">
            {/* 積分與道具顯示 */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">積分餘額</span>
                <span className="text-amber-600 font-bold">⏳ {PointsSystem.getBalance()}</span>
              </div>
              {InventorySystem.getItemCount('guilt_free_pass') > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500 text-sm">道具</span>
                  <span className="text-emerald-600 font-bold">🎫 ×{InventorySystem.getItemCount('guilt_free_pass')}</span>
                </div>
              )}
            </div>

            {/* 每日挑戰設定 */}
            <button
              onClick={() => setShowChallengeModal(true)}
              className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200 hover:border-emerald-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🎯</div>
                  <div className="text-left">
                    <div className="text-slate-900 font-bold">每日挑戰設定</div>
                    <div className="text-slate-500 text-sm">新增或編輯自定義挑戰</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 時間沙商店 */}
            <button
              onClick={() => setShowShopModal(true)}
              className="w-full bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🛒</div>
                  <div className="text-left">
                    <div className="text-slate-900 font-bold">時間沙商店</div>
                    <div className="text-slate-500 text-sm">用積分兑換道具</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </Collapsible>

        {/* Cloud Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-slate-200 shadow-sm">
          <h2 className="text-slate-900 font-bold mb-4">資料同步</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${GAS_WEB_APP_URL ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span className="text-slate-600">
              {GAS_WEB_APP_URL ? 'Google Sheets 已連接' : 'Google Sheets 未設定'}
            </span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-3xl p-6 border border-red-200">
          <h2 className="text-red-600 font-bold mb-4">危險區域</h2>
          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)} className="text-red-500 text-sm hover:text-red-700 transition-colors">
              清除所有資料
            </button>
          ) : (
            <div>
              <p className="text-slate-600 text-sm mb-2">
                ⚠️ 這將刪除所有記錄和設定，且<span className="text-red-600 font-bold">無法復原</span>！
              </p>
              <p className="text-slate-500 text-xs mb-3">
                請輸入 <span className="text-red-600 font-mono">DELETE</span> 以確認
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="輸入 DELETE"
                className="w-full bg-white text-slate-900 px-3 py-2 rounded-xl text-sm mb-3 border border-slate-200 focus:border-red-500 focus:outline-none"
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
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-300 transition-colors">
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-slate-400 text-sm mt-8">TimeBar v2.5</div>
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
