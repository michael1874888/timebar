// TimeBar 類型定義 - v4.2 精簡版

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

  // v2.1 新增欄位
  customCategories?: Category[];       // 自訂分類

  // v2.2 新增設置同步欄位
  hiddenCategories?: string[];         // 隱藏的分類ID

  // 用戶創建時間
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

// ==================== 畫面路由 ====================

export type Screen = 'loading' | 'onboarding' | 'home' | 'history' | 'settings';

// ==================== GPS 計算結果 ====================

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

// ==================== v4.1: 目標軌跡偏差模型 ====================

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
  weeksElapsed: number;               // 已經過完整週數（用於目標儲蓄計算）
  requiredMonthlySavings: number;     // 每月必須儲蓄額
  startDate: string;                  // 軌跡追蹤起點（ISO 8601 格式）
}
