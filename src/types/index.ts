// TimeBar 類型定義

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

// ==================== 用戶數據 ====================

export interface UserData {
  age: number;
  salary: number;
  retireAge: number;
  currentSavings: number;
  monthlySavings: number;
  inflationRate: number;
  roiRate: number;
  targetRetirementFund?: number;

  // v2.0 新增欄位
  pointsBalance?: number;              // 積分餘額
  inventory?: Inventory;               // 道具庫存
  customChallenges?: ChallengeDefinition[];  // 自定義挑戰

  // v2.1 新增欄位
  customCategories?: Category[];       // 自訂分類
  budgetSettings?: BudgetSettings;     // 額度設定
  quickActions?: QuickAction[];        // 快速記帳按鈕

  // v2.2 新增設置同步欄位
  hiddenCategories?: string[];         // 隱藏的分類ID
  deletedDefaultChallenges?: string[]; // 刪除的預設挑戰ID
  modifiedDefaultChallenges?: Record<string, ChallengeDefinition>; // 修改的預設挑戰

  // Phase 1: 漸進式揭露功能
  createdAt?: string;                  // 用戶完成 onboarding 的時間戳（ISO 8601格式）

  // v4.1: 目標軌跡偏差模型
  trajectoryStartDate?: string;        // 起點日期 (ISO 8601)
  lastGoalChangeDate?: string;         // 最後一次修改退休目標的日期
  historicalDeviationHours?: number;   // 歷史累積偏差（工作小時）
}

// ==================== 記帳系統 ====================

export interface Record {
  id: string;
  type: 'spend' | 'save';
  amount: number;
  isRecurring: boolean;
  timeCost: number;
  category: string;
  note: string;
  timestamp: string;
  date: string;
  guiltFree?: boolean;       // v2.0: 是否使用免死金牌豁免
  
  // v2.1 新增：訂閱管理
  recurringStatus?: 'active' | 'ended';  // 訂閱狀態
  recurringEndDate?: string;             // 終止日期（YYYY-MM-DD）
  
  // v2.1 新增：元數據
  createdAt?: number;         // 創建時間戳記
  updatedAt?: number;         // 最後修改時間戳記
}

// ==================== 分類系統 ====================

export interface Category {
  id: string;                 // 'food', 'transport', 'housing'...
  name: string;               // '飲食', '交通', '居住'...
  icon: string;               // '🍽️', '🚗', '🏠'...
  color: string;              // Tailwind 色碼
  type: 'default' | 'custom'; // 預設或自訂
  isHidden?: boolean;         // 是否在選單中隱藏
  sortOrder?: number;         // 排序權重
}

// ==================== 額度系統 ====================

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

// ==================== 快速記帳 ====================

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

// ==================== 畫面路由 ====================

// Phase 2: 簡化導航結構，從 11 個畫面減少到 5 個核心畫面
// - 移除: 'shop', 'challenge-settings', 'subscription-manager', 'category-settings', 'budget-settings', 'quick-actions-settings', 'new-ui'
// - 重命名: 'dashboard' → 'home'
// - 這些功能將改用 Modal 顯示
export type Screen = 'loading' | 'onboarding' | 'home' | 'history' | 'settings';

export interface GPSResult {
  estimatedAge: number;
  ageDiff: number;
  ageDiffDays: number;
  isAhead: boolean;
  isBehind: boolean;
  isOnTrack: boolean;
  totalSavedHours: number;
  totalSpentHours: number;
}

export interface TimeFormatted {
  value: number;
  unit: string;
  color: string;
}

// 里程碑類型
export interface Milestone {
  id: string;
  name: string;
  hoursNeeded: number;
  icon: string;
  isUnlocked?: boolean;
}

// 節省記錄
export interface SkippedPurchase {
  id: string;
  amount: number;
  workingHours: number;
  timestamp: string;
}

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
  startDate: string;                  // 軌跡追蹤起點（ISO 8601 格式）
}


