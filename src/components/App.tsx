import { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { DashboardScreen } from './dashboard/DashboardScreen';
import { MainTracker } from './tracker/MainTracker';
import { HistoryPage } from './history/HistoryPage';
import { SettingsPage } from './settings/SettingsPage';
import { ShopPage } from './shop/ShopPage';
import { ChallengeSettingsPage } from './settings/ChallengeSettingsPage';
import { CategorySettingsPage } from './settings/CategorySettingsPage';
import { QuickActionsSettingsPage } from './settings/QuickActionsSettingsPage';
import { SubscriptionManagerPage } from './subscription/SubscriptionManagerPage';
// import { NewUIPreview } from '@/NewUIPreview'; // Phase 0: 暫時註釋，等待 @ui/pages 組件實現
import { GoogleSheetsAPI } from '@/services/googleSheets';
import { Storage } from '@/utils/storage';
import { CONSTANTS } from '@/utils/financeCalc';
import { PointsSystem } from '@/utils/pointsSystem';
import { InventorySystem } from '@/utils/inventorySystem';
import { RecordSystem } from '@/utils/recordSystem';
import { QuickActionsUtils } from './dashboard/QuickActionsBar';
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

            // v2.0: 同步積分和庫存到對應系統
            if (cloudUserData.pointsBalance !== undefined) {
              PointsSystem.setBalance(cloudUserData.pointsBalance);
            }
            if (cloudUserData.inventory) {
              InventorySystem.save(cloudUserData.inventory);
            }

            // v2.1: 同步快速記帳按鈕
            if (cloudData.quickActions && cloudData.quickActions.length > 0) {
              Storage.save('timebar_quick_actions', cloudData.quickActions);
            }

            // v2.2: 同步所有設置（分類、挑戰、預算）
            await SettingsSystem.syncFromCloud();

            // 完全以雲端為準（source of truth），不合併本地記錄
            // 這樣可以確保跨裝置資料同步的一致性，避免資料重置後出現舊資料
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
            setScreen('dashboard');
            return;
          } else if (cloudData.success && !cloudData.userData) {
            // 雲端成功回應但沒有資料 = 資料已被其他裝置清除
            // 清除本地資料以保持同步
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
        setScreen('dashboard');
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
        // 即使雲端同步失敗，本地資料已儲存，不影響使用
      });
    }
  }, [userData]);

  // 當 records 更新時，同步到本地（包括空陣列）
  useEffect(() => {
    if (userData) {
      // 只在有 userData 時才儲存 records（避免初始載入時覆蓋）
      Storage.save('records', records);
    }
  }, [records, userData]);

  const handleOnboardingComplete = (data: UserData): void => { setUserData(data); setScreen('dashboard'); };

  const handleAddRecord = async (record: RecordType): Promise<void> => {
    // v2.1: 新增 createdAt 時間戳記
    const recordWithMeta: RecordType = {
      ...record,
      createdAt: Date.now()
    };
    setRecords(prev => [...prev, recordWithMeta]);
    try {
      await GoogleSheetsAPI.saveRecord(recordWithMeta);

      // v2.0: 記帳後同步積分和庫存到雲端
      if (userData) {
        const updatedUserData: UserData = {
          ...userData,
          pointsBalance: PointsSystem.getBalance(),
          inventory: InventorySystem.load()
        };
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('Failed to save record to cloud:', error);
      // 記錄已加入本地，即使雲端同步失敗也不影響使用
    }
  };

  // v2.1: 更新記錄
  const handleUpdateRecord = async (id: string, updates: { amount: number; category: string; note: string }): Promise<void> => {
    const result = await RecordSystem.updateRecord(records, id, updates);
    if (result.success) {
      setRecords(result.records);
    } else {
      console.error('Failed to update record:', result.error);
      throw new Error(result.error);
    }
  };

  // v2.1: 刪除記錄
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
    // v2.0: 同步積分和庫存
    const updatedData: UserData = {
      ...data,
      pointsBalance: PointsSystem.getBalance(),
      inventory: InventorySystem.load()
    };
    setUserData(updatedData);
  };
  const handleReset = async (): Promise<void> => {
    try {
      await GoogleSheetsAPI.clearAllData();
    } catch (error) {
      console.error('Failed to clear cloud data:', error);
      // 繼續清除本地資料
    }
    Storage.clear();
    // v2.0: 重置積分和庫存系統
    PointsSystem.reset();
    InventorySystem.reset();
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
      {screen === 'dashboard' && userData && (
        <DashboardScreen
          userData={userData}
          records={records}
          onAddRecord={handleAddRecord}
          onOpenTracker={() => setScreen('tracker')}
          onOpenHistory={() => setScreen('history')}
          onOpenSettings={() => setScreen('settings')}
          onOpenQuickActionsSettings={() => setScreen('quick-actions-settings')}
          // Phase 0: onOpenNewUI 暫時移除，等待 @ui/pages 組件實現
        />
      )}
      {screen === 'tracker' && userData && (
        <MainTracker
          userData={userData}
          records={records}
          onAddRecord={handleAddRecord}
          onOpenHome={() => setScreen('dashboard')}
          onOpenHistory={() => setScreen('history')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'history' && userData && (
        <HistoryPage
          records={records}
          userData={userData}
          onClose={() => setScreen('dashboard')}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}
      {screen === 'settings' && userData && (
        <SettingsPage userData={userData} onUpdateUser={handleUpdateUser}
          onClose={() => setScreen('dashboard')} onReset={handleReset}
          onOpenShop={() => setScreen('shop')}
          onOpenChallengeSettings={() => setScreen('challenge-settings')}
          onOpenSubscriptionManager={() => setScreen('subscription-manager')}
          onOpenCategorySettings={() => setScreen('category-settings')} />
      )}
      {screen === 'shop' && userData && (
        <ShopPage onClose={() => setScreen('settings')} />
      )}
      {screen === 'challenge-settings' && (
        <ChallengeSettingsPage onClose={() => setScreen('settings')} />
      )}
      {screen === 'subscription-manager' && userData && (
        <SubscriptionManagerPage
          records={records}
          onUpdateRecords={setRecords}
          onClose={() => setScreen('settings')}
        />
      )}
      {screen === 'category-settings' && (
        <CategorySettingsPage onClose={() => setScreen('settings')} />
      )}
      {screen === 'quick-actions-settings' && (
        <QuickActionsSettingsPage onBack={() => setScreen('dashboard')} />
      )}
      {/* Phase 0: 暫時註釋，等待 @ui/pages 組件實現
      {screen === 'new-ui' && userData && (
        <div className="relative">
          <button
            onClick={() => setScreen('dashboard')}
            className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg text-gray-700 hover:bg-white transition"
          >
            ← 返回舊版
          </button>
          <NewUIPreview />
        </div>
      )}
      */}
    </div>
  );
}

