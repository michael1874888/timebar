/**
 * TimeBar - API 層類型定義
 * Layer 1 (Data Layer) - API 接口和類型
 */

/**
 * API 結果類型
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

/**
 * API 錯誤
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * 重試策略
 */
export interface RetryPolicy {
  /** 最大重試次數 */
  maxRetries: number;
  /** 初始延遲 (ms) */
  initialDelayMs: number;
  /** 延遲倍數 */
  backoffMultiplier: number;
  /** 最大延遲 (ms) */
  maxDelayMs: number;
}

/**
 * 默認重試策略
 */
export const defaultRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 10000,
};

/**
 * 用戶數據傳輸對象
 */
export interface UserDataDTO {
  age: number;
  salary: number;
  retireAge: number;
  currentSavings: number;
  monthlySavings: number;
  inflationRate: number;
  roiRate: number;
  targetRetirementFund?: number;
}

/**
 * 記錄傳輸對象
 */
export interface RecordDTO {
  id: string;
  type: 'spend' | 'save';
  amount: number;
  isRecurring: boolean;
  timeCost: number;
  category: string;
  note: string;
  timestamp: string;
  date: string;
  recurringStatus?: 'active' | 'ended';
  recurringEndDate?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * 雲端同步接口
 */
export interface ICloudSync {
  /**
   * 檢查是否已配置
   */
  isConfigured(): boolean;

  /**
   * 獲取所有數據
   */
  getAll(): Promise<Result<{
    userData: UserDataDTO | null;
    records: RecordDTO[];
    quickActions?: unknown[];
  }>>;

  /**
   * 獲取用戶數據
   */
  getUserData(): Promise<Result<UserDataDTO | null>>;

  /**
   * 保存用戶數據
   */
  saveUserData(data: UserDataDTO): Promise<Result<void>>;

  /**
   * 獲取記錄
   */
  getRecords(): Promise<Result<RecordDTO[]>>;

  /**
   * 保存記錄
   */
  saveRecord(record: RecordDTO): Promise<Result<void>>;

  /**
   * 更新記錄
   */
  updateRecord(id: string, updates: Partial<RecordDTO>): Promise<Result<void>>;

  /**
   * 刪除記錄
   */
  deleteRecord(id: string): Promise<Result<void>>;

  /**
   * 清除所有數據
   */
  clearAllData(): Promise<Result<void>>;
}

/**
 * 同步狀態
 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

/**
 * 同步事件
 */
export interface SyncEvent {
  type: 'start' | 'success' | 'error' | 'offline';
  timestamp: number;
  error?: Error;
}
