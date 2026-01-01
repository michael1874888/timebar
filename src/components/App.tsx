import { useState, useEffect } from 'react';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import { LifeCostCalculator } from './calculator/LifeCostCalculator';
import { FreedomTracker } from './freedom/FreedomTracker';
import { LifeBattery } from './visualization/LifeBattery';
import { HistoryPage } from './history/HistoryPage';
import { SettingsPage } from './settings/SettingsPage';
import { CelebrationSystem } from './feedback/CelebrationSystem';
import { DailyChallenge } from './challenges/DailyChallenge';
import { CatchUpPlan } from './psychology/CatchUpPlan';
import { SpendingBreakdown } from './analytics/SpendingBreakdown';
import { ErrorBoundary } from './common/ErrorBoundary';
import { GoogleSheetsAPI } from '@/services/googleSheets';
import { Storage } from '@/utils/storage';
import { CONSTANTS, GPSCalc } from '@/utils/financeCalc';
import { UserData, Record as RecordType, Screen } from '@/types';

const { DEFAULT_INFLATION_RATE, DEFAULT_ROI_RATE } = CONSTANTS;

type SyncStatus = '' | 'syncing' | 'synced' | 'offline';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [records, setRecords] = useState<RecordType[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSavedAmount, setLastSavedAmount] = useState(0);

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
            setScreen('main');
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

  // 自動關閉慶祝系統
  useEffect(() => {
    if (!showCelebration) return;

    const timer = setTimeout(() => {
      setShowCelebration(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showCelebration]);

  const handleOnboardingComplete = (data: UserData): void => {
    setUserData(data);
    setScreen('main');
  };

  const handleDecision = async (action: 'buy' | 'save', amount: number): Promise<void> => {
    if (!userData) return;

    const record: RecordType = {
      id: Date.now().toString(),
      type: action === 'save' ? 'save' : 'spend',
      amount,
      isRecurring: false,
      timeCost: 0, // 這裡可以計算，但不是必須
      category: action === 'save' ? '主動儲蓄' : '消費',
      note: '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    setRecords((prev) => [record, ...prev]);

    try {
      await GoogleSheetsAPI.saveRecord(record);
    } catch (error) {
      console.error('Failed to save record:', error);
    }

    // 只有「不買」才觸發慶祝
    if (action === 'save') {
      setLastSavedAmount(amount);
      setShowCelebration(true);
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
      // 繼續清除本地資料
    }
    Storage.clear();
    setUserData(null);
    setRecords([]);
    setScreen('onboarding');
  };

  // 計算累積數據
  const { totalSaved } = GPSCalc.calculateTotals(records);

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-4xl font-black text-white mb-4">
          Time<span className="text-emerald-400">Bar</span>
        </div>
        <div className="spinner mb-4" />
        <div className="text-gray-500 text-sm">
          {syncStatus === 'syncing' ? '☁️ 正在同步雲端資料...' : '載入中...'}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div>
        {/* 慶祝系統 */}
        {userData && (
          <CelebrationSystem
            trigger={showCelebration}
            amount={lastSavedAmount}
            userData={userData}
          />
        )}

        {screen === 'onboarding' && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}

        {screen === 'main' && userData && (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 animate-fade-in">
          {/* 頂部導航 */}
          <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
            <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
              <button
                onClick={() => setScreen('dashboard')}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              <div className="text-white font-bold">Time<span className="text-emerald-400">Bar</span></div>
              <button
                onClick={() => setScreen('settings')}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 主要內容 */}
          <LifeCostCalculator
            userData={userData}
            onDecision={handleDecision}
          />
        </div>
      )}

      {screen === 'dashboard' && userData && (
        <DashboardScreen
          userData={userData}
          records={records}
          totalSaved={totalSaved}
          onClose={() => setScreen('main')}
          onChallengeComplete={handleDecision}
          onShowCelebration={(amount: number) => {
            setLastSavedAmount(amount);
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          }}
        />
      )}

      {screen === 'history' && userData && (
        <HistoryPage
          records={records}
          userData={userData}
          onClose={() => setScreen('main')}
        />
      )}

      {screen === 'settings' && userData && (
        <SettingsPage
          userData={userData}
          onUpdateUser={handleUpdateUser}
          onClose={() => setScreen('main')}
          onReset={handleReset}
        />
      )}
      </div>
    </ErrorBoundary>
  );
}

// Dashboard Screen
interface DashboardScreenProps {
  userData: UserData;
  records: RecordType[];
  totalSaved: number;
  onClose: () => void;
  onChallengeComplete: (action: 'buy' | 'save', amount: number) => Promise<void>;
  onShowCelebration: (amount: number) => void;
}

function DashboardScreen({ userData, records, totalSaved, onClose, onChallengeComplete, onShowCelebration }: DashboardScreenProps) {
  // 計算 GPS 狀態，用於 CatchUpPlan
  const { estimatedAge } = GPSCalc.calculateEstimatedAge(userData.retireAge, records);
  const ageDiff = estimatedAge - userData.retireAge; // 正數 = 落後

  // 統計卡片收合狀態
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 pb-8 animate-slide-in-right">
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button onClick={onClose} className="text-gray-400 hover:text-white mr-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">自由儀表板</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <FreedomTracker userData={userData} totalSaved={totalSaved} />
        <LifeBattery userData={userData} records={records} />

        {/* 每日挑戰系統 */}
        <DailyChallenge
          userData={userData}
          onChallengeComplete={(challenge) => {
            // 記錄為一筆儲蓄
            onChallengeComplete('save', challenge.reward);
            // 觸發慶祝
            onShowCelebration(challenge.reward);
          }}
        />

        {/* 追趕計劃（只在落後時顯示） */}
        <CatchUpPlan userData={userData} ageDiff={ageDiff} />

        {/* 詳細統計收合按鈕 */}
        <button
          onClick={() => setShowDetailedStats(!showDetailedStats)}
          className="w-full bg-gray-800/40 rounded-2xl p-4 flex justify-between items-center hover:bg-gray-800/60 transition-colors"
        >
          <span className="text-gray-400 text-sm">📊 詳細統計</span>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${
              showDetailedStats ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 詳細統計區域（可收合） */}
        {showDetailedStats && (
          <div className="space-y-4 animate-slide-down">
            <SpendingBreakdown records={records} userData={userData} />
          </div>
        )}
      </div>
    </div>
  );
}
