/**
 * TimeBar - 存儲層類型定義
 * Layer 1 (Data Layer) - 存儲接口和類型
 */

/**
 * 存儲錯誤
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * 存儲選項
 */
export interface StorageOptions {
  /** 過期時間 (ms) */
  ttl?: number;
  /** 前綴 */
  prefix?: string;
}

/**
 * 統一存儲接口
 */
export interface IStorage {
  /**
   * 儲存數據
   */
  save<T>(key: string, value: T): Promise<void>;

  /**
   * 讀取數據
   */
  load<T>(key: string, defaultValue?: T): Promise<T | null>;

  /**
   * 移除數據
   */
  remove(key: string): Promise<void>;

  /**
   * 清除所有數據
   */
  clear(): Promise<void>;

  /**
   * 檢查鍵是否存在
   */
  has(key: string): Promise<boolean>;

  /**
   * 獲取所有鍵
   */
  keys(): Promise<string[]>;
}

/**
 * 同步存儲接口 (用於需要同步操作的場景)
 */
export interface ISyncStorage {
  saveSync<T>(key: string, value: T): void;
  loadSync<T>(key: string, defaultValue?: T): T | null;
  removeSync(key: string): void;
  clearSync(): void;
  hasSync(key: string): boolean;
}

/**
 * 結合異步和同步的完整存儲接口
 */
export interface IFullStorage extends IStorage, ISyncStorage {}

/**
 * 存儲事件類型
 */
export type StorageEventType = 'save' | 'load' | 'remove' | 'clear';

/**
 * 存儲事件監聽器
 */
export interface StorageEventListener {
  (event: { type: StorageEventType; key?: string; value?: unknown }): void;
}
