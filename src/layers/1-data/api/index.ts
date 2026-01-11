/**
 * TimeBar - API 層入口
 * Layer 1 (Data Layer)
 */

// 類型
export type {
  Result,
  ICloudSync,
  UserDataDTO,
  RecordDTO,
  RetryPolicy,
  SyncStatus,
  SyncEvent,
} from './types';
export { APIError, defaultRetryPolicy } from './types';

// 適配器
export {
  GoogleSheetsAdapter,
  createGoogleSheetsAPI,
  googleSheetsAPI,
} from './GoogleSheetsAdapter';
