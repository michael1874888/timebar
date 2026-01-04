/**
 * RecordSystem - 記帳 CRUD 系統
 * v2.1: 提供記錄的創建、讀取、更新、刪除功能
 */

import { Record } from '@/types';
import { Storage } from '@/utils/storage';
import { GoogleSheetsAPI } from '@/services/googleSheets';

const RECORDS_KEY = 'timebar_records';

export const RecordSystem = {
  /**
   * 更新記錄（有限度編輯）
   * 可編輯：金額、分類、備註
   * 不可編輯：日期、類型、是否循環
   */
  async updateRecord(
    records: Record[],
    id: string,
    updates: Pick<Partial<Record>, 'amount' | 'category' | 'note'>
  ): Promise<{ success: boolean; records: Record[]; error?: string }> {
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, records, error: '找不到該記錄' };
    }

    // 驗證
    if (updates.amount !== undefined && updates.amount <= 0) {
      return { success: false, records, error: '金額必須大於 0' };
    }

    // 更新記錄
    const updatedRecord: Record = {
      ...records[index],
      ...updates,
      updatedAt: Date.now()
    };

    // 重新計算 timeCost（如果金額變更）
    // 這裡需要外部傳入 hourlyRate，暫時保留原值
    // TODO: 可考慮接受 hourlyRate 參數重新計算

    const newRecords = [...records];
    newRecords[index] = updatedRecord;

    // 儲存到 localStorage
    Storage.save(RECORDS_KEY, newRecords);

    // 同步到 Google Sheets
    try {
      await GoogleSheetsAPI.updateRecord(updatedRecord);
    } catch (error) {
      console.error('[RecordSystem] Failed to sync update to cloud:', error);
      // 本地已更新，繼續使用
    }

    return { success: true, records: newRecords };
  },

  /**
   * 刪除記錄
   */
  async deleteRecord(
    records: Record[],
    id: string
  ): Promise<{ success: boolean; records: Record[]; error?: string }> {
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, records, error: '找不到該記錄' };
    }

    const newRecords = records.filter(r => r.id !== id);

    // 儲存到 localStorage
    Storage.save(RECORDS_KEY, newRecords);

    // 同步到 Google Sheets
    try {
      await GoogleSheetsAPI.deleteRecord(id);
    } catch (error) {
      console.error('[RecordSystem] Failed to sync delete to cloud:', error);
      // 本地已刪除，繼續使用
    }

    return { success: true, records: newRecords };
  },

  /**
   * 終止訂閱
   * 將循環支出標記為已終止，不再計入未來成本
   */
  async endSubscription(
    records: Record[],
    id: string
  ): Promise<{ success: boolean; records: Record[]; error?: string }> {
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, records, error: '找不到該記錄' };
    }

    const record = records[index];
    if (!record.isRecurring) {
      return { success: false, records, error: '此記錄不是循環支出' };
    }

    if (record.recurringStatus === 'ended') {
      return { success: false, records, error: '此訂閱已終止' };
    }

    // 標記為已終止
    const today = new Date().toISOString().split('T')[0];
    const updatedRecord: Record = {
      ...record,
      recurringStatus: 'ended',
      recurringEndDate: today,
      updatedAt: Date.now()
    };

    const newRecords = [...records];
    newRecords[index] = updatedRecord;

    // 儲存到 localStorage
    Storage.save(RECORDS_KEY, newRecords);

    // 同步到 Google Sheets
    try {
      await GoogleSheetsAPI.updateRecord(updatedRecord);
    } catch (error) {
      console.error('[RecordSystem] Failed to sync subscription end to cloud:', error);
    }

    return { success: true, records: newRecords };
  },

  /**
   * 驗證記錄
   */
  validateRecord(record: Partial<Record>): { valid: boolean; error?: string } {
    if (record.amount !== undefined && record.amount <= 0) {
      return { valid: false, error: '金額必須大於 0' };
    }
    if (record.category !== undefined && !record.category.trim()) {
      return { valid: false, error: '請選擇分類' };
    }
    return { valid: true };
  },

  /**
   * 取得所有進行中的訂閱
   */
  getActiveSubscriptions(records: Record[]): Record[] {
    return records.filter(r => 
      r.isRecurring && 
      r.type === 'spend' &&
      r.recurringStatus !== 'ended'
    );
  },

  /**
   * 取得已終止的訂閱
   */
  getEndedSubscriptions(records: Record[]): Record[] {
    return records.filter(r => 
      r.isRecurring && 
      r.recurringStatus === 'ended'
    );
  },

  /**
   * 計算訂閱的累計花費
   */
  calculateSubscriptionTotal(record: Record): number {
    if (!record.isRecurring) return record.amount;
    
    const startDate = new Date(record.date);
    const endDate = record.recurringEndDate 
      ? new Date(record.recurringEndDate)
      : new Date();
    
    // 計算月數
    const months = Math.max(1, 
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth()) + 1
    );
    
    return record.amount * months;
  }
};
