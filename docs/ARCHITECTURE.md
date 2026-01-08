# TimeBar 四層架構技術文檔

> 版本: 3.1.0
> 最後更新: 2026-01-08

---

## 目錄

1. [架構概述](#架構概述)
2. [目錄結構](#目錄結構)
3. [各層詳解](#各層詳解)
4. [設計系統](#設計系統)
5. [使用指南](#使用指南)
6. [遷移指南](#遷移指南)

---

## 架構概述

TimeBar 採用**四層架構**設計，確保關注點分離、易於測試和維護：

```
┌─────────────────────────────────────┐
│       Layer 4: UI (用戶界面)         │
│    Pages, Features, Molecules, Atoms │
├─────────────────────────────────────┤
│     Layer 3: Business (業務邏輯)     │
│         Hooks, State, Validators     │
├─────────────────────────────────────┤
│      Layer 2: Domain (領域邏輯)      │
│        Calculators, Types, Utils     │
├─────────────────────────────────────┤
│       Layer 1: Data (數據存取)       │
│          Storage, API, Adapters      │
└─────────────────────────────────────┘
```

### 依賴規則

- 每層**只能依賴下一層**
- 禁止跨層依賴（如 Layer 4 直接依賴 Layer 1）
- 禁止反向依賴（如 Layer 2 依賴 Layer 3）

---

## 目錄結構

```
src/layers/
├── 1-data/                    # Layer 1: 數據層
│   ├── storage/               # 存儲抽象
│   │   ├── types.ts           # IStorage 接口
│   │   ├── LocalStorageAdapter.ts
│   │   ├── SessionStorageAdapter.ts
│   │   ├── StorageFactory.ts
│   │   └── index.ts
│   ├── api/                   # API 抽象
│   │   ├── types.ts           # ICloudSync 接口
│   │   ├── GoogleSheetsAdapter.ts
│   │   └── index.ts
│   └── index.ts
│
├── 2-domain/                  # Layer 2: 領域層
│   ├── calculators/           # 計算引擎 (純函數)
│   │   ├── FinanceCalculator.ts
│   │   ├── GPSCalculator.ts
│   │   ├── TimeCalculator.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── types/                 # 類型定義
│   │   ├── calculator.types.ts
│   │   └── index.ts
│   └── index.ts
│
├── 3-business/                # Layer 3: 業務層
│   ├── hooks/                 # Custom Hooks
│   │   ├── useFinance.ts
│   │   ├── useGPS.ts
│   │   ├── useRecords.ts
│   │   ├── useSync.ts
│   │   └── index.ts
│   └── index.ts
│
├── 4-ui/                      # Layer 4: UI 層
│   ├── design-system/         # 設計系統
│   │   ├── tokens/            # Design Tokens
│   │   ├── atoms/             # 原子組件
│   │   ├── molecules/         # 分子組件
│   │   └── index.ts
│   ├── features/              # 功能組件
│   │   ├── retirement-progress/
│   │   ├── amount-input/
│   │   ├── time-cost-display/
│   │   ├── decision-buttons/
│   │   └── index.ts
│   ├── pages/                 # 頁面組件
│   │   ├── HomePage/
│   │   ├── HistoryPage/
│   │   └── index.ts
│   └── index.ts
│
└── index.ts                   # 統一入口
```

---

## 各層詳解

### Layer 1: 數據層 (Data)

負責所有外部數據交互，包括本地存儲和雲端 API。

#### 存儲接口

```typescript
import { StorageFactory, type IStorage } from '@data';

// 創建存儲實例
const storage = StorageFactory.create('local');  // 或 'session', 'memory'

// 使用
await storage.save('key', { foo: 'bar' });
const data = await storage.load<MyType>('key');
await storage.remove('key');
```

#### API 接口

```typescript
import { googleSheetsAPI, type Result } from '@data';

// 獲取數據
const result: Result<UserDataDTO> = await googleSheetsAPI.getUserData();
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

---

### Layer 2: 領域層 (Domain)

包含所有業務計算邏輯，全部為**純函數**，無副作用。

```typescript
import { FinanceCalculator, GPSCalculator, TimeCalculator } from '@domain';

// 計算時間成本
const timeCost = FinanceCalculator.calculateTimeCost({
  amount: 5000,
  hourlyRate: 312.5,
  isRecurring: false,
  retirementYears: 35,
  returnRate: 0.06,
});

// 計算 GPS 狀態
const status = GPSCalculator.calculateStatus(65.0, 65);

// 格式化時間
const formatted = TimeCalculator.formatHumanReadable(timeCost);
```

---

### Layer 3: 業務層 (Business)

封裝 React 狀態邏輯的 Hooks，連接領域層和 UI 層。

```typescript
import { useFinance, useGPS, useRecords, useSync } from '@business';

function MyComponent() {
  const { calculateTimeCost, formatTimeCost } = useFinance(userData);
  const { status, config } = useGPS(userData);
  const { records, addRecord, deleteRecord } = useRecords(initialRecords);
  const { syncAll, status: syncStatus } = useSync();
  
  // ...
}
```

---

### Layer 4: UI 層 (UI)

所有可視組件，從原子到頁面。

#### 原子組件

```tsx
import { Button, Badge, Input } from '@ui';

<Button variant="primary" size="md" loading={isLoading}>
  提交
</Button>

<Badge variant="success">成功</Badge>

<Input
  label="金額"
  leftAddon="$"
  error={error}
/>
```

#### 分子組件

```tsx
import { Card, Modal } from '@ui';

<Card title="標題" clickable onClick={handleClick}>
  內容
</Card>

<Modal isOpen={open} onClose={() => setOpen(false)} title="確認">
  確定要執行嗎？
</Modal>
```

#### 功能組件

```tsx
import { RetirementProgress, AmountInput, TimeCostDisplay, DecisionButtons } from '@ui';

<RetirementProgress
  estimatedAge={65.2}
  targetAge={65}
  currentAge={30}
  points={150}
/>
```

#### 頁面組件

```tsx
import { HomePage, HistoryPage } from '@ui';

<HomePage
  userData={userData}
  records={records}
  onAddRecord={handleAddRecord}
  points={points}
/>

<HistoryPage
  records={records}
  onBack={() => navigate('home')}
  onDeleteRecord={handleDelete}
/>
```

---

## 設計系統

### Design Tokens

```typescript
import { ColorTokens, SpacingTokens, resolveColor } from '@ui';

// 直接使用
const primaryColor = ColorTokens.semantic.primary.DEFAULT; // '#10b981'

// 使用 resolver
const color = resolveColor('semantic.primary.DEFAULT');
```

### 色彩系統

| Token 路徑 | 值 | 用途 |
|-----------|-----|------|
| `semantic.primary.DEFAULT` | #10b981 | 主要操作 |
| `semantic.secondary.DEFAULT` | #3b82f6 | 次要操作 |
| `state.ahead.bar` | #10b981 | GPS 領先 |
| `state.behind.bar` | #f97316 | GPS 落後 |

---

## 使用指南

### Path Aliases

```typescript
// ✅ 正確使用
import { Button } from '@ui';
import { useFinance } from '@business';
import { FinanceCalculator } from '@domain';
import { StorageFactory } from '@data';

// ❌ 錯誤：跨層依賴
import { StorageFactory } from '@data'; // 在 Layer 2 使用
```

### 添加新組件

1. **原子組件** → `src/layers/4-ui/design-system/atoms/`
2. **分子組件** → `src/layers/4-ui/design-system/molecules/`
3. **功能組件** → `src/layers/4-ui/features/`
4. **頁面組件** → `src/layers/4-ui/pages/`

### 添加新 Hook

1. 在 `src/layers/3-business/hooks/` 創建檔案
2. 在 `index.ts` 中導出
3. Hook 只依賴 `@domain` 層

---

## 遷移指南

### 從舊代碼遷移

#### 1. 計算邏輯

```typescript
// 舊
import { FinanceCalc } from '@/utils/financeCalc';
const cost = FinanceCalc.calculateTimeCost(params);

// 新
import { FinanceCalculator } from '@domain';
const cost = FinanceCalculator.calculateTimeCost(params);
```

#### 2. 存儲

```typescript
// 舊
localStorage.setItem('key', JSON.stringify(value));

// 新
import { defaultStorage } from '@data';
await defaultStorage.save('key', value);
```

#### 3. 組件

```typescript
// 舊
import { LifeBattery } from '@/components/LifeBattery';

// 新
import { RetirementProgress } from '@ui';
```

### Feature Flags

使用 Feature Flags 進行漸進式遷移：

```typescript
import { FeatureFlags } from '@/config';

if (FeatureFlags.useNewHomePage) {
  return <HomePage />;
} else {
  return <LegacyDashboard />;
}
```

---

## 附錄

### 構建命令

```bash
# 開發
npm run dev

# 構建
npm run build

# 測試
npm test
```

### 相關文檔

- [REFACTORING-PLAN.md](./REFACTORING-PLAN.md) - 完整重構計劃
- [UI-UX-ANALYSIS-AND-REDESIGN.md](./UI-UX-ANALYSIS-AND-REDESIGN.md) - UI/UX 設計分析
