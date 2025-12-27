import { useState, useCallback, useMemo } from 'react';
import { FinanceCalc, GPSCalc, Formatters } from '@/utils/financeCalc';
import { getEquivalent, getMotivationalQuote } from '@/utils/helpers';
import { Confetti } from '../Confetti';

const { formatTime, formatCurrency, formatCurrencyFull, formatAgeDiff } = Formatters;

export function MainTracker({ userData, records, onAddRecord, onOpenHistory, onOpenSettings }) {
  const [mode, setMode] = useState('spend');
  const [amount, setAmount] = useState(500);
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultType, setResultType] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { age, salary, retireAge, currentSavings, monthlySavings,
          inflationRate, roiRate } = userData;

  const yearsToRetire = retireAge - age;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const monthlyRate = realRate / 12;
  const monthsToRetire = yearsToRetire * 12;

  // 使用 GPSCalc 計算累積影響和預估退休年齡
  const { totalSaved, totalSpent } = useMemo(() => GPSCalc.calculateTotals(records), [records]);

  const gpsResult = useMemo(() => {
    return GPSCalc.calculateEstimatedAge(retireAge, records);
  }, [retireAge, records]);

  const { estimatedAge, ageDiff, ageDiffDays, isAhead, isBehind, isOnTrack } = gpsResult;
  const diffDisplay = formatAgeDiff(ageDiff);

  // 計算目標退休金
  const targetFund = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, yearsToRetire, realRate);

  // 計算當前花費/儲蓄的時間成本
  const calculateTimeCost = useCallback(() => {
    return FinanceCalc.calculateTimeCost(amount, isRecurring, hourlyRate, realRate, yearsToRetire);
  }, [amount, isRecurring, hourlyRate, realRate, yearsToRetire]);

  const timeCost = calculateTimeCost();
  const timeFormatted = formatTime(timeCost);

  const handleSubmit = async () => {
    if (amount <= 0) return;
    setIsSaving(true);

    const record = {
      id: Date.now().toString(),
      type: mode,
      amount,
      isRecurring,
      timeCost,
      category: category || (mode === 'spend' ? '一般消費' : '儲蓄'),
      note,
      timestamp: new Date().toISOString(),
    };

    await onAddRecord(record);
    setResultType(mode);
    setShowResult(true);

    if (mode === 'save') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }

    setIsSaving(false);
    setTimeout(() => {
      setShowResult(false);
      setResultType(null);
      setAmount(500);
      setCategory('');
      setNote('');
    }, 2500);
  };

  const spendCategories = ['飲食', '購物', '娛樂', '交通', '訂閱', '其他'];
  const saveCategories = ['薪資儲蓄', '獎金', '投資收益', '副業收入', '其他'];

  return (
    <div className={`min-h-screen transition-colors duration-700 ${
      resultType === 'spend' ? 'bg-gradient-to-b from-red-950 via-red-900/30 to-gray-900' :
      resultType === 'save' ? 'bg-gradient-to-b from-emerald-950 via-emerald-900/30 to-gray-900' :
      'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800'
    }`}>
      <Confetti active={showConfetti} />

      {/* GPS Header */}
      <div className="pt-4 pb-2 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-start mb-2">
            <button onClick={onOpenHistory} className="text-left">
              <div className="text-xs text-gray-500">🎯 目標</div>
              <div className="text-white font-bold text-xl">{retireAge} 歲</div>
            </button>
            <div className="text-center">
              <div className="text-xl font-black text-white">
                Time<span className="text-emerald-400">Bar</span>
              </div>
            </div>
            <button onClick={onOpenSettings} className="text-right">
              <div className="text-xs text-gray-500">📍 預估</div>
              <div className={`font-bold text-xl ${isOnTrack ? 'text-white' : isAhead ? 'text-emerald-400' : 'text-orange-400'}`}>
                {estimatedAge.toFixed(1)} 歲
              </div>
            </button>
          </div>

          {/* GPS Status Bar */}
          <div className={`rounded-xl px-4 py-2 text-center text-sm ${
            isOnTrack ? 'bg-gray-700 text-gray-300' :
            isAhead ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {isOnTrack
              ? `✅ 完美！目前剛好符合計畫`
              : isAhead
                ? `🚀 領先 ${diffDisplay.value} ${diffDisplay.unit}！繼續保持！`
                : `⏰ 落後 ${diffDisplay.value} ${diffDisplay.unit}，加油追上！`
            }
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto bg-gray-800/40 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-emerald-400 font-bold text-lg">{formatCurrency(totalSaved)}</div>
              <div className="text-gray-500 text-xs">額外儲蓄</div>
            </div>
            <div>
              <div className={`font-bold text-lg ${
                isOnTrack ? 'text-white' : isAhead ? 'text-emerald-400' : 'text-orange-400'
              }`}>
                {isOnTrack ? '±0' : isAhead ? '+' : ''}{ageDiffDays} 天
              </div>
              <div className="text-gray-500 text-xs">退休時間影響</div>
            </div>
            <div>
              <div className="text-orange-400 font-bold text-lg">{formatCurrency(totalSpent)}</div>
              <div className="text-gray-500 text-xs">額外支出</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24">
        <div className="max-w-lg mx-auto">

          {/* Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800 rounded-2xl p-1.5 flex">
              <button onClick={() => { setMode('spend'); setShowResult(false); }}
                className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === 'spend' ? 'bg-orange-500 text-gray-900 shadow-lg shadow-orange-500/25' : 'text-gray-400 hover:text-white'
                }`}>💸 花費</button>
              <button onClick={() => { setMode('save'); setShowResult(false); }}
                className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  mode === 'save' ? 'bg-emerald-500 text-gray-900 shadow-lg shadow-emerald-500/25' : 'text-gray-400 hover:text-white'
                }`}>💰 儲蓄</button>
            </div>
          </div>

          {!showResult ? (
            <>
              {/* Recurring Toggle */}
              <div className="flex justify-center mb-6">
                <button onClick={() => setIsRecurring(!isRecurring)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                    isRecurring ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' : 'bg-gray-800 text-gray-400'
                  }`}>{isRecurring ? '🔄 每月固定' : '☝️ 僅此一次'}</button>
              </div>

              {/* Amount Input */}
              <div className="text-center mb-4">
                <div className="text-gray-400 text-sm mb-2">{mode === 'spend' ? '這次要花' : '這次要存'}</div>
                <div className="text-6xl font-black text-white tabular-nums mb-2">{formatCurrencyFull(amount)}</div>
                {isRecurring && <div className="text-purple-400 text-sm">/每月</div>}
              </div>

              {/* Slider */}
              <div className="mb-4 px-2">
                <input type="range" min="0" max="100000"
                  step={amount < 1000 ? 100 : amount < 10000 ? 500 : 1000}
                  value={amount} onChange={(e) => setAmount(parseInt(e.target.value))}
                  className={`slider w-full ${mode === 'spend' ? 'orange' : ''}`} />
                <div className="flex justify-between text-gray-600 text-xs mt-1">
                  <span>$0</span><span>$10萬</span>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2 justify-center flex-wrap mb-6">
                {[100, 500, 1000, 3000, 5000, 10000].map((qa) => (
                  <button key={qa} onClick={() => setAmount(qa)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      amount === qa
                        ? mode === 'spend' ? 'bg-orange-500 text-gray-900' : 'bg-emerald-500 text-gray-900'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}>{formatCurrency(qa)}</button>
                ))}
              </div>

              {/* Category Selection */}
              <div className="mb-4">
                <div className="text-gray-400 text-sm mb-2 text-center">分類（選填）</div>
                <div className="flex gap-2 justify-center flex-wrap">
                  {(mode === 'spend' ? spendCategories : saveCategories).map((cat) => (
                    <button key={cat} onClick={() => setCategory(category === cat ? '' : cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        category === cat ? 'bg-gray-600 text-white' : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
                      }`}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Note Input */}
              <div className="mb-6">
                <input type="text" placeholder="備註（選填）" value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600" />
              </div>

              {/* Impact Preview */}
              {amount > 0 && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-gray-700/50 animate-fade-in">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm mb-2">
                      {mode === 'spend' ? '這會讓你的退休延後' : '這會讓你的退休提早'}
                    </div>
                    <div className="flex items-baseline justify-center gap-2 mb-2">
                      <span className={`text-5xl font-black ${mode === 'spend' ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {timeFormatted.value}
                      </span>
                      <span className="text-2xl text-gray-400">{timeFormatted.unit}</span>
                    </div>
                    <div className="text-gray-500 text-sm mt-2">
                      💡 相當於「{getEquivalent(timeCost, mode === 'spend')}」
                    </div>

                    {isRecurring && (
                      <div className={`mt-4 ${mode === 'spend' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} rounded-xl p-3 border`}>
                        <div className={`text-sm ${mode === 'spend' ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {mode === 'spend' ? '⚠️ 每月訂閱的威力驚人' : '✨ 定期儲蓄的複利威力'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button onClick={handleSubmit} disabled={amount <= 0 || isSaving}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 active:scale-95 disabled:opacity-50 ${
                  mode === 'spend' ? 'bg-orange-500 hover:bg-orange-400 text-gray-900' : 'bg-emerald-500 hover:bg-emerald-400 text-gray-900'
                }`}>{isSaving ? '記錄中...' : mode === 'spend' ? '記錄花費' : '記錄儲蓄'}</button>
            </>
          ) : (
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl p-8 text-center animate-slide-up">
              {resultType === 'spend' ? (
                <>
                  <div className="text-5xl mb-4">😅</div>
                  <div className="text-2xl text-orange-400 font-bold mb-2">已記錄</div>
                  <div className="text-gray-300 mb-4">
                    這筆花費讓退休延後了<br />
                    <span className="text-orange-400 font-bold text-xl">{timeFormatted.value} {timeFormatted.unit}</span>
                  </div>
                  <div className="text-gray-500 text-sm">沒關係，知道代價就好，繼續加油！</div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🎉</div>
                  <div className="text-2xl text-emerald-400 font-bold mb-2">太棒了！</div>
                  <div className="text-gray-300 mb-4">
                    你剛剛為自己贏回了<br />
                    <span className="text-emerald-400 font-bold text-xl">{timeFormatted.value} {timeFormatted.unit}</span>
                    的自由！
                  </div>
                  <div className="text-gray-500 text-sm italic">{getMotivationalQuote()}</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800">
        <div className="max-w-lg mx-auto flex justify-around py-3">
          <button className="flex flex-col items-center text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 font-medium">記錄</span>
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
