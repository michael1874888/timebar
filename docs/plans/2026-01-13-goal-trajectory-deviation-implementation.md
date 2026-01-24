# Goal Trajectory Deviation Model - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 將 TimeBar 的核心邏輯從「絕對機會成本」改為「目標軌跡偏差模型」，減輕用戶心理壓力並提供更準確的財務指引。

**Architecture:** 新增 TrajectoryCalculator 計算引擎，計算「實際儲蓄 vs 目標儲蓄」的累積偏差。修改 RetirementProgress 組件使用新邏輯，增加視覺進度條和詳情展開功能。新增 RecalibrationDialog 處理目標變更時的校準選擇。

**Tech Stack:** TypeScript, React 18, Vitest, Tailwind CSS, Layer 4 UI Architecture

---

## Phase 1: 核心計算層

### Task 1.1: 新增 DeviationResult 型別定義

**Files:**
- Modify: `src/types/index.ts:190` (在文件末尾新增)

**Step 1: 新增型別定義**

在 `src/types/index.ts` 文件末尾新增以下型別：

```typescript
// v4.1: 目標軌跡偏差模型
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
```

**Step 2: 更新 UserData 型別**

在 `UserData` 接口中新增以下字段（約在第 80 行，`createdAt?` 之後）：

```typescript
export interface UserData {
  // ... 現有字段

  // Phase 1: 漸進式揭露功能
  createdAt?: string;                  // 用戶完成 onboarding 的時間戳（ISO 8601格式）

  // v4.1: 目標軌跡偏差模型
  trajectoryStartDate?: string;        // 起點日期 (ISO 8601)
  lastGoalChangeDate?: string;         // 最後一次修改退休目標的日期
  historicalDeviationHours?: number;   // 歷史累積偏差（工作小時）
}
```

**Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add DeviationResult type and UserData fields for trajectory model"
```

---

### Task 1.2: 創建 TrajectoryCalculator - calculateStartDate

**Files:**
- Create: `src/layers/2-domain/calculators/TrajectoryCalculator.ts`
- Create: `src/tests/TrajectoryCalculator.test.ts`

**Step 1: 寫測試（calculateStartDate）**

創建 `src/tests/TrajectoryCalculator.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { TrajectoryCalculator } from '@/layers/2-domain/calculators/TrajectoryCalculator';
import type { UserData, Record } from '@/types';

describe('TrajectoryCalculator', () => {
  describe('calculateStartDate', () => {
    it('使用 createdAt 當第一筆記錄在 7 天內', () => {
      const userData: Partial<UserData> = {
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 100,
          isRecurring: false,
          timeCost: 1,
          category: 'food',
          note: '',
          timestamp: '2026-01-05T12:00:00.000Z',
          date: '2026-01-05',
        },
      ];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      expect(result).toBe('2026-01-01T00:00:00.000Z');
    });

    it('使用 firstRecord - 7天 當超過 7 天才記帳', () => {
      const userData: Partial<UserData> = {
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const records: Record[] = [
        {
          id: '1',
          type: 'spend',
          amount: 100,
          isRecurring: false,
          timeCost: 1,
          category: 'food',
          note: '',
          timestamp: '2026-01-20T12:00:00.000Z',
          date: '2026-01-20',
        },
      ];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      // 2026-01-20 往前推 7 天 = 2026-01-13
      expect(new Date(result).getDate()).toBe(13);
      expect(new Date(result).getMonth()).toBe(0); // January
    });

    it('沒有記錄時返回 createdAt', () => {
      const userData: Partial<UserData> = {
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const records: Record[] = [];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      expect(result).toBe('2026-01-01T00:00:00.000Z');
    });

    it('沒有 createdAt 時使用當前時間', () => {
      const userData: Partial<UserData> = {};
      const records: Record[] = [];

      const result = TrajectoryCalculator.calculateStartDate(
        userData as UserData,
        records
      );

      const resultDate = new Date(result);
      const now = new Date();
      const diffMs = Math.abs(now.getTime() - resultDate.getTime());

      // 應該在 1 秒內
      expect(diffMs).toBeLessThan(1000);
    });
  });
});
```

**Step 2: 運行測試（預期失敗）**

```bash
npm test -- TrajectoryCalculator
```

Expected: FAIL with "Cannot find module '@/layers/2-domain/calculators/TrajectoryCalculator'"

**Step 3: 創建 TrajectoryCalculator 骨架**

創建 `src/layers/2-domain/calculators/TrajectoryCalculator.ts`：

```typescript
/**
 * TimeBar - 目標軌跡偏差計算引擎
 * Layer 2 (Domain Layer) - v4.1
 *
 * 計算用戶相對於退休目標的財務軌跡偏差
 */

import type { UserData, Record, DeviationResult } from '@/types';
import { FinanceCalculator } from './FinanceCalculator';
import { CONSTANTS } from './constants';

/**
 * 軌跡偏差計算引擎
 */
export class TrajectoryCalculator {
  /**
   * 計算軌跡起點（混合方案）
   * 邏輯：max(createdAt, firstRecordDate - 7天)
   *
   * @param userData - 用戶資料
   * @param records - 所有記錄
   * @returns ISO 8601 格式的起點日期
   */
  static calculateStartDate(userData: UserData, records: Record[]): string {
    const { createdAt } = userData;

    // 如果沒有記錄，從 onboarding 完成時算起
    if (!records.length) {
      return createdAt || new Date().toISOString();
    }

    // 找到第一筆記錄的日期
    const firstRecord = records.reduce((earliest, r) =>
      r.timestamp < earliest.timestamp ? r : earliest
    );
    const firstRecordDate = new Date(firstRecord.timestamp);

    // 往前推 7 天
    const sevenDaysBefore = new Date(firstRecordDate);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);

    // 取較晚的日期
    if (!createdAt) {
      return sevenDaysBefore.toISOString();
    }

    const createdAtDate = new Date(createdAt);
    return createdAtDate > sevenDaysBefore
      ? createdAt
      : sevenDaysBefore.toISOString();
  }
}
```

**Step 4: 運行測試（預期通過）**

```bash
npm test -- TrajectoryCalculator
```

Expected: PASS (4 tests)

**Step 5: 提交**

```bash
git add src/layers/2-domain/calculators/TrajectoryCalculator.ts src/tests/TrajectoryCalculator.test.ts
git commit -m "feat: add TrajectoryCalculator.calculateStartDate with tests"
```

---

### Task 1.3: 實現 calculateMonthsElapsed

**Files:**
- Modify: `src/layers/2-domain/calculators/TrajectoryCalculator.ts`
- Modify: `src/tests/TrajectoryCalculator.test.ts`

**Step 1: 新增測試**

在 `src/tests/TrajectoryCalculator.test.ts` 的 `describe('TrajectoryCalculator')` 內新增：

```typescript
describe('calculateMonthsElapsed', () => {
  it('正確計算經過的月數（精確到小數）', () => {
    const startDate = '2026-01-01T00:00:00.000Z';
    // 假設現在是 2026-01-31（經過 1 個月）
    const mockNow = new Date('2026-01-31T00:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateMonthsElapsed(startDate);

    // 30 天 / 30.44 (平均每月天數) ≈ 0.986
    expect(result).toBeCloseTo(0.986, 2);

    Date.now = originalNow;
  });

  it('3個月後計算正確', () => {
    const startDate = '2026-01-01T00:00:00.000Z';
    const mockNow = new Date('2026-04-01T00:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateMonthsElapsed(startDate);

    // 90 天 / 30.44 ≈ 2.96
    expect(result).toBeCloseTo(2.96, 2);

    Date.now = originalNow;
  });

  it('處理小於 1 個月的情況', () => {
    const startDate = '2026-01-01T00:00:00.000Z';
    const mockNow = new Date('2026-01-08T00:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateMonthsElapsed(startDate);

    // 7 天 / 30.44 ≈ 0.23
    expect(result).toBeCloseTo(0.23, 2);

    Date.now = originalNow;
  });
});
```

**Step 2: 運行測試（預期失敗）**

```bash
npm test -- TrajectoryCalculator
```

Expected: FAIL with "TrajectoryCalculator.calculateMonthsElapsed is not a function"

**Step 3: 實現 calculateMonthsElapsed**

在 `TrajectoryCalculator` 類中新增方法：

```typescript
/**
 * 計算經過的月數（精確到小數）
 *
 * @param startDate - ISO 8601 格式的起點日期
 * @returns 經過的月數（小數）
 */
static calculateMonthsElapsed(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays / 30.44; // 平均每月天數
}
```

**Step 4: 運行測試（預期通過）**

```bash
npm test -- TrajectoryCalculator
```

Expected: PASS (7 tests)

**Step 5: 提交**

```bash
git add src/layers/2-domain/calculators/TrajectoryCalculator.ts src/tests/TrajectoryCalculator.test.ts
git commit -m "feat: add calculateMonthsElapsed with tests"
```

---

### Task 1.4: 實現 calculateActualSavings

**Files:**
- Modify: `src/layers/2-domain/calculators/TrajectoryCalculator.ts`
- Modify: `src/tests/TrajectoryCalculator.test.ts`

**Step 1: 新增測試**

在 `src/tests/TrajectoryCalculator.test.ts` 新增：

```typescript
describe('calculateActualSavings', () => {
  it('推算收入 = 月薪 × 經過月數', () => {
    const userData: Partial<UserData> = {
      salary: 80000,
    };
    const records: Record[] = [
      {
        id: '1',
        type: 'spend',
        amount: 5000,
        isRecurring: false,
        timeCost: 5,
        category: 'food',
        note: '',
        timestamp: '2026-01-15T00:00:00.000Z',
        date: '2026-01-15',
      },
    ];
    const monthsElapsed = 1;

    const result = TrajectoryCalculator.calculateActualSavings(
      userData as UserData,
      records,
      monthsElapsed
    );

    // 80,000 × 1 - 5,000 = 75,000
    expect(result).toBe(75000);
  });

  it('排除 guiltFree 記錄', () => {
    const userData: Partial<UserData> = {
      salary: 80000,
    };
    const records: Record[] = [
      {
        id: '1',
        type: 'spend',
        amount: 5000,
        isRecurring: false,
        timeCost: 5,
        category: 'food',
        note: '',
        timestamp: '2026-01-15T00:00:00.000Z',
        date: '2026-01-15',
      },
      {
        id: '2',
        type: 'spend',
        amount: 3000,
        isRecurring: false,
        timeCost: 3,
        category: 'food',
        note: '',
        timestamp: '2026-01-16T00:00:00.000Z',
        date: '2026-01-16',
        guiltFree: true, // 使用免死金牌
      },
    ];
    const monthsElapsed = 1;

    const result = TrajectoryCalculator.calculateActualSavings(
      userData as UserData,
      records,
      monthsElapsed
    );

    // 80,000 × 1 - 5,000 = 75,000 (不計 guiltFree)
    expect(result).toBe(75000);
  });

  it('排除 ended 訂閱', () => {
    const userData: Partial<UserData> = {
      salary: 80000,
    };
    const records: Record[] = [
      {
        id: '1',
        type: 'spend',
        amount: 5000,
        isRecurring: false,
        timeCost: 5,
        category: 'food',
        note: '',
        timestamp: '2026-01-15T00:00:00.000Z',
        date: '2026-01-15',
      },
      {
        id: '2',
        type: 'spend',
        amount: 200,
        isRecurring: true,
        timeCost: 2,
        category: 'entertainment',
        note: '',
        timestamp: '2026-01-16T00:00:00.000Z',
        date: '2026-01-16',
        recurringStatus: 'ended',
      },
    ];
    const monthsElapsed = 1;

    const result = TrajectoryCalculator.calculateActualSavings(
      userData as UserData,
      records,
      monthsElapsed
    );

    // 80,000 × 1 - 5,000 = 75,000 (不計 ended 訂閱)
    expect(result).toBe(75000);
  });

  it('處理多筆記錄', () => {
    const userData: Partial<UserData> = {
      salary: 80000,
    };
    const records: Record[] = [
      { id: '1', type: 'spend', amount: 5000, isRecurring: false, timeCost: 5, category: 'food', note: '', timestamp: '2026-01-15T00:00:00.000Z', date: '2026-01-15' },
      { id: '2', type: 'spend', amount: 3000, isRecurring: false, timeCost: 3, category: 'transport', note: '', timestamp: '2026-01-16T00:00:00.000Z', date: '2026-01-16' },
      { id: '3', type: 'spend', amount: 10000, isRecurring: false, timeCost: 10, category: 'housing', note: '', timestamp: '2026-01-17T00:00:00.000Z', date: '2026-01-17' },
    ];
    const monthsElapsed = 2;

    const result = TrajectoryCalculator.calculateActualSavings(
      userData as UserData,
      records,
      monthsElapsed
    );

    // 80,000 × 2 - (5,000 + 3,000 + 10,000) = 142,000
    expect(result).toBe(142000);
  });
});
```

**Step 2: 運行測試（預期失敗）**

```bash
npm test -- TrajectoryCalculator
```

Expected: FAIL

**Step 3: 實現 calculateActualSavings**

在 `TrajectoryCalculator` 類中新增方法：

```typescript
/**
 * 計算實際累積儲蓄（推算收入 - 記錄支出）
 *
 * @param userData - 用戶資料
 * @param records - 所有記錄
 * @param monthsElapsed - 經過的月數
 * @returns 實際累積儲蓄金額
 */
static calculateActualSavings(
  userData: UserData,
  records: Record[],
  monthsElapsed: number
): number {
  const { salary } = userData;

  // 推算總收入（假設月薪穩定）
  const estimatedIncome = salary * monthsElapsed;

  // 實際支出（排除已豁免和已終止的訂閱）
  const totalSpent = records
    .filter((r) => r.type === 'spend')
    .filter((r) => !r.guiltFree)
    .filter((r) => r.recurringStatus !== 'ended')
    .reduce((sum, r) => sum + r.amount, 0);

  return estimatedIncome - totalSpent;
}
```

**Step 4: 運行測試（預期通過）**

```bash
npm test -- TrajectoryCalculator
```

Expected: PASS (11 tests)

**Step 5: 提交**

```bash
git add src/layers/2-domain/calculators/TrajectoryCalculator.ts src/tests/TrajectoryCalculator.test.ts
git commit -m "feat: add calculateActualSavings with tests"
```

---

### Task 1.5: 實現 calculateDeviation（核心方法）

**Files:**
- Modify: `src/layers/2-domain/calculators/TrajectoryCalculator.ts`
- Modify: `src/tests/TrajectoryCalculator.test.ts`

**Step 1: 新增測試**

在 `src/tests/TrajectoryCalculator.test.ts` 新增：

```typescript
describe('calculateDeviation', () => {
  const createMockUserData = (): UserData => ({
    age: 25,
    salary: 80000,
    retireAge: 60,
    currentSavings: 100000,
    monthlySavings: 30000,
    inflationRate: 2.5,
    roiRate: 6,
    targetRetirementFund: 10000000,
    createdAt: '2026-01-01T00:00:00.000Z',
    trajectoryStartDate: '2026-01-01T00:00:00.000Z',
  });

  it('返回超前狀態當實際儲蓄 > 目標儲蓄', () => {
    const userData = createMockUserData();
    // 模擬經過 1 個月，應該存 30,000，實際存了 50,000（只花 30,000）
    const records: Record[] = [
      {
        id: '1',
        type: 'spend',
        amount: 30000,
        isRecurring: false,
        timeCost: 30,
        category: 'food',
        note: '',
        timestamp: '2026-01-15T00:00:00.000Z',
        date: '2026-01-15',
      },
    ];

    // Mock Date.now() 為 1 個月後
    const mockNow = new Date('2026-02-01T00:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateDeviation({
      userData,
      records,
    });

    expect(result.isAhead).toBe(true);
    expect(result.isBehind).toBe(false);
    expect(result.deviation).toBeGreaterThan(0);
    expect(result.deviationHours).toBeGreaterThan(0);

    Date.now = originalNow;
  });

  it('返回落後狀態當實際儲蓄 < 目標儲蓄', () => {
    const userData = createMockUserData();
    // 模擬經過 1 個月，應該存 30,000，但花了 60,000（實際儲蓄 20,000）
    const records: Record[] = [
      {
        id: '1',
        type: 'spend',
        amount: 60000,
        isRecurring: false,
        timeCost: 60,
        category: 'food',
        note: '',
        timestamp: '2026-01-15T00:00:00.000Z',
        date: '2026-01-15',
      },
    ];

    const mockNow = new Date('2026-02-01T00:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateDeviation({
      userData,
      records,
    });

    expect(result.isAhead).toBe(false);
    expect(result.isBehind).toBe(true);
    expect(result.deviation).toBeLessThan(0);
    expect(result.deviationHours).toBeLessThan(0);

    Date.now = originalNow;
  });

  it('處理歷史偏差疊加', () => {
    const userData = createMockUserData();
    userData.historicalDeviationHours = 100; // 歷史落後 100 小時

    const records: Record[] = [];

    const mockNow = new Date('2026-02-01T00:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateDeviation({
      userData,
      records,
    });

    // 即使當前持平，也應該因為歷史偏差而顯示落後
    expect(result.deviationHours).toBeLessThan(0);

    Date.now = originalNow;
  });

  it('處理剛開始（沒有記錄）的情況', () => {
    const userData = createMockUserData();
    const records: Record[] = [];

    // 剛完成 onboarding（經過 1 小時）
    const mockNow = new Date('2026-01-01T01:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateDeviation({
      userData,
      records,
    });

    expect(result.monthsElapsed).toBeLessThan(0.01); // 接近 0
    expect(result.isOnTrack).toBe(true); // 應該顯示「在軌道上」
    expect(Math.abs(result.deviation)).toBeLessThan(1000); // 偏差很小

    Date.now = originalNow;
  });

  it('計算包含所有必要字段', () => {
    const userData = createMockUserData();
    const records: Record[] = [];

    const mockNow = new Date('2026-02-01T00:00:00.000Z');
    const originalNow = Date.now;
    Date.now = () => mockNow.getTime();

    const result = TrajectoryCalculator.calculateDeviation({
      userData,
      records,
    });

    // 驗證返回值包含所有必要字段
    expect(result).toHaveProperty('targetAccumulatedSavings');
    expect(result).toHaveProperty('actualAccumulatedSavings');
    expect(result).toHaveProperty('deviation');
    expect(result).toHaveProperty('deviationHours');
    expect(result).toHaveProperty('deviationDays');
    expect(result).toHaveProperty('deviationYears');
    expect(result).toHaveProperty('isOnTrack');
    expect(result).toHaveProperty('isAhead');
    expect(result).toHaveProperty('isBehind');
    expect(result).toHaveProperty('monthsElapsed');
    expect(result).toHaveProperty('requiredMonthlySavings');

    Date.now = originalNow;
  });
});
```

**Step 2: 運行測試（預期失敗）**

```bash
npm test -- TrajectoryCalculator
```

Expected: FAIL

**Step 3: 實現 calculateDeviation**

在 `TrajectoryCalculator` 類中新增主計算方法：

```typescript
/**
 * 計算用戶相對於目標軌跡的偏差
 *
 * @param params.userData - 用戶資料
 * @param params.records - 所有記錄
 * @returns 偏差計算結果
 */
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

  // 如果沒有設置目標退休金，使用 4% 法則反推
  const targetRetirementFund =
    userData.targetRetirementFund ||
    FinanceCalculator.monthlyToFund(userData.salary - userData.monthlySavings);

  const requiredMonthlySavings = FinanceCalculator.requiredMonthlySavings({
    currentSavings: userData.currentSavings,
    targetAmount: targetRetirementFund,
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

**Step 4: 運行測試（預期通過）**

```bash
npm test -- TrajectoryCalculator
```

Expected: PASS (16 tests)

**Step 5: 導出到 index**

修改 `src/layers/2-domain/calculators/index.ts`，新增導出：

```typescript
export { TrajectoryCalculator } from './TrajectoryCalculator';
```

**Step 6: 提交**

```bash
git add src/layers/2-domain/calculators/TrajectoryCalculator.ts src/layers/2-domain/calculators/index.ts src/tests/TrajectoryCalculator.test.ts
git commit -m "feat: add calculateDeviation (core trajectory calculator) with tests"
```

---

## Phase 2: UI 層改造

### Task 2.1: 修改 RetirementProgress 使用新邏輯

**Files:**
- Modify: `src/layers/4-ui/features/retirement-progress/RetirementProgress.tsx`

**Step 1: 讀取現有組件**

先讀取現有的 RetirementProgress 組件以了解結構。

**Step 2: 修改計算邏輯**

找到使用 `GPSCalc.calculateEstimatedAge` 的地方，替換為 `TrajectoryCalculator.calculateDeviation`。

假設原代碼類似：

```typescript
// 舊邏輯
const gpsResult = GPSCalc.calculateEstimatedAge(
  userData.retireAge,
  allRecords
);
const estimatedAge = gpsResult.estimatedAge;
```

修改為：

```typescript
// 新邏輯
import { TrajectoryCalculator } from '@/layers/2-domain/calculators';

const deviation = TrajectoryCalculator.calculateDeviation({
  userData,
  records: allRecords,
});

const estimatedAge = userData.retireAge + deviation.deviationYears;
```

**Step 3: 運行開發服務器測試**

```bash
npm run dev
```

訪問 http://localhost:5173/timebar/ 並檢查首頁是否正常顯示退休進度。

**Step 4: 提交**

```bash
git add src/layers/4-ui/features/retirement-progress/RetirementProgress.tsx
git commit -m "refactor: use TrajectoryCalculator in RetirementProgress"
```

---

### Task 2.2: 增加進度條組件

**Files:**
- Modify: `src/layers/4-ui/features/retirement-progress/RetirementProgress.tsx`

**Step 1: 增加進度條 UI**

在 RetirementProgress 組件中新增進度條顯示：

```typescript
// 在組件內計算進度百分比
const progressPercentage = Math.min(
  100,
  Math.max(
    0,
    (deviation.actualAccumulatedSavings / deviation.targetAccumulatedSavings) *
      100
  )
);

// 在 JSX 中新增進度條
<div className="mb-4">
  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
    <div
      className={`h-full flex items-center justify-end pr-3 text-sm font-medium text-white transition-all duration-500 ${
        deviation.isAhead
          ? 'bg-success'
          : deviation.isBehind
          ? 'bg-warning'
          : 'bg-primary'
      }`}
      style={{ width: `${progressPercentage}%` }}
    >
      {progressPercentage > 10 && `${Math.round(progressPercentage)}%`}
    </div>
  </div>
</div>
```

**Step 2: 測試視覺效果**

```bash
npm run dev
```

檢查進度條是否正確顯示，顏色是否根據狀態變化。

**Step 3: 提交**

```bash
git add src/layers/4-ui/features/retirement-progress/RetirementProgress.tsx
git commit -m "feat: add visual progress bar to RetirementProgress"
```

---

### Task 2.3: 實現展開/收起詳情功能

**Files:**
- Modify: `src/layers/4-ui/features/retirement-progress/RetirementProgress.tsx`

**Step 1: 新增狀態管理**

```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

**Step 2: 新增詳情內容**

```typescript
{isExpanded && (
  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        📊 累積進度（使用 {Math.round(deviation.monthsElapsed * 10) / 10} 個月）
      </p>
      <ul className="space-y-1 text-sm">
        <li className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">• 目標儲蓄：</span>
          <span className="font-medium">
            {Formatters.formatCurrency(deviation.targetAccumulatedSavings)} 元
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">• 實際儲蓄：</span>
          <span
            className={`font-medium ${
              deviation.isAhead
                ? 'text-success'
                : deviation.isBehind
                ? 'text-warning'
                : ''
            }`}
          >
            {Formatters.formatCurrency(deviation.actualAccumulatedSavings)} 元{' '}
            {deviation.isAhead && '✓'}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">• 差距：</span>
          <span
            className={`font-medium ${
              deviation.deviation > 0 ? 'text-success' : 'text-warning'
            }`}
          >
            {deviation.deviation > 0 ? '+' : ''}
            {Formatters.formatCurrency(deviation.deviation)} 元
          </span>
        </li>
      </ul>
    </div>

    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        💰 每月必須儲蓄：
      </p>
      <p className="text-base font-semibold">
        {Formatters.formatCurrency(deviation.requiredMonthlySavings)} 元
      </p>
    </div>

    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
      <p className="text-sm text-blue-800 dark:text-blue-200">
        💡{' '}
        {deviation.isAhead
          ? '你已經存夠這階段需要的金額！'
          : deviation.isBehind
          ? '需要加快儲蓄速度以達成目標。'
          : '保持當前儲蓄速度即可達標。'}
      </p>
    </div>
  </div>
)}
```

**Step 3: 新增展開/收起按鈕**

```typescript
<button
  onClick={() => setIsExpanded(!isExpanded)}
  className="mt-3 text-sm text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer transition-colors"
>
  {isExpanded ? '收起 ▲' : '查看詳情 ▼'}
</button>
```

**Step 4: 測試交互**

```bash
npm run dev
```

點擊按鈕確認展開/收起功能正常。

**Step 5: 提交**

```bash
git add src/layers/4-ui/features/retirement-progress/RetirementProgress.tsx
git commit -m "feat: add expand/collapse details in RetirementProgress"
```

---

### Task 2.4: 修改記錄卡片顯示機會成本參考值

**Files:**
- Find and Modify: Record card components (需要先找到顯示記錄的組件)

**Step 1: 找到記錄卡片組件**

```bash
# 搜尋顯示 timeCost 的組件
grep -r "timeCost" src/components src/layers --include="*.tsx"
```

**Step 2: 修改顯示邏輯**

假設找到的組件中有類似代碼：

```typescript
// 舊顯示
<p className="text-sm">時間成本：{record.timeCost} 小時</p>
```

修改為：

```typescript
// 新顯示
<div className="text-sm text-muted">
  <p>💭 機會成本：{Math.round(record.timeCost * 10) / 10} 小時</p>
  <p className="text-xs ml-5 text-gray-500 dark:text-gray-400">
    └ 僅供參考，不計入退休進度
  </p>
</div>
```

**Step 3: 測試顯示效果**

```bash
npm run dev
```

創建一筆消費記錄，檢查卡片顯示是否正確。

**Step 4: 提交**

```bash
git add <modified-file>
git commit -m "refactor: mark timeCost as reference value in record cards"
```

---

## Phase 3: 交互增強

### Task 3.1: 創建 RecalibrationDialog 組件

**Files:**
- Create: `src/layers/4-ui/components/RecalibrationDialog.tsx`

**Step 1: 創建組件骨架**

```typescript
/**
 * 目標變更校準對話框
 * 當用戶修改退休目標時，詢問是否重新校準進度
 */

import React from 'react';

interface RecalibrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  oldGoal: {
    retireAge: number;
    requiredMonthlySavings: number;
  };
  newGoal: {
    retireAge: number;
    requiredMonthlySavings: number;
  };
  currentEstimatedAge: number;
  onConfirm: (shouldReset: boolean) => void;
}

export const RecalibrationDialog: React.FC<RecalibrationDialogProps> = ({
  isOpen,
  onClose,
  oldGoal,
  newGoal,
  currentEstimatedAge,
  onConfirm,
}) => {
  const [selectedOption, setSelectedOption] = React.useState<'reset' | 'keep'>(
    'reset'
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedOption === 'reset');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">🎯 退休目標已變更</h2>

        <div className="mb-4 text-sm">
          <p className="mb-2">
            {oldGoal.retireAge} 歲 → {newGoal.retireAge} 歲
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            每月必須儲蓄：
            {Math.round(oldGoal.requiredMonthlySavings).toLocaleString()} →{' '}
            {Math.round(newGoal.requiredMonthlySavings).toLocaleString()} 元
          </p>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-700" />

        <p className="text-sm font-medium mb-3">如何處理歷史進度？</p>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="calibration"
              value="reset"
              checked={selectedOption === 'reset'}
              onChange={() => setSelectedOption('reset')}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium">重新開始（推薦）</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                └ 清除之前的超前/落後記錄
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                └ 預估年齡：{newGoal.retireAge} 歲（歸零）
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="calibration"
              value="keep"
              checked={selectedOption === 'keep'}
              onChange={() => setSelectedOption('keep')}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-medium">保留歷史</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                └ 繼續累積之前的進度
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                └ 預估年齡：{Math.round(currentEstimatedAge * 10) / 10} 歲（目前狀態）
              </p>
            </div>
          </label>
        </div>

        <hr className="my-4 border-gray-200 dark:border-gray-700" />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            確認變更
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: 測試對話框顯示**

創建臨時測試頁面或在現有頁面中測試對話框。

**Step 3: 提交**

```bash
git add src/layers/4-ui/components/RecalibrationDialog.tsx
git commit -m "feat: create RecalibrationDialog component"
```

---

### Task 3.2: 在 Settings 中集成校準對話框

**Files:**
- Find and Modify: Settings page component

**Step 1: 找到 Settings 組件**

```bash
find src -name "*Settings*.tsx" -o -name "*settings*.tsx"
```

**Step 2: 導入對話框並新增狀態**

```typescript
import { RecalibrationDialog } from '@/layers/4-ui/components/RecalibrationDialog';
import { TrajectoryCalculator } from '@/layers/2-domain/calculators';

const [showRecalibrationDialog, setShowRecalibrationDialog] = useState(false);
const [pendingGoalChange, setPendingGoalChange] = useState<{
  oldGoal: { retireAge: number; requiredMonthlySavings: number };
  newGoal: { retireAge: number; requiredMonthlySavings: number };
} | null>(null);
```

**Step 3: 修改目標變更邏輯**

假設原有代碼類似：

```typescript
const handleRetireAgeChange = (newAge: number) => {
  setUserData({ ...userData, retireAge: newAge });
  SettingsSystem.saveSetting('retireAge', newAge);
};
```

修改為：

```typescript
const handleRetireAgeChange = (newAge: number) => {
  // 計算舊的和新的必須儲蓄額
  const realRate = FinanceCalculator.realRate(
    userData.inflationRate,
    userData.roiRate
  );

  const oldRequiredSavings = FinanceCalculator.requiredMonthlySavings({
    currentSavings: userData.currentSavings,
    targetAmount: userData.targetRetirementFund || FinanceCalculator.monthlyToFund(userData.salary - userData.monthlySavings),
    years: userData.retireAge - userData.age,
    rate: realRate,
  });

  const newRequiredSavings = FinanceCalculator.requiredMonthlySavings({
    currentSavings: userData.currentSavings,
    targetAmount: userData.targetRetirementFund || FinanceCalculator.monthlyToFund(userData.salary - userData.monthlySavings),
    years: newAge - userData.age,
    rate: realRate,
  });

  // 顯示校準對話框
  setPendingGoalChange({
    oldGoal: {
      retireAge: userData.retireAge,
      requiredMonthlySavings: oldRequiredSavings,
    },
    newGoal: {
      retireAge: newAge,
      requiredMonthlySavings: newRequiredSavings,
    },
  });
  setShowRecalibrationDialog(true);
};

const handleRecalibrationConfirm = (shouldReset: boolean) => {
  if (!pendingGoalChange) return;

  const newAge = pendingGoalChange.newGoal.retireAge;

  if (shouldReset) {
    // 重新開始：清除歷史偏差
    SettingsSystem.saveSetting('historicalDeviationHours', 0);
    SettingsSystem.saveSetting('trajectoryStartDate', new Date().toISOString());
  } else {
    // 保留歷史：將當前偏差存入歷史
    const deviation = TrajectoryCalculator.calculateDeviation({
      userData,
      records: allRecords,
    });
    SettingsSystem.saveSetting('historicalDeviationHours', deviation.deviationHours);
  }

  // 更新目標
  setUserData({ ...userData, retireAge: newAge });
  SettingsSystem.saveSetting('retireAge', newAge);
  SettingsSystem.saveSetting('lastGoalChangeDate', new Date().toISOString());

  setPendingGoalChange(null);
};
```

**Step 4: 新增對話框渲染**

```typescript
<RecalibrationDialog
  isOpen={showRecalibrationDialog}
  onClose={() => {
    setShowRecalibrationDialog(false);
    setPendingGoalChange(null);
  }}
  oldGoal={pendingGoalChange?.oldGoal || { retireAge: 0, requiredMonthlySavings: 0 }}
  newGoal={pendingGoalChange?.newGoal || { retireAge: 0, requiredMonthlySavings: 0 }}
  currentEstimatedAge={
    userData.retireAge +
    TrajectoryCalculator.calculateDeviation({ userData, records: allRecords })
      .deviationYears
  }
  onConfirm={handleRecalibrationConfirm}
/>
```

**Step 5: 測試流程**

```bash
npm run dev
```

進入設定頁面，修改退休年齡，確認對話框彈出並功能正常。

**Step 6: 提交**

```bash
git add <settings-file>
git commit -m "feat: integrate RecalibrationDialog in Settings"
```

---

## Phase 4: 測試與驗證

### Task 4.1: 新增 E2E 測試

**Files:**
- Modify: `src/tests/App.test.tsx` (需要先檢查文件是否存在)

**Step 1: 新增測試 describe 區塊**

在 `App.test.tsx` 文件末尾新增：

```typescript
describe('Trajectory Deviation Model E2E', () => {
  it('首頁顯示基於軌跡的退休年齡', async () => {
    // 設置用戶數據
    const mockUserData: UserData = {
      age: 25,
      salary: 80000,
      retireAge: 60,
      currentSavings: 100000,
      monthlySavings: 30000,
      inflationRate: 2.5,
      roiRate: 6,
      targetRetirementFund: 10000000,
      createdAt: '2026-01-01T00:00:00.000Z',
      trajectoryStartDate: '2026-01-01T00:00:00.000Z',
    };

    // 模擬存儲
    localStorage.setItem('timebar_userData', JSON.stringify(mockUserData));
    localStorage.setItem('timebar_records', JSON.stringify([]));

    render(<App />);

    // 等待首頁加載
    await waitFor(() => {
      expect(screen.getByText(/退休進度/i)).toBeInTheDocument();
    });

    // 驗證顯示預估年齡
    expect(screen.getByText(/預估/i)).toBeInTheDocument();
  });

  it('展開/收起詳細進度信息', async () => {
    const mockUserData: UserData = {
      age: 25,
      salary: 80000,
      retireAge: 60,
      currentSavings: 100000,
      monthlySavings: 30000,
      inflationRate: 2.5,
      roiRate: 6,
      targetRetirementFund: 10000000,
      createdAt: '2026-01-01T00:00:00.000Z',
      trajectoryStartDate: '2026-01-01T00:00:00.000Z',
    };

    localStorage.setItem('timebar_userData', JSON.stringify(mockUserData));
    localStorage.setItem('timebar_records', JSON.stringify([]));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/退休進度/i)).toBeInTheDocument();
    });

    // 點擊「查看詳情」
    const detailsButton = screen.getByText(/查看詳情/i);
    fireEvent.click(detailsButton);

    // 驗證詳情顯示
    await waitFor(() => {
      expect(screen.getByText(/累積進度/i)).toBeInTheDocument();
      expect(screen.getByText(/每月必須儲蓄/i)).toBeInTheDocument();
    });

    // 點擊「收起」
    const collapseButton = screen.getByText(/收起/i);
    fireEvent.click(collapseButton);

    // 驗證詳情隱藏
    await waitFor(() => {
      expect(screen.queryByText(/累積進度/i)).not.toBeInTheDocument();
    });
  });

  it('記錄卡片顯示機會成本參考值', async () => {
    const mockUserData: UserData = {
      age: 25,
      salary: 80000,
      retireAge: 60,
      currentSavings: 100000,
      monthlySavings: 30000,
      inflationRate: 2.5,
      roiRate: 6,
      targetRetirementFund: 10000000,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const mockRecords: Record[] = [
      {
        id: '1',
        type: 'spend',
        amount: 150,
        isRecurring: false,
        timeCost: 0.8,
        category: 'food',
        note: '咖啡',
        timestamp: '2026-01-15T12:00:00.000Z',
        date: '2026-01-15',
      },
    ];

    localStorage.setItem('timebar_userData', JSON.stringify(mockUserData));
    localStorage.setItem('timebar_records', JSON.stringify(mockRecords));

    render(<App />);

    // 導航到歷史頁面（假設有歷史頁面）
    // ... 導航邏輯

    // 驗證顯示「機會成本」和「僅供參考」
    await waitFor(() => {
      expect(screen.getByText(/機會成本/i)).toBeInTheDocument();
      expect(screen.getByText(/僅供參考/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: 運行測試**

```bash
npm test
```

Expected: 新增的測試應該通過

**Step 3: 提交**

```bash
git add src/tests/App.test.tsx
git commit -m "test: add E2E tests for trajectory deviation model"
```

---

### Task 4.2: 運行所有測試確保無回歸

**Step 1: 運行完整測試套件**

```bash
npm test
```

Expected: 所有測試通過，測試數量從 93 增加到 110+

**Step 2: 檢查覆蓋率**

```bash
npm test:coverage
```

Expected: TrajectoryCalculator 覆蓋率 > 90%

**Step 3: 如有失敗，修復並重新測試**

**Step 4: 最終提交**

```bash
git add .
git commit -m "test: ensure all tests pass with trajectory deviation model"
```

---

### Task 4.3: 手動測試關鍵流程

**Step 1: 測試新用戶流程**

1. 清空 localStorage
2. 完成 Onboarding
3. 檢查首頁退休進度顯示是否正確
4. 創建幾筆消費記錄
5. 檢查進度條和預估年齡是否更新

**Step 2: 測試目標變更流程**

1. 進入設定頁面
2. 修改退休年齡
3. 驗證校準對話框彈出
4. 選擇「重新開始」並確認
5. 返回首頁檢查進度是否重置

**Step 3: 測試展開/收起功能**

1. 在首頁點擊「查看詳情」
2. 驗證詳細信息顯示正確
3. 點擊「收起」
4. 驗證詳情隱藏

**Step 4: 記錄測試結果**

創建測試報告文件：

```bash
echo "# Manual Testing Report - Trajectory Deviation Model

## Test Date: $(date)

### New User Flow
- [ ] Onboarding completed successfully
- [ ] Home page shows retirement progress
- [ ] Creating records updates progress correctly

### Goal Change Flow
- [ ] Settings page allows changing retire age
- [ ] Recalibration dialog appears
- [ ] Reset option works correctly
- [ ] Keep history option works correctly

### UI Interactions
- [ ] Expand/collapse details works
- [ ] Progress bar displays correctly
- [ ] Record cards show reference value label

## Issues Found
(List any issues discovered during testing)

## Notes
(Additional observations)
" > docs/manual-testing-report.md
```

**Step 5: 提交測試報告**

```bash
git add docs/manual-testing-report.md
git commit -m "docs: add manual testing report"
```

---

### Task 4.4: 性能檢查

**Step 1: 測量計算性能**

創建性能測試文件 `src/tests/performance.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import { TrajectoryCalculator } from '@/layers/2-domain/calculators/TrajectoryCalculator';
import type { UserData, Record } from '@/types';

describe('Performance Tests', () => {
  it('calculateDeviation 執行時間 < 10ms', () => {
    const userData: UserData = {
      age: 25,
      salary: 80000,
      retireAge: 60,
      currentSavings: 100000,
      monthlySavings: 30000,
      inflationRate: 2.5,
      roiRate: 6,
      targetRetirementFund: 10000000,
      createdAt: '2026-01-01T00:00:00.000Z',
      trajectoryStartDate: '2026-01-01T00:00:00.000Z',
    };

    const records: Record[] = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      type: 'spend' as const,
      amount: 100,
      isRecurring: false,
      timeCost: 1,
      category: 'food',
      note: '',
      timestamp: `2026-01-${String(i % 28 + 1).padStart(2, '0')}T12:00:00.000Z`,
      date: `2026-01-${String(i % 28 + 1).padStart(2, '0')}`,
    }));

    const startTime = performance.now();
    TrajectoryCalculator.calculateDeviation({ userData, records });
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`calculateDeviation execution time: ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(10);
  });

  it('處理 1000 筆記錄的性能', () => {
    const userData: UserData = {
      age: 25,
      salary: 80000,
      retireAge: 60,
      currentSavings: 100000,
      monthlySavings: 30000,
      inflationRate: 2.5,
      roiRate: 6,
      targetRetirementFund: 10000000,
      createdAt: '2026-01-01T00:00:00.000Z',
      trajectoryStartDate: '2026-01-01T00:00:00.000Z',
    };

    const records: Record[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i}`,
      type: 'spend' as const,
      amount: 100,
      isRecurring: false,
      timeCost: 1,
      category: 'food',
      note: '',
      timestamp: `2026-01-${String((i % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
      date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
    }));

    const startTime = performance.now();
    TrajectoryCalculator.calculateDeviation({ userData, records });
    const endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`1000 records execution time: ${duration.toFixed(2)}ms`);

    // 1000 筆記錄應該在 50ms 內完成
    expect(duration).toBeLessThan(50);
  });
});
```

**Step 2: 運行性能測試**

```bash
npm test -- performance
```

Expected: 所有性能測試通過

**Step 3: 如需優化，使用 useMemo**

在 RetirementProgress 組件中：

```typescript
const deviation = useMemo(
  () =>
    TrajectoryCalculator.calculateDeviation({
      userData,
      records: allRecords,
    }),
  [userData, allRecords]
);
```

**Step 4: 提交**

```bash
git add src/tests/performance.test.ts
git commit -m "test: add performance tests for trajectory calculator"
```

---

### Task 4.5: 更新 CLAUDE.md 文檔

**Files:**
- Modify: `CLAUDE.md`

**Step 1: 新增版本歷史**

在 CLAUDE.md 的 Version History Context 區塊新增：

```markdown
- **v4.1** (2026-01-13): Goal Trajectory Deviation Model
  - 核心邏輯從「絕對機會成本」改為「目標軌跡偏差」
  - 新增 `TrajectoryCalculator` 計算引擎
  - 退休年齡 = 目標年齡 + (實際儲蓄 vs 必須儲蓄的偏差)
  - 單筆記錄的時間成本降級為「參考值」
  - 目標變更時支持用戶選擇是否校準歷史進度
  - 混合起點：max(createdAt, firstRecordDate - 7天)
  - Tests: 93 → 110+ (新增 TrajectoryCalculator 測試)
  - 新增 RecalibrationDialog 組件
  - RetirementProgress 增加視覺進度條和詳情展開功能
```

**Step 2: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with v4.1 changes"
```

---

### Task 4.6: 最終 Build 驗證

**Step 1: 運行生產構建**

```bash
npm run build
```

Expected: Build 成功，無錯誤

**Step 2: 預覽生產版本**

```bash
npm run preview
```

訪問並測試所有關鍵功能

**Step 3: 檢查 Bundle 大小**

查看 dist/ 目錄，確保新增代碼沒有顯著增加 bundle 大小

**Step 4: 最終提交**

```bash
git add .
git commit -m "chore: final build verification for v4.1"
```

---

## 完成檢查清單

- [ ] Phase 1: 核心計算層完成（TrajectoryCalculator + 測試）
- [ ] Phase 2: UI 層改造完成（RetirementProgress + 記錄卡片）
- [ ] Phase 3: 交互增強完成（RecalibrationDialog + 校準邏輯）
- [ ] Phase 4: 測試與驗證完成（E2E 測試 + 手動測試 + 性能測試）
- [ ] 所有測試通過（110+ 測試）
- [ ] 測試覆蓋率 > 90%
- [ ] 手動測試無明顯 bug
- [ ] 性能符合要求（< 10ms）
- [ ] 文檔已更新
- [ ] Build 成功

---

**Implementation Plan Complete**

Total tasks: 23 tasks across 4 phases
Estimated time: 3-4 hours (assuming no major blockers)

**下一步**：使用 `superpowers:executing-plans` 或 `superpowers:subagent-driven-development` 執行此計劃。
