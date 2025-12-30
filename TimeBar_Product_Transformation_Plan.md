# TimeBar 產品重構計劃 v2.0
## 從「計算機」到「自由販賣機」

> **核心轉變**：不再是「退休計算器」，而是「生命成本轉換器」  
> **使用場景轉變**：從「月底記帳」→「消費決策當下」  
> **情緒轉變**：從「焦慮產生器」→「自由解鎖遊戲」

---

## 📊 產品診斷報告

### 當前狀態分析
**症狀**：用戶計算一次後就不再回來

**根本原因**：
1. ❌ **回饋太遙遠**：「65 歲退休」距離現在 20-30 年，太抽象
2. ❌ **無即時獎勵**：省 $150 只看到「提前 0.001 歲」→ 無感
3. ❌ **負面情緒**：一直提醒「你還不夠努力」→ 焦慮 → 刪除
4. ❌ **使用頻率低**：月底才記帳 → 容易遺忘

### 競品分析
- **Excel**：更強大、更靈活
- **其他 FIRE 計算器**：功能類似，無差異化

### TimeBar 的唯一優勢
✅ **把金錢換算成時間/生命**  
→ 這是最強的心理武器，必須放大 10 倍！

---

## 🎯 產品重新定位

### 舊定位（要淘汰）
```
TimeBar = 退休年齡計算器
使用時機：月底想知道進度時
情緒：焦慮、壓力
頻率：每月 1 次
```

### 新定位（目標）
```
TimeBar = 生命成本即時轉換器
使用時機：消費前想知道「這值多少生命」
情緒：掌控感、成就感
頻率：每天 3-5 次
```

### 核心價值主張
**「在你掏錢之前，告訴你這個東西值多少生命」**

---

## 🔥 Phase 0: 核心產品轉型（必須完成）

> 這是整個重構的基石。沒有 Phase 0，後面的都沒意義。

---

### 0.1 生命成本即時計算器（主畫面徹底改造）⭐⭐⭐⭐⭐

**目標**：從「記帳工具」變成「消費決策工具」

#### 使用場景
```
舊：晚上回家想起來才記帳 → 懶得記 → 放棄
新：看到想買的東西 → 當下打開 App → 看到生命成本 → 做決定
```

#### 技術實作

**檔案位置**：`src/components/calculator/LifeCostCalculator.tsx`

```typescript
import { useState, useMemo } from 'react';
import { NumericFormat } from 'react-number-format';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { formatCurrency } = Formatters;

interface LifeCostCalculatorProps {
  userData: UserData;
  onDecision: (action: 'buy' | 'save', amount: number) => void;
}

export function LifeCostCalculator({ userData, onDecision }: LifeCostCalculatorProps) {
  const [amount, setAmount] = useState<number>(0);
  const [itemName, setItemName] = useState<string>('');

  // 計算參數
  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 核心計算 1：這筆錢 = 多少工作時間
  const workTime = useMemo(() => {
    const hoursLost = amount / hourlyRate;
    const days = Math.floor(hoursLost / 8);
    const hours = Math.floor(hoursLost % 8);
    const minutes = Math.round((hoursLost % 1) * 60);
    
    return { days, hours, minutes, totalHours: hoursLost };
  }, [amount, hourlyRate]);

  // 核心計算 2：這筆錢會推遲多少退休日期
  const retirementImpact = useMemo(() => {
    const timeCost = FinanceCalc.calculateTimeCost(
      amount,
      false,
      hourlyRate,
      realRate,
      yearsToRetire
    );
    const daysLost = timeCost / 24;
    return {
      days: Math.floor(daysLost),
      hours: Math.round((daysLost % 1) * 24)
    };
  }, [amount, hourlyRate, realRate, yearsToRetire]);

  // 生動的比喻
  const lifeEquivalent = useMemo(() => {
    const hours = workTime.totalHours;
    
    if (hours < 0.5) return '看一集 YouTube 影片的時間';
    if (hours < 1) return '喝一杯咖啡的時間';
    if (hours < 2) return '一場電影的時間';
    if (hours < 4) return '半天的上班時間';
    if (hours < 8) return '一個上午的會議時間';
    if (hours < 24) return '整整一個工作天';
    if (hours < 40) return `${workTime.days} 個工作天`;
    
    const weeks = Math.floor(hours / 40);
    const months = Math.floor(weeks / 4);
    
    if (months > 0) {
      return `${months} 個月的薪水（${weeks} 週的辛苦工作）`;
    }
    return `${weeks} 週的辛苦工作`;
  }, [workTime]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* 頭部標題 */}
      <div className="text-center pt-8 pb-6 px-4">
        <h1 className="text-4xl font-black text-white mb-3">
          這個東西值多少
          <span className="text-orange-400">生命</span>
          ？
        </h1>
        <p className="text-gray-400 text-sm">
          在掏錢之前，先問問自己
        </p>
      </div>

      {/* 金額輸入區 */}
      <div className="px-4 mb-6">
        <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border-2 border-orange-500/30 shadow-xl">
          {/* 物品名稱（選填） */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="想買什麼？（選填）"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full bg-gray-700/50 text-white placeholder-gray-500 px-4 py-3 rounded-xl border border-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* 金額輸入 */}
          <div className="text-center mb-4">
            <div className="text-gray-400 text-sm mb-2">
              {itemName || '這個東西'}要花
            </div>
            <NumericFormat
              value={amount || ''}
              onValueChange={(values) => setAmount(values.floatValue || 0)}
              thousandSeparator=","
              prefix="NT$ "
              placeholder="NT$ 0"
              className="text-5xl font-black text-center bg-transparent text-white w-full outline-none"
            />
          </div>

          {/* 快速金額按鈕 */}
          <div className="flex gap-2 justify-center flex-wrap">
            {[100, 150, 500, 1000, 1500, 5000, 10000, 36000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  amount === v
                    ? 'bg-orange-500 text-gray-900'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {v >= 1000 ? `${v / 1000}k` : v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 生命成本顯示（只在輸入金額後顯示） */}
      {amount > 0 && (
        <div className="px-4 pb-24 animate-slide-up">
          {/* 核心震撼：工作時間成本 */}
          <div className="bg-orange-500/10 border-2 border-orange-500 rounded-3xl p-6 mb-4 shadow-xl">
            <div className="text-center">
              <div className="text-orange-400 text-sm font-medium mb-3">
                ⚠️ 生命成本
              </div>
              <div className="text-white text-5xl font-black mb-3">
                {workTime.days > 0 && <>{workTime.days} 天</>}
                {workTime.days > 0 && (workTime.hours > 0 || workTime.minutes > 0) && <> </>}
                {workTime.hours > 0 && <>{workTime.hours} 小時</>}
                {workTime.hours > 0 && workTime.minutes > 0 && <> </>}
                {workTime.minutes > 0 && workTime.days === 0 && <>{workTime.minutes} 分</>}
              </div>
              <div className="text-gray-300 text-base">
                你需要為{itemName || '這個東西'}工作這麼久
              </div>
            </div>
          </div>

          {/* 退休影響 */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-4xl">💀</div>
              <div className="flex-1">
                <div className="text-red-400 font-bold text-lg mb-2">
                  這會推遲你的退休
                </div>
                <div className="text-white text-3xl font-black mb-1">
                  {retirementImpact.days} 天
                  {retirementImpact.hours > 0 && <> {retirementImpact.hours} 小時</>}
                </div>
                <div className="text-gray-400 text-sm">
                  原本 {retireAge} 歲退休，現在要到{' '}
                  {(retireAge + (retirementImpact.days + retirementImpact.hours / 24) / 365).toFixed(2)} 歲
                </div>
              </div>
            </div>
          </div>

          {/* 生動比喻 */}
          <div className="bg-gray-800/60 backdrop-blur rounded-2xl p-4 mb-6 border border-gray-700">
            <div className="flex items-start gap-2">
              <div className="text-2xl">💭</div>
              <div className="flex-1">
                <div className="text-gray-400 text-xs mb-1">這相當於...</div>
                <div className="text-gray-200 text-sm font-medium">
                  {lifeEquivalent}
                </div>
              </div>
            </div>
          </div>

          {/* 行動按鈕 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                onDecision('buy', amount);
                setAmount(0);
                setItemName('');
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95"
            >
              <div>還是要買</div>
              <div className="text-sm text-gray-400 mt-1">😔</div>
            </button>
            <button
              onClick={() => {
                onDecision('save', amount);
                setAmount(0);
                setItemName('');
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              <div>我不買了！</div>
              <div className="text-sm text-emerald-700 mt-1">🎉</div>
            </button>
          </div>

          {/* 提示文字 */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              每一次忍住，都是在買回自己的自由
            </p>
          </div>
        </div>
      )}

      {/* 空狀態提示 */}
      {amount === 0 && (
        <div className="px-4 text-center">
          <div className="text-gray-600 text-sm">
            <div className="text-4xl mb-3">🤔</div>
            <div>輸入想買的東西的價格</div>
            <div className="mt-2">看看它值多少生命</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 關鍵設計決策

1. **金額為 0 時不顯示計算結果**
   - 避免資訊過載
   - 讓用戶專注於輸入

2. **兩種成本同時顯示**
   - 工作時間（更直觀）
   - 退休影響（長期價值）

3. **生動比喻**
   - 把抽象時間具象化
   - 「1 個月薪水」比「176 小時」更有感

4. **決策按鈕對比強烈**
   - 左：灰色（買）→ 負面
   - 右：綠色（不買）→ 正面
   - 視覺引導正確決策

**預估工時**：12 小時  
**優先級**：P0（最高）

---

### 0.2 微型里程碑系統（解鎖自由日）⭐⭐⭐⭐⭐

**目標**：把遙遠的「65 歲退休」拆解成可見的小目標

#### 心理學原理
```
20 年太遠 → 看不到盡頭 → 放棄
解鎖週一 → 7 天就能達成 → 有動力
```

#### 技術實作

**檔案位置**：`src/components/freedom/FreedomTracker.tsx`

```typescript
import { useMemo } from 'react';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { formatCurrency } = Formatters;

interface FreedomTrackerProps {
  userData: UserData;
  totalSaved: number;
}

export function FreedomTracker({ userData, totalSaved }: FreedomTrackerProps) {
  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 計算已買回多少自由天數
  const freedomDays = useMemo(() => {
    if (totalSaved === 0) return 0;
    
    // 這筆儲蓄在退休時的複利價值
    const futureValue = totalSaved * Math.pow(1 + realRate, yearsToRetire);
    
    // 轉換成工作小時
    const freedomHours = futureValue / hourlyRate;
    
    // 轉換成天數（8 小時工作日）
    return Math.floor(freedomHours / 8);
  }, [totalSaved, hourlyRate, realRate, yearsToRetire]);

  // 里程碑定義
  const milestones = [
    {
      id: 'monday',
      days: 1,
      title: '自由星期一',
      icon: '🎉',
      description: '你已經存夠一天不用工作的錢了！',
      color: 'emerald'
    },
    {
      id: 'weekend',
      days: 7,
      title: '自由一週',
      icon: '🏖️',
      description: '可以出去玩一整週了！',
      color: 'blue'
    },
    {
      id: 'coffee',
      days: 30,
      title: '咖啡自由',
      icon: '☕',
      description: '被動收入可支付每天一杯咖啡',
      color: 'amber'
    },
    {
      id: 'month',
      days: 90,
      title: '季度假期自由',
      icon: '✈️',
      description: '每季可以出國旅遊一次',
      color: 'purple'
    },
    {
      id: 'year',
      days: 365,
      title: '年度自由',
      icon: '🎊',
      description: '整整一年不用工作！',
      color: 'pink'
    },
    {
      id: 'five-years',
      days: 1825,
      title: '五年自由',
      icon: '🚀',
      description: '可以環遊世界五年',
      color: 'red'
    }
  ];

  // 找出當前進度
  const unlockedMilestones = milestones.filter(m => m.days <= freedomDays);
  const nextMilestone = milestones.find(m => m.days > freedomDays) || milestones[milestones.length - 1];
  const progress = nextMilestone ? (freedomDays / nextMilestone.days) * 100 : 100;
  const daysToNext = nextMilestone ? nextMilestone.days - freedomDays : 0;

  // 計算還需要存多少錢才能解鎖下一個
  const amountToNext = useMemo(() => {
    if (!nextMilestone) return 0;
    
    const targetHours = daysToNext * 8;
    const targetFutureValue = targetHours * hourlyRate;
    const presentValue = targetFutureValue / Math.pow(1 + realRate, yearsToRetire);
    
    return Math.max(0, Math.round(presentValue));
  }, [nextMilestone, daysToNext, hourlyRate, realRate, yearsToRetire]);

  return (
    <div className="space-y-4">
      {/* 當前成就卡片 */}
      <div className="bg-gradient-to-br from-emerald-900/40 via-emerald-800/30 to-emerald-900/40 rounded-3xl p-6 border border-emerald-500/30">
        <div className="text-center mb-6">
          <div className="text-emerald-400 text-sm font-medium mb-2">
            🏆 你已經買回
          </div>
          <div className="text-white text-6xl font-black mb-2">
            {freedomDays}
          </div>
          <div className="text-emerald-300 text-lg">
            天自由時光
          </div>
        </div>

        {/* 已解鎖成就 */}
        {unlockedMilestones.length > 0 && (
          <div className="mb-6">
            <div className="text-emerald-400 text-xs font-medium mb-3">
              ✓ 已解鎖成就
            </div>
            <div className="space-y-2">
              {unlockedMilestones.slice(-3).reverse().map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 bg-emerald-500/10 rounded-xl p-3"
                >
                  <div className="text-2xl">{milestone.icon}</div>
                  <div className="flex-1">
                    <div className="text-emerald-300 font-bold text-sm">
                      {milestone.title}
                    </div>
                    <div className="text-emerald-400/70 text-xs">
                      {milestone.description}
                    </div>
                  </div>
                  <div className="text-emerald-400 text-xl">✓</div>
                </div>
              ))}
            </div>
            {unlockedMilestones.length > 3 && (
              <div className="text-emerald-400/50 text-xs text-center mt-2">
                還有 {unlockedMilestones.length - 3} 個成就
              </div>
            )}
          </div>
        )}

        {/* 下一個里程碑 */}
        {nextMilestone && (
          <div>
            <div className="text-gray-400 text-xs font-medium mb-3">
              🎯 下一個目標
            </div>
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="text-3xl">{nextMilestone.icon}</div>
                  <div>
                    <div className="text-white font-bold">
                      {nextMilestone.title}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {nextMilestone.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 text-sm font-bold">
                    還差 {daysToNext} 天
                  </div>
                </div>
              </div>

              {/* 進度條 */}
              <div className="relative">
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-gray-500 text-xs mt-1 text-right">
                  {Math.min(Math.round(progress), 100)}%
                </div>
              </div>

              {/* 提示 */}
              <div className="mt-3 text-center">
                <div className="text-gray-400 text-xs">
                  再存 {formatCurrency(amountToNext)} 就能解鎖
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 所有里程碑列表（收合式） */}
      <details className="bg-gray-800/40 rounded-2xl overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer text-gray-400 text-sm hover:text-gray-300">
          查看所有里程碑 →
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {milestones.map((milestone) => {
            const isUnlocked = milestone.days <= freedomDays;
            const isCurrent = milestone.id === nextMilestone?.id;

            return (
              <div
                key={milestone.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isUnlocked
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : isCurrent
                    ? 'bg-orange-500/10 border border-orange-500/30'
                    : 'bg-gray-700/30 border border-gray-600/30'
                }`}
              >
                <div className="text-2xl">{milestone.icon}</div>
                <div className="flex-1">
                  <div
                    className={`font-bold text-sm ${
                      isUnlocked
                        ? 'text-emerald-300'
                        : isCurrent
                        ? 'text-orange-300'
                        : 'text-gray-400'
                    }`}
                  >
                    {milestone.title}
                  </div>
                  <div
                    className={`text-xs ${
                      isUnlocked
                        ? 'text-emerald-400/70'
                        : isCurrent
                        ? 'text-orange-400/70'
                        : 'text-gray-500'
                    }`}
                  >
                    {milestone.days} 天
                  </div>
                </div>
                {isUnlocked && (
                  <div className="text-emerald-400 text-xl">✓</div>
                )}
                {isCurrent && (
                  <div className="text-orange-400 text-sm font-bold">
                    進行中
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
```

**預估工時**：10 小時  
**優先級**：P0

---

### 0.3 生命電池視覺化 ⭐⭐⭐⭐⭐

**目標**：把一生的時間視覺化，看到紅色縮短的療癒感

#### 技術實作

**檔案位置**：`src/components/visualization/LifeBattery.tsx`

```typescript
import { useMemo } from 'react';
import { GPSCalc } from '@/utils/financeCalc';
import { UserData, Record as RecordType } from '@/types';

interface LifeBatteryProps {
  userData: UserData;
  records: RecordType[];
}

export function LifeBattery({ userData, records }: LifeBatteryProps) {
  const { age, retireAge } = userData;
  const lifeExpectancy = 85; // 預期壽命

  // 使用 GPS 計算實際預估退休年齡
  const { estimatedAge } = useMemo(() => 
    GPSCalc.calculateEstimatedAge(retireAge, records),
    [retireAge, records]
  );

  // 計算各階段年數
  const stages = useMemo(() => {
    const workingStart = 22; // 開始工作年齡
    const livedYears = age - workingStart;
    const workYearsLeft = Math.max(0, estimatedAge - age);
    const freeYears = Math.max(0, lifeExpectancy - estimatedAge);
    const totalYears = lifeExpectancy - workingStart;

    return {
      lived: livedYears,
      work: workYearsLeft,
      free: freeYears,
      total: totalYears,
      // 百分比
      livedPercent: (livedYears / totalYears) * 100,
      workPercent: (workYearsLeft / totalYears) * 100,
      freePercent: (freeYears / totalYears) * 100
    };
  }, [age, estimatedAge, lifeExpectancy]);

  // 動態訊息
  const message = useMemo(() => {
    if (estimatedAge < retireAge) {
      const savedYears = retireAge - estimatedAge;
      return {
        text: `太棒了！你提前了 ${savedYears.toFixed(1)} 年`,
        emoji: '🎉',
        color: 'emerald'
      };
    } else if (estimatedAge > retireAge) {
      const delayedYears = estimatedAge - retireAge;
      return {
        text: `還需努力 ${delayedYears.toFixed(1)} 年`,
        emoji: '💪',
        color: 'orange'
      };
    } else {
      return {
        text: '完美！正按計畫進行',
        emoji: '✓',
        color: 'blue'
      };
    }
  }, [estimatedAge, retireAge]);

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <h3 className="text-white text-xl font-bold mb-2">
          你的生命電量
        </h3>
        <p className="text-gray-400 text-sm">
          灰 = 已過去 | 紅 = 要工作 | 綠 = 自由時光
        </p>
      </div>

      {/* 電池視覺化 */}
      <div className="relative mb-6">
        {/* 電池外框 */}
        <div className="h-24 rounded-2xl border-4 border-gray-600 overflow-hidden relative bg-gray-800">
          {/* 已過去的時間（灰色） */}
          <div
            className="absolute h-full bg-gradient-to-r from-gray-700 to-gray-600 transition-all duration-700"
            style={{ width: `${stages.livedPercent}%`, left: 0 }}
          >
            <div className="flex items-center justify-center h-full text-gray-400 font-bold text-sm">
              {stages.lived > 5 && `${stages.lived} 年`}
            </div>
          </div>

          {/* 還要工作的時間（紅色） */}
          <div
            className="absolute h-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 transition-all duration-700 animate-pulse-slow"
            style={{
              width: `${stages.workPercent}%`,
              left: `${stages.livedPercent}%`
            }}
          >
            <div className="flex items-center justify-center h-full text-white font-bold text-sm">
              {stages.work > 5 && (
                <>
                  ⚠️ {stages.work.toFixed(1)} 年
                </>
              )}
            </div>
          </div>

          {/* 自由時間（綠色） */}
          <div
            className="absolute h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-700"
            style={{
              width: `${stages.freePercent}%`,
              right: 0
            }}
          >
            <div className="flex items-center justify-center h-full text-gray-900 font-bold text-sm">
              {stages.free > 5 && (
                <>
                  ✨ {stages.free.toFixed(1)} 年
                </>
              )}
            </div>
          </div>
        </div>

        {/* 電池頭（裝飾） */}
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-10 bg-gray-600 rounded-r" />

        {/* 電量百分比顯示 */}
        <div className="absolute -top-8 right-0 text-emerald-400 text-sm font-bold">
          ⚡ {Math.round(stages.freePercent)}% 自由
        </div>
      </div>

      {/* 數據圖例 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-700/30 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-3 h-3 bg-gray-600 rounded" />
            <div className="text-gray-500 text-xs">已過去</div>
          </div>
          <div className="text-white font-bold">{stages.lived} 年</div>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-3 h-3 bg-red-500 rounded animate-pulse" />
            <div className="text-red-400 text-xs">要工作</div>
          </div>
          <div className="text-red-400 font-bold">
            {stages.work.toFixed(1)} 年
          </div>
        </div>
        <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <div className="text-emerald-400 text-xs">自由</div>
          </div>
          <div className="text-emerald-400 font-bold">
            {stages.free.toFixed(1)} 年
          </div>
        </div>
      </div>

      {/* 動態訊息 */}
      <div
        className={`text-center p-4 rounded-xl ${
          message.color === 'emerald'
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : message.color === 'orange'
            ? 'bg-orange-500/10 border border-orange-500/30'
            : 'bg-blue-500/10 border border-blue-500/30'
        }`}
      >
        <div
          className={`font-bold text-sm ${
            message.color === 'emerald'
              ? 'text-emerald-400'
              : message.color === 'orange'
              ? 'text-orange-400'
              : 'text-blue-400'
          }`}
        >
          {message.emoji} {message.text}
        </div>
      </div>

      {/* 提示文字 */}
      <div className="mt-4 text-center text-gray-500 text-xs">
        每次儲蓄都在縮短紅色區域，擴大綠色區域
      </div>
    </div>
  );
}
```

**視覺效果**：
- 動畫過渡：區塊變化時有 0.7 秒的 smooth transition
- 紅色區塊微脈動：提醒這是「還要工作」的時間
- 數字只在區塊夠大時才顯示（避免擁擠）

**預估工時**：8 小時  
**優先級**：P0

---

### 0.4 主畫面架構重組 ⭐⭐⭐⭐

**目標**：整合新元件，形成完整的「自由販賣機」體驗

#### App.tsx 改動

```typescript
// src/components/App.tsx
import { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { LifeCostCalculator } from './calculator/LifeCostCalculator';
import { FreedomTracker } from './freedom/FreedomTracker';
import { LifeBattery } from './visualization/LifeBattery';
import { HistoryPage } from './history/HistoryPage';
import { SettingsPage } from './settings/SettingsPage';
import { CelebrationSystem } from './feedback/CelebrationSystem';
import { GoogleSheetsAPI } from '@/services/googleSheets';
import { Storage } from '@/utils/storage';
import { GPSCalc } from '@/utils/financeCalc';
import { UserData, Record as RecordType, Screen } from '@/types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSavedAmount, setLastSavedAmount] = useState(0);

  // ... 載入邏輯保持不變

  // 處理決策（買 or 不買）
  const handleDecision = async (action: 'buy' | 'save', amount: number) => {
    if (!userData) return;

    const record: RecordType = {
      id: Date.now().toString(),
      type: action === 'save' ? 'save' : 'spend',
      amount,
      isRecurring: false,
      timeCost: 0, // 這裡可以計算，但不是必須
      category: action === 'save' ? '主動儲蓄' : '消費',
      note: '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    setRecords((prev) => [record, ...prev]);

    try {
      await GoogleSheetsAPI.saveRecord(record);
    } catch (error) {
      console.error('Failed to save record:', error);
    }

    // 只有「不買」才觸發慶祝
    if (action === 'save') {
      setLastSavedAmount(amount);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  // 計算累積數據
  const { totalSaved, totalSpent } = GPSCalc.calculateTotals(records);

  if (screen === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <div>
      {/* 慶祝系統 */}
      <CelebrationSystem
        trigger={showCelebration}
        amount={lastSavedAmount}
        userData={userData!}
      />

      {screen === 'onboarding' && (
        <OnboardingScreen onComplete={(data) => {
          setUserData(data);
          setScreen('main');
        }} />
      )}

      {screen === 'main' && userData && (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
          {/* 頂部導航 */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
            <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
              <button
                onClick={() => setScreen('dashboard')}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              <div className="text-white font-bold">Time<span className="text-emerald-400">Bar</span></div>
              <button
                onClick={() => setScreen('settings')}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 主要內容 */}
          <LifeCostCalculator
            userData={userData}
            onDecision={handleDecision}
          />
        </div>
      )}

      {screen === 'dashboard' && userData && (
        <DashboardScreen
          userData={userData}
          records={records}
          totalSaved={totalSaved}
          onClose={() => setScreen('main')}
        />
      )}

      {screen === 'history' && userData && (
        <HistoryPage
          records={records}
          userData={userData}
          onClose={() => setScreen('main')}
        />
      )}

      {screen === 'settings' && userData && (
        <SettingsPage
          userData={userData}
          onUpdateUser={setUserData}
          onClose={() => setScreen('main')}
          onReset={async () => {
            await GoogleSheetsAPI.clearAllData();
            Storage.clear();
            setUserData(null);
            setRecords([]);
            setScreen('onboarding');
          }}
        />
      )}
    </div>
  );
}

// 新增 Dashboard Screen
function DashboardScreen({ userData, records, totalSaved, onClose }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 pb-8">
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button onClick={onClose} className="text-gray-400 hover:text-white mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">自由儀表板</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <FreedomTracker userData={userData} totalSaved={totalSaved} />
        <LifeBattery userData={userData} records={records} />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="text-4xl font-black text-white mb-4">
        Time<span className="text-emerald-400">Bar</span>
      </div>
      <div className="spinner mb-4" />
      <div className="text-gray-500 text-sm">載入中...</div>
    </div>
  );
}
```

**預估工時**：6 小時

---

## 🎮 Phase 1: 遊戲化與成就系統

### 1.1 慶祝動畫系統 ⭐⭐⭐⭐

**檔案位置**：`src/components/feedback/CelebrationSystem.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Confetti } from '../Confetti';
import { FinanceCalc } from '@/utils/financeCalc';
import { UserData } from '@/types';

interface CelebrationSystemProps {
  trigger: boolean;
  amount: number;
  userData: UserData;
}

export function CelebrationSystem({ trigger, amount, userData }: CelebrationSystemProps) {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (trigger && amount > 0) {
      // 1. 播放音效（可選）
      playSuccessSound();

      // 2. 手機震動
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }

      // 3. 顯示慶祝 Modal
      setShowModal(true);

      // 4. 3 秒後自動關閉
      setTimeout(() => {
        setShowModal(false);
      }, 3000);
    }
  }, [trigger, amount]);

  if (!showModal || amount === 0) return null;

  // 計算買回的時間
  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  const timeCost = FinanceCalc.calculateTimeCost(
    amount,
    false,
    hourlyRate,
    realRate,
    yearsToRetire
  );

  const days = Math.floor(timeCost / 24);
  const hours = Math.floor(timeCost % 24);

  // 根據金額選擇訊息
  const getMessage = () => {
    if (amount >= 10000) {
      return '這是一個重大決定！';
    } else if (amount >= 1000) {
      return '很棒的自制力！';
    } else {
      return '積少成多！';
    }
  };

  return (
    <>
      {/* 彩帶動畫 */}
      <Confetti active={true} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 rounded-3xl p-8 max-w-sm mx-4 shadow-2xl border-2 border-emerald-500/50 animate-bounce-in">
          <div className="text-center">
            {/* Emoji */}
            <div className="text-7xl mb-4 animate-bounce">🎉</div>

            {/* 主標題 */}
            <h2 className="text-white text-3xl font-black mb-3">
              {getMessage()}
            </h2>

            {/* 說明 */}
            <p className="text-emerald-200 text-lg mb-4">
              你剛剛買回了
            </p>

            {/* 買回的時間 */}
            <div className="bg-emerald-950/50 rounded-2xl p-4 mb-4 border border-emerald-500/30">
              <div className="text-white text-5xl font-black mb-2">
                {days > 0 && <>{days} 天</>}
                {days > 0 && hours > 0 && <> </>}
                {hours > 0 && <>{hours} 小時</>}
              </div>
              <div className="text-emerald-300 text-sm">
                自由時光
              </div>
            </div>

            {/* 激勵語 */}
            <p className="text-emerald-200/80 text-sm italic">
              "{getMotivationalQuote()}"
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// 音效播放（可選）
function playSuccessSound() {
  try {
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // 忽略播放失敗（某些瀏覽器需要用戶互動）
    });
  } catch (error) {
    // 音效不是必須的
  }
}

// 激勵語錄
function getMotivationalQuote() {
  const quotes = [
    '每一次忍住，都是在買回自己的自由',
    '省下的不是錢，是時間',
    '你正在用行動改變未來',
    '自律帶來自由',
    '小小的決定，大大的改變',
    '你比昨天的自己更自由了',
    '堅持下去，終點不遠了'
  ];

  return quotes[Math.floor(Math.random() * quotes.length)];
}
```

**動畫定義**：

```css
/* src/styles/animations.css - 新增 */

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}
```

**預估工時**：4 小時

---

### 1.2 每日挑戰系統 ⭐⭐⭐

**目標**：提供每日回訪理由

**檔案位置**：`src/components/challenges/DailyChallenge.tsx`

```typescript
import { useState, useEffect } from 'react';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { Storage } from '@/utils/storage';
import { UserData } from '@/types';

const { formatTime, formatCurrency } = Formatters;

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  category: string;
}

interface DailyChallengeProps {
  userData: UserData;
  onChallengeComplete: (challenge: Challenge) => void;
}

export function DailyChallenge({ userData, onChallengeComplete }: DailyChallengeProps) {
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  // 載入今日已完成的挑戰
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = Storage.load(`challenges_${today}`, []) as string[];
    setCompletedToday(stored);
  }, []);

  // 儲存完成狀態
  const saveCompleted = (challengeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = [...completedToday, challengeId];
    setCompletedToday(updated);
    Storage.save(`challenges_${today}`, updated);
  };

  // 挑戰列表
  const challenges: Challenge[] = [
    {
      id: 'coffee',
      title: '咖啡挑戰',
      description: '今天不買手搖飲/咖啡',
      reward: 150,
      icon: '☕',
      category: '飲食'
    },
    {
      id: 'lunch',
      title: '自備午餐',
      description: '自己帶便當上班',
      reward: 100,
      icon: '🍱',
      category: '飲食'
    },
    {
      id: 'taxi',
      title: '大眾運輸',
      description: '不叫計程車/Uber',
      reward: 200,
      icon: '🚇',
      category: '交通'
    },
    {
      id: 'snack',
      title: '零食抵抗',
      description: '不買零食點心',
      reward: 50,
      icon: '🍿',
      category: '飲食'
    }
  ];

  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 計算完成百分比
  const completionRate = Math.round((completedToday.length / challenges.length) * 100);

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">🎯 今日挑戰</h3>
        <div className="text-emerald-400 text-sm font-bold">
          {completedToday.length}/{challenges.length}
        </div>
      </div>

      {/* 進度條 */}
      <div className="mb-6">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="text-gray-500 text-xs mt-1 text-right">
          {completionRate}% 完成
        </div>
      </div>

      {/* 挑戰列表 */}
      <div className="space-y-3">
        {challenges.map((challenge) => {
          const isCompleted = completedToday.includes(challenge.id);

          // 計算這個挑戰能買回多少時間
          const timeCost = FinanceCalc.calculateTimeCost(
            challenge.reward,
            false,
            hourlyRate,
            realRate,
            yearsToRetire
          );
          const timeFormatted = formatTime(timeCost);

          return (
            <div
              key={challenge.id}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isCompleted
                  ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`text-4xl transition-transform ${
                    isCompleted ? 'scale-110' : ''
                  }`}
                >
                  {challenge.icon}
                </div>

                {/* 內容 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`font-bold ${
                        isCompleted ? 'text-emerald-300' : 'text-white'
                      }`}
                    >
                      {challenge.title}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'bg-emerald-500/30 text-emerald-300'
                          : 'bg-gray-600 text-gray-400'
                      }`}
                    >
                      {challenge.category}
                    </span>
                  </div>
                  <div
                    className={`text-sm ${
                      isCompleted ? 'text-emerald-400/80' : 'text-gray-400'
                    }`}
                  >
                    {challenge.description}
                  </div>
                </div>

                {/* 按鈕或完成標記 */}
                {!isCompleted ? (
                  <button
                    onClick={() => {
                      saveCompleted(challenge.id);
                      onChallengeComplete(challenge);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
                  >
                    <div>完成</div>
                    <div className="text-xs text-emerald-900">
                      +{timeFormatted.value}
                      {timeFormatted.unit}
                    </div>
                  </button>
                ) : (
                  <div className="text-emerald-400 text-3xl">✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 全部完成提示 */}
      {completedToday.length === challenges.length && (
        <div className="mt-4 text-center p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/50 animate-slide-up">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-emerald-400 font-bold mb-1">
            今日全部完成！
          </div>
          <div className="text-emerald-300/80 text-sm">
            你是自由戰士！明天再來挑戰吧！
          </div>
        </div>
      )}
    </div>
  );
}
```

**整合到 Dashboard**：

```typescript
// 在 DashboardScreen 中加入
<DailyChallenge
  userData={userData}
  onChallengeComplete={(challenge) => {
    // 記錄為一筆儲蓄
    handleDecision('save', challenge.reward);
    // 觸發慶祝
    setLastSavedAmount(challenge.reward);
    setShowCelebration(true);
  }}
/>
```

**預估工時**：6 小時

---

## 🧠 Phase 2: 心理學優化

### 2.1 追趕計劃（防焦慮）⭐⭐⭐⭐

**目標**：當用戶落後時，不只說「你落後了」，還要給出「這樣做可以追上」

**檔案位置**：`src/components/psychology/CatchUpPlan.tsx`

```typescript
import { useMemo } from 'react';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData } from '@/types';

const { formatCurrency, formatYearMonth } = Formatters;

interface CatchUpPlanProps {
  userData: UserData;
  ageDiff: number; // 落後的年數（負數 = 領先）
}

export function CatchUpPlan({ userData, ageDiff }: CatchUpPlanProps) {
  // 如果領先或剛好，不顯示追趕計劃
  if (ageDiff <= 0) return null;

  const { salary, age, retireAge, currentSavings, monthlySavings, inflationRate, roiRate } = userData;
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 計算不同方案需要多久才能追上
  const scenarios = useMemo(() => {
    const plans = [1000, 2000, 3000, 5000];

    return plans.map((extraSaving) => {
      const newMonthlySaving = monthlySavings + extraSaving;

      // 計算新的預估退休年齡
      // 簡化版：假設線性關係
      const savingIncrease = extraSaving / monthlySavings;
      const timeSaved = ageDiff * savingIncrease;

      // 計算需要幾個月才能追上
      const monthsToTarget = ageDiff * 12 / savingIncrease;

      return {
        extraSaving,
        newMonthlySaving,
        timeSaved: Math.min(timeSaved, ageDiff),
        monthsToTarget: Math.round(monthsToTarget),
        percentage: Math.round((extraSaving / monthlySavings) * 100)
      };
    }).filter(s => s.monthsToTarget > 0 && s.monthsToTarget < 240); // 只顯示合理的方案（20年內）
  }, [ageDiff, monthlySavings]);

  if (scenarios.length === 0) {
    return null;
  }

  return (
    <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-5">
      <div className="flex items-start gap-2 mb-4">
        <div className="text-2xl">💡</div>
        <div>
          <div className="text-orange-400 font-bold text-lg mb-1">
            追趕計劃
          </div>
          <div className="text-gray-300 text-sm">
            目前落後 {formatYearMonth(ageDiff)}，以下方案可以幫你追上：
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {scenarios.map((scenario, index) => (
          <div
            key={scenario.extraSaving}
            className={`bg-gray-800/60 rounded-xl p-4 border transition-all hover:border-orange-500 cursor-pointer ${
              index === 1 ? 'border-orange-500/50' : 'border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-white font-bold">
                  方案 {index + 1}
                  {index === 1 && (
                    <span className="ml-2 text-xs bg-orange-500 text-gray-900 px-2 py-0.5 rounded">
                      推薦
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-sm">
                  每月多存 {formatCurrency(scenario.extraSaving)}
                  （增加 {scenario.percentage}%）
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-gray-300 text-sm">
                新月儲蓄：
                <span className="text-emerald-400 font-bold ml-1">
                  {formatCurrency(scenario.newMonthlySaving)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-bold">
                  {Math.floor(scenario.monthsToTarget / 12)} 年{' '}
                  {scenario.monthsToTarget % 12} 個月
                </div>
                <div className="text-gray-500 text-xs">可追上目標</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="bg-orange-500 hover:bg-orange-400 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all active:scale-95">
          選擇方案並開始執行
        </button>
      </div>
    </div>
  );
}
```

**整合位置**：
- 在 `DashboardScreen` 中
- 在 GPS 狀態顯示下方

**預估工時**：4 小時

---

### 2.2 正向訊息框架 ⭐⭐⭐

**目標**：重寫所有負面訊息，改成正向/行動導向

**檔案位置**：`src/utils/positiveMessaging.ts`

```typescript
export const PositiveMessaging = {
  // GPS 狀態訊息
  gpsStatus: {
    ahead: (years: number) => ({
      emoji: '🎉',
      title: '太棒了！',
      message: `你領先計劃 ${years.toFixed(1)} 年！`,
      action: '繼續保持這個節奏'
    }),

    onTrack: () => ({
      emoji: '✓',
      title: '完美！',
      message: '你正走在計畫的軌道上',
      action: '穩健前進，持續就是力量'
    }),

    behind: (years: number, extraSaving: number) => ({
      emoji: '💪',
      title: '再加把勁！',
      message: `還差 ${years.toFixed(1)} 年`,
      action: `每月多存 ${extraSaving}，6 個月就能追上`
    })
  },

  // 消費記錄後
  afterSpending: (amount: number, days: number) => ({
    neutral: `已記錄 ${amount} 元的消費`,
    insight: `下次省下來，就能買回 ${days} 天自由時光`,
    motivation: '每次的小決定，都在塑造未來'
  }),

  // 儲蓄記錄後
  afterSaving: (amount: number, days: number) => ({
    celebration: '太棒了！',
    impact: `你剛剛買回了 ${days} 天自由`,
    quote: getRandomQuote('save')
  }),

  // 里程碑解鎖
  milestoneUnlocked: (milestone: string) => ({
    title: '🏆 成就解鎖！',
    message: `你解鎖了「${milestone}」`,
    reward: '這是你努力的證明'
  })
};

function getRandomQuote(type: 'save' | 'spend') {
  const saveQuotes = [
    '每一次忍住，都是在買回自己的自由',
    '省下的不是錢，是時間',
    '你正在用行動改變未來',
    '自律帶來自由',
    '你比昨天的自己更自由了'
  ];

  const spendQuotes = [
    '沒關係，知道代價就好',
    '偶爾享受也是生活的一部分',
    '下次可以做得更好',
    '重要的是持續前進'
  ];

  const quotes = type === 'save' ? saveQuotes : spendQuotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}
```

**應用**：
- 在所有顯示訊息的地方使用這個模組
- 避免直接寫死負面文案

**預估工時**：2 小時

---

## 📊 Phase 3: 視覺化與體驗提升

### 3.1 支出分類分析 ⭐⭐⭐

**目標**：讓用戶看到「哪個分類吃掉最多生命」

**檔案位置**：`src/components/analytics/SpendingBreakdown.tsx`

```typescript
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData, Record as RecordType } from '@/types';

const { formatCurrency } = Formatters;

const COLORS = {
  '飲食': '#f59e0b',
  '購物': '#ec4899',
  '娛樂': '#8b5cf6',
  '交通': '#06b6d4',
  '訂閱': '#ef4444',
  '其他': '#6b7280'
};

interface SpendingBreakdownProps {
  records: RecordType[];
  userData: UserData;
}

export function SpendingBreakdown({ records, userData }: SpendingBreakdownProps) {
  const spendingRecords = records.filter((r) => r.type === 'spend');

  if (spendingRecords.length === 0) {
    return (
      <div className="bg-gray-800/60 rounded-3xl p-6 border border-gray-700 text-center">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-gray-400">還沒有消費記錄</div>
      </div>
    );
  }

  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 按分類統計
  const categoryData = useMemo(() => {
    const byCategory: { [key: string]: number } = {};

    spendingRecords.forEach((record) => {
      const category = record.category || '其他';
      byCategory[category] = (byCategory[category] || 0) + record.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => {
        // 計算這個分類吃掉了多少生命
        const timeCost = FinanceCalc.calculateTimeCost(
          value,
          false,
          hourlyRate,
          realRate,
          yearsToRetire
        );
        const daysLost = Math.floor(timeCost / 24);

        return {
          name,
          value,
          daysLost,
          percentage: 0 // 後面計算
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [spendingRecords, hourlyRate, realRate, yearsToRetire]);

  // 計算百分比
  const totalSpent = categoryData.reduce((sum, item) => sum + item.value, 0);
  categoryData.forEach((item) => {
    item.percentage = Math.round((item.value / totalSpent) * 100);
  });

  // 最大殺手
  const topKiller = categoryData[0];

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border border-gray-700">
      <h3 className="text-white font-bold text-lg mb-4">
        💸 支出分析
      </h3>

      {/* 圖表 */}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {categoryData.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] || COLORS['其他']}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <div className="text-white font-bold">{data.name}</div>
                    <div className="text-gray-400 text-sm">
                      {formatCurrency(data.value)}
                    </div>
                    <div className="text-orange-400 text-xs">
                      = {data.daysLost} 天生命
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 列表 */}
      <div className="space-y-2 mt-4">
        {categoryData.map((cat, index) => (
          <div
            key={cat.name}
            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLORS[cat.name] || COLORS['其他'] }}
              />
              <span className="text-gray-300">{cat.name}</span>
            </div>
            <div className="text-right">
              <div className="text-orange-400 font-bold">
                {formatCurrency(cat.value)}
              </div>
              <div className="text-gray-500 text-xs">
                {cat.daysLost} 天 • {cat.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 最大殺手警告 */}
      {topKiller && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-2">
            <div className="text-2xl">💀</div>
            <div className="flex-1">
              <div className="text-red-400 font-bold mb-1">
                生命殺手 #{1}：{topKiller.name}
              </div>
              <div className="text-gray-300 text-sm">
                如果減少這個分類的支出 50%，你可以提早{' '}
                <span className="text-emerald-400 font-bold">
                  {Math.floor(topKiller.daysLost * 0.5)} 天
                </span>{' '}
                退休
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**安裝依賴**：
```bash
npm install recharts
```

**預估工時**：6 小時

---

### 3.2 主畫面細節優化 ⭐⭐⭐

**目標**：從舊計劃中挑選並實作關鍵優化

#### 3.2.1 數字格式優化

```typescript
// src/utils/financeCalc.ts - 更新 Formatters
export const Formatters = {
  // ... 現有函數

  // 新增：格式化年月
  formatYearMonth: (years: number) => {
    const y = Math.floor(years);
    const m = Math.round((years - y) * 12);

    if (y === 0) {
      return `${m} 個月`;
    } else if (m === 0) {
      return `${y} 年`;
    } else {
      return `${y} 年 ${m} 個月`;
    }
  },

  // 優化：formatTime 使用 formatYearMonth
  formatTime: (hours: number) => {
    const years = hours / (8 * 22 * 12);
    if (years >= 1) {
      return { value: Formatters.formatYearMonth(years), unit: '' };
    }

    const days = hours / 8;
    if (days >= 1) {
      const d = Math.floor(days);
      const h = Math.round((days - d) * 8);
      return { value: h > 0 ? `${d}天${h}` : d, unit: h > 0 ? '小時' : '天' };
    }

    return { value: Math.round(hours), unit: '小時' };
  }
};
```

#### 3.2.2 統計卡片收合

```typescript
// 在 DashboardScreen 中
const [showDetailedStats, setShowDetailedStats] = useState(false);

<button
  onClick={() => setShowDetailedStats(!showDetailedStats)}
  className="w-full bg-gray-800/40 rounded-2xl p-4 flex justify-between items-center mb-4"
>
  <span className="text-gray-400 text-sm">📊 詳細統計</span>
  <svg
    className={`w-5 h-5 text-gray-400 transform transition-transform ${
      showDetailedStats ? 'rotate-180' : ''
    }`}
  >
    {/* 下箭頭 SVG */}
  </svg>
</button>

{showDetailedStats && (
  <div className="space-y-4 animate-slide-down">
    <SpendingBreakdown records={records} userData={userData} />
    {/* 其他統計... */}
  </div>
)}
```

**預估工時**：4 小時

---

## 📋 Implementation Timeline（重新規劃）

### Sprint 0 (Week 1-2): 核心產品轉型 🔥🔥🔥
**目標**：把計算機變成自由販賣機

**任務清單**：
- [ ] 0.1 生命成本計算器 - 12h
  - [ ] UI 設計與實作
  - [ ] 核心計算邏輯
  - [ ] 快速金額按鈕
  - [ ] 生動比喻系統
- [ ] 0.2 微型里程碑系統 - 10h
  - [ ] 里程碑定義
  - [ ] 進度計算
  - [ ] UI 實作
- [ ] 0.3 生命電池視覺化 - 8h
  - [ ] 電池動畫
  - [ ] 顏色分區
  - [ ] 動態訊息
- [ ] 0.4 主畫面架構重組 - 6h
  - [ ] App.tsx 改造
  - [ ] 導航整合
  - [ ] Dashboard Screen
- [ ] 1.1 慶祝動畫系統 - 4h
  - [ ] Modal 設計
  - [ ] 彩帶效果
  - [ ] 音效整合（可選）

**總計：40 小時**

**檢查點**：
- ✅ 用戶能在主畫面輸入金額，看到生命成本
- ✅ 按下「我不買了」會觸發慶祝動畫
- ✅ 能看到已解鎖的里程碑
- ✅ 生命電池正確顯示三個區塊

**成功指標**：
- 使用場景轉變：從「記帳」→「消費前查詢」
- 情緒反應：看到生命成本時有「震撼感」

---

### Sprint 1 (Week 3): 遊戲化與心理優化
**目標**：提高黏著度，降低焦慮

**任務清單**：
- [ ] 1.2 每日挑戰系統 - 6h
  - [ ] 挑戰定義
  - [ ] LocalStorage 狀態管理
  - [ ] UI 實作
- [ ] 2.1 追趕計劃 - 4h
  - [ ] 方案計算邏輯
  - [ ] UI 設計
- [ ] 2.2 正向訊息框架 - 2h
  - [ ] 訊息模組
  - [ ] 應用到各處
- [ ] 數字格式優化（從舊計劃）- 2h
- [ ] 統計卡片收合 - 2h

**總計：16 小時**

**檢查點**：
- ✅ 用戶每天會看到 4 個挑戰
- ✅ 落後時會看到追趕計劃
- ✅ 所有訊息都是正向/行動導向
- ✅ 數字顯示更易讀（年月格式）

**成功指標**：
- 次日回訪率 > 40%
- 用戶完成至少 1 個每日挑戰 > 50%

---

### Sprint 2 (Week 4): 視覺化與體驗提升
**目標**：提供深度洞察

**任務清單**：
- [ ] 3.1 支出分類分析 - 6h
  - [ ] Recharts 整合
  - [ ] 餅圖實作
  - [ ] 最大殺手提示
- [ ] 資產成長曲線圖（可選）- 6h
- [ ] 備份匯出功能 - 4h
- [ ] 小細節 polish - 2h
  - [ ] 清除資料改中文
  - [ ] 金額格式統一
  - [ ] 完美狀態容忍區間

**總計：18 小時**

**檢查點**：
- ✅ 用戶能看到支出分類圖表
- ✅ 能識別「生命殺手」分類
- ✅ 能匯出/匯入備份

**成功指標**：
- 用戶查看支出分析 > 60%
- 用戶根據分析調整行為 > 30%

---

## 🎯 Success Metrics（新成功指標）

### 核心指標

#### 1. 使用頻率（最關鍵）
- **當前基準**：每月 1 次
- **目標**：每天 3-5 次
- **測量**：DAU / MAU 比率
- **達成條件**：> 0.15（即 15% 的月活用戶每天都用）

#### 2. 使用場景轉變
- **當前**：晚上記帳
- **目標**：消費前查詢
- **測量**：生命成本計算器使用次數 vs 手動記錄次數
- **達成條件**：計算器使用次數 > 記錄次數 × 2

#### 3. 決策影響力
- **目標**：用戶因為 App 而放棄消費
- **測量**：按下「我不買了」的次數
- **達成條件**：> 每週 2 次

#### 4. 情緒價值
- **當前**：焦慮 😰
- **目標**：成就感 🎉
- **測量**：用戶反饋問卷「這 App 讓我感到...」
  - 焦慮/壓力：< 20%
  - 掌控感/成就感：> 70%

### 次要指標

#### 5. 留存率
- **次日留存**：> 50%（看到慶祝動畫後會回來）
- **7 日留存**：> 35%（每日挑戰）
- **30 日留存**：> 20%（已養成習慣）

#### 6. 功能使用率
- **每日挑戰完成率**：> 40%
- **里程碑查看率**：> 70%
- **生命電池查看率**：> 60%

#### 7. 行為改變
- **目標**：實際減少消費、增加儲蓄
- **測量**：
  - 每月儲蓄記錄 vs 花費記錄比例
  - 用戶自我報告「減少消費次數」

---

## 📦 Dependencies（最終清單）

```bash
# Phase 0-1
npm install react-number-format react-hot-toast

# Phase 2
npm install recharts

# 測試
npm install --save-dev @testing-library/react @testing-library/jest-dom

# TypeScript 類型
npm install --save-dev @types/node
```

---

## 🚀 Quick Start

```bash
# 1. 切換到新分支
git checkout -b refactor/product-transformation-v2

# 2. 安裝依賴
npm install

# 3. 創建新元件架構
mkdir -p src/components/{calculator,freedom,visualization,challenges,feedback,psychology,analytics}

# 4. 複製現有元件作為基礎
# （保留 onboarding, settings, history 等現有元件）

# 5. 開始開發 Sprint 0
npm run dev

# 6. 持續測試
npm test
```

---

## ✅ Definition of Done（完成定義）

每個功能必須滿足：

### 功能面
- [ ] 核心邏輯正確（通過測試）
- [ ] UI 在手機上正常顯示
- [ ] 動畫流暢（60fps）
- [ ] 無 console 錯誤

### 體驗面
- [ ] 首次使用者能直覺操作
- [ ] 回饋即時（< 100ms）
- [ ] 視覺層次清晰
- [ ] 文案易懂（給非技術背景的人看）

### 技術面
- [ ] TypeScript 無錯誤
- [ ] 元件已加入測試
- [ ] 程式碼已 review
- [ ] Git commit message 清楚

---

## 🎨 Design Principles（設計原則）

### 1. 即時反饋優先
- 任何操作都要有立即的視覺回饋
- 計算結果即時更新（不需要按「計算」按鈕）
- 動畫要快速完成（0.3-0.7 秒）

### 2. 情緒設計
- 慶祝要誇張（彩帶、音效、震動）
- 警告要溫和（不嚇人，給希望）
- 顏色要有意義（紅 = 工作，綠 = 自由）

### 3. 具象化抽象概念
- 不說「$50,000」→ 說「2 週薪水」
- 不說「提前 0.5 年」→ 說「提前 6 個月」
- 不說「65 歲退休」→ 用電池條顯示

### 4. 漸進式揭露
- 主畫面只顯示最關鍵資訊
- 詳細資料放在可展開區域
- 進階功能放在設定頁

### 5. 行動導向
- 不只告訴現狀，要告訴「怎麼做」
- 每個問題都提供解決方案
- 按鈕要清楚說明會發生什麼

---

## 🐛 Known Issues to Fix（已知問題）

在重構過程中順便修復：

### 從舊代碼繼承的問題
- [ ] Google Sheets 同步無 Loading 狀態
- [ ] 網路錯誤處理不完整
- [ ] 深色模式在強光下對比度不足
- [ ] Slider 在部分安卓機上卡頓

### 新增功能需注意
- [ ] 慶祝動畫在低階手機上可能卡頓
- [ ] LocalStorage 容量限制（每日挑戰數據累積）
- [ ] 圖表在小螢幕上可能擁擠

---

## 📝 Testing Checklist（測試清單）

### 功能測試
- [ ] 輸入金額 → 看到生命成本
- [ ] 按「我不買了」→ 觸發慶祝
- [ ] 完成挑戰 → 記錄儲蓄 + 慶祝
- [ ] 解鎖里程碑 → 顯示正確
- [ ] 生命電池 → 三區塊比例正確
- [ ] 追趕計劃 → 計算合理

### 邊界測試
- [ ] 金額 = 0 → 不顯示計算結果
- [ ] 金額非常大（1 億）→ 不溢位
- [ ] 所有挑戰完成 → 顯示慶祝
- [ ] 無消費記錄 → 圖表顯示空狀態

### 相容性測試
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] 桌面 Chrome
- [ ] 小螢幕（iPhone SE）
- [ ] 大螢幕（iPad）

### 效能測試
- [ ] 慶祝動畫不卡頓
- [ ] 圖表渲染 < 1 秒
- [ ] 首次載入 < 3 秒

---

## 📚 Resources（參考資源）

### 產品設計
- [Hooked: How to Build Habit-Forming Products](https://www.nirandfar.com/hooked/)
- [Don't Make Me Think](https://sensible.com/dont-make-me-think/)
- [The Design of Everyday Things](https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things)

### 行為經濟學
- [Nudge: Improving Decisions About Health, Wealth, and Happiness](https://en.wikipedia.org/wiki/Nudge_(book))
- [Thinking, Fast and Slow](https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow)

### FIRE 社群
- [r/financialindependence](https://www.reddit.com/r/financialindependence/)
- [Mr. Money Mustache](https://www.mrmoneymustache.com/)

### 技術文件
- [React Hook Form](https://react-hook-form.com/)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 💬 User Feedback Collection（用戶反饋）

### 關鍵問題（測試後詢問）
1. 「這個 App 讓你對消費有什麼新的想法？」
2. 「你會在什麼時候打開這個 App？」
3. 「看到生命成本後，你的感覺是？」
4. 「你有因為這個 App 而放棄任何消費嗎？」
5. 「你會推薦給朋友嗎？為什麼？」

### 情緒溫度計
- 😰 焦慮 / 壓力
- 😐 無感
- 🤔 有趣 / 好奇
- 💪 有動力
- 🎉 興奮 / 成就感

目標：80% 用戶選擇 💪 或 🎉

---

## 🔮 Future Vision（未來展望）

### Phase 4 (3-6 個月後)
如果 Phase 0-3 成功，可以考慮：

- **AI 個人化建議**
  - 「你每週咖啡花 $600，建議改成 $300」
  - 「你的最大支出是娛樂，考慮減少 20%」

- **社群功能**（輕量）
  - 看看「年齡相仿的人平均解鎖到哪個里程碑」
  - 匿名排行榜（非競爭性）

- **更多場景模擬**
  - 買房 vs 租房
  - 生小孩的成本
  - 留學的機會成本

### Phase 5 (1 年後)
- 銀行帳戶連結（自動記帳）
- 投資建議整合
- 退休地點成本比較

---

## 🎯 North Star Metric（北極星指標）

**最重要的指標：**

**「用戶因為 TimeBar 而放棄的消費總金額」**

測量方式：
- 每次按「我不買了」記錄金額
- 累積統計
- 目標：每用戶每月平均省下 > $3,000

這個指標代表：
1. 用戶真的在使用（頻率）
2. App 真的有影響力（價值）
3. 產品達成了目標（改變行為）

---

## 📞 Support & Communication

### 開發過程中的溝通
- **每日站會**：15 分鐘同步進度
- **Sprint Review**：每 2 週展示成果
- **用戶測試**：每個 Sprint 結束後找 5 個人測試

### 問題回報
- **Critical**：立即修復（功能無法使用）
- **High**：當天修復（體驗嚴重受損）
- **Medium**：本 Sprint 修復（小問題）
- **Low**：下 Sprint 考慮（優化）

---

**最後更新**：2024-12-29  
**文件版本**：v2.0 - Product Transformation (No Social/Voice/OCR)  
**維護者**：TimeBar Team

---

## 🚀 Let's Transform TimeBar!

**目標不只是做一個「好用的工具」**  
**而是做一個「會讓人上癮的產品」**

**從今天開始，每一行代碼都在問自己：**
> 「這會讓用戶更想打開 App 嗎？」  
> 「這會讓用戶更接近自由嗎？」  
> 「這會創造即時的成就感嗎？」

**Let's build something people LOVE to use! 💰 → 🕊️**
