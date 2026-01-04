// Google Sheets API 服務
import { GAS_WEB_APP_URL } from '@/constants';
import type { UserData, Record } from '@/types';

export const GoogleSheetsAPI = {
  isConfigured: (): boolean => !!GAS_WEB_APP_URL,

  // 讀取使用者資料
  async getUserData(): Promise<{ success: boolean; data: UserData | null }> {
    if (!this.isConfigured()) return { success: false, data: null };
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getUserData`);
      const result = await response.json();
      return { success: true, data: result.userData };
    } catch (e) {
      console.error('getUserData error:', e);
      return { success: false, data: null };
    }
  },

  // 讀取所有消費紀錄
  async getRecords(): Promise<{ success: boolean; data: Record[] }> {
    if (!this.isConfigured()) return { success: false, data: [] };
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getRecords`);
      const result = await response.json();
      return { success: true, data: result.records || [] };
    } catch (e) {
      console.error('getRecords error:', e);
      return { success: false, data: [] };
    }
  },

  // 讀取全部資料（一次請求）
  async getAll(): Promise<{ success: boolean; userData: UserData | null; records: Record[] }> {
    if (!this.isConfigured()) return { success: false, userData: null, records: [] };
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getAll`);
      const result = await response.json();
      return {
        success: true,
        userData: result.userData,
        records: result.records || []
      };
    } catch (e) {
      console.error('getAll error:', e);
      return { success: false, userData: null, records: [] };
    }
  },

  async saveRecord(record: Record): Promise<{ success: boolean }> {
    if (!this.isConfigured()) return { success: false };
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addRecord', data: record }),
      });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  async saveUserData(userData: UserData): Promise<{ success: boolean }> {
    if (!this.isConfigured()) return { success: false };
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveUserData', data: userData }),
      });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  // v2.1: 更新記錄
  async updateRecord(record: Record): Promise<{ success: boolean }> {
    if (!this.isConfigured()) return { success: false };
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateRecord', data: record }),
      });
      return { success: true };
    } catch (e) {
      console.error('updateRecord error:', e);
      return { success: false };
    }
  },

  // v2.1: 刪除記錄
  async deleteRecord(id: string): Promise<{ success: boolean }> {
    if (!this.isConfigured()) return { success: false };
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteRecord', id }),
      });
      return { success: true };
    } catch (e) {
      console.error('deleteRecord error:', e);
      return { success: false };
    }
  },

  async clearAllData(): Promise<{ success: boolean }> {
    if (!this.isConfigured()) return { success: false };
    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearAllData' }),
      });
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },
};
