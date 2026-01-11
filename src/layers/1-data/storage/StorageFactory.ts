/**
 * TimeBar - 存儲工廠
 * Layer 1 (Data Layer) - 根據配置創建存儲實例
 */

import type { IFullStorage, StorageOptions } from './types';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { SessionStorageAdapter } from './SessionStorageAdapter';

/**
 * 存儲類型
 */
export type StorageType = 'local' | 'session' | 'memory';

/**
 * 內存存儲（用於測試或 SSR）
 */
export class MemoryStorageAdapter implements IFullStorage {
  private store: Map<string, string> = new Map();

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
    return Array.from(this.store.keys());
  }

  saveSync<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value));
  }

  loadSync<T>(key: string, defaultValue?: T): T | null {
    const item = this.store.get(key);
    if (item === undefined) {
      return defaultValue ?? null;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return defaultValue ?? null;
    }
  }

  removeSync(key: string): void {
    this.store.delete(key);
  }

  clearSync(): void {
    this.store.clear();
  }

  hasSync(key: string): boolean {
    return this.store.has(key);
  }
}

/**
 * 存儲工廠
 */
export class StorageFactory {
  private static instances: Map<string, IFullStorage> = new Map();

  /**
   * 創建存儲實例
   */
  static create(type: StorageType, options?: StorageOptions): IFullStorage {
    const key = `${type}_${options?.prefix ?? 'default'}`;

    // 單例模式
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let instance: IFullStorage;

    switch (type) {
      case 'local':
        instance = new LocalStorageAdapter(options);
        break;
      case 'session':
        instance = new SessionStorageAdapter(options);
        break;
      case 'memory':
        instance = new MemoryStorageAdapter();
        break;
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }

    this.instances.set(key, instance);
    return instance;
  }

  /**
   * 獲取默認存儲實例 (LocalStorage)
   */
  static getDefault(): IFullStorage {
    return this.create('local');
  }

  /**
   * 清除所有實例（用於測試）
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}

/**
 * 默認存儲實例
 */
export const defaultStorage = StorageFactory.getDefault();
