import { useMemo, useState } from 'react';
import { GPSCalc, Formatters } from '@/utils/financeCalc';
import { UserData, Record as RecordType } from '@/types';
import { CategoryPieChart } from './CategoryPieChart';
import { EditRecordModal, DeleteConfirmModal } from './EditRecordModal';
import { CategorySystem } from '@/utils/categorySystem';

const { formatTime, formatCurrency, formatAgeDiff } = Formatters;

interface HistoryPageProps {
  records: RecordType[];
  userData: UserData;
  onClose: () => void;
  onUpdateRecord?: (id: string, updates: { amount: number; category: string; note: string }) => Promise<void>;
  onDeleteRecord?: (id: string) => Promise<void>;
}

export function HistoryPage({ records, userData, onClose, onUpdateRecord, onDeleteRecord }: HistoryPageProps) {
  const { retireAge } = userData;

  // v2.1: 編輯/刪除 Modal 狀態
  const [editingRecord, setEditingRecord] = useState<RecordType | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<RecordType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 使用 GPSCalc 計算
  const { totalSaved, totalSpent } = useMemo(() => GPSCalc.calculateTotals(records), [records]);
  const gpsResult = useMemo(() => GPSCalc.calculateEstimatedAge(retireAge, records), [retireAge, records]);
  const { estimatedAge, ageDiff, isAhead, isOnTrack } = gpsResult;
  const diffDisplay = useMemo(() => formatAgeDiff(ageDiff), [ageDiff]);

  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [records]
  );

  const groupedRecords = useMemo(() =>
    sortedRecords.reduce((groups: { [key: string]: RecordType[] }, record) => {
      const date = new Date(record.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
      return groups;
    }, {} as { [key: string]: RecordType[] }),
    [sortedRecords]
  );

  // v2.1: 處理編輯儲存
  const handleEditSave = async (updates: { amount: number; category: string; note: string }) => {
    if (!editingRecord || !onUpdateRecord) return;
    setIsLoading(true);
    try {
      await onUpdateRecord(editingRecord.id, updates);
      setEditingRecord(null);
    } catch (error) {
      console.error('Failed to update record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // v2.1: 處理刪除確認
  const handleDeleteConfirm = async () => {
    if (!deletingRecord || !onDeleteRecord) return;
    setIsLoading(true);
    try {
      await onDeleteRecord(deletingRecord.id);
      setDeletingRecord(null);
    } catch (error) {
      console.error('Failed to delete record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 取得分類顯示資訊
  const getCategoryDisplay = (categoryId: string) => {
    return CategorySystem.getCategoryDisplay(categoryId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 pb-8">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 mr-4 p-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-slate-900">歷史紀錄</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* GPS Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-slate-200 shadow-md">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-600">{formatCurrency(totalSaved)}</div>
              <div className="text-slate-500 text-sm">累積儲蓄</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-orange-500">{formatCurrency(totalSpent)}</div>
              <div className="text-slate-500 text-sm">累積花費</div>
            </div>
          </div>

          <div className="h-px bg-slate-200 mb-6" />

          {/* GPS Timeline */}
          <div className="text-center mb-4">
            <div className="text-slate-500 text-sm mb-3">退休 GPS</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-500 text-xs">🎯 目標</div>
                <div className="text-slate-900 font-bold text-lg">{retireAge} 歲</div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden relative">
                  <div className={`h-full rounded-full transition-all ${
                    isOnTrack ? 'bg-gray-500' : isAhead ? 'bg-emerald-500' : 'bg-orange-500'
                  }`}
                    style={{ width: `${Math.min(100, Math.max(10, 50 + ageDiff * 10))}%` }} />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <div className={`text-xs ${isOnTrack ? 'text-slate-500' : isAhead ? 'text-emerald-600' : 'text-orange-500'}`}>
                  📍 預估
                </div>
                <div className={`font-bold text-lg ${isOnTrack ? 'text-slate-900' : isAhead ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {estimatedAge.toFixed(1)} 歲
                </div>
              </div>
            </div>
          </div>

          <div className={`text-center text-sm px-4 py-2 rounded-xl ${
            isOnTrack ? 'bg-slate-100 text-slate-700' :
            isAhead ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {isOnTrack
              ? `✅ 完美！目前剛好符合計畫`
              : isAhead
                ? `🎉 比目標提早 ${diffDisplay.value} ${diffDisplay.unit}！`
                : `📈 需要再努力 ${diffDisplay.value} ${diffDisplay.unit}`
            }
          </div>
        </div>

        {/* 支出分類分析 */}
        {records.length > 0 && (
          <div className="mb-6">
            <CategoryPieChart records={records} type="spend" />
          </div>
        )}

        {/* Records List */}
        {Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <div className="text-slate-500">還沒有任何紀錄</div>
            <div className="text-slate-400 text-sm mt-1">開始記錄你的第一筆吧！</div>
          </div>
        ) : (
          Object.entries(groupedRecords).map(([monthKey, monthRecords]) => {
            const [year, month] = monthKey.split('-');
            const monthSaved = monthRecords.filter(r => r.type === 'save').reduce((s, r) => s + r.amount, 0);
            const monthSpent = monthRecords.filter(r => r.type === 'spend').reduce((s, r) => s + r.amount, 0);

            return (
              <div key={monthKey} className="mb-6">
                <div data-testid="month-summary" className="flex justify-between items-center mb-3 px-1">
                  <div className="text-slate-600 font-medium">{year}年{month}月</div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-emerald-600">+{formatCurrency(monthSaved)}</span>
                    <span className="text-orange-500">-{formatCurrency(monthSpent)}</span>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  {monthRecords.map((record, i) => {
                    const time = formatTime(record.timeCost);
                    const date = new Date(record.timestamp);
                    const categoryDisplay = getCategoryDisplay(record.category);
                    // v4.1: 判斷是否為已豁免的記錄（例如已終止的訂閱）
                    const isExempted = record.recurringStatus === 'ended';

                    return (
                      <div key={record.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-slate-200' : ''}`}>
                        {/* 分類圖示 */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          record.type === 'save' ? 'bg-emerald-100' : 'bg-orange-100'
                        } ${isExempted ? 'opacity-50' : ''}`}>
                          {categoryDisplay.icon}
                        </div>
                        
                        {/* 記錄內容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <div className={`font-medium truncate ${isExempted ? 'text-slate-400' : 'text-slate-900'}`}>
                                {categoryDisplay.name || (record.type === 'save' ? '儲蓄' : '消費')}
                              </div>
                              {record.note && (
                                <div className="text-slate-500 text-xs truncate">
                                  {record.note}
                                </div>
                              )}
                              <div className="text-slate-400 text-xs">
                                {record.isRecurring ? '🔄 ' : ''}{date.getMonth() + 1}/{date.getDate()}
                                {isExempted && <span className="text-amber-500 ml-1">(已終止・不計入統計)</span>}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className={`font-bold ${
                                isExempted ? 'text-slate-400' :
                                record.type === 'save' ? 'text-emerald-600' : 'text-orange-500'
                              }`}>
                                {record.type === 'save' ? '+' : '-'}{formatCurrency(record.amount)}
                              </div>
                              {/* v4.1: 機會成本標註為參考值 */}
                              {!isExempted && (
                                <div className={`text-xs ${
                                  record.type === 'save' ? 'text-emerald-500/70' : 'text-orange-400/70'
                                }`}>
                                  <span title="僅供參考，不計入退休進度">
                                    💭 {time.value}{time.unit}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* v4.1: 機會成本參考說明（展開可見） */}
                          {!isExempted && record.type === 'spend' && (
                            <div className="mt-1 text-xs text-slate-400">
                              └ 機會成本僅供參考
                            </div>
                          )}
                        </div>

                        {/* v2.1: 編輯/刪除按鈕 */}
                        {(onUpdateRecord || onDeleteRecord) && (
                          <div className="flex gap-1 ml-2">
                            {onUpdateRecord && (
                              <button
                                onClick={() => setEditingRecord(record)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                title="編輯"
                              >
                                <span className="text-sm">✏️</span>
                              </button>
                            )}
                            {onDeleteRecord && (
                              <button
                                onClick={() => setDeletingRecord(record)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center transition-colors"
                                title="刪除"
                              >
                                <span className="text-sm">🗑️</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* v2.1: 編輯 Modal */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onSave={handleEditSave}
          onCancel={() => setEditingRecord(null)}
        />
      )}

      {/* v2.1: 刪除確認 Modal */}
      {deletingRecord && (
        <DeleteConfirmModal
          record={deletingRecord}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingRecord(null)}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg border border-slate-200">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-900">處理中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
