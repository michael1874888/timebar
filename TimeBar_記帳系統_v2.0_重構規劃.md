# TimeBar v2.0 - 記帳系統重構規劃

> **版本**: v2.0  
> **日期**: 2026-01-03  
> **目標**: 從「只能寫入」到「可管理可回顧」，建立完整的記帳 CRUD 系統  
> **原則**: 零摩擦（Frictionless）、可後悔（Forgiving）、即時回饋（Instant Feedback）

---

## 📋 目錄

1. [重構目標與核心原則](#重構目標與核心原則)
2. [核心痛點回顧](#核心痛點回顧)
3. [解決方案架構](#解決方案架構)
4. [資料結構設計](#資料結構設計)
5. [功能規格詳述](#功能規格詳述)
6. [檔案修改清單](#檔案修改清單)
7. [實作順序建議](#實作順序建議)
8. [測試計劃](#測試計劃)
9. [未來擴充性](#未來擴充性)

---

## 🎯 重構目標與核心原則

### 核心目標

**從「一次性計算機」到「每日習慣工具」**

當前狀態：
- ❌ 用戶記錯帳 → 無法修改 → 數據變髒 → 放棄使用
- ❌ 訂閱取消 → 無法標記 → 永久計算錯誤 → 失去信任
- ❌ 分類混亂 → 無法分析 → 圖表失真 → 缺乏洞察

目標狀態：
- ✅ 完整的 CRUD 功能 → 數據可整形 → 保持準確
- ✅ 訂閱管理中心 → 狀態可切換 → 反映現實
- ✅ 標準化分類 → 一致性高 → 有效分析
- ✅ 快速記帳入口 → 摩擦力低 → 養成習慣
- ✅ 即時生命額度 → 痛感明確 → 決策當下

### 設計原則

1. **零摩擦（Frictionless）**
   - 常用消費 1 秒記帳
   - 無需打字，按鈕完成
   - 默認值智能化

2. **可後悔（Forgiving）**
   - 任何記錄都可修改
   - 任何訂閱都可終止
   - 操作可撤銷

3. **即時回饋（Instant Feedback）**
   - 記帳後立即看到生命時間扣減
   - 每日額度實時更新
   - 視覺警告（超額時）

4. **數據真實性優先**
   - 修改有限度（保護時間線）
   - 訂閱終止不刪除歷史
   - 分類標準化避免混亂

---

## 🛑 核心痛點回顧

### 痛點 1：悔棋機制的缺失

**現狀**：
- 前端沒有「編輯」按鈕
- 後端有 `deleteRecord` 但前端沒接
- 完全沒有 `updateRecord` API

**後果**：
```
用戶手滑輸入 $1,000（本來要輸 $100）
→ 無法修改
→ 數據永久錯誤
→ 退休年齡被錯誤推遲 10 年
→ 覺得 App 沒用
→ 刪除 App
```

**用戶心聲**：
> "我只是打錯一個數字，為什麼不能改？這個 App 太不人性化了。"

---

### 痛點 2：訂閱制的邏輯黑洞

**現狀**：
- 記帳時勾選 `isRecurring`（每月固定）
- 系統視為「永久支出」直到退休
- 無法標記「訂閱已取消」

**邏輯漏洞**：
```typescript
// 現有計算邏輯
const recurringRecords = records.filter(r => r.isRecurring);
const monthlyRecurringCost = recurringRecords.reduce((sum, r) => sum + r.amount, 0);

// 假設用戶距離退休還有 30 年
const totalFutureCost = monthlyRecurringCost * 12 * 30;
// 這會把「已取消的 Netflix」算 30 年！
```

**真實場景**：
```
1/1  - 訂閱 Netflix $390/月（用戶在 App 中記錄）
3/1  - 取消訂閱（在 Netflix 官網操作）
3/15 - TimeBar 仍然計算「未來 30 年每月 $390」
     → 總額誤差 $140,400（390 × 12 × 30）
     → 退休年齡被錯誤推遲 3-5 年
```

**用戶心聲**：
> "我早就退訂 Netflix 了，為什麼 App 還在算？完全不準！"

---

### 痛點 3：分類管理的混亂

**現狀**：
- 分類似乎是自由輸入
- 沒有標準化選項

**後果**：
```
用戶的記錄：
- "Food" (大寫 F)
- "food" (小寫 f)  
- "飲食"
- "吃飯"
- "午餐"

→ 系統視為 5 個不同分類
→ 圓餅圖分裂成 5 塊
→ 無法看出「飲食支出」總額
```

**用戶心聲**：
> "為什麼我的圖表這麼亂？明明都是吃的東西。"

---

### 痛點 4：缺乏即時回饋

**現狀**：
- 記帳後只有一個 Toast 提示
- 沒有「今天還能花多少」的概念
- 痛感不明確

**心理學問題**：
```
傳統記帳：記下 $100 → 數字變化 → 無感
理想狀態：花 $100 → 生命時間 -0.5 小時 → 心痛
```

**缺失的即時回饋**：
- 沒有「今日生命額度」進度條
- 沒有「超額警告」
- 沒有「剩餘可用時間」顯示

---

## 🏗️ 解決方案架構

### 系統分層

```
┌─────────────────────────────────────────┐
│           UI Layer (使用者介面)            │
├─────────────────────────────────────────┤
│  QuickActions  │  DailyBudget  │  Sub   │
│   快速記帳      │   今日額度    │ 訂閱管理 │
├─────────────────────────────────────────┤
│       Business Logic (業務邏輯)           │
├─────────────────────────────────────────┤
│  RecordSystem  │  SubscriptionSystem     │
│   記帳 CRUD    │   訂閱狀態管理          │
├─────────────────────────────────────────┤
│  CategorySystem │  BudgetCalculator      │
│   分類標準化    │   額度計算引擎          │
├─────────────────────────────────────────┤
│        Data Layer (資料層)                │
├─────────────────────────────────────────┤
│  localStorage  │  Google Sheets API      │
└─────────────────────────────────────────┘
```

### 核心模組

#### 1. RecordSystem（記帳 CRUD 系統）
- **職責**：創建、讀取、更新、刪除記錄
- **限制**：更新時不可改日期、類型、是否循環
- **驗證**：確保金額 > 0，分類合法

#### 2. SubscriptionSystem（訂閱管理系統）
- **職責**：標記訂閱狀態（active / ended）
- **邏輯**：終止日期 = 用戶操作日期
- **計算**：排除已終止的訂閱

#### 3. CategorySystem（分類標準化系統）
- **職責**：提供預設分類、管理自訂分類
- **驗證**：確保選擇的分類存在於系統中
- **遷移**：將舊記錄的自由文字對應到標準分類

#### 4. BudgetCalculator（額度計算引擎）
- **職責**：計算每日可用生命時間
- **公式**：（月薪 - 月儲蓄）/ 月工作時間 / 30 天
- **追蹤**：今日已花費時間、剩餘時間、超額時間

---

## 📊 資料結構設計

### 擴充 Record 介面

```typescript
// src/types/index.ts

export interface Record {
  id: string;
  type: 'save' | 'spend';
  amount: number;
  category: string;           // 必須是標準分類 ID
  note?: string;
  timestamp: number;
  date: string;               // YYYY-MM-DD
  timeCost: number;
  isRecurring: boolean;
  guiltFree?: boolean;        // v2.0 已有（免死金牌）
  
  // ========== v2.1 新增欄位 ==========
  
  // 訂閱管理
  recurringStatus?: 'active' | 'ended';  // 訂閱狀態
  recurringEndDate?: string;             // 終止日期（YYYY-MM-DD）
  
  // 元數據
  createdAt?: number;         // 創建時間戳記
  updatedAt?: number;         // 最後修改時間戳記
  editHistory?: EditLog[];    // 編輯歷史（可選，用於審計）
}

export interface EditLog {
  timestamp: number;
  field: string;              // 被修改的欄位名稱
  oldValue: any;              // 舊值
  newValue: any;              // 新值
}
```

### 新增 Category 介面

```typescript
// src/types/index.ts

export interface Category {
  id: string;                 // 'food', 'transport', 'housing'...
  name: string;               // '飲食', '交通', '居住'...
  icon: string;               // '🍽️', '🚗', '🏠'...
  color: string;              // Tailwind 色碼
  type: 'default' | 'custom'; // 預設或自訂
  isHidden?: boolean;         // 是否在選單中隱藏
  sortOrder?: number;         // 排序權重
}

export interface CategoryMapping {
  // 用於遷移舊資料的對應表
  [freeText: string]: string; // 自由文字 -> 標準分類 ID
}
```

### 新增 DailyBudget 介面

```typescript
// src/types/index.ts

export interface DailyBudget {
  date: string;               // YYYY-MM-DD
  totalAllowedHours: number;  // 今日可用生命時間（小時）
  spentHours: number;         // 已花費時間
  remainingHours: number;     // 剩餘時間
  isOverBudget: boolean;      // 是否超額
  overBudgetHours?: number;   // 超額時間
}

export interface BudgetSettings {
  method: 'auto' | 'custom';  // 計算方式
  customDailyHours?: number;  // 自訂每日額度（小時）
  workHoursPerDay?: number;   // 工作時數/天（預設 8）
  allowancePercentage?: number; // 可浪費比例（預設 25% = 2hr）
}
```

### 新增 QuickAction 介面

```typescript
// src/types/index.ts

export interface QuickAction {
  id: string;
  name: string;               // '早餐', '咖啡', '午餐'
  amount: number;             // 預設金額
  category: string;           // 分類 ID
  icon: string;               // 圖示
  type: 'default' | 'custom'; // 預設或自訂
  sortOrder: number;          // 排序
  usageCount?: number;        // 使用次數（用於智能排序）
}
```

### 擴充 UserData

```typescript
export interface UserData {
  // ... 既有欄位
  
  // v2.1 新增
  customCategories?: Category[];      // 自訂分類
  budgetSettings?: BudgetSettings;    // 額度設定
  quickActions?: QuickAction[];       // 快速記帳按鈕
}
```

### LocalStorage 結構

新增 / 修改：
- `timebar_records` - Record[]（擴充欄位）
- `timebar_categories` - Category[]（新增）
- `timebar_quick_actions` - QuickAction[]（新增）
- `timebar_budget_settings` - BudgetSettings（新增）
- `timebar_category_mapping` - CategoryMapping（新增，用於遷移）

### Google Sheets 結構

#### 消費紀錄工作表（擴充至 14 欄）

| 欄位 | 名稱 | 類型 | 說明 |
|------|------|------|------|
| Col 1-10 | 既有欄位 | - | 保持不變 |
| **Col 11** | 訂閱狀態 | String | 'active' / 'ended' / '' |
| **Col 12** | 終止日期 | Date | YYYY-MM-DD 或空白 |
| **Col 13** | 創建時間 | Timestamp | 毫秒時間戳記 |
| **Col 14** | 最後修改時間 | Timestamp | 毫秒時間戳記 |

#### 使用者資料工作表（擴充至 15 欄）

| 欄位 | 名稱 | 類型 | 說明 |
|------|------|------|------|
| Col 1-12 | 既有欄位 | - | 保持不變 |
| **Col 13** | 自訂分類 | JSON | Category[] |
| **Col 14** | 額度設定 | JSON | BudgetSettings |
| **Col 15** | 快速記帳 | JSON | QuickAction[] |

---

## 🎨 功能規格詳述

### 功能 1：完整的 CRUD 系統

#### 1.1 編輯記錄（Edit Record）

**觸發點**：
- 歷史頁面（HistoryPage）每筆記錄右側新增「✏️」按鈕
- 點擊後彈出編輯 Modal

**可編輯欄位**：
- ✅ 金額（amount）
- ✅ 分類（category，從標準分類選單選擇）
- ✅ 備註（note）

**不可編輯欄位**：
- ❌ 日期（date）- 保護時間線完整性
- ❌ 類型（type: save/spend）- 避免邏輯混亂
- ❌ 是否循環（isRecurring）- 避免訂閱狀態錯亂

**UI 設計**：
```
編輯記錄 Modal
┌────────────────────────────────┐
│ 編輯這筆消費                    │
│                                │
│ 金額                           │
│ [$___________] 元              │
│                                │
│ 分類                           │
│ [🍽️ 飲食 ▼]                   │
│                                │
│ 備註                           │
│ [_______________]              │
│                                │
│ 📅 2026-01-03 (不可改)         │
│ ⏱️  約 2.5 小時生命時間         │
│                                │
│ [取消]  [儲存修改]              │
└────────────────────────────────┘
```

**驗證邏輯**：
- 金額必須 > 0
- 分類必須是標準分類 ID
- 儲存時更新 `updatedAt` 時間戳記
- 可選：記錄到 `editHistory`

**後端 API**：
- `updateRecord(id, updates)` - 接收部分更新
- 驗證 ID 存在
- 驗證欄位合法性
- 更新 Google Sheets 對應列

---

#### 1.2 刪除記錄（Delete Record）

**觸發點**：
- 歷史頁面每筆記錄右側新增「🗑️」按鈕
- 點擊後彈出確認 Modal

**UI 設計**：
```
確認刪除 Modal
┌────────────────────────────────┐
│ ⚠️ 確定要刪除這筆記錄嗎？       │
│                                │
│ 💸 飲食 $500                   │
│ 📅 2026-01-03                  │
│ 📝 午餐聚餐                    │
│                                │
│ 刪除後無法復原                 │
│                                │
│ [取消]  [確定刪除]              │
└────────────────────────────────┘
```

**操作流程**：
1. 用戶點擊「確定刪除」
2. 前端呼叫 `RecordSystem.deleteRecord(id)`
3. 從 localStorage 移除
4. 呼叫 `GoogleSheetsAPI.deleteRecord(id)`
5. 後端從工作表刪除該列
6. 顯示 Toast：「已刪除記錄」
7. 刷新歷史列表

**注意事項**：
- **硬刪除**（真的移除，不是軟刪除）
- 刪除後重新計算退休時間
- 如果是循環支出，影響未來計算

---

### 功能 2：訂閱管理中心

#### 2.1 訂閱列表頁面（Subscription Manager）

**入口**：
- 設定頁面新增「訂閱管理」Tab
- 或主選單新增「📱 訂閱管理」

**UI 佈局**：
```
訂閱管理
┌─────────────────────────────────────┐
│ 進行中的訂閱 (3)                     │
├─────────────────────────────────────┤
│ 📱 Netflix                          │
│ $390 / 月                           │
│ 開始於 2025-11-01                   │
│ [⏸ 終止訂閱]                        │
├─────────────────────────────────────┤
│ 🏋️ 健身房會員                       │
│ $1,200 / 月                         │
│ 開始於 2025-12-15                   │
│ [⏸ 終止訂閱]                        │
├─────────────────────────────────────┤
│ 🎵 Spotify                          │
│ $149 / 月                           │
│ 開始於 2024-06-01                   │
│ [⏸ 終止訂閱]                        │
├─────────────────────────────────────┤
│ 已終止的訂閱 (1) [展開 ▼]           │
├─────────────────────────────────────┤
│ ☁️ iCloud (已終止)                  │
│ $30 / 月                            │
│ 2024-01-01 ~ 2025-10-15             │
│ 總計已付 $540                       │
└─────────────────────────────────────┘
```

**顯示邏輯**：
- 從 `records` 中過濾 `isRecurring: true`
- 依據 `recurringStatus` 分組：
  - `active` 或 undefined → 進行中
  - `ended` → 已終止
- 進行中的顯示「終止訂閱」按鈕
- 已終止的顯示總付費金額和期間

---

#### 2.2 終止訂閱流程

**觸發**：
- 點擊「⏸ 終止訂閱」按鈕

**確認 Modal**：
```
終止訂閱 - Netflix
┌────────────────────────────────┐
│ 確定要終止這個訂閱嗎？          │
│                                │
│ 📱 Netflix                     │
│ $390 / 月                      │
│                                │
│ 終止日期：2026-01-03 (今天)    │
│ （這筆訂閱將不再計入未來成本）  │
│                                │
│ [取消]  [確定終止]              │
└────────────────────────────────┘
```

**執行邏輯**：
1. 用戶點擊「確定終止」
2. 系統執行：
   ```typescript
   RecordSystem.endSubscription(recordId, {
     recurringStatus: 'ended',
     recurringEndDate: getTodayDate(), // 2026-01-03
     updatedAt: Date.now()
   });
   ```
3. 更新 localStorage 和 Google Sheets
4. 重新計算退休時間（排除已終止的訂閱）
5. 顯示 Toast：「已終止訂閱 - Netflix」
6. 刷新訂閱列表

**計算邏輯影響**：
```typescript
// 在 financeCalc.ts 中
export function calculateMonthlyRecurringCost(records: Record[]): number {
  return records
    .filter(r => r.isRecurring && r.type === 'spend')
    .filter(r => r.recurringStatus !== 'ended') // 🆕 排除已終止
    .reduce((sum, r) => sum + r.amount, 0);
}
```

---

### 功能 3：標準化分類系統

#### 3.1 預設分類定義

```typescript
// src/utils/categorySystem.ts

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: '飲食',
    icon: '🍽️',
    color: '#f97316', // orange-500
    type: 'default',
    sortOrder: 1
  },
  {
    id: 'transport',
    name: '交通',
    icon: '🚗',
    color: '#3b82f6', // blue-500
    type: 'default',
    sortOrder: 2
  },
  {
    id: 'entertainment',
    name: '娛樂',
    icon: '🎮',
    color: '#a855f7', // purple-500
    type: 'default',
    sortOrder: 3
  },
  {
    id: 'housing',
    name: '居住',
    icon: '🏠',
    color: '#eab308', // yellow-500
    type: 'default',
    sortOrder: 4
  },
  {
    id: 'health',
    name: '健康',
    icon: '💊',
    color: '#22c55e', // green-500
    type: 'default',
    sortOrder: 5
  },
  {
    id: 'education',
    name: '學習',
    icon: '📚',
    color: '#06b6d4', // cyan-500
    type: 'default',
    sortOrder: 6
  },
  {
    id: 'subscription',
    name: '訂閱',
    icon: '📱',
    color: '#ec4899', // pink-500
    type: 'default',
    sortOrder: 7
  },
  {
    id: 'other',
    name: '其他',
    icon: '📦',
    color: '#6b7280', // gray-500
    type: 'default',
    sortOrder: 8
  }
];
```

#### 3.2 分類選擇器 UI

**記帳時的分類選擇**：
```
選擇分類
┌─────────────────────────────────┐
│ [🍽️ 飲食]  [🚗 交通]  [🎮 娛樂] │
│ [🏠 居住]  [💊 健康]  [📚 學習] │
│ [📱 訂閱]  [📦 其他]            │
│                                 │
│ + 自訂分類                      │
└─────────────────────────────────┘
```

**按鈕網格設計**：
- 每個按鈕顯示圖示 + 名稱
- 選中時高亮顯示（邊框加粗、背景色）
- 點擊立即選定，無需「確認」按鈕

---

#### 3.3 自訂分類管理

**入口**：設定頁面 → 分類管理

**UI 設計**：
```
分類管理
┌─────────────────────────────────┐
│ 預設分類                         │
├─────────────────────────────────┤
│ 🍽️ 飲食       [✓ 顯示] [編輯]   │
│ 🚗 交通       [✓ 顯示] [編輯]   │
│ 🎮 娛樂       [✗ 隱藏] [編輯]   │
│ ...                             │
├─────────────────────────────────┤
│ 自訂分類 (2)                     │
├─────────────────────────────────┤
│ 🐱 養貓       [✓ 顯示] [刪除]   │
│ 💍 約會       [✓ 顯示] [刪除]   │
├─────────────────────────────────┤
│ [+ 新增自訂分類]                 │
└─────────────────────────────────┘
```

**功能**：
- 預設分類可「隱藏」但不能刪除
- 預設分類可修改名稱和圖示（但不建議）
- 自訂分類可完全刪除（如果沒有記錄使用）

---

#### 3.4 舊資料遷移

**問題**：舊用戶的記錄可能有自由文字分類（如 "food", "Food", "吃飯"）

**解決方案**：智能對應表

```typescript
// src/utils/categoryMapping.ts

export const LEGACY_CATEGORY_MAPPING: CategoryMapping = {
  // 英文變體
  'food': 'food',
  'Food': 'food',
  'FOOD': 'food',
  'eat': 'food',
  'meal': 'food',
  
  // 中文變體
  '飲食': 'food',
  '吃飯': 'food',
  '餐費': 'food',
  '食物': 'food',
  
  // 交通變體
  'transport': 'transport',
  'Transportation': 'transport',
  '交通': 'transport',
  '車資': 'transport',
  'taxi': 'transport',
  'uber': 'transport',
  
  // ... 更多對應
  
  // 預設
  'default': 'other'
};
```

**遷移邏輯**：
```typescript
// 在 App 啟動時執行一次
function migrateOldCategories(records: Record[]): Record[] {
  return records.map(record => {
    const oldCategory = record.category;
    const newCategory = LEGACY_CATEGORY_MAPPING[oldCategory] || 'other';
    
    if (oldCategory !== newCategory) {
      console.log(`Migrated: ${oldCategory} -> ${newCategory}`);
      return { ...record, category: newCategory };
    }
    
    return record;
  });
}
```

---

### 功能 4：今日生命額度（Daily Life Budget）

#### 4.1 額度計算邏輯

**公式**：
```typescript
// 方法 1：基於工作時間（推薦）
const monthlyIncome = userData.monthlySalary; // 50,000
const monthlySavingsGoal = userData.monthlySavings; // 10,000
const availableForSpending = monthlyIncome - monthlySavingsGoal; // 40,000

const workHoursPerDay = 8;  // 每天工作 8 小時
const workDaysPerMonth = 22; // 每月 22 個工作日
const totalWorkHoursPerMonth = workHoursPerDay * workDaysPerMonth; // 176 小時

// 時薪
const hourlyRate = monthlyIncome / totalWorkHoursPerMonth; // 284 元/小時

// 每日可用時間（假設 25% 可浪費）
const dailyBudgetPercentage = 0.25; // 25%
const dailyAllowedHours = workHoursPerDay * dailyBudgetPercentage; // 2 小時

// 換算成金額
const dailyBudgetAmount = dailyAllowedHours * hourlyRate; // 568 元
```

**方法 2：用戶自訂**
```typescript
// 用戶在設定中填寫
budgetSettings: {
  method: 'custom',
  customDailyHours: 3 // 每天最多花 3 小時
}
```

---

#### 4.2 Dashboard 顯示 UI

**位置**：Dashboard 頂部，每日挑戰上方

**設計**：
```
今日生命額度
┌───────────────────────────────────────┐
│ ⏳ 今天還有 1.5 小時 的生命可使用      │
│                                       │
│ ████████████░░░░░░░░░░░░ 75% (1.5h)  │
│                                       │
│ 已使用 0.5 小時 • 預算 2 小時          │
└───────────────────────────────────────┘
```

**狀態顏色**：
- 0-50%：綠色 `bg-emerald-500`
- 50-80%：黃色 `bg-yellow-500`
- 80-100%：橙色 `bg-orange-500`
- >100%：紅色 `bg-red-500`

**超額顯示**：
```
今日生命額度
┌───────────────────────────────────────┐
│ ⚠️ 今天已超額 0.8 小時                 │
│                                       │
│ ████████████████████████ 140% (-0.8h) │
│                                       │
│ 已使用 2.8 小時 • 預算 2 小時 • 超支   │
└───────────────────────────────────────┘
```

---

#### 4.3 記帳時的即時回饋

**場景**：用戶剛記錄 $500 的消費

**動畫流程**：
1. 顯示 Toast：「已記錄消費 💸」
2. 「今日額度」進度條動畫變化（0.5 秒過渡）
3. 如果超額，進度條變紅 + 震動效果
4. 顯示「-1.8 小時」的減少動畫（數字倒數）

**Toast 擴充**：
```typescript
showToast(
  '已記錄消費 $500',
  'error', // 消費用 error 樣式（紅色）
  {
    subMessage: '生命時間 -1.8 小時 ⏱️',
    duration: 3000
  }
);
```

---

#### 4.4 額度設定頁面

**入口**：設定 → 每日額度設定

**UI 設計**：
```
每日額度設定
┌───────────────────────────────────┐
│ 計算方式                           │
│ ○ 自動計算（基於月薪和工作時間）   │
│ ● 自訂額度                         │
│                                   │
│ 每日可使用生命時間                 │
│ [_3___] 小時                       │
│                                   │
│ 💡 提示：                          │
│ 設定越小，消費警覺性越高           │
│ 建議設定為每日工作時間的 20-30%    │
│                                   │
│ [取消]  [儲存]                     │
└───────────────────────────────────┘
```

---

### 功能 5：快速記帳（Quick Actions）

#### 5.1 預設快速按鈕

**位置**：Dashboard 中間區域（每日挑戰下方）

**UI 設計**：
```
快速記帳
┌─────────────────────────────────────┐
│ [☕ 咖啡]  [🍱 午餐]  [🚇 交通]     │
│   $100       $120       $30         │
│                                     │
│ [🍿 零食]  [🎬 電影]  [+ 更多]     │
│   $50        $300      ...          │
└─────────────────────────────────────┘
```

**預設項目**：
```typescript
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'coffee', name: '咖啡', amount: 100, category: 'food', icon: '☕', sortOrder: 1 },
  { id: 'lunch', name: '午餐', amount: 120, category: 'food', icon: '🍱', sortOrder: 2 },
  { id: 'transport', name: '交通', amount: 30, category: 'transport', icon: '🚇', sortOrder: 3 },
  { id: 'snack', name: '零食', amount: 50, category: 'food', icon: '🍿', sortOrder: 4 },
  { id: 'movie', name: '電影', amount: 300, category: 'entertainment', icon: '🎬', sortOrder: 5 },
];
```

---

#### 5.2 點擊行為

**一鍵記帳流程**：
1. 用戶點擊「☕ 咖啡 $100」
2. 系統立即創建記錄：
   ```typescript
   {
     type: 'spend',
     amount: 100,
     category: 'food',
     note: '咖啡（快速記帳）',
     // ... 其他欄位
   }
   ```
3. 顯示 Toast：「已記錄：咖啡 $100 ☕」
4. 更新「今日額度」進度條
5. **不**彈出完整的記帳 Modal

**可選：長按編輯**
- 長按按鈕 1 秒 → 彈出 Modal 可調整金額和備註
- 快速點擊 → 直接使用預設值記帳

---

#### 5.3 自訂快速按鈕

**入口**：設定 → 快速記帳設定

**UI 設計**：
```
快速記帳設定
┌─────────────────────────────────────┐
│ 預設項目 (拖曳排序)                  │
├─────────────────────────────────────┤
│ ☰ ☕ 咖啡    $100  [編輯] [隱藏]     │
│ ☰ 🍱 午餐    $120  [編輯] [隱藏]     │
│ ☰ 🚇 交通    $30   [編輯] [隱藏]     │
│ ...                                 │
├─────────────────────────────────────┤
│ 自訂項目 (2)                         │
├─────────────────────────────────────┤
│ ☰ 🐱 貓罐罐  $80   [編輯] [刪除]     │
│ ☰ 💇 理髮    $500  [編輯] [刪除]     │
├─────────────────────────────────────┤
│ [+ 新增自訂項目]                     │
└─────────────────────────────────────┘
```

**新增自訂項目 Modal**：
```
新增快速記帳
┌────────────────────────────────┐
│ 名稱                           │
│ [_______________]              │
│                                │
│ 圖示                           │
│ [選擇 Emoji 🎯]                │
│                                │
│ 預設金額                       │
│ [$___________] 元              │
│                                │
│ 分類                           │
│ [🍽️ 飲食 ▼]                   │
│                                │
│ [取消]  [新增]                  │
└────────────────────────────────┘
```

---

#### 5.4 與每日挑戰的關係

**重要**：保持分離，避免邏輯混淆

**佈局建議**：
```
Dashboard
┌─────────────────────────────────────┐
│ 今日生命額度                         │
│ ████████░░░░░ 60%                   │
├─────────────────────────────────────┤
│ 每日挑戰 💪                         │
│ [☕ 自備飲品] [🍱 自己做飯] ...      │
│ （點擊 = 獲得積分，可選記帳）        │
├─────────────────────────────────────┤
│ 快速記帳 ✏️                         │
│ [☕ 咖啡 $100] [🍱 午餐 $120] ...    │
│ （點擊 = 立即記帳）                  │
└─────────────────────────────────────┘
```

**關鍵差異**：
- **每日挑戰**：鼓勵「不消費」→ 獲得積分 + 可選記帳
- **快速記帳**：承認「已消費」→ 立即記錄

---

## 📁 檔案修改清單

### 需要修改的現有檔案

#### 1. **src/types/index.ts** ⭐⭐⭐
**修改內容**：
- 擴充 `Record` 介面（新增 `recurringStatus`, `recurringEndDate`, `createdAt`, `updatedAt`, `editHistory?`）
- 新增 `Category` 介面
- 新增 `CategoryMapping` 介面
- 新增 `DailyBudget` 介面
- 新增 `BudgetSettings` 介面
- 新增 `QuickAction` 介面
- 擴充 `UserData` 介面

---

#### 2. **google-apps-script/Code.gs** ⭐⭐⭐
**修改內容**：
- `getOrCreateSheet()` 中擴充消費紀錄工作表至 14 欄
- `getOrCreateSheet()` 中擴充使用者資料工作表至 15 欄
- **新增** `updateRecord(record)` 函數
- 確認 `deleteRecord(id)` 函數正確運作
- `saveRecords()` 中處理新增欄位
- `getUserData()` 中讀取並解析新的 JSON 欄位

**預估工作量**：1.5 小時

---

#### 3. **src/utils/googleSheets.ts** ⭐⭐⭐
**修改內容**：
- **新增** `updateRecord(record: Partial<Record>)` 方法
- 確認 `deleteRecord(id: string)` 方法存在並正確
- `saveRecords()` 中傳遞新欄位到後端

**預估工作量**：0.5 小時

---

#### 4. **src/components/history/HistoryPage.tsx** ⭐⭐⭐
**修改內容**：
- 每筆記錄新增「✏️ 編輯」和「🗑️ 刪除」按鈕
- 實作編輯 Modal（`EditRecordModal` 元件）
- 實作刪除確認 Modal
- 連接 `RecordSystem.updateRecord()` 和 `RecordSystem.deleteRecord()`

**預估工作量**：2 小時

---

#### 5. **src/components/dashboard/DashboardScreen.tsx** ⭐⭐⭐
**修改內容**：
- 新增「今日生命額度」顯示區塊
- 新增「快速記帳」按鈕區塊
- 整合 `BudgetCalculator`
- 記帳後觸發額度更新動畫

**預估工作量**：2.5 小時

---

#### 6. **src/components/settings/SettingsPage.tsx** ⭐⭐
**修改內容**：
- 新增「訂閱管理」入口（連到 `SubscriptionManagerPage`）
- 新增「分類管理」入口（連到 `CategorySettingsPage`）
- 新增「額度設定」入口（連到 `BudgetSettingsPage`）
- 新增「快速記帳設定」入口（連到 `QuickActionsSettingsPage`）

**預估工作量**：0.5 小時

---

#### 7. **src/components/App.tsx** ⭐⭐
**修改內容**：
- 新增路由：`subscription-manager`, `category-settings`, `budget-settings`, `quick-actions-settings`
- 初始化時執行 `migrateOldCategories()`
- 載入自訂分類、額度設定、快速按鈕

**預估工作量**：1 小時

---

#### 8. **src/utils/financeCalc.ts** ⭐⭐
**修改內容**：
- `calculateMonthlyRecurringCost()` 中過濾 `recurringStatus !== 'ended'`
- 確保所有涉及循環支出的計算都排除已終止項目

**預估工作量**：0.5 小時

---

#### 9. **src/components/tracker/MainTracker.tsx** ⭐
**修改內容**：
- 記帳時從分類選擇器選擇（不再是自由輸入）
- 儲存時標記 `createdAt`

**預估工作量**：1 小時

---

### 需要新增的檔案

#### 1. **src/utils/recordSystem.ts** ⭐⭐⭐
**職責**：
- `updateRecord(id, updates)` - 更新記錄（有限度編輯）
- `deleteRecord(id)` - 刪除記錄
- `endSubscription(id, endDate)` - 終止訂閱
- 驗證邏輯

**預估工作量**：1.5 小時

---

#### 2. **src/utils/categorySystem.ts** ⭐⭐⭐
**職責**：
- 提供 `DEFAULT_CATEGORIES`
- `getCategories()` - 取得所有分類（預設 + 自訂）
- `addCustomCategory(category)` - 新增自訂分類
- `removeCategory(id)` - 移除自訂分類
- `toggleCategoryVisibility(id)` - 隱藏/顯示分類

**預估工作量**：1 小時

---

#### 3. **src/utils/categoryMapping.ts** ⭐⭐
**職責**：
- 提供 `LEGACY_CATEGORY_MAPPING` 對應表
- `migrateOldCategories(records)` - 遷移舊分類

**預估工作量**：1 小時

---

#### 4. **src/utils/budgetCalculator.ts** ⭐⭐⭐
**職責**：
- `calculateDailyBudget(userData, records, date)` - 計算今日額度
- `getDailySpentHours(records, date)` - 計算今日已花費
- `getRemainingHours(budget, spent)` - 計算剩餘時間
- `isOverBudget(budget, spent)` - 是否超額

**預估工作量**：1.5 小時

---

#### 5. **src/components/subscription/SubscriptionManagerPage.tsx** ⭐⭐⭐
**職責**：
- 列出所有訂閱（進行中 / 已終止）
- 終止訂閱功能
- 顯示訂閱統計

**預估工作量**：2.5 小時

---

#### 6. **src/components/settings/CategorySettingsPage.tsx** ⭐⭐
**職責**：
- 列出所有分類
- 新增 / 刪除 / 編輯自訂分類
- 隱藏 / 顯示預設分類

**預估工作量**：2 小時

---

#### 7. **src/components/settings/BudgetSettingsPage.tsx** ⭐⭐
**職責**：
- 選擇計算方式（自動 / 自訂）
- 設定每日額度
- 預覽效果

**預估工作量**：1.5 小時

---

#### 8. **src/components/settings/QuickActionsSettingsPage.tsx** ⭐⭐
**職責**：
- 管理快速按鈕（排序、隱藏、刪除）
- 新增自訂快速按鈕

**預估工作量**：2 小時

---

#### 9. **src/components/history/EditRecordModal.tsx** ⭐⭐
**職責**：
- 編輯記錄的 Modal UI
- 驗證和提交

**預估工作量**：1.5 小時

---

#### 10. **src/components/budget/DailyBudgetWidget.tsx** ⭐⭐
**職責**：
- 顯示今日額度進度條
- 動畫效果
- 顏色狀態

**預估工作量**：1.5 小時

---

#### 11. **src/components/quick-actions/QuickActionsBar.tsx** ⭐⭐
**職責**：
- 顯示快速按鈕網格
- 一鍵記帳功能

**預估工作量**：1.5 小時

---

## 🚀 實作順序建議

### Phase 1: 基礎 CRUD（必須，3-4 小時）

**目標**：讓用戶可以修改和刪除記錄

1. **擴充資料結構**（0.5 小時）
   - 修改 `src/types/index.ts`
   - 新增訂閱狀態欄位

2. **後端 API 補完**（1 小時）
   - 修改 `Code.gs`（新增 `updateRecord`）
   - 修改 `googleSheets.ts`（介接新 API）

3. **前端 CRUD UI**（2 小時）
   - 修改 `HistoryPage.tsx`（新增編輯/刪除按鈕）
   - 新增 `EditRecordModal.tsx`
   - 新增 `recordSystem.ts`

**驗收標準**：
- ✅ 可以編輯記錄的金額、分類、備註
- ✅ 可以刪除記錄
- ✅ 修改後正確同步到 Google Sheets

---

### Phase 2: 訂閱管理（重要，4-5 小時）

**目標**：解決循環支出的邏輯黑洞

1. **訂閱終止邏輯**（1 小時）
   - 修改 `recordSystem.ts`（新增 `endSubscription`）
   - 修改 `financeCalc.ts`（排除已終止）

2. **訂閱管理頁面**（2.5 小時）
   - 新增 `SubscriptionManagerPage.tsx`
   - 列出進行中 / 已終止訂閱
   - 終止按鈕和確認 Modal

3. **整合入口**（0.5 小時）
   - 修改 `SettingsPage.tsx`（新增入口）
   - 修改 `App.tsx`（新增路由）

**驗收標準**：
- ✅ 可以看到所有訂閱列表
- ✅ 可以終止訂閱
- ✅ 終止後不再計入未來成本
- ✅ 退休年齡重新計算正確

---

### Phase 3: 標準化分類（重要，3-4 小時）

**目標**：統一分類，提升分析品質

1. **分類系統建立**（1.5 小時）
   - 新增 `categorySystem.ts`（預設分類）
   - 新增 `categoryMapping.ts`（遷移舊資料）

2. **分類選擇器 UI**（1 小時）
   - 修改 `MainTracker.tsx`（按鈕網格選擇）
   - 套用預設分類

3. **分類管理頁面**（1.5 小時）
   - 新增 `CategorySettingsPage.tsx`
   - 自訂分類功能

**驗收標準**：
- ✅ 記帳時從標準分類選擇
- ✅ 舊資料自動遷移到標準分類
- ✅ 圖表不再分裂（所有「飲食」合併）

---

### Phase 4: 今日額度（加分，3-4 小時）

**目標**：提供即時的消費回饋

1. **額度計算引擎**（1.5 小時）
   - 新增 `budgetCalculator.ts`
   - 實作計算邏輯

2. **Dashboard 顯示**（1.5 小時）
   - 新增 `DailyBudgetWidget.tsx`
   - 修改 `DashboardScreen.tsx`（整合）

3. **額度設定頁面**（1 小時）
   - 新增 `BudgetSettingsPage.tsx`

**驗收標準**：
- ✅ Dashboard 顯示今日額度進度條
- ✅ 記帳後進度條即時更新
- ✅ 超額時顯示紅色警告

---

### Phase 5: 快速記帳（加分，3-4 小時）

**目標**：降低記帳摩擦力

1. **快速按鈕 UI**（1.5 小時）
   - 新增 `QuickActionsBar.tsx`
   - 修改 `DashboardScreen.tsx`（整合）

2. **快速按鈕設定**（1.5 小時）
   - 新增 `QuickActionsSettingsPage.tsx`
   - 自訂按鈕功能

**驗收標準**：
- ✅ Dashboard 顯示快速按鈕
- ✅ 點擊後立即記帳（無 Modal）
- ✅ 可自訂按鈕

---

### Phase 6: UI/UX 優化（可選，2-3 小時）

1. **動畫優化**
   - 額度進度條過渡動畫
   - 超額震動效果
   - Toast 擴充（subMessage）

2. **文案優化**
   - 所有 Modal 文案
   - 引導提示

3. **響應式調整**
   - 手機版佈局
   - 平板適配

---

### Phase 7: 測試與修正（1-2 小時）

1. **功能測試**
2. **邊界測試**（無記錄、超大金額、負數驗證）
3. **數據一致性測試**（localStorage ↔ Google Sheets）

---

**總工時估算**：18-24 小時

---

## 🧪 測試計劃

### 測試場景 1：編輯與刪除記錄

**步驟**：
1. 進入歷史頁面，看到 5 筆記錄
2. 點擊第 1 筆的「✏️ 編輯」
3. 修改金額從 $500 → $1000
4. 修改分類從「飲食」→「娛樂」
5. 儲存

**預期結果**：
- ✅ 記錄金額更新為 $1000
- ✅ 記錄分類更新為「娛樂」
- ✅ `updatedAt` 時間戳記更新
- ✅ Google Sheets 同步正確
- ✅ 退休時間重新計算

**刪除測試**：
1. 點擊第 2 筆的「🗑️ 刪除」
2. 確認刪除

**預期結果**：
- ✅ 記錄從列表消失
- ✅ Google Sheets 該列被刪除
- ✅ 退休時間重新計算

---

### 測試場景 2：訂閱終止

**步驟**：
1. 記錄 Netflix $390/月（勾選循環支出）
2. 查看退休計算（應包含這筆）
3. 進入「訂閱管理」
4. 點擊「⏸ 終止訂閱 - Netflix」
5. 確認終止

**預期結果**：
- ✅ 訂閱狀態變為「已終止」
- ✅ `recurringEndDate` = 今天
- ✅ 退休時間重新計算（Netflix 不再計入）
- ✅ 訂閱列表移至「已終止」區域

---

### 測試場景 3：分類遷移

**前置準備**：
- 手動創建幾筆舊記錄：
  - 分類 "food"（小寫）
  - 分類 "Food"（大寫）
  - 分類 "吃飯"（中文）

**步驟**：
1. 重新啟動 App
2. 系統自動執行 `migrateOldCategories()`

**預期結果**：
- ✅ 所有上述記錄的分類都變為 "food"（標準 ID）
- ✅ 圓餅圖正確聚合
- ✅ 不再出現分裂的分類

---

### 測試場景 4：今日額度

**步驟**：
1. 設定月薪 $50,000、月儲蓄 $10,000
2. Dashboard 應顯示「今日額度：2 小時」
3. 快速記帳：咖啡 $100（約 0.5 小時）
4. 觀察進度條變化

**預期結果**：
- ✅ 進度條從 100% → 75%
- ✅ 顯示「已使用 0.5 小時」
- ✅ Toast 顯示「生命時間 -0.5 小時」

**超額測試**：
1. 記帳 $2000（約 10 小時，超過額度）
2. 觀察進度條

**預期結果**：
- ✅ 進度條變紅色
- ✅ 顯示「已超額 8 小時 ⚠️」

---

### 測試場景 5：快速記帳

**步驟**：
1. Dashboard 顯示快速按鈕
2. 點擊「☕ 咖啡 $100」
3. 不應彈出 Modal

**預期結果**：
- ✅ 立即創建記錄
- ✅ Toast 顯示「已記錄：咖啡 $100」
- ✅ 今日額度立即更新
- ✅ 歷史頁面看到新記錄

---

### 測試場景 6：自訂快速按鈕

**步驟**：
1. 進入「快速記帳設定」
2. 點擊「+ 新增自訂項目」
3. 填寫：
   - 名稱：「貓罐罐」
   - 圖示：🐱
   - 金額：$80
   - 分類：其他
4. 儲存

**預期結果**：
- ✅ Dashboard 顯示新按鈕「🐱 貓罐罐 $80」
- ✅ 點擊可正常記帳
- ✅ 設定頁面可編輯/刪除

---

### 邊界測試

#### 測試 1：編輯不存在的記錄
- 嘗試編輯 ID 不存在的記錄 → 應顯示錯誤

#### 測試 2：刪除最後一筆記錄
- 刪除唯一的記錄 → 歷史頁面應顯示「空狀態」

#### 測試 3：超大金額
- 記帳 $999,999,999 → 應正確處理（不溢位）

#### 測試 4：負數金額
- 嘗試輸入 -$100 → 應拒絕或自動轉正

#### 測試 5：終止未循環的記錄
- 嘗試終止非循環支出 → 應無此按鈕

---

## 🔮 未來擴充性

### 預留的擴充點

#### 1. 編輯歷史審計（Audit Trail）
```typescript
// 已預留 editHistory 欄位
interface Record {
  editHistory?: EditLog[];
}

// 未來可實作
function showEditHistory(recordId: string) {
  // 顯示這筆記錄的所有修改歷史
}
```

#### 2. 批量操作
```typescript
// 選取多筆記錄
function bulkDelete(ids: string[]) { ... }
function bulkChangeCategory(ids: string[], newCategory: string) { ... }
```

#### 3. 訂閱提醒
```typescript
// 自動生成每月帳單提醒
function scheduleBillingReminder(subscription: Record) {
  // "你的 Netflix 即將在 3 天後扣款 $390"
}
```

#### 4. 自動記帳
```typescript
// 根據歷史規律自動建議
function suggestRecording() {
  // "你通常在週一早上 9:00 買咖啡，要記一筆嗎？"
}
```

#### 5. 預算目標
```typescript
// 設定每週 / 每月預算
interface BudgetGoal {
  period: 'weekly' | 'monthly';
  targetAmount: number;
  category?: string; // 可針對特定分類
}
```

#### 6. 智能分類建議
```typescript
// 根據備註自動建議分類
function suggestCategory(note: string): string {
  // "星巴克" -> 飲食
  // "Uber" -> 交通
}
```

---

## 🎯 成功指標

### 產品目標

**短期（1 個月）**：
- ✅ 用戶每週至少開啟 App 3 次
- ✅ 每日額度功能使用率 > 60%
- ✅ 快速記帳功能使用率 > 40%
- ✅ 訂閱終止功能使用率 > 20%（有訂閱的用戶）

**中期（3 個月）**：
- ✅ 每日平均記帳 2-3 筆
- ✅ 數據錯誤率 < 5%（需要修改的記錄比例）
- ✅ 退休時間計算準確度提升 30%

**長期（6 個月）**：
- ✅ 用戶留存率（7 日）> 50%
- ✅ 用戶留存率（30 日）> 30%
- ✅ NPS（淨推薦值）> 40

---

## 📝 最終檢查清單

### Phase 1: 基礎 CRUD
- [ ] 擴充 `Record` 介面
- [ ] 後端 `updateRecord` API
- [ ] 前端編輯 Modal
- [ ] 前端刪除確認
- [ ] Google Sheets 同步正確

### Phase 2: 訂閱管理
- [ ] 訂閱狀態欄位
- [ ] 終止訂閱邏輯
- [ ] 訂閱管理頁面
- [ ] 計算邏輯排除已終止
- [ ] 退休時間重新計算正確

### Phase 3: 標準化分類
- [ ] 預設分類定義
- [ ] 分類選擇器 UI
- [ ] 舊資料遷移
- [ ] 分類管理頁面
- [ ] 圓餅圖正確聚合

### Phase 4: 今日額度
- [ ] 額度計算邏輯
- [ ] Dashboard 顯示 Widget
- [ ] 記帳後即時更新
- [ ] 超額警告視覺
- [ ] 額度設定頁面

### Phase 5: 快速記帳
- [ ] 快速按鈕 UI
- [ ] 一鍵記帳功能
- [ ] 快速按鈕設定頁面
- [ ] 自訂按鈕功能

### Phase 6: 測試
- [ ] 場景 1-6 全部通過
- [ ] 邊界測試全部通過
- [ ] 無 Console 錯誤
- [ ] Google Sheets 同步正常

---

## 🚀 部署前確認

- [ ] 所有 TypeScript 錯誤已修正
- [ ] 所有測試場景通過
- [ ] Google Sheets 欄位正確擴充
- [ ] 舊用戶數據自動遷移
- [ ] 效能測試（1000 筆記錄）
- [ ] 跨裝置數據一致性
- [ ] 離線行為正常（localStorage 優先）

---

## 📚 附錄

### A. 關鍵決策記錄

1. **編輯範圍限制**：保護時間線完整性
2. **訂閱終止方式**：操作日期（不追溯），平衡簡單性與準確性
3. **分類標準化**：提升數據分析品質
4. **今日額度基於工作時間**：更直觀的痛感
5. **快速記帳與挑戰分離**：避免邏輯混淆

### B. 技術債務

1. **編輯歷史審計**：目前僅預留欄位，未實作完整 UI
2. **批量操作**：未實作，需求不明確
3. **自動記帳**：需累積更多數據

### C. 已知限制

1. **訂閱終止不可追溯**：v2.0 簡化版限制
2. **無法編輯日期**：保護時間線完整性
3. **每日額度計算簡化**：假設月工作 22 天

---

**文件版本**：v2.0  
**最後更新**：2026-01-03  
**預計完成時間**：18-24 小時  
**優先級排序**：P1 (CRUD + 訂閱) > P2 (分類) > P3 (額度 + 快速)

---

🎯 **核心目標**：從「一次性計算機」到「每日習慣工具」  
💡 **設計原則**：零摩擦、可後悔、即時回饋、數據真實  
🚀 **成功指標**：每週使用 3 次、7 日留存 > 50%
