/**
 * 核心系統抽象接口
 * 用於依賴注入和測試隔離
 */

// ==================== Storage 接口 ====================

export interface IStorage {
  save<T>(key: string, value: T): boolean
  load<T>(key: string): T | null
  clear(key: string): boolean
}

// ==================== Cloud Sync 接口 ====================

export interface ICloudSync {
  isConfigured(): boolean
  getUserData(): Promise<{ success: boolean; data: any }>
  saveUserData(data: any): Promise<{ success: boolean }>
}

// ==================== Debouncer 接口 ====================

export interface IDebouncer {
  schedule(callback: () => void | Promise<void>): void
  cancel(): void
  flush(): Promise<void>
}

/**
 * Debouncer 實現
 * 用於延遲和批量處理操作
 */
export class Debouncer implements IDebouncer {
  private timer: NodeJS.Timeout | null = null
  private callback: (() => void | Promise<void>) | null = null

  constructor(private delay: number = 1000) {}

  schedule(callback: () => void | Promise<void>): void {
    this.callback = callback

    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(async () => {
      if (this.callback) {
        await this.callback()
        this.callback = null
      }
      this.timer = null
    }, this.delay)
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.callback = null
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (this.callback) {
      await this.callback()
      this.callback = null
    }
  }
}
