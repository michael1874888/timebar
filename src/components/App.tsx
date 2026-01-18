import { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { HomePage } from '@ui/pages/HomePage';
import { HistoryPage } from './history/HistoryPage';
import { SettingsPage } from './settings/SettingsPage';
import { GoogleSheetsAPI } from '@/services/googleSheets';
import { Storage } from '@/utils/storage';
import { CONSTANTS } from '@/utils/financeCalc';
import { RecordSystem } from '@/utils/recordSystem';
import { SettingsSystem } from '@/utils/settingsSystem';
import { UserData, Record as RecordType, Screen } from '@/types';

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;

type SyncStatus = '' | 'syncing' | 'synced' | 'offline';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('');

  // 載入資料：智能合併本地與雲端資料
  useEffect(() => {
    const loadData = async () => {
      // 先讀取本地資料
      const localUserData = Storage.load('userData') as UserData | null;
      const localRecords = (Storage.load('records', []) as RecordType[]) || [];

      // 嘗試從雲端讀取
      if (GoogleSheetsAPI.isConfigured()) {
        setSyncStatus('syncing');
        try {
          const cloudData = await GoogleSheetsAPI.getAll();

          if (cloudData.success && cloudData.userData) {
            // 雲端有資料，需要智能合併
            const cloudUserData = {
              ...cloudData.userData,
              inflationRate: cloudData.userData.inflationRate ?? DEFAULT_INFLATION_RATE,
              roiRate: cloudData.userData.roiRate ?? DEFAULT_ROI_RATE,
              monthlySavings: cloudData.userData.monthlySavings ?? Math.round(cloudData.userData.salary * 0.2),
            };

            // v2.2: 同步所有設置（分類等）
            await SettingsSystem.syncFromCloud();

            // 完全以雲端為準（source of truth），不合併本地記錄
            const cloudRecords = cloudData.records || [];

            // 按時間戳排序（最新的在前）
            cloudRecords.sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            setUserData(cloudUserData);
            setRecords(cloudRecords);

            // 同步到本地
            Storage.save('userData', cloudUserData);
            Storage.save('records', cloudRecords);

            setSyncStatus('synced');
            setScreen('home');
            return;
          } else if (cloudData.success && !cloudData.userData) {
            // 雲端成功回應但沒有資料 = 資料已被其他裝置清除
            Storage.clear();
            setUserData(null);
            setRecords([]);
            setSyncStatus('synced');
            setScreen('onboarding');
            return;
          }
        } catch (e) {
          console.error('Cloud sync failed:', e);
        }
        setSyncStatus('offline');
      }

      // 雲端沒資料或讀取失敗，使用本地資料
      if (localUserData) {
        const userData: UserData = {
          ...localUserData,
          inflationRate: localUserData.inflationRate ?? DEFAULT_INFLATION_RATE,
          roiRate: localUserData.roiRate ?? DEFAULT_ROI_RATE,
          monthlySavings: localUserData.monthlySavings ?? Math.round(localUserData.salary * 0.2),
        };
        setUserData(userData);
        setRecords(localRecords || []);
        setScreen('home');
      } else {
        // 都沒資料，進入 onboarding
        setScreen('onboarding');
      }
    };

    // 延遲一下讓 loading 畫面顯示
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  // 當 userData 更新時，同步到本地和雲端
  useEffect(() => {
    if (userData) {
      Storage.save('userData', userData);
      GoogleSheetsAPI.saveUserData(userData).catch((error) => {
        console.error('Failed to sync userData to cloud:', error);
      });
    }
  }, [userData]);

  // 當 records 更新時，同步到本地
  useEffect(() => {
    if (userData) {
      Storage.save('records', records);
    }
  }, [records, userData]);

  const handleOnboardingComplete = (data: UserData): void => {
    setUserData(data);
    setScreen('home');
  };

  const handleAddRecord = async (record: RecordType): Promise<void> => {
    const recordWithMeta: RecordType = {
      ...record,
      createdAt: Date.now()
    };
    setRecords(prev => [...prev, recordWithMeta]);
    try {
      await GoogleSheetsAPI.saveRecord(recordWithMeta);
    } catch (error) {
      console.error('Failed to save record to cloud:', error);
    }
  };

  const handleUpdateRecord = async (id: string, updates: { amount: number; category: string; note: string }): Promise<void> => {
    const result = await RecordSystem.updateRecord(records, id, updates);
    if (result.success) {
      setRecords(result.records);
    } else {
      console.error('Failed to update record:', result.error);
      throw new Error(result.error);
    }
  };

  const handleDeleteRecord = async (id: string): Promise<void> => {
    const result = await RecordSystem.deleteRecord(records, id);
    if (result.success) {
      setRecords(result.records);
    } else {
      console.error('Failed to delete record:', result.error);
      throw new Error(result.error);
    }
  };

  const handleUpdateUser = (data: UserData): void => {
    setUserData(data);
  };

  const handleReset = async (): Promise<void> => {
    try {
      await GoogleSheetsAPI.clearAllData();
    } catch (error) {
      console.error('Failed to clear cloud data:', error);
    }
    Storage.clear();
    setUserData(null);
    setRecords([]);
    setScreen('onboarding');
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-4xl font-black text-white mb-4">Time<span className="text-emerald-400">Bar</span></div>
        <div className="spinner mb-4" />
        <div className="text-gray-500 text-sm">
          {syncStatus === 'syncing' ? '☁️ 正在同步雲端資料...' : '載入中...'}
        </div>
      </div>
    );
  }

  return (
    <div>
      {screen === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingComplete} />}
      {screen === 'home' && userData && (
        <HomePage
          userData={{
            age: userData.age,
            monthlySalary: userData.salary,
            targetRetireAge: userData.retireAge,
          }}
          fullUserData={userData}
          records={records.map(r => ({
            type: r.type === 'spend' ? 'spend' : 'save',
            amount: r.amount,
            timeCost: r.timeCost || 0,
            isRecurring: r.isRecurring || false,
            timestamp: r.timestamp,
            date: r.date,
            recurringStatus: r.recurringStatus,
          } as any))}
          onAddRecord={(record) => {
            if ('id' in record && 'timestamp' in record) {
              handleAddRecord(record as RecordType);
              return;
            }

            const category = record.category || (record.type === 'save' ? '主動儲蓄' : '一般消費');
            const note = record.note || (record.type === 'save'
              ? (record.isRecurring ? '每月固定儲蓄' : '一次性儲蓄')
              : '');

            handleAddRecord({
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              date: new Date().toISOString().split('T')[0],
              type: record.type,
              amount: record.amount,
              timeCost: record.timeCost,
              category,
              note,
              isRecurring: record.isRecurring,
            } as RecordType);
          }}
          onSettingsClick={() => setScreen('settings')}
          onHistoryClick={() => setScreen('history')}
          onUpdateUserData={(updates) => {
            setUserData(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}
      {screen === 'history' && userData && (
        <HistoryPage
          records={records}
          userData={userData}
          onClose={() => setScreen('home')}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}
      {screen === 'settings' && userData && (
        <SettingsPage
          userData={userData}
          onUpdateUser={handleUpdateUser}
          onClose={() => setScreen('home')}
          onReset={handleReset}
          records={records}
          onUpdateRecords={setRecords}
        />
      )}
    </div>
  );
}
