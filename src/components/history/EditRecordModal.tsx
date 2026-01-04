/**
 * EditRecordModal - 編輯記錄 Modal
 * v2.1: 允許用戶編輯金額、分類、備註（日期和類型不可改）
 */

import { useState } from 'react';
import { Record as RecordType, Category } from '@/types';
import { DEFAULT_CATEGORIES } from '@/utils/categorySystem';

interface EditRecordModalProps {
  record: RecordType;
  onSave: (updates: { amount: number; category: string; note: string }) => void;
  onCancel: () => void;
  categories?: Category[];
}

export function EditRecordModal({ record, onSave, onCancel, categories }: EditRecordModalProps) {
  const [amount, setAmount] = useState(record.amount);
  const [category, setCategory] = useState(record.category);
  const [note, setNote] = useState(record.note || '');
  const [error, setError] = useState('');

  // 使用預設分類或傳入的分類
  const allCategories = categories || DEFAULT_CATEGORIES;

  const handleSave = () => {
    if (amount <= 0) {
      setError('金額必須大於 0');
      return;
    }
    if (!category) {
      setError('請選擇分類');
      return;
    }
    onSave({ amount, category, note });
  };

  // 格式化時間成本
  const formatTimeCost = (hours: number) => {
    if (hours < 1) {
      return `約 ${Math.round(hours * 60)} 分鐘`;
    }
    return `約 ${hours.toFixed(1)} 小時`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md animate-scale-up max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-6">
          ✏️ 編輯{record.type === 'spend' ? '消費' : '儲蓄'}記錄
        </h2>

        {/* 金額 */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">金額 *</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xl">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 bg-gray-700 text-white text-xl rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 分類選擇器 */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">分類 *</label>
          <div className="grid grid-cols-4 gap-2">
            {allCategories.filter(c => !c.isHidden).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  category === cat.id
                    ? 'bg-emerald-500 ring-2 ring-emerald-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs text-gray-300 mt-1">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 備註 */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">備註（選填）</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：午餐、Netflix 訂閱"
            maxLength={100}
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 不可編輯資訊 */}
        <div className="bg-gray-700/50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">📅 日期（不可改）</span>
            <span className="text-gray-300">{record.date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">⏱️ 生命時間</span>
            <span className="text-gray-300">{formatTimeCost(record.timeCost)}</span>
          </div>
          {record.isRecurring && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">🔄 每月固定</span>
              <span className="text-emerald-400">是</span>
            </div>
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="text-red-400 text-sm mb-4">{error}</div>
        )}

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-gray-900 font-bold hover:bg-emerald-400"
          >
            儲存修改
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  record: RecordType;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ record, onConfirm, onCancel }: DeleteConfirmModalProps) {
  // 取得分類圖示
  const category = DEFAULT_CATEGORIES.find(c => c.id === record.category);
  const categoryIcon = category?.icon || '📦';
  const categoryName = category?.name || record.category;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">確定要刪除嗎？</h2>
          <p className="text-gray-400 text-sm">刪除後無法復原</p>
        </div>

        {/* 記錄摘要 */}
        <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{categoryIcon}</span>
            <div>
              <div className="text-white font-medium">{categoryName}</div>
              <div className={`text-lg font-bold ${record.type === 'spend' ? 'text-red-400' : 'text-emerald-400'}`}>
                {record.type === 'spend' ? '-' : '+'}${record.amount.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            📅 {record.date}
            {record.note && <span className="ml-2">• {record.note}</span>}
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-400"
          >
            確定刪除
          </button>
        </div>
      </div>
    </div>
  );
}
