/**
 * TimeBar - Google Sheets API 適配器
 * Layer 1 (Data Layer) - 雲端同步實作
 *
 * 重構自：src/services/googleSheets.ts
 */

import type {
  ICloudSync,
  Result,
  UserDataDTO,
  RecordDTO,
  RetryPolicy,
} from './types';
import { APIError, defaultRetryPolicy } from './types';

/**
 * Google Sheets API 配置
 */
interface GoogleSheetsConfig {
  apiUrl: string | null;
  retryPolicy?: RetryPolicy;
}

/**
 * 從 localStorage 獲取 API URL
 */
function getStoredApiUrl(): string | null {
  try {
    return localStorage.getItem('googleSheetsApiUrl');
  } catch {
    return null;
  }
}

/**
 * Google Sheets API 適配器
 */
export class GoogleSheetsAdapter implements ICloudSync {
  private apiUrl: string | null;
  private retryPolicy: RetryPolicy;

  constructor(config?: Partial<GoogleSheetsConfig>) {
    this.apiUrl = config?.apiUrl ?? getStoredApiUrl();
    this.retryPolicy = config?.retryPolicy ?? defaultRetryPolicy;
  }

  /**
   * 設置 API URL
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
    try {
      localStorage.setItem('googleSheetsApiUrl', url);
    } catch (e) {
      console.warn('Failed to save API URL to localStorage:', e);
    }
  }

  /**
   * 檢查是否已配置
   */
  isConfigured(): boolean {
    return !!this.apiUrl;
  }

  /**
   * 執行帶重試的請求
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<Result<T>> {
    let lastError: Error = new Error('Unknown error');
    let delay = this.retryPolicy.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryPolicy.maxRetries; attempt++) {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retryPolicy.maxRetries) {
          await this.sleep(delay);
          delay = Math.min(
            delay * this.retryPolicy.backoffMultiplier,
            this.retryPolicy.maxDelayMs
          );
        }
      }
    }

    return { success: false, error: lastError };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 發送 API 請求
   */
  private async request<T>(
    action: string,
    data?: unknown
  ): Promise<T> {
    if (!this.apiUrl) {
      throw new APIError('API URL not configured');
    }

    const url = new URL(this.apiUrl);
    url.searchParams.set('action', action);

    const options: RequestInit = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      throw new APIError(
        `API request failed: ${response.statusText}`,
        response.status
      );
    }

    const result = await response.json();

    if (result.error) {
      throw new APIError(result.error);
    }

    return result;
  }

  // ==================== ICloudSync 實作 ====================

  async getAll(): Promise<Result<{
    userData: UserDataDTO | null;
    records: RecordDTO[];
    quickActions?: unknown[];
  }>> {
    if (!this.isConfigured()) {
      return {
        success: true,
        data: { userData: null, records: [] },
      };
    }

    return this.withRetry(async () => {
      const result = await this.request<{
        success: boolean;
        userData?: UserDataDTO;
        records?: RecordDTO[];
        quickActions?: unknown[];
      }>('getAll');

      return {
        userData: result.userData ?? null,
        records: result.records ?? [],
        quickActions: result.quickActions,
      };
    });
  }

  async getUserData(): Promise<Result<UserDataDTO | null>> {
    if (!this.isConfigured()) {
      return { success: true, data: null };
    }

    return this.withRetry(async () => {
      const result = await this.request<{
        success: boolean;
        userData?: UserDataDTO;
      }>('getUserData');

      return result.userData ?? null;
    });
  }

  async saveUserData(data: UserDataDTO): Promise<Result<void>> {
    if (!this.isConfigured()) {
      return { success: true, data: undefined };
    }

    return this.withRetry(async () => {
      await this.request('saveUserData', data);
    });
  }

  async getRecords(): Promise<Result<RecordDTO[]>> {
    if (!this.isConfigured()) {
      return { success: true, data: [] };
    }

    return this.withRetry(async () => {
      const result = await this.request<{
        success: boolean;
        records?: RecordDTO[];
      }>('getRecords');

      return result.records ?? [];
    });
  }

  async saveRecord(record: RecordDTO): Promise<Result<void>> {
    if (!this.isConfigured()) {
      return { success: true, data: undefined };
    }

    return this.withRetry(async () => {
      await this.request('saveRecord', record);
    });
  }

  async updateRecord(
    id: string,
    updates: Partial<RecordDTO>
  ): Promise<Result<void>> {
    if (!this.isConfigured()) {
      return { success: true, data: undefined };
    }

    return this.withRetry(async () => {
      await this.request('updateRecord', { id, ...updates });
    });
  }

  async deleteRecord(id: string): Promise<Result<void>> {
    if (!this.isConfigured()) {
      return { success: true, data: undefined };
    }

    return this.withRetry(async () => {
      await this.request('deleteRecord', { id });
    });
  }

  async clearAllData(): Promise<Result<void>> {
    if (!this.isConfigured()) {
      return { success: true, data: undefined };
    }

    return this.withRetry(async () => {
      await this.request('clearAll');
    });
  }
}

/**
 * 創建默認的 Google Sheets API 實例
 */
export const createGoogleSheetsAPI = (
  config?: Partial<GoogleSheetsConfig>
): GoogleSheetsAdapter => {
  return new GoogleSheetsAdapter(config);
};

/**
 * 默認 API 實例
 */
export const googleSheetsAPI = createGoogleSheetsAPI();
