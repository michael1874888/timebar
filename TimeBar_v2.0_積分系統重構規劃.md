# TimeBar v2.0 - 每日挑戰與積分系統重構規劃

> **版本**: v2.0  
> **日期**: 2026-01-03  
> **目標**: 將遊戲化與財務記帳完全分離，建立可擴充的積分經濟系統  
> **原則**: 高維護性、易擴充、數據真實性優先

---

## 📋 目錄

1. [重構目標與核心原則](#重構目標與核心原則)
2. [核心問題回顧](#核心問題回顧)
3. [新系統架構設計](#新系統架構設計)
4. [資料結構設計](#資料結構設計)
5. [功能規格詳述](#功能規格詳述)
6. [檔案修改清單](#檔案修改清單)
7. [實作順序建議](#實作順序建議)
8. [測試計劃](#測試計劃)
9. [未來擴充性設計](#未來擴充性設計)

---

## 重構目標與核心原則

### 🎯 核心目標

1. **徹底分離遊戲層與財務層**
   - 完成挑戰 = 100% 獲得積分（遊戲獎勵）
   - 記帳行為 = Opt-in 確認制（用戶主動觸發）
   - 兩者解耦，互不依賴

2. **建立可擴充的積分經濟系統**
   - 積分來源多元化（為未來擴充預留接口）
   - 積分消耗有意義（從免死金牌開始）
   - 積分流動可追蹤（為未來統計預留）

3. **提升用戶體驗**
   - 降低認知負擔（分離遊戲與記帳）
   - 增加即時回饋（動畫、Toast、積分增長）
   - 保持操作流暢（非阻斷式確認）

### 💎 設計原則

#### 1. 單一職責原則 (Single Responsibility)
```
✅ 好的設計：
- ChallengeSystem: 管理挑戰狀態、積分獎勵
- PointsSystem: 管理積分餘額、消耗、兌換
- RecordSystem: 管理財務記錄、計算

❌ 避免：
- 挑戰完成時直接操作財務記錄
- 積分系統混入記帳邏輯
```

#### 2. 開放封閉原則 (Open-Closed)
```
未來可以輕鬆擴充：
- 新的挑戰類型（不修改核心邏輯）
- 新的積分來源（註冊事件監聽器）
- 新的兌換道具（註冊到商店系統）
```

#### 3. 依賴反轉原則 (Dependency Inversion)
```
高層模組（Dashboard）不依賴低層模組（具體挑戰實作）
都依賴抽象接口（Challenge Interface）
```

#### 4. 數據真實性優先
```
任何影響財務數據的操作：
- 必須明確的用戶確認
- 必須清楚的視覺回饋
- 必須可追溯的記錄
```

---

## 核心問題回顧

### 🔴 問題 1：每日挑戰的虛假儲蓄

**舊邏輯**：
```
用戶點擊「完成」→ 自動記錄為 type: 'save' → 累積到總資產
```

**問題**：
- 用戶可能從來不喝咖啡，卻每天「省下咖啡錢」
- 導致財務數據虛增，退休計算不準確
- 用戶對工具失去信任

**新邏輯**：
```
用戶點擊「完成」→ 獲得積分（遊戲層）
→ 顯示 Toast 詢問「真的存下來了嗎？」（可選）
→ 用戶點擊「記一筆」才真正寫入財務資料庫
```

### 🔴 問題 2：首頁「我不買了」的虛假儲蓄

**舊邏輯**：
```
用戶輸入 $500 → 點擊「我不買了」→ 自動記錄為 type: 'save'
```

**問題**：
- 這 $500 本來就在銀行帳戶裡
- 「沒花掉」≠「額外存下」
- 同樣導致資產虛增

**新邏輯**：
```
用戶點擊「我不買了」→ 觸發慶祝動畫（心理獎勵）
→ 在 CelebrationModal 或 Toast 中顯示：
   「要把這 $500 記入儲蓄嗎？」
→ 提供按鈕：「記一筆儲蓄」/ 「忽略」
→ 只有點擊「記一筆」才寫入資料庫
```

---

## 新系統架構設計

### 🏗️ 三層架構

```
┌─────────────────────────────────────────────────┐
│              UI Layer (呈現層)                    │
│  Dashboard / CelebrationModal / Toast / Shop    │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│           Business Logic Layer (業務層)          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐│
│  │ Challenge   │  │   Points    │  │  Record  ││
│  │   System    │  │   System    │  │  System  ││
│  └─────────────┘  └─────────────┘  └──────────┘│
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│            Data Layer (數據層)                    │
│  localStorage / Google Sheets API               │
└─────────────────────────────────────────────────┘
```

### 📦 模組劃分

#### 1. ChallengeSystem (挑戰系統)
```typescript
職責：
- 管理挑戰定義（預設 + 用戶自定義）
- 追蹤挑戰完成狀態
- 每日重置邏輯
- 發放積分獎勵

不負責：
❌ 財務記錄
❌ 積分管理（只觸發事件）
```

#### 2. PointsSystem (積分系統)
```typescript
職責：
- 管理積分餘額
- 處理積分增減
- 驗證兌換請求
- 記錄積分流水（未來擴充）

不負責：
❌ 決定積分來源（由事件觸發）
❌ 財務記錄
```

#### 3. RecordSystem (記帳系統)
```typescript
職責：
- 創建財務記錄
- 同步到 localStorage / Google Sheets
- 計算累積統計

不負責：
❌ 遊戲邏輯
❌ 積分邏輯
```

#### 4. RewardSystem (獎勵系統 - 新增)
```typescript
職責：
- 定義可兌換道具（Shop Items）
- 處理兌換請求
- 管理道具庫存（Inventory）

未來可擴充：
- 新道具類型
- 道具效果系統
```

---

## 資料結構設計

### 🗂️ 新增類型定義

在 `src/types/index.ts` 中新增：

```typescript
// ==================== 挑戰系統 ====================

/** 挑戰定義（可自定義） */
export interface ChallengeDefinition {
  id: string;                // UUID
  name: string;              // "忍住不買手搖飲"
  description: string;       // "今天不買飲料，省下約 $60"
  icon: string;              // "🧋"
  defaultAmount: number;     // 60 (預設省下金額)
  energyReward: number;      // 10 (完成可得積分)
  category: string;          // "food" (對應支出分類)
}

/** 每日挑戰狀態 */
export interface ChallengeState {
  date: string;                         // "2026-01-03"
  completed: string[];                  // ["skip_coffee", "walk_instead"]
  totalEarnedToday: number;            // 今天獲得的總積分
}

// ==================== 積分系統 ====================

/** 積分交易記錄（未來擴充用） */
export interface PointsTransaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  source: string;           // "daily_challenge" | "streak_bonus" | "shop"
  timestamp: string;
  relatedId?: string;       // 關聯的挑戰 ID 或道具 ID
}

/** 道具定義 */
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;              // 積分價格
  type: 'consumable' | 'permanent';  // 可消耗 vs 永久
  effect?: string;           // 效果描述
}

/** 用戶庫存 */
export interface Inventory {
  guiltFreePass: number;     // 免死金牌數量
  // 未來可擴充其他道具
}

// ==================== 用戶數據擴充 ====================

/** 擴充 UserData（向後兼容） */
export interface UserData {
  // ... 既有欄位保持不變
  
  // 新增欄位
  pointsBalance?: number;              // 積分餘額
  inventory?: Inventory;               // 道具庫存
  customChallenges?: ChallengeDefinition[];  // 自定義挑戰
}
```

### 📁 LocalStorage 結構

```typescript
// 現有的 keys
timebar_userData        // UserData (含積分、庫存)
timebar_records         // Record[]

// 新增的 keys
timebar_daily_challenges     // ChallengeState
timebar_custom_challenges    // ChallengeDefinition[]
timebar_points_history       // PointsTransaction[] (未來擴充)
```

### 🌐 Google Sheets 結構

#### Sheet: 使用者資料

| 欄位 | 說明 | 範例 |
|------|------|------|
| Col 1-9 | 既有欄位 | (保持不變) |
| Col 10 | 積分餘額 (Number) | 120 |
| Col 11 | 道具庫存 (JSON) | `{"guiltFreePass": 2}` |
| Col 12 | 自定義挑戰 (JSON) | `[{id: "...", name: "..."}]` |

---

## 功能規格詳述

### 🎯 功能 1：積分獨立的每日挑戰

#### 預設挑戰範本

保留在 `src/components/dashboard/DailyChallenge.tsx` 中：

```typescript
const DEFAULT_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'skip_coffee',
    name: '跳過一杯咖啡',
    description: '今天不買咖啡，省下約 $100',
    defaultAmount: 100,
    energyReward: 10,
    icon: '☕',
    category: 'food'
  },
  {
    id: 'skip_snack',
    name: '拒絕一次零食',
    description: '不買零食或飲料，省下約 $50',
    defaultAmount: 50,
    energyReward: 10,
    icon: '🍪',
    category: 'food'
  },
  {
    id: 'walk_instead',
    name: '走路代替交通',
    description: '步行或騎車，省下交通費 $30',
    defaultAmount: 30,
    energyReward: 10,
    icon: '🚶',
    category: 'transport'
  },
  {
    id: 'cook_home',
    name: '自己做一餐',
    description: '不叫外送，自己煮飯省 $150',
    defaultAmount: 150,
    energyReward: 10,
    icon: '🍳',
    category: 'food'
  }
];
```

#### 完成挑戰流程

```
Step 1: UI 操作
用戶點擊 DailyChallenge 卡片上的「完成」按鈕

↓

Step 2: 挑戰系統處理
- ChallengeSystem.completeChallenge(challengeId)
  → 更新 ChallengeState (completed 陣列)
  → 儲存到 localStorage
  → 觸發事件: 'challenge:completed'

↓

Step 3: 積分系統響應
- PointsSystem 監聽事件
  → 增加積分 (pointsBalance += energyReward)
  → 觸發視覺回饋 (粒子動畫 + Toast)

↓

Step 4: 可選的記帳流程（非阻斷式）
- 在 Toast / Snackbar 顯示：
  「太棒了！獲得 10 ⏳」
  [要把省下的 $100 記下來嗎？]
  
  [記一筆] 按鈕 → 開啟記帳 Modal
  → 預填金額、分類
  → 用戶確認後才寫入 RecordSystem
  
  [忽略] 或 5 秒自動關閉 → 什麼都不做
```

#### UI 設計要點

1. **完成狀態視覺**
   - 未完成：灰底、白字
   - 已完成：綠底、綠字、打勾 ✓
   - 顯示「已獲得 10 ⏳」

2. **進度顯示**
   ```
   🎯 今日挑戰  [2/4]  省 $150
   ```

3. **全部完成慶祝**
   ```
   🏆 今日挑戰全部完成！
   今天省下了 $330，太棒了！
   ```

---

### 💰 功能 2：免死金牌系統

#### 道具定義

```typescript
const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'guilt_free_pass',
    name: '免死金牌',
    description: '使用後，一筆消費不計入「生命殺手」統計',
    icon: '🎫',
    cost: 300,  // 調整為 300 積分（約 7-10 天）
    type: 'consumable',
    effect: 'exclude_from_negative_stats'
  }
  // 未來可擴充其他道具
];
```

#### 兌換流程

```
Step 1: 進入商店頁面
- Settings → 商店 Tab
- 或 Dashboard 新增「商店」入口

↓

Step 2: 顯示可兌換道具
┌────────────────────────────────┐
│ 🎫 免死金牌                     │
│                                │
│ 使用後，一筆消費不計入          │
│ 「生命殺手」統計               │
│                                │
│ 價格: 300 ⏳                   │
│ 你的積分: 450 ⏳               │
│                                │
│     [ 兌換 ]                   │
└────────────────────────────────┘

↓

Step 3: 兌換確認
- 扣除 300 積分
- inventory.guiltFreePass += 1
- 顯示 Toast: "兌換成功！獲得 1 張免死金牌 🎫"
- 同步到 localStorage 和 Google Sheets
```

#### 使用流程

```
場景：用戶想記錄一筆「非必要消費」

Step 1: 記帳頁面（MainTracker）
- 輸入金額、分類
- 如果 type = 'spend' && inventory.guiltFreePass > 0
  → 顯示「使用免死金牌」按鈕

↓

Step 2: 點擊「使用免死金牌」
- 彈出確認 Modal:
  ┌────────────────────────────────┐
  │ 💚 使用免死金牌                 │
  │                                │
  │ 努力是為了更好的生活。          │
  │ 這一次的放縱是系統准許的獎勵！  │
  │                                │
  │ 這筆消費將標記為「已豁免」，    │
  │ 不會計入負面統計。              │
  │                                │
  │   [確定使用] [取消]             │
  └────────────────────────────────┘

↓

Step 3: 確定使用
- 扣除金牌: inventory.guiltFreePass -= 1
- 創建記錄時標記: guiltFree: true
- 儲存記錄
- 顯示特殊慶祝動畫（溫暖的綠色主題）

↓

Step 4: 在歷史頁面特殊顯示
- 普通消費：紅色背景、計入「生命殺手」
- 免死金牌消費：灰色背景、標註「🎫 已豁免」
  → 不計入 CategoryPieChart 的「最大殺手」
  → 不計入 GPS 退休年齡計算（可選）
```

---

### 🏠 功能 3：首頁「我不買了」的確認機制

#### 修改 DashboardScreen.tsx

**舊流程（要移除）**：
```
handleSkipped() {
  // ❌ 直接創建 save 記錄
  const record = { type: 'save', ... };
  await onAddRecord(record);
}
```

**新流程**：
```
Step 1: 用戶點擊「我不買了」
→ handleSkipped() 執行

↓

Step 2: 觸發慶祝（視覺獎勵）
- 顯示 Confetti 動畫
- 顯示 CelebrationModal
- Modal 內容：
  「明智的決定！你守住了 $500！
   這代表你贏回了 2 天的自由」

↓

Step 3: 在 Modal 底部新增按鈕
┌────────────────────────────────┐
│ 🎉 太棒了！                     │
│                                │
│ 你守住了 NT$ 500               │
│ 贏回了 2 天的自由               │
│                                │
│  [ 💰 把這筆錢存下來 ]          │  ← 新增
│  [ 繼續加油 💪 ]                │  ← 原有的關閉
└────────────────────────────────┘

↓

Step 4: 點擊「把這筆錢存下來」
- 創建 save 記錄並呼叫 onAddRecord()
- 顯示 Toast: "已記入儲蓄 💰"
- 關閉 Modal

點擊「繼續加油」或等待自動關閉
- 不創建任何記錄
- 只享受心理勝利
```

#### CelebrationModal 修改

新增 Props:
```typescript
interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAmount: number;
  savedHours: number;
  newMilestone?: Milestone;
  
  // 新增
  onConfirmSave?: () => void;  // 點擊「存下來」的回調
  showSaveOption?: boolean;    // 是否顯示「存下來」按鈕
}
```

---

### 🎁 功能 4：積分獲取多元化（未來擴充）

#### 設計接口（Interface）

創建 `src/utils/pointsRewards.ts`：

```typescript
/** 積分獎勵來源定義 */
export interface PointsSource {
  id: string;
  type: 'challenge' | 'streak' | 'milestone' | 'manual';
  amount: number;
  condition: () => boolean;  // 觸發條件
  message: string;           // 獲得積分時的提示
}

/** 積分獎勵註冊表（可擴充） */
export const POINTS_SOURCES: PointsSource[] = [
  {
    id: 'daily_challenge',
    type: 'challenge',
    amount: 10,
    condition: () => true,  // 完成挑戰時觸發
    message: '完成挑戰獲得 10 ⏳'
  },
  // 未來可擴充
  // {
  //   id: 'streak_3',
  //   type: 'streak',
  //   amount: 20,
  //   condition: () => getStreak() === 3,
  //   message: '連續登入 3 天！獲得 20 ⏳'
  // },
  // {
  //   id: 'milestone_unlock',
  //   type: 'milestone',
  //   amount: 30,
  //   condition: (milestoneId) => isFirstUnlock(milestoneId),
  //   message: '首次解鎖里程碑！獲得 30 ⏳'
  // }
];
```

#### 事件驅動架構

創建 `src/utils/eventBus.ts`（簡單版）：

```typescript
type EventCallback = (data: any) => void;

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();
  
  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

export const eventBus = new EventBus();

// 使用範例
eventBus.on('challenge:completed', (challenge) => {
  PointsSystem.addPoints(challenge.energyReward, 'daily_challenge');
});

eventBus.on('milestone:unlocked', (milestone) => {
  PointsSystem.addPoints(30, 'milestone_unlock');
});
```

---

## 檔案修改清單

### 📝 需要修改的現有檔案

#### 1. `src/types/index.ts` ⭐⭐⭐
**修改類型**：擴充  
**內容**：
- 新增 `ChallengeDefinition` 介面
- 新增 `ChallengeState` 介面
- 新增 `PointsTransaction` 介面
- 新增 `ShopItem` 介面
- 新增 `Inventory` 介面
- 擴充 `UserData` 介面（新增 pointsBalance, inventory, customChallenges）
- 擴充 `Record` 介面（新增 guiltFree?: boolean）

---

#### 2. `src/components/dashboard/DailyChallenge.tsx` ⭐⭐⭐
**修改類型**：重構  
**主要變更**：
- 移除 `skippedAmounts` 邏輯
- 完成挑戰時：
  - 只更新 `completed` 陣列
  - 只增加 `totalEarnedToday`
  - **不**直接呼叫 `onAddRecord()`
- 修改 `onCompleteChallenge` 回調：
  ```typescript
  // 舊
  onCompleteChallenge: (challenge: Challenge) => void
  
  // 新
  onCompleteChallenge: (challenge: ChallengeDefinition) => {
    points: number,
    showRecordPrompt: boolean  // 是否顯示記帳提示
  }
  ```
- 新增「記帳提示」的 Toast/Snackbar UI

---

#### 3. `src/components/dashboard/DashboardScreen.tsx` ⭐⭐⭐
**修改類型**：重構  
**主要變更**：

1. **修改 `handleSkipped` 函數**
   - 移除直接呼叫 `onAddRecord()` 的邏輯
   - 改為：
     ```typescript
     // 1. 顯示慶祝
     setShowCelebration(true)
     setPendingSave({ amount, timeCost })
     
     // 2. 不自動記帳
     ```

2. **新增 `handleConfirmSave` 函數**
   - 由 CelebrationModal 呼叫
   - 執行真正的記帳邏輯

3. **處理每日挑戰完成**
   ```typescript
   <DailyChallenge
     onCompleteChallenge={(challenge, result) => {
       // 增加積分（透過 PointsSystem）
       addPoints(result.points);
       
       // 顯示 Toast 詢問是否記帳
       if (result.showRecordPrompt) {
         showRecordPromptToast(challenge);
       }
     }}
   />
   ```

4. **新增積分相關 State**
   ```typescript
   const [pointsBalance, setPointsBalance] = useState(0);
   const [inventory, setInventory] = useState<Inventory>({
     guiltFreePass: 0
   });
   ```

---

#### 4. `src/components/common/CelebrationModal.tsx` ⭐⭐
**修改類型**：擴充  
**新增內容**：
- 新增 Props: `onConfirmSave?`, `showSaveOption?`
- 在 Modal 底部新增「把這筆錢存下來」按鈕
- 點擊後呼叫 `onConfirmSave()` 並關閉 Modal

---

#### 5. `src/components/App.tsx` ⭐⭐
**修改類型**：擴充  
**新增內容**：
- 從 localStorage 載入積分和庫存
- 初始化時補充預設值：
  ```typescript
  pointsBalance: userData.pointsBalance ?? 0,
  inventory: userData.inventory ?? { guiltFreePass: 0 },
  customChallenges: userData.customChallenges ?? []
  ```
- 儲存時同步積分和庫存到 localStorage / Google Sheets

---

#### 6. `google-apps-script/Code.gs` ⭐⭐⭐
**修改類型**：擴充  
**主要變更**：

1. **`getOrCreateSheet()` 函數**
   - USER_DATA 工作表的 Header 從 9 欄擴充到 12 欄
   - 新增欄位：
     - Col 10: 積分餘額(TimeSand)
     - Col 11: 道具庫存(JSON)
     - Col 12: 自定義挑戰(JSON)

2. **`saveUserData()` 函數**
   - 接收 `pointsBalance`, `inventory`, `customChallenges`
   - 將 inventory 和 customChallenges 轉為 JSON 字串儲存
   - 新增欄位格式化（Col 10 設為數字格式）

3. **`getUserData()` 函數**
   - 讀取新欄位
   - 解析 JSON 字串為物件
   - 回傳時補充預設值：
     ```javascript
     pointsBalance: row[9] ?? 0,
     inventory: parseJSON(row[10], {}),
     customChallenges: parseJSON(row[11], [])
     ```

---

### 🆕 需要新增的檔案

#### 1. `src/utils/pointsSystem.ts` ⭐⭐⭐
**功能**：積分系統核心邏輯  
**內容**：
```typescript
// 主要函數
export const PointsSystem = {
  // 獲取積分餘額
  getBalance(): number
  
  // 增加積分
  addPoints(amount: number, source: string): void
  
  // 扣除積分
  spendPoints(amount: number, reason: string): boolean
  
  // 驗證是否足夠
  hasEnough(amount: number): boolean
  
  // 儲存到 localStorage
  save(): void
  
  // 從 localStorage 載入
  load(): void
}
```

---

#### 2. `src/utils/inventorySystem.ts` ⭐⭐
**功能**：道具庫存管理  
**內容**：
```typescript
export const InventorySystem = {
  // 獲取道具數量
  getItemCount(itemId: string): number
  
  // 增加道具
  addItem(itemId: string, count: number): void
  
  // 使用道具
  useItem(itemId: string): boolean
  
  // 檢查是否擁有
  hasItem(itemId: string): boolean
  
  // 儲存/載入
  save(): void
  load(): Inventory
}
```

---

#### 3. `src/components/shop/ShopPage.tsx` ⭐⭐⭐
**功能**：商店頁面  
**UI 結構**：
```
Header: 「商店」+ 返回按鈕

Your Points: 450 ⏳

┌────────────────────────────────┐
│ Available Items                │
│                                │
│ [道具卡片 1: 免死金牌]          │
│ [道具卡片 2: ...未來擴充]       │
└────────────────────────────────┘

Your Inventory:
🎫 免死金牌 × 2
```

---

#### 4. `src/components/shop/ItemCard.tsx` ⭐
**功能**：商店道具卡片  
**Props**：
```typescript
interface ItemCardProps {
  item: ShopItem;
  currentPoints: number;
  onPurchase: (item: ShopItem) => void;
}
```

---

#### 5. `src/utils/eventBus.ts` ⭐⭐
**功能**：簡單的事件總線（未來擴充用）  
**用途**：
- 解耦模組之間的依賴
- 挑戰完成 → 積分系統響應
- 里程碑解鎖 → 積分獎勵

---

#### 6. `src/utils/pointsRewards.ts` ⭐
**功能**：積分獎勵定義（未來擴充）  
**內容**：
- 定義各種積分獲取來源
- 統一管理獎勵規則
- 方便未來新增連續登入、成就系統

---

### 🔄 需要小幅調整的檔案

#### 1. `src/components/history/HistoryPage.tsx` ⭐
**調整內容**：
- 在記錄列表中，標記 `guiltFree: true` 的記錄
- 顯示 🎫 圖示和「已豁免」文字
- 使用灰色背景（區別於普通消費的紅色）

---

#### 2. `src/components/history/CategoryPieChart.tsx` ⭐
**調整內容**：
- 計算「生命殺手」時，排除 `guiltFree: true` 的記錄
- 提示文案：「（不含已豁免消費）」

---

#### 3. `src/components/settings/SettingsPage.tsx` ⭐
**調整內容**：
- 新增「商店」入口按鈕或 Tab
- 顯示當前積分餘額

---

#### 4. `src/utils/storage.ts`
**調整內容**：無需修改（已足夠通用）

---

#### 5. `src/services/googleSheets.ts`
**調整內容**：無需修改（API 已支援 UserData 的擴充）

---

## 實作順序建議

### 🚀 Phase 1: 基礎設施（2-3 小時）

**目標**：建立積分和庫存系統的底層邏輯

1. ✅ 修改 `src/types/index.ts`
   - 新增所有需要的介面定義
   - 擴充 UserData 和 Record

2. ✅ 創建 `src/utils/pointsSystem.ts`
   - 實作積分增減邏輯
   - localStorage 存取
   - 基本測試

3. ✅ 創建 `src/utils/inventorySystem.ts`
   - 實作道具管理邏輯
   - localStorage 存取

4. ✅ 修改 `google-apps-script/Code.gs`
   - 擴充欄位定義
   - 修改 saveUserData / getUserData
   - 測試 JSON 存取

**驗收標準**：
- 積分可以正確增減並儲存
- 道具數量可以正確管理並儲存
- Google Sheets 可以正確讀寫新欄位

---

### 🎯 Phase 2: 每日挑戰重構（3-4 小時）

**目標**：將挑戰系統與記帳分離

1. ✅ 修改 `src/components/dashboard/DailyChallenge.tsx`
   - 移除 skippedAmounts 邏輯
   - 完成時只增加積分
   - 新增「記帳提示」Toast UI

2. ✅ 修改 `src/components/dashboard/DashboardScreen.tsx`
   - 整合 PointsSystem
   - 處理挑戰完成事件
   - 顯示積分餘額

3. ✅ 修改 `src/components/App.tsx`
   - 載入積分和庫存
   - 同步到 localStorage 和 Google Sheets

4. ✅ 測試
   - 完成挑戰是否正確獲得積分
   - 積分是否正確儲存
   - 不點「記一筆」是否不會創建記錄

**驗收標準**：
- 完成挑戰只影響積分，不影響財務記錄
- Toast 提示正確顯示
- 可選擇是否記帳

---

### 🏠 Phase 3: 首頁確認機制（2 小時）

**目標**：首頁「我不買了」增加確認步驟

1. ✅ 修改 `src/components/common/CelebrationModal.tsx`
   - 新增 onConfirmSave Props
   - 新增「把這筆錢存下來」按鈕

2. ✅ 修改 `src/components/dashboard/DashboardScreen.tsx`
   - 修改 handleSkipped 邏輯
   - 新增 handleConfirmSave 函數
   - 新增 pendingSave State

3. ✅ 測試
   - 點擊「我不買了」是否顯示慶祝
   - 點擊「存下來」是否正確記帳
   - 直接關閉是否不記帳

**驗收標準**：
- 「我不買了」不會自動記帳
- 提供明確的確認按鈕
- 流程流暢不阻礙

---

### 💰 Phase 4: 免死金牌系統（4-5 小時）

**目標**：實作完整的道具兌換和使用流程

1. ✅ 創建 `src/components/shop/ShopPage.tsx`
   - 顯示可兌換道具
   - 顯示當前積分
   - 處理兌換邏輯

2. ✅ 創建 `src/components/shop/ItemCard.tsx`
   - 道具卡片 UI
   - 價格顯示
   - 兌換按鈕

3. ✅ 修改 `src/components/tracker/MainTracker.tsx`
   - 記帳時顯示「使用免死金牌」選項
   - 處理道具使用邏輯
   - 標記 guiltFree: true

4. ✅ 修改 `src/components/history/HistoryPage.tsx`
   - 特殊顯示已豁免的記錄

5. ✅ 修改 `src/components/history/CategoryPieChart.tsx`
   - 排除已豁免記錄

6. ✅ 修改 `src/components/settings/SettingsPage.tsx`
   - 新增商店入口

**驗收標準**：
- 可以用積分兌換道具
- 記帳時可以使用道具
- 已豁免的消費正確顯示和統計

---

### 🎨 Phase 5: UI/UX 優化（2-3 小時）

**目標**：提升使用體驗

1. ✅ 動畫優化
   - 積分增加時的粒子效果
   - 兌換道具時的特效
   - 使用道具時的溫暖視覺

2. ✅ Toast/Snackbar 統一
   - 確保非阻斷式
   - 5 秒自動關閉
   - 可手動關閉

3. ✅ 文案優化
   - 所有提示文案保持正向
   - 避免「失敗」、「不足」等負面詞彙

4. ✅ 響應式調整
   - 確保小螢幕正常顯示
   - 按鈕大小適中

**驗收標準**：
- 操作流暢不卡頓
- 視覺回饋即時明確
- 文案友善易懂

---

### 🧪 Phase 6: 測試與修正（1-2 小時）

**目標**：全面測試並修正問題

1. ✅ 功能測試清單
   - [ ] 完成挑戰獲得積分
   - [ ] 積分正確儲存到 localStorage
   - [ ] 積分正確同步到 Google Sheets
   - [ ] 每日挑戰重置（隔天）
   - [ ] 兌換道具扣除積分
   - [ ] 道具正確儲存到庫存
   - [ ] 使用道具扣除庫存
   - [ ] 已豁免消費正確標記
   - [ ] 統計排除已豁免記錄
   - [ ] 首頁確認流程完整
   - [ ] 多裝置同步（如果有）

2. ✅ 邊界測試
   - [ ] 積分不足時兌換
   - [ ] 道具不足時使用
   - [ ] 網路斷線時的處理
   - [ ] localStorage 滿了的處理

3. ✅ 修正 Bug

**驗收標準**：
- 所有功能測試通過
- 無明顯 Bug
- 錯誤處理完善

---

## 測試計劃

### 🧪 單元測試（可選）

如果要寫測試，建議測試以下模組：

```typescript
// src/utils/pointsSystem.test.ts
describe('PointsSystem', () => {
  test('增加積分應正確更新餘額', () => {
    // ...
  });
  
  test('扣除積分應驗證餘額是否足夠', () => {
    // ...
  });
});

// src/utils/inventorySystem.test.ts
describe('InventorySystem', () => {
  test('使用道具應扣除數量', () => {
    // ...
  });
  
  test('道具不足時應返回 false', () => {
    // ...
  });
});
```

### 🎭 手動測試場景

#### 場景 1：完整的每日挑戰流程

```
1. 進入 Dashboard
2. 看到 4 個每日挑戰（未完成狀態）
3. 點擊「跳過一杯咖啡」的「完成」
4. 驗證：
   ✓ 卡片變為完成狀態（綠底、打勾）
   ✓ Toast 顯示「獲得 10 ⏳」
   ✓ Toast 詢問「要把 $100 記下來嗎？」
   ✓ 積分餘額更新（10 → 10）
5. 點擊 Toast 的「記一筆」按鈕
6. 驗證：
   ✓ 開啟記帳 Modal（預填 $100、分類 Food）
   ✓ 儲存後記錄正確寫入
   ✓ 歷史頁面可以看到記錄
7. 完成其他 3 個挑戰（不點「記一筆」）
8. 驗證：
   ✓ 積分增加到 40
   ✓ 沒有創建額外的財務記錄
   ✓ 顯示「今日挑戰全部完成」
9. 隔天重新進入
10. 驗證：
    ✓ 挑戰已重置
    ✓ 積分餘額保留（40）
```

#### 場景 2：首頁確認機制

```
1. 進入 Dashboard
2. 輸入金額 $500
3. 點擊「我不買了」
4. 驗證：
   ✓ 顯示 Confetti 動畫
   ✓ 顯示 CelebrationModal
   ✓ Modal 顯示「守住了 $500」
   ✓ Modal 有兩個按鈕
5. 點擊「把這筆錢存下來」
6. 驗證：
   ✓ 創建 save 記錄
   ✓ 歷史頁面可見
   ✓ Modal 關閉
7. 重複步驟 1-3
8. 這次點擊「繼續加油」或等待自動關閉
9. 驗證：
   ✓ 沒有創建任何記錄
   ✓ 金額重置
```

#### 場景 3：免死金牌完整流程

```
1. 累積 300 積分（完成 30 個挑戰）
2. 進入設定 → 商店
3. 驗證：
   ✓ 顯示「免死金牌」道具
   ✓ 價格 300 ⏳
   ✓ 當前積分 300 ⏳
4. 點擊「兌換」
5. 驗證：
   ✓ 積分扣除到 0
   ✓ 庫存增加到 1
   ✓ Toast 顯示「兌換成功」
6. 進入記帳頁面（MainTracker）
7. 輸入金額 $200、選擇「花費」
8. 驗證：
   ✓ 顯示「使用免死金牌」按鈕（因為庫存 > 0）
9. 點擊「使用免死金牌」
10. 驗證：
    ✓ 彈出確認 Modal
    ✓ 文案正向且溫暖
11. 點擊「確定使用」
12. 驗證：
    ✓ 庫存扣除到 0
    ✓ 創建記錄時 guiltFree: true
    ✓ 特殊慶祝動畫（綠色主題）
13. 進入歷史頁面
14. 驗證：
    ✓ 該記錄顯示灰色背景
    ✓ 標註「🎫 已豁免」
15. 查看支出分類圖表
16. 驗證：
    ✓ 「生命殺手」不包含該記錄
```

#### 場景 4：Google Sheets 同步

```
1. 完成上述所有操作
2. 打開 Google Sheets
3. 驗證「使用者資料」工作表：
   ✓ Col 10 顯示正確的積分餘額
   ✓ Col 11 顯示 {"guiltFreePass": 0}
   ✓ Col 12 顯示 [] 或自定義挑戰 JSON
4. 清除瀏覽器 localStorage
5. 重新載入 App
6. 驗證：
   ✓ 從 Google Sheets 正確載入積分
   ✓ 從 Google Sheets 正確載入庫存
   ✓ 數據完全一致
```

---

## 未來擴充性設計

### 🔮 預留的擴充點

#### 1. 新的積分來源

已透過 `eventBus` 和 `POINTS_SOURCES` 設計了接口，未來可輕鬆新增：

```typescript
// 只需要在 pointsRewards.ts 中新增定義
{
  id: 'streak_7',
  type: 'streak',
  amount: 50,
  condition: () => getLoginStreak() === 7,
  message: '連續登入 7 天！獲得 50 ⏳'
}

// 然後在適當的地方觸發事件
eventBus.emit('streak:achieved', { days: 7 });
```

**可能的來源**：
- 連續登入獎勵
- 里程碑首次解鎖
- 每週儲蓄達標
- 邀請好友（如果未來有社群功能）
- 完成教學任務

---

#### 2. 新的商店道具

已透過 `ShopItem` 介面和 `SHOP_ITEMS` 陣列設計了接口，未來可新增：

```typescript
{
  id: 'theme_cyberpunk',
  name: 'Cyberpunk 主題',
  description: '讓你的 LifeBattery 變成霓虹風格',
  icon: '🌃',
  cost: 500,
  type: 'permanent',
  effect: 'unlock_theme'
}
```

**可能的道具**：
- UI 主題/皮膚
- 進階圖表解鎖
- 自訂提醒功能
- 數據匯出功能
- 進階分析報告

---

#### 3. 成就系統

可以基於現有的事件系統，新增成就追蹤：

```typescript
// src/utils/achievementSystem.ts
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: () => boolean;
  reward: number;  // 積分獎勵
}

const ACHIEVEMENTS = [
  {
    id: 'first_save',
    name: '第一桶金',
    description: '完成第一筆儲蓄記錄',
    icon: '🏆',
    condition: () => getTotalRecords() >= 1,
    reward: 50
  },
  // ...
];
```

---

#### 4. 挑戰難度系統

未來可以根據完成率動態調整挑戰難度：

```typescript
interface ChallengeDifficulty {
  easy: number;    // energyReward = 5
  normal: number;  // energyReward = 10
  hard: number;    // energyReward = 20
}

// 根據用戶完成率自動調整
if (completionRate > 80%) {
  suggestHarderChallenges();
}
```

---

#### 5. 積分流水帳（Analytics）

已預留 `PointsTransaction` 介面，未來可以實作：

```typescript
// 記錄每一筆積分變動
{
  id: "txn-123",
  type: "earn",
  amount: 10,
  source: "daily_challenge",
  timestamp: "2026-01-03T10:00:00Z",
  relatedId: "skip_coffee"
}

// 可視化積分獲取趨勢
<PointsHistoryChart transactions={history} />
```

---

### 🎨 架構優勢總結

1. **模組化**
   - ChallengeSystem, PointsSystem, InventorySystem 完全獨立
   - 修改一個不影響其他

2. **事件驅動**
   - 使用 EventBus 解耦
   - 新增功能不需要修改現有代碼

3. **介面導向**
   - 所有系統都定義了清晰的介面
   - 易於測試和替換實作

4. **數據分離**
   - 遊戲數據（積分、道具）與財務數據（記錄）完全分離
   - 保證財務數據的真實性

5. **向後兼容**
   - UserData 使用可選欄位（`?`）
   - 舊數據自動補充預設值
   - 不破壞現有功能

---

## 📌 關鍵決策記錄

### 決策 1：積分與記帳完全分離
**原因**：避免虛假財務數據，保證工具的可信度  
**代價**：增加一個確認步驟，但用非阻斷式 UI 降低干擾  
**好處**：用戶清楚知道什麼是遊戲、什麼是真實記帳

### 決策 2：免死金牌價格設為 300 積分
**原因**：讓用戶在 7-10 天內可以獲得第一個獎勵，保持動力  
**代價**：可能太容易獲得，未來可根據數據調整  
**好處**：快速體驗到獎勵循環，提高留存率

### 決策 3：使用事件總線而非直接呼叫
**原因**：解耦模組依賴，方便未來擴充  
**代價**：增加一層抽象，稍微複雜一點  
**好處**：新增功能時不需要修改現有代碼

### 決策 4：道具效果只影響統計，不影響計算
**原因**：保持退休計算的準確性  
**代價**：道具效果較弱，可能吸引力不足  
**好處**：財務數據永遠真實可靠

---

## ✅ 重構完成檢查清單

### 階段 1：基礎設施
- [ ] `src/types/index.ts` 新增所有介面
- [ ] `src/utils/pointsSystem.ts` 完成並測試
- [ ] `src/utils/inventorySystem.ts` 完成並測試
- [ ] `google-apps-script/Code.gs` 擴充欄位並測試
- [ ] Google Sheets 可正確讀寫 JSON

### 階段 2：每日挑戰
- [ ] `DailyChallenge.tsx` 移除記帳邏輯
- [ ] `DashboardScreen.tsx` 整合積分系統
- [ ] `App.tsx` 載入和儲存積分
- [ ] 完成挑戰只獲得積分，不自動記帳
- [ ] Toast 詢問是否記帳

### 階段 3：首頁確認
- [ ] `CelebrationModal.tsx` 新增確認按鈕
- [ ] `DashboardScreen.tsx` 修改 handleSkipped
- [ ] 點擊「我不買了」不自動記帳
- [ ] 提供明確的「存下來」選項

### 階段 4：免死金牌
- [ ] `ShopPage.tsx` 完成商店 UI
- [ ] `ItemCard.tsx` 完成道具卡片
- [ ] `MainTracker.tsx` 整合道具使用
- [ ] `HistoryPage.tsx` 特殊顯示已豁免記錄
- [ ] `CategoryPieChart.tsx` 排除已豁免記錄
- [ ] 兌換和使用流程完整

### 階段 5：優化
- [ ] 動畫流暢
- [ ] Toast 非阻斷
- [ ] 文案正向友善
- [ ] 響應式正常

### 階段 6：測試
- [ ] 所有手動測試場景通過
- [ ] 無明顯 Bug
- [ ] Google Sheets 同步正常
- [ ] 跨裝置數據一致

---

## 🎯 最終目標驗收

### 用戶體驗目標
✅ 用戶明確知道什麼是遊戲、什麼是記帳  
✅ 用戶不會因為「玩遊戲」而產生虛假數據  
✅ 用戶能快速獲得獎勵，保持動力  
✅ 用戶覺得操作流暢，不被打斷  

### 技術目標
✅ 代碼模組化，職責清晰  
✅ 易於測試和維護  
✅ 易於擴充新功能  
✅ 數據結構設計合理  

### 產品目標
✅ 財務數據永遠真實可靠  
✅ 遊戲化增加黏著度  
✅ 積分經濟可持續運作  
✅ 為未來擴充打好基礎  

---

**文件版本**: v1.0  
**最後更新**: 2026-01-03  
**作者**: TimeBar Team  
**狀態**: Ready for Implementation ✅
