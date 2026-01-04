/**
 * SubscriptionManagerPage - 訂閱管理頁面
 * v2.1: 列出所有訂閱（進行中/已終止），支援終止訂閱
 */

import { useState, useMemo } from 'react';
import { Record as RecordType } from '@/types';
import { RecordSystem } from '@/utils/recordSystem';
import { CategorySystem } from '@/utils/categorySystem';
import { Formatters } from '@/utils/financeCalc';

const { formatCurrency } = Formatters;

interface SubscriptionManagerPageProps {
  records: RecordType[];
  onUpdateRecords: (records: RecordType[]) => void;
  onClose: () => void;
}

export function SubscriptionManagerPage({ records, onUpdateRecords, onClose }: SubscriptionManagerPageProps) {
  const [confirmEndId, setConfirmEndId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 取得進行中和已終止的訂閱
  const activeSubscriptions = useMemo(() => 
    RecordSystem.getActiveSubscriptions(records), [records]);
  
  const endedSubscriptions = useMemo(() => 
    RecordSystem.getEndedSubscriptions(records), [records]);

  // 計算訂閱統計
  const monthlyTotal = useMemo(() => 
    activeSubscriptions.reduce((sum, r) => sum + r.amount, 0), [activeSubscriptions]);

  // 終止訂閱
  const handleEndSubscription = async (id: string) => {
    setIsLoading(true);
    try {
      const result = await RecordSystem.endSubscription(records, id);
      if (result.success) {
        onUpdateRecords(result.records);
      }
    } catch (error) {
      console.error('Failed to end subscription:', error);
    } finally {
      setIsLoading(false);
      setConfirmEndId(null);
    }
  };

  // 取得分類顯示資訊
  const getCategoryDisplay = (categoryId: string) => {
    return CategorySystem.getCategoryDisplay(categoryId);
  };

  // 格式化日期範圍
  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = startDate.substring(0, 7).replace('-', '/');
    if (!endDate) return `${start} 起`;
    const end = endDate.substring(0, 7).replace('-', '/');
    return `${start} ~ ${end}`;
  };

  // 找到要終止的訂閱
  const confirmRecord = confirmEndId 
    ? records.find(r => r.id === confirmEndId) 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur sticky top-0 z-10 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">訂閱管理</h1>
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          {/* 訂閱統計 */}
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-4 mb-6 border border-pink-500/30">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-400 text-sm">每月訂閱支出</div>
                <div className="text-2xl font-bold text-pink-400">{formatCurrency(monthlyTotal)}</div>
              </div>
              <div className="text-4xl">📱</div>
            </div>
            <div className="text-gray-500 text-xs mt-2">
              共 {activeSubscriptions.length} 個進行中的訂閱
            </div>
          </div>

          {/* 進行中的訂閱 */}
          <div className="mb-6">
            <h2 className="text-gray-400 text-sm mb-3">🔄 進行中的訂閱 ({activeSubscriptions.length})</h2>
            {activeSubscriptions.length === 0 ? (
              <div className="bg-gray-800/40 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <div className="text-gray-500 text-sm">沒有進行中的訂閱支出</div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubscriptions.map((record) => {
                  const category = getCategoryDisplay(record.category);
                  return (
                    <div 
                      key={record.id}
                      className="bg-gray-800/60 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-2xl">
                          {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">
                            {record.note || category.name}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-pink-400 font-bold">
                              {formatCurrency(record.amount)}/月
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">
                              {formatDateRange(record.date)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmEndId(record.id)}
                          className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-red-500/30 text-gray-400 hover:text-red-400 text-sm transition-colors"
                        >
                          ⏸ 終止
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 已終止的訂閱 */}
          {endedSubscriptions.length > 0 && (
            <div className="mb-6">
              <h2 className="text-gray-400 text-sm mb-3">
                📦 已終止的訂閱 ({endedSubscriptions.length})
              </h2>
              <div className="space-y-3">
                {endedSubscriptions.map((record) => {
                  const category = getCategoryDisplay(record.category);
                  const totalPaid = RecordSystem.calculateSubscriptionTotal(record);
                  return (
                    <div 
                      key={record.id}
                      className="bg-gray-800/40 rounded-xl p-4 opacity-60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center text-2xl grayscale">
                          {category.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-400 font-medium truncate">
                            {record.note || category.name}
                            <span className="text-gray-600 text-xs ml-2">(已終止)</span>
                          </div>
                          <div className="text-gray-500 text-sm">
                            {formatDateRange(record.date, record.recurringEndDate)}
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            累計付費 {formatCurrency(totalPaid)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 提示文字 */}
          <div className="text-center text-gray-500 text-xs mt-6">
            <p>終止訂閱後，該筆支出不再計入未來退休計算</p>
            <p className="mt-1">⚠️ 請記得同時在官方平台取消訂閱</p>
          </div>
        </div>
      </div>

      {/* 終止確認 Modal */}
      {confirmRecord && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⏸</div>
              <h2 className="text-xl font-bold text-white mb-2">終止這個訂閱？</h2>
              <p className="text-gray-400 text-sm">此訂閱將不再計入未來支出</p>
            </div>

            {/* 訂閱資訊 */}
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryDisplay(confirmRecord.category).icon}</span>
                <div>
                  <div className="text-white font-medium">
                    {confirmRecord.note || getCategoryDisplay(confirmRecord.category).name}
                  </div>
                  <div className="text-pink-400 font-bold">
                    {formatCurrency(confirmRecord.amount)}/月
                  </div>
                </div>
              </div>
              <div className="text-gray-500 text-sm mt-2">
                終止日期：{new Date().toISOString().split('T')[0]}（今天）
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEndId(null)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                onClick={() => handleEndSubscription(confirmRecord.id)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-400 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? '處理中...' : '確定終止'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-xl px-6 py-4 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white">處理中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
