/**
 * TimeBar - LocalStorage 適配器
 * Layer 1 (Data Layer) - LocalStorage 實作
 */

import type { IFullStorage, StorageOptions, StorageEventListener, StorageEventType } from './types';
import { StorageError } from './types';

const DEFAULT_PREFIX = 'timebar_';

/**
 * LocalStorage 適配器
 * 實作統一存儲接口
 */
export class LocalStorageAdapter implements IFullStorage {
  private prefix: string;
  private listeners: StorageEventListener[] = [];

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? DEFAULT_PREFIX;
  }

  /**
   * 獲取完整的鍵名
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 發送事件
   */
  private emit(type: StorageEventType, key?: string, value?: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, key, value });
      } catch (e) {
        console.error('Storage event listener error:', e);
      }
    });
  }

  // ==================== 異步方法 ====================

  async save<T>(key: string, value: T): Promise<void> {
    this.saveSync(key, value);
  }

  async load<T>(key: string, defaultValue?: T): Promise<T | null> {
    return this.loadSync(key, defaultValue);
  }

  async remove(key: string): Promise<void> {
    this.removeSync(key);
  }

  async clear(): Promise<void> {
    this.clearSync();
  }

  async has(key: string): Promise<boolean> {
    return this.hasSync(key);
  }

  async keys(): Promise<string[]> {
    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        allKeys.push(key.slice(this.prefix.length));
      }
    }
    return allKeys;
  }

  // ==================== 同步方法 ====================

  saveSync<T>(key: string, value: T): void {
    const fullKey = this.getFullKey(key);
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      this.emit('save', key, value);
    } catch (error) {
      throw new StorageError('Failed to save to localStorage', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  loadSync<T>(key: string, defaultValue?: T): T | null {
    const fullKey = this.getFullKey(key);
    try {
      const item = localStorage.getItem(fullKey);
      if (item === null) {
        return defaultValue ?? null;
      }
      const parsed = JSON.parse(item) as T;
      this.emit('load', key, parsed);
      return parsed;
    } catch (error) {
      console.warn(`Failed to parse localStorage item: ${key}`, error);
      return defaultValue ?? null;
    }
  }

  removeSync(key: string): void {
    const fullKey = this.getFullKey(key);
    localStorage.removeItem(fullKey);
    this.emit('remove', key);
  }

  clearSync(): void {
    // 只清除帶有前綴的項目
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    this.emit('clear');
  }

  hasSync(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  // ==================== 事件監聽 ====================

  /**
   * 添加事件監聽器
   */
  addListener(listener: StorageEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 移除所有監聯器
   */
  removeAllListeners(): void {
    this.listeners = [];
  }
}

/**
 * 創建默認的 LocalStorage 實例
 */
export const createLocalStorage = (options?: StorageOptions): LocalStorageAdapter => {
  return new LocalStorageAdapter(options);
};
