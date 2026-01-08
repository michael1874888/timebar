/**
 * TimeBar - SessionStorage 適配器
 * Layer 1 (Data Layer) - SessionStorage 實作 (用於臨時數據)
 */

import type { IFullStorage, StorageOptions, StorageEventListener, StorageEventType } from './types';
import { StorageError } from './types';

const DEFAULT_PREFIX = 'timebar_session_';

/**
 * SessionStorage 適配器
 * 用於存儲臨時數據（瀏覽器關閉後清除）
 */
export class SessionStorageAdapter implements IFullStorage {
  private prefix: string;
  private listeners: StorageEventListener[] = [];

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? DEFAULT_PREFIX;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

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
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
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
      sessionStorage.setItem(fullKey, serialized);
      this.emit('save', key, value);
    } catch (error) {
      throw new StorageError('Failed to save to sessionStorage', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  loadSync<T>(key: string, defaultValue?: T): T | null {
    const fullKey = this.getFullKey(key);
    try {
      const item = sessionStorage.getItem(fullKey);
      if (item === null) {
        return defaultValue ?? null;
      }
      const parsed = JSON.parse(item) as T;
      this.emit('load', key, parsed);
      return parsed;
    } catch (error) {
      console.warn(`Failed to parse sessionStorage item: ${key}`, error);
      return defaultValue ?? null;
    }
  }

  removeSync(key: string): void {
    const fullKey = this.getFullKey(key);
    sessionStorage.removeItem(fullKey);
    this.emit('remove', key);
  }

  clearSync(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    this.emit('clear');
  }

  hasSync(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return sessionStorage.getItem(fullKey) !== null;
  }

  // ==================== 事件監聽 ====================

  addListener(listener: StorageEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  removeAllListeners(): void {
    this.listeners = [];
  }
}

export const createSessionStorage = (options?: StorageOptions): SessionStorageAdapter => {
  return new SessionStorageAdapter(options);
};
