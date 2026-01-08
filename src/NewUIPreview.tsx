/**
 * TimeBar - 新組件預覽頁面
 * 用於展示和測試新版 UI 組件
 */

import { useState } from 'react';
import { HomePage } from '@ui/pages';
import type { RecordItem } from '@domain/types';

// 模擬用戶數據
const mockUserData = {
  age: 30,
  monthlySalary: 50000,
  targetRetireAge: 65,
};

// 模擬記錄
const mockRecords: RecordItem[] = [
  { type: 'save', amount: 10000, timeCost: 64 },
  { type: 'spend', amount: 500, timeCost: 3.2 },
  { type: 'save', amount: 5000, timeCost: 32 },
  { type: 'spend', amount: 1500, timeCost: 9.6 },
];

/**
 * 預覽頁面
 */
export function NewUIPreview() {
  const [records, setRecords] = useState<RecordItem[]>(mockRecords);
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

  return (
    <HomePage
      userData={mockUserData}
      records={records}
      onAddRecord={handleAddRecord}
      points={points}
      onSettingsClick={() => console.log('Settings clicked')}
    />
  );
}

export default NewUIPreview;
