import { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { MainTracker } from './tracker/MainTracker';
import { HistoryPage } from './history/HistoryPage';
import { SettingsPage } from './settings/SettingsPage';
import { GoogleSheetsAPI } from '@/services/googleSheets';
import { Storage } from '@/utils/storage';
import { CONSTANTS } from '@/utils/financeCalc';
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

            // 合併記錄：使用 id 去重，保留兩邊的記錄
            const cloudRecords = cloudData.records || [];
            const mergedRecords = [...localRecords];
            const existingIds = new Set(localRecords.map(r => r.id));

            cloudRecords.forEach(cloudRecord => {
              if (!existingIds.has(cloudRecord.id)) {
                mergedRecords.push(cloudRecord);
              }
            });

            // 按時間戳排序（最新的在前）
            mergedRecords.sort((a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            // 如果本地有額外的記錄，需要同步到雲端
            if (mergedRecords.length > cloudRecords.length) {
              const newRecords = mergedRecords.filter(r =>
                !cloudRecords.some(cr => cr.id === r.id)
              );
              for (const record of newRecords) {
                await GoogleSheetsAPI.saveRecord(record);
              }
            }

            setUserData(cloudUserData);
            setRecords(mergedRecords);

            // 同步到本地
            Storage.save('userData', cloudUserData);
            Storage.save('records', mergedRecords);

            setSyncStatus('synced');
            setScreen('main');
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
        setScreen('main');
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
      GoogleSheetsAPI.saveUserData(userData);
    }
  }, [userData]);

  // 當 records 更新時，同步到本地（包括空陣列）
  useEffect(() => {
    if (userData) {
      // 只在有 userData 時才儲存 records（避免初始載入時覆蓋）
      Storage.save('records', records);
    }
  }, [records, userData]);

  const handleOnboardingComplete = (data: UserData): void => { setUserData(data); setScreen('main'); };
  const handleAddRecord = async (record: RecordType): Promise<void> => { setRecords(prev => [...prev, record]); await GoogleSheetsAPI.saveRecord(record); };
  const handleUpdateUser = (data: UserData): void => { setUserData(data); };
  const handleReset = async (): Promise<void> => {
    await GoogleSheetsAPI.clearAllData();
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
      {screen === 'main' && userData && (
        <MainTracker userData={userData} records={records} onAddRecord={handleAddRecord}
          onOpenHistory={() => setScreen('history')} onOpenSettings={() => setScreen('settings')} />
      )}
      {screen === 'history' && userData && (
        <HistoryPage records={records} userData={userData} onClose={() => setScreen('main')} />
      )}
      {screen === 'settings' && userData && (
        <SettingsPage userData={userData} onUpdateUser={handleUpdateUser}
          onClose={() => setScreen('main')} onReset={handleReset} />
      )}
    </div>
  );
}
