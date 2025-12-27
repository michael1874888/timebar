import { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { MainTracker } from './tracker/MainTracker';
import { HistoryPage } from './history/HistoryPage';
import { SettingsPage } from './settings/SettingsPage';
import { GoogleSheetsAPI } from '@/services/googleSheets';
import { Storage } from '@/utils/storage';
import { CONSTANTS } from '@/utils/financeCalc';

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [userData, setUserData] = useState(null);
  const [records, setRecords] = useState([]);
  const [syncStatus, setSyncStatus] = useState(''); // '', 'syncing', 'synced', 'offline'

  // 載入資料：優先從雲端讀取
  useEffect(() => {
    const loadData = async () => {
      // 先讀取本地資料作為備用
      const localUserData = Storage.load('userData');
      const localRecords = Storage.load('records', []);

      // 嘗試從雲端讀取
      if (GoogleSheetsAPI.isConfigured()) {
        setSyncStatus('syncing');
        try {
          const cloudData = await GoogleSheetsAPI.getAll();

          if (cloudData.success && cloudData.userData) {
            // 雲端有資料，使用雲端資料
            const cloudUserData = {
              ...cloudData.userData,
              inflationRate: cloudData.userData.inflationRate ?? DEFAULT_INFLATION_RATE,
              roiRate: cloudData.userData.roiRate ?? DEFAULT_ROI_RATE,
              monthlySavings: cloudData.userData.monthlySavings ?? Math.round(cloudData.userData.salary * 0.2),
            };

            setUserData(cloudUserData);
            setRecords(cloudData.records || []);

            // 同步到本地
            Storage.save('userData', cloudUserData);
            Storage.save('records', cloudData.records || []);

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
        setUserData({
          ...localUserData,
          inflationRate: localUserData.inflationRate ?? DEFAULT_INFLATION_RATE,
          roiRate: localUserData.roiRate ?? DEFAULT_ROI_RATE,
          monthlySavings: localUserData.monthlySavings ?? Math.round(localUserData.salary * 0.2),
        });
        setRecords(localRecords);
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

  // 當 records 更新時，同步到本地
  useEffect(() => {
    if (records.length > 0) Storage.save('records', records);
  }, [records]);

  const handleOnboardingComplete = (data) => { setUserData(data); setScreen('main'); };
  const handleAddRecord = async (record) => { setRecords(prev => [...prev, record]); await GoogleSheetsAPI.saveRecord(record); };
  const handleUpdateUser = (data) => { setUserData(data); };
  const handleReset = async () => {
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
