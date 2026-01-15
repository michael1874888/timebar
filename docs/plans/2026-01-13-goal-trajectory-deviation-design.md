# 目標軌跡偏差模型 (Goal Trajectory Deviation Model) - 設計文檔

**版本**：v4.1
**日期**：2026-01-13
**狀態**：設計完成，待實現

---

## 1. 背景與動機

### 1.1 現有問題

**當前邏輯（絕對機會成本）**：
- 任何消費都會延後退休時間（相對於「完全不花錢」的極端基準）
- 系統不知道用戶的「合理預算」是多少
- 公式：`退休年齡 = 目標年齡 + Σ(消費時間成本) / 年工時`

**問題**：
1. **用戶心理壓力過大**：每買一杯咖啡都感到罪惡感，即使在預算內
2. **財務誤導風險**：如果用戶設定的「預算」本身不可行，系統不會警告
3. **缺乏目標感**：用戶不知道「我應該存多少」才能達成目標

### 1.2 解決方案

**新邏輯（目標軌跡偏差）**：
- 系統計算「為了達成退休目標，每月必須儲蓄多少」
- 比較「實際儲蓄」vs「必須儲蓄」的累積差距
- 只有當累積儲蓄 < 目標儲蓄時，才延後退休時間

**核心概念**：
```
退休年齡 = 目標年齡 + 軌跡偏差（年）

軌跡偏差 = (目標累積儲蓄 - 實際累積儲蓄) × 複利 / 時薪 / 年工時
```

---

## 2. 核心設計決策

### 2.1 時間範圍：累積制（從起點至今）

**選擇**：B - 累積制（建議）

**邏輯**：
```typescript
目標累積儲蓄 = requiredMonthlySavings × 經過月數
實際累積儲蓄 = (月薪 × 經過月數) - Σ(消費記錄)
偏差 = 實際累積儲蓄 - 目標累積儲蓄
```

**優勢**：
- 反映「長期是否在正軌上」
- 短期超支可以被長期達標抵消
- 真實反映財務健康度

### 2.2 累積制起點：混合方案

**選擇**：混合方案 AB

**計算邏輯**：
```typescript
起點 = max(createdAt, firstRecordDate - 7天)
```

**情境處理**：
1. 用戶在 Onboarding 後 7 天內開始記帳 → 從 `createdAt` 算起
2. 用戶超過 7 天才記帳 → 從第一筆記錄往前推 7 天算起

**優勢**：
- 鼓勵用戶及早記帳（7 天內開始有獎勵）
- 容忍初期猶豫期（不會因晚幾天開始就虛假落後）
- 長期持續記帳，偏差會自然收斂

### 2.3 單筆記錄的時間成本：保留但降級為「參考值」

**選擇**：A - 保留但改變意義

**顯示方式**：
```
☕ 咖啡         -150 元
飲食  |  2026-01-13

💭 機會成本：0.8 小時
   └ 僅供參考，不計入退休進度
```

**理由**：
- 保留財務教育價值
- 減輕用戶心理壓力（明確標注「不影響進度」）
- 用戶仍能感知每筆花費的重量

### 2.4 目標變更處理：用戶自主校準

**選擇**：C - 混合（向後看 + 校準機制）

**觸發時機**：用戶修改 `retireAge` 或其他影響 `requiredMonthlySavings` 的參數

**對話框選項**：
```
🎯 退休目標已變更

60 歲 → 65 歲
每月必須儲蓄：30,000 → 20,000 元

如何處理歷史進度？

○ 重新開始（推薦）
  └ 清除之前的超前/落後記錄
  └ 預估年齡：60 歲（歸零）

● 保留歷史
  └ 繼續累積之前的進度
  └ 預估年齡：58.5 歲（目前狀態）

[取消]              [確認變更]
```

**實現邏輯**：
- 選擇「重新開始」：`historicalDeviationHours = 0`, `trajectoryStartDate = now`
- 選擇「保留歷史」：`historicalDeviationHours = currentDeviationHours`

---

## 3. 資料結構設計

### 3.1 UserData 新增字段

```typescript
export interface UserData {
  // ... 現有字段

  // v4.1: 目標軌跡偏差模型
  trajectoryStartDate?: string;          // 起點日期 (ISO 8601)
  lastGoalChangeDate?: string;           // 最後一次修改退休目標的日期
  historicalDeviationHours?: number;     // 歷史累積偏差（工作小時）
}
```

**注意**：內測階段，不需要 `calculationMode` 和 `hasAcceptedRecalibration` 字段（直接使用新邏輯）

### 3.2 新增類型定義

```typescript
// 軌跡偏差計算結果
export interface DeviationResult {
  targetAccumulatedSavings: number;   // 目標累積儲蓄
  actualAccumulatedSavings: number;   // 實際累積儲蓄
  deviation: number;                  // 偏差金額（正=超前）
  deviationHours: number;             // 偏差工作小時
  deviationDays: number;              // 偏差天數
  deviationYears: number;             // 偏差年數
  isOnTrack: boolean;                 // 是否在軌道上
  isAhead: boolean;                   // 是否超前
  isBehind: boolean;                  // 是否落後
  monthsElapsed: number;              // 已經過月數
  requiredMonthlySavings: number;     // 每月必須儲蓄額
}

// 單筆記錄的時間成本（保留作為參考值）
export interface TimeCostReference {
  hours: number;                      // 機會成本（小時）
  isReference: true;                  // 標記為參考值
  label: string;                      // "機會成本（僅供參考）"
}
```

---

## 4. 核心算法實現

### 4.1 TrajectoryCalculator 類

**文件位置**：`src/layers/2-domain/calculators/TrajectoryCalculator.ts`

**主要方法**：

```typescript
export class TrajectoryCalculator {
  /**
   * 計算軌跡起點（混合方案）
   * 邏輯：max(createdAt, firstRecordDate - 7天)
   */
  static calculateStartDate(
    userData: UserData,
    records: Record[]
  ): string;

  /**
   * 計算經過的月數（精確到小數）
   */
  static calculateMonthsElapsed(startDate: string): number;

  /**
   * 計算實際累積儲蓄（推算收入 - 記錄支出）
   */
  static calculateActualSavings(
    userData: UserData,
    records: Record[],
    monthsElapsed: number
  ): number;

  /**
   * 主計算方法：計算用戶相對於目標軌跡的偏差
   */
  static calculateDeviation(params: {
    userData: UserData;
    records: Record[];
  }): DeviationResult;
}
```

### 4.2 核心計算邏輯

```typescript
static calculateDeviation(params: {
  userData: UserData;
  records: Record[];
}): DeviationResult {
  const { userData, records } = params;

  // 1. 確定起點
  let startDate = userData.trajectoryStartDate;
  if (!startDate) {
    startDate = this.calculateStartDate(userData, records);
  }

  // 2. 計算經過月數
  const monthsElapsed = this.calculateMonthsElapsed(startDate);

  // 3. 計算每月必須儲蓄額
  const realRate = FinanceCalculator.realRate(
    userData.inflationRate,
    userData.roiRate
  );
  const yearsToRetire = userData.retireAge - userData.age;
  const requiredMonthlySavings = FinanceCalculator.requiredMonthlySavings({
    currentSavings: userData.currentSavings,
    targetAmount: userData.targetRetirementFund ||
      FinanceCalculator.monthlyToFund(userData.salary - userData.monthlySavings),
    years: yearsToRetire,
    rate: realRate,
  });

  // 4. 計算目標累積儲蓄
  const targetAccumulatedSavings = requiredMonthlySavings * monthsElapsed;

  // 5. 計算實際累積儲蓄
  const actualAccumulatedSavings = this.calculateActualSavings(
    userData,
    records,
    monthsElapsed
  );

  // 6. 計算偏差
  const deviation = actualAccumulatedSavings - targetAccumulatedSavings;

  // 7. 如果有歷史偏差，疊加上去
  const hourlyRate = FinanceCalculator.hourlyRate(userData.salary);
  const historicalDeviationAmount =
    (userData.historicalDeviationHours || 0) * hourlyRate;
  const totalDeviationAmount = deviation + historicalDeviationAmount;

  // 8. 轉換為時間成本
  const futureValueOfDeviation =
    totalDeviationAmount * Math.pow(1 + realRate, yearsToRetire);
  const deviationHours = futureValueOfDeviation / hourlyRate;

  return {
    targetAccumulatedSavings,
    actualAccumulatedSavings,
    deviation: totalDeviationAmount,
    deviationHours,
    deviationDays: FinanceCalculator.hoursToDays(deviationHours),
    deviationYears: FinanceCalculator.hoursToYears(deviationHours),
    isOnTrack: Math.abs(deviationHours) < CONSTANTS.WORKING_HOURS_PER_DAY,
    isAhead: deviationHours > CONSTANTS.WORKING_HOURS_PER_DAY,
    isBehind: deviationHours < -CONSTANTS.WORKING_HOURS_PER_DAY,
    monthsElapsed,
    requiredMonthlySavings,
  };
}
```

### 4.3 邊緣情況處理

| 情境 | 處理方式 |
|------|---------|
| **用戶剛完成 Onboarding，還沒記錄** | monthsElapsed ≈ 0，目標/實際儲蓄都 ≈ 0，顯示「剛開始旅程」 |
| **用戶中斷記帳 3 個月後恢復** | 時間持續累積（從起點算），空白期算入「應儲蓄期」，實際儲蓄沒增加 → 自然產生落後 |
| **用戶每月記錄 save 類型收入** | 優先使用 save 記錄的總和，而非 `salary × months`（更準確）|
| **目標退休金未設置** | 使用 4% 法則反推：`targetRetirementFund = (salary - monthlySavings) × 300` |
| **requiredMonthlySavings 為負數** | 表示用戶已存夠退休金，顯示「已達成目標，enjoy life！」 |

---

## 5. UI/UX 設計

### 5.1 RetirementProgress 組件改造

**文件位置**：`src/layers/4-ui/pages/HomePage/components/RetirementProgress.tsx`

**折疊狀態（默認）**：

```
┌─────────────────────────────────────┐
│  🎯 退休進度                        │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║ ▓▓▓▓▓▓▓▓▓▓░░░░░░ 62%          ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
│  目標：60 歲  →  預估：58.5 歲 ✓   │
│  提早 1.5 年 · 繼續保持！           │
│                                     │
│  [查看詳情 ▼]                       │
└─────────────────────────────────────┘
```

**展開狀態**：

```
┌─────────────────────────────────────┐
│  🎯 退休進度                        │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║ ▓▓▓▓▓▓▓▓▓▓░░░░░░ 62%          ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
│  目標：60 歲  →  預估：58.5 歲 ✓   │
│  ─────────────────────────────────  │
│                                     │
│  📊 累積進度（使用 3 個月）         │
│  • 目標儲蓄：90,000 元              │
│  • 實際儲蓄：105,000 元 ✓           │
│  • 差距：+15,000 元                 │
│                                     │
│  💰 每月必須儲蓄：30,000 元         │
│                                     │
│  💡 你已經存夠這階段需要的金額！    │
│                                     │
│  [收起 ▲]                           │
└─────────────────────────────────────┘
```

**關鍵設計要素**：
- ✅ 視覺進度條：`百分比 = (實際儲蓄 / 目標儲蓄) × 100%`
- ✅ 圖標區分信息類型：📊 數據、💰 行動、💡 提示
- ✅ 狀態指示：✓（超前綠色）、⚠️（落後橙色）
- ✅ 漸進式揭露：默認折疊，減少信息過載
- ✅ 交互反饋：`cursor-pointer` + hover 效果

### 5.2 記錄卡片的時間成本顯示

**文件位置**：消費記錄相關組件

**正常狀態**：

```
┌─────────────────────────────────────┐
│  ☕ 咖啡                 -150 元     │
│  飲食  •  2026-01-13                │
│  ─────────────────────────────────  │
│  💭 機會成本：0.8 小時               │
│     └ 僅供參考，不計入退休進度      │
└─────────────────────────────────────┘
```

**當月未達標時**：

```
┌─────────────────────────────────────┐
│  ☕ 咖啡                 -150 元     │
│  飲食  •  2026-01-13                │
│  ─────────────────────────────────  │
│  💭 機會成本：0.8 小時               │
│     └ 僅供參考，不計入退休進度      │
│                                     │
│  ⚠️ 本月尚未達標（缺口 5,150 元）   │
└─────────────────────────────────────┘
```

**關鍵設計要素**：
- ✅ 視覺縮進（└）表示次要信息
- ✅ 情境化警示（只在未達標時顯示）
- ✅ 不單純用顏色（符號 + 文字 + 顏色組合）

### 5.3 目標變更校準對話框

**文件位置**：`src/layers/4-ui/components/RecalibrationDialog.tsx`（新建）

**設計**：

```
┌───────────────────────────────────────┐
│  🎯 退休目標已變更                     │
│                                       │
│  60 歲 → 65 歲                        │
│  每月必須儲蓄：30,000 → 20,000 元     │
│  ─────────────────────────────────   │
│                                       │
│  如何處理歷史進度？                   │
│                                       │
│  ○ 重新開始（推薦）                   │
│    └ 清除之前的超前/落後記錄          │
│    └ 預估年齡：60 歲（歸零）          │
│                                       │
│  ● 保留歷史                           │
│    └ 繼續累積之前的進度               │
│    └ 預估年齡：58.5 歲（目前狀態）    │
│                                       │
│  ─────────────────────────────────   │
│  [取消]              [確認變更]       │
└───────────────────────────────────────┘
```

**關鍵設計要素**：
- ✅ 選項簡化為短標題 + 縮進詳情
- ✅ 顯示「選擇後的預估年齡」預覽
- ✅ 標注「推薦」選項
- ✅ CTA 使用主色（信任藍 #3B82F6）

### 5.4 配色方案（基於金融產品最佳實踐）

```typescript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',      // 信任藍（Trust Blue）
      secondary: '#60A5FA',    // 淺藍（輔助）
      warning: '#F97316',      // 警示橙（CTA/Alert）
      success: '#10B981',      // 成功綠
      danger: '#EF4444',       // 危險紅
      muted: '#64748B',        // 灰色文字（參考值用）
    }
  }
}
```

---

## 6. 測試策略

### 6.1 單元測試

**文件位置**：`src/tests/TrajectoryCalculator.test.ts`（新建）

**測試範圍**：
```typescript
describe('TrajectoryCalculator', () => {
  describe('calculateStartDate', () => {
    it('使用 createdAt 當第一筆記錄在 7 天內');
    it('使用 firstRecord - 7天 當超過 7 天才記帳');
    it('沒有記錄時返回 createdAt');
  });

  describe('calculateMonthsElapsed', () => {
    it('正確計算經過的月數（精確到小數）');
  });

  describe('calculateActualSavings', () => {
    it('推算收入 = 月薪 × 經過月數');
    it('排除 guiltFree 和 ended 訂閱');
    it('優先使用 save 記錄總和（如果有）');
  });

  describe('calculateDeviation', () => {
    it('返回超前狀態當實際儲蓄 > 目標儲蓄');
    it('返回落後狀態當實際儲蓄 < 目標儲蓄');
    it('處理歷史偏差疊加');
    it('處理未設置目標退休金的情況');
  });
});
```

**目標覆蓋率**：> 90%

### 6.2 E2E 測試更新

**文件位置**：`src/tests/App.test.tsx`

**新增測試案例**：
```typescript
describe('Trajectory Deviation Model', () => {
  it('首頁顯示基於軌跡的退休年齡');
  it('目標變更時彈出校準對話框');
  it('記錄卡片顯示機會成本參考值');
  it('展開/收起詳細進度信息');
  it('未達標時顯示警示提示');
});
```

**目標測試數量**：93 → 110+

---

## 7. 實現順序

### Phase 1：核心計算層（不影響 UI）

1. ✅ 創建 `TrajectoryCalculator.ts`
2. ✅ 在 `types/index.ts` 新增 `DeviationResult` 類型
3. ✅ 編寫單元測試 `TrajectoryCalculator.test.ts`
4. ✅ 確保算法正確（測試通過）

**估計工作量**：核心開發

### Phase 2：UI 層改造（可見變化）

5. ✅ 修改 `RetirementProgress.tsx`，使用新計算結果
6. ✅ 增加視覺進度條組件
7. ✅ 實現展開/收起詳情功能
8. ✅ 修改記錄卡片，標注「機會成本」為參考值

**估計工作量**：UI 重構

### Phase 3：交互增強

9. ✅ 創建 `RecalibrationDialog.tsx` 組件
10. ✅ 在 Settings 修改目標時觸發對話框
11. ✅ 實現校準邏輯（重新開始 vs 保留歷史）

**估計工作量**：交互功能

### Phase 4：測試與驗證

12. ✅ E2E 測試覆蓋關鍵流程
13. ✅ 手動測試邊緣情況
14. ✅ 性能檢查（如有需要）

**估計工作量**：品質保證

---

## 8. 潛在風險與緩解

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| **算法計算錯誤** | High | 完整單元測試覆蓋，與現有 FinanceCalc 交叉驗證 |
| **UI 信息過載** | Medium | 漸進式揭露，默認折疊詳情 |
| **用戶不理解新邏輯** | Medium | 清晰的 UI 文案，tooltips 解釋關鍵概念 |
| **性能問題（計算過於頻繁）** | Low | 使用 useMemo 緩存計算結果 |
| **校準對話框打斷用戶** | Low | 只在「確認修改」時觸發，提供「取消」選項 |

---

## 9. 成功指標

### 定量指標

- ✅ 單元測試覆蓋率 > 90%
- ✅ E2E 測試數量從 93 增加到 110+
- ✅ 核心計算函數性能 < 10ms

### 定性指標

- ✅ 用戶能清楚理解「我需要每月存多少」
- ✅ 用戶在達標後消費時罪惡感降低
- ✅ 系統能準確反映長期財務軌跡

---

## 10. 未來擴展可能

### 短期（v4.2）

- 增加「月度報告」：顯示本月達標/超支情況
- 支持「動態目標」：月薪變化時自動調整起點

### 長期（v5.0）

- AI 預測：根據歷史消費模式預測未來偏差
- 多目標支持：同時追蹤退休、買房、子女教育等多個目標

---

## 附錄

### A. 關鍵公式總結

```typescript
// 1. 每月必須儲蓄額
requiredMonthlySavings = (targetAmount - FV(currentSavings)) / annuityFactor

// 2. 目標累積儲蓄
targetAccumulatedSavings = requiredMonthlySavings × monthsElapsed

// 3. 實際累積儲蓄
actualAccumulatedSavings = (salary × monthsElapsed) - Σ(spendRecords)

// 4. 偏差（時間成本）
deviationHours = (deviation × (1 + realRate)^yearsToRetire) / hourlyRate

// 5. 預估退休年齡
estimatedRetireAge = targetRetireAge + (deviationHours / WORKING_HOURS_PER_YEAR)
```

### B. 參考資料

- 《Your Money or Your Life》- 機會成本概念來源
- Tailwind CSS 金融產品配色最佳實踐
- React Testing Library 文檔
- TimeBar v3.2 架構文檔（CLAUDE.md）

---

**文檔結束**

**下一步**：使用 `writing-plans` skill 創建詳細的實現計劃。
