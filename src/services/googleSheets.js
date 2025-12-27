// Google Sheets API 服務
import { GAS_WEB_APP_URL } from '@/constants';

export const GoogleSheetsAPI = {
  isConfigured: () => !!GAS_WEB_APP_URL,

  // 讀取使用者資料
  async getUserData() {
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
  async getRecords() {
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
  async getAll() {
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

  async saveRecord(record) {
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

  async saveUserData(userData) {
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

  async clearAllData() {
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
