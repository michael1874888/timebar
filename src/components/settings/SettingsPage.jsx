import { useState, useMemo } from 'react';
import { FinanceCalc, Formatters, CONSTANTS } from '@/utils/financeCalc';
import { GAS_WEB_APP_URL } from '@/constants';

const { formatCurrency, formatCurrencyFull } = Formatters;
const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;

export function SettingsPage({ userData, onUpdateUser, onClose, onReset }) {
  const [age, setAge] = useState(userData.age);
  const [salary, setSalary] = useState(userData.salary);
  const [retireAge, setRetireAge] = useState(userData.retireAge);
  const [currentSavings, setCurrentSavings] = useState(userData.currentSavings || 0);
  const [monthlySavings, setMonthlySavings] = useState(userData.monthlySavings || Math.round(userData.salary * 0.2));
  const [inflationRate, setInflationRate] = useState(userData.inflationRate || DEFAULT_INFLATION_RATE);
  const [roiRate, setRoiRate] = useState(userData.roiRate || DEFAULT_ROI_RATE);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState('age'); // age, fund, lifestyle
  const [targetFund, setTargetFund] = useState(30000000);
  const [monthlyRetirement, setMonthlyRetirement] = useState(50000);

  const handleSave = () => {
    onUpdateUser({ age, salary, retireAge, currentSavings, monthlySavings, inflationRate, roiRate,
      targetRetirementFund: Math.round(FinanceCalc.targetFundByAge(currentSavings, monthlySavings, retireAge - age, realRate))
    });
    onClose();
  };

  const handleClear = async () => {
    setIsClearing(true);
    await onReset();
    setIsClearing(false);
  };

  const hourlyRate = Math.round(FinanceCalc.hourlyRate(salary));
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // Calculator results
  const calcResults = useMemo(() => {
    if (calculatorMode === 'age') {
      const fund = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, yearsToRetire, realRate);
      const monthly = FinanceCalc.fundToMonthly(fund);
      return { fund, monthly };
    } else if (calculatorMode === 'fund') {
      const years = FinanceCalc.yearsToTarget(currentSavings, monthlySavings, targetFund, realRate);
      return { years, retireAge: age + years };
    } else {
      const requiredFund = FinanceCalc.monthlyToFund(monthlyRetirement);
      const years = FinanceCalc.yearsToTarget(currentSavings, monthlySavings, requiredFund, realRate);
      const requiredSavings = FinanceCalc.requiredMonthlySavings(currentSavings, requiredFund, yearsToRetire, realRate);
      return { requiredFund, years, retireAge: age + years, requiredSavings };
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
            {[
              { id: 'age', label: '年齡導向' },
              { id: 'fund', label: '金額導向' },
              { id: 'lifestyle', label: '生活品質' },
            ].map(m => (
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
                <div className="text-blue-400 text-2xl font-bold">{calcResults.retireAge.toFixed(1)} 歲</div>
                <div className="text-blue-400/70 text-xs mt-2">
                  還需要 {calcResults.years.toFixed(1)} 年
                </div>
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
                  按目前進度需 {calcResults.years.toFixed(1)} 年（{calcResults.retireAge.toFixed(0)}歲）
                </div>
                {yearsToRetire > 0 && (
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
              <p className="text-gray-400 text-sm mb-3">確定要清除所有資料嗎？</p>
              <div className="flex gap-3">
                <button onClick={handleClear} disabled={isClearing}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                  {isClearing ? '清除中...' : '確定清除'}
                </button>
                <button onClick={() => setShowConfirm(false)}
                  className="bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm">取消</button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-gray-600 text-sm mt-8">TimeBar v2.5</div>
      </div>
    </div>
  );
}
