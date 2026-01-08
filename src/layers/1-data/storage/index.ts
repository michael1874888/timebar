/**
 * TimeBar - 存儲層入口
 * Layer 1 (Data Layer)
 */

// 類型
export type {
  IStorage,
  ISyncStorage,
  IFullStorage,
  StorageOptions,
  StorageEventListener,
  StorageEventType,
} from './types';
export { StorageError } from './types';

// 適配器
export { LocalStorageAdapter, createLocalStorage } from './LocalStorageAdapter';
export { SessionStorageAdapter, createSessionStorage } from './SessionStorageAdapter';
export { MemoryStorageAdapter, StorageFactory, defaultStorage } from './StorageFactory';
export type { StorageType } from './StorageFactory';
