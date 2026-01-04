/**
 * 適配器實現
 * 將現有實現包裝為接口
 */

import { Storage } from './storage'
import { GoogleSheetsAPI } from '@/services/googleSheets'
import { IStorage, ICloudSync } from './interfaces'

/**
 * Storage 適配器
 * 將現有 Storage 包裝為 IStorage 接口
 */
export class StorageAdapter implements IStorage {
  save<T>(key: string, value: T): boolean {
    return Storage.save(key, value)
  }

  load<T>(key: string): T | null {
    return Storage.load(key)
  }

  clear(key: string): boolean {
    return Storage.clear(key)
  }
}

/**
 * GoogleSheets 適配器
 * 將現有 GoogleSheetsAPI 包裝為 ICloudSync 接口
 */
export class GoogleSheetsAdapter implements ICloudSync {
  isConfigured(): boolean {
    return GoogleSheetsAPI.isConfigured()
  }

  async getUserData(): Promise<{ success: boolean; data: any }> {
    return GoogleSheetsAPI.getUserData()
  }

  async saveUserData(data: any): Promise<{ success: boolean }> {
    return GoogleSheetsAPI.saveUserData(data)
  }
}
