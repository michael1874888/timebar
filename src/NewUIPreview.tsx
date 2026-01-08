/**
 * TimeBar - 新組件預覽頁面
 * 用於展示和測試新版 UI 組件
 */

import { useState } from 'react';
import { HomePage, HistoryPage } from '@ui/pages';
import type { RecordItem } from '@domain/types';
import type { RecordDTO } from '@data/api';

// 模擬用戶數據
const mockUserData = {
  age: 30,
  monthlySalary: 50000,
  targetRetireAge: 65,
};

// 模擬記錄 (RecordItem 格式，用於 HomePage)
const mockRecords: RecordItem[] = [
  { type: 'save', amount: 10000, timeCost: 64 },
  { type: 'spend', amount: 500, timeCost: 3.2 },
  { type: 'save', amount: 5000, timeCost: 32 },
  { type: 'spend', amount: 1500, timeCost: 9.6 },
];

// 模擬歷史記錄 (RecordDTO 格式，用於 HistoryPage)
const mockHistoryRecords: RecordDTO[] = [
  {
    id: '1',
    type: 'save',
    amount: 10000,
    isRecurring: false,
    timeCost: 64,
    category: '餐飲',
    note: '午餐便當',
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: '2',
    type: 'spend',
    amount: 500,
    isRecurring: false,
    timeCost: 3.2,
    category: '交通',
    note: '計程車',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    date: new Date().toISOString().split('T')[0],
  },
  {
    id: '3',
    type: 'save',
    amount: 5000,
    isRecurring: false,
    timeCost: 32,
    category: '娛樂',
    note: '電影票',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  },
  {
    id: '4',
    type: 'spend',
    amount: 1500,
    isRecurring: true,
    timeCost: 9.6,
    category: '訂閱',
    note: 'Netflix',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
  },
];

type Screen = 'home' | 'history';

/**
 * 預覽頁面
 */
export function NewUIPreview() {
  const [screen, setScreen] = useState<Screen>('home');
  const [records, setRecords] = useState<RecordItem[]>(mockRecords);
  const [historyRecords, setHistoryRecords] = useState<RecordDTO[]>(mockHistoryRecords);
  const [points, setPoints] = useState(150);

  const handleAddRecord = (record: {
    type: 'save' | 'spend';
    amount: number;
    timeCost: number;
    isRecurring: boolean;
  }) => {
    const newRecord: RecordItem = {
      type: record.type,
      amount: record.amount,
      timeCost: record.timeCost,
      isRecurring: record.isRecurring,
    };

    setRecords((prev) => [...prev, newRecord]);

    // 同時加入歷史記錄
    const newHistoryRecord: RecordDTO = {
      id: `${Date.now()}`,
      type: record.type,
      amount: record.amount,
      isRecurring: record.isRecurring,
      timeCost: record.timeCost,
      category: '一般',
      note: '',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };
    setHistoryRecords((prev) => [...prev, newHistoryRecord]);

    // 如果是節省，加積分
    if (record.type === 'save') {
      setPoints((prev) => prev + 10);
    }

    // 顯示提示
    const message =
      record.type === 'save'
        ? `🎉 太棒了！省下 $${record.amount.toLocaleString()}`
        : `📝 已記錄消費 $${record.amount.toLocaleString()}`;
    console.log(message);
  };

  const handleDeleteRecord = (id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // 渲染當前畫面
  if (screen === 'history') {
    return (
      <HistoryPage
        records={historyRecords}
        onBack={() => setScreen('home')}
        onDeleteRecord={handleDeleteRecord}
      />
    );
  }

  return (
    <>
      <HomePage
        userData={mockUserData}
        records={records}
        onAddRecord={handleAddRecord}
        points={points}
        onSettingsClick={() => console.log('Settings clicked')}
      />
      {/* 歷史記錄按鈕 */}
      <button
        onClick={() => setScreen('history')}
        style={{
          position: 'fixed',
          bottom: '5rem',
          right: '1rem',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '9999px',
          padding: '0.75rem 1.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
          zIndex: 50,
        }}
      >
        📊 歷史記錄
      </button>
    </>
  );
}

export default NewUIPreview;

