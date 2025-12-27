import { GPSCalc, Formatters } from '@/utils/financeCalc';
import { UserData, Record as RecordType } from '@/types';

const { formatTime, formatCurrency, formatAgeDiff } = Formatters;

interface HistoryPageProps {
  records: RecordType[];
  userData: UserData;
  onClose: () => void;
}

export function HistoryPage({ records, userData, onClose }: HistoryPageProps) {
  const { retireAge } = userData;

  // 使用 GPSCalc 計算
  const { totalSaved, totalSpent } = GPSCalc.calculateTotals(records);
  const { estimatedAge, ageDiff, isAhead, isOnTrack } = GPSCalc.calculateEstimatedAge(retireAge, records);
  const diffDisplay = formatAgeDiff(ageDiff);

  const sortedRecords = [...records].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const groupedRecords = sortedRecords.reduce((groups: { [key: string]: RecordType[] }, record) => {
    const date = new Date(record.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {} as { [key: string]: RecordType[] });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 pb-8">
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          <button onClick={onClose} className="text-gray-400 hover:text-white mr-4 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">歷史紀錄</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* GPS Summary */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 rounded-3xl p-6 mb-6 border border-gray-700/50">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-400">{formatCurrency(totalSaved)}</div>
              <div className="text-gray-500 text-sm">累積儲蓄</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-orange-400">{formatCurrency(totalSpent)}</div>
              <div className="text-gray-500 text-sm">累積花費</div>
            </div>
          </div>

          <div className="h-px bg-gray-700 mb-6" />

          {/* GPS Timeline */}
          <div className="text-center mb-4">
            <div className="text-gray-400 text-sm mb-3">退休 GPS</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs">🎯 目標</div>
                <div className="text-white font-bold text-lg">{retireAge} 歲</div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
                  <div className={`h-full rounded-full transition-all ${
                    isOnTrack ? 'bg-gray-500' : isAhead ? 'bg-emerald-500' : 'bg-orange-500'
                  }`}
                    style={{ width: `${Math.min(100, Math.max(10, 50 + ageDiff * 10))}%` }} />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <div className={`text-xs ${isOnTrack ? 'text-gray-400' : isAhead ? 'text-emerald-400' : 'text-orange-400'}`}>
                  📍 預估
                </div>
                <div className={`font-bold text-lg ${isOnTrack ? 'text-white' : isAhead ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {estimatedAge.toFixed(1)} 歲
                </div>
              </div>
            </div>
          </div>

          <div className={`text-center text-sm px-4 py-2 rounded-xl ${
            isOnTrack ? 'bg-gray-700 text-gray-300' :
            isAhead ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {isOnTrack
              ? `✅ 完美！目前剛好符合計畫`
              : isAhead
                ? `🎉 比目標提早 ${diffDisplay.value} ${diffDisplay.unit}！`
                : `📈 需要再努力 ${diffDisplay.value} ${diffDisplay.unit}`
            }
          </div>
        </div>

        {/* Records List */}
        {Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📝</div>
            <div className="text-gray-400">還沒有任何紀錄</div>
            <div className="text-gray-600 text-sm mt-1">開始記錄你的第一筆吧！</div>
          </div>
        ) : (
          Object.entries(groupedRecords).map(([monthKey, monthRecords]) => {
            const [year, month] = monthKey.split('-');
            const monthSaved = monthRecords.filter(r => r.type === 'save').reduce((s, r) => s + r.amount, 0);
            const monthSpent = monthRecords.filter(r => r.type === 'spend').reduce((s, r) => s + r.amount, 0);

            return (
              <div key={monthKey} className="mb-6">
                <div className="flex justify-between items-center mb-3 px-1">
                  <div className="text-gray-400 font-medium">{year}年{month}月</div>
                  <div className="flex gap-3 text-sm">
                    <span className="text-emerald-400">+{formatCurrency(monthSaved)}</span>
                    <span className="text-orange-400">-{formatCurrency(monthSpent)}</span>
                  </div>
                </div>
                <div className="bg-gray-800/40 rounded-2xl overflow-hidden">
                  {monthRecords.map((record, i) => {
                    const time = formatTime(record.timeCost);
                    const date = new Date(record.timestamp);
                    return (
                      <div key={record.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-gray-700/50' : ''}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          record.type === 'save' ? 'bg-emerald-500/20' : 'bg-orange-500/20'
                        }`}>{record.type === 'save' ? '💰' : '💸'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <div className="text-white font-medium truncate">
                                {record.note || record.category || (record.type === 'save' ? '儲蓄' : '消費')}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {record.isRecurring ? '🔄 ' : ''}{date.getMonth() + 1}/{date.getDate()}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className={`font-bold ${record.type === 'save' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                {record.type === 'save' ? '+' : '-'}{formatCurrency(record.amount)}
                              </div>
                              <div className={`text-xs ${record.type === 'save' ? 'text-emerald-500/70' : 'text-orange-500/70'}`}>
                                {record.type === 'save' ? '+' : '-'}{time.value}{time.unit}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
