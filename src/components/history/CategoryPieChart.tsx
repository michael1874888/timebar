import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Record as RecordType } from '@/types';
import { Formatters } from '@/utils/financeCalc';

const { formatCurrency } = Formatters;

interface CategoryPieChartProps {
  records: RecordType[];
  type?: 'spend' | 'save';
}

// 顏色配置
const COLORS = [
  '#f97316', // orange
  '#ef4444', // red
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

interface CategoryData {
  name: string;
  value: number;
  hours: number;
  count: number;
}

export function CategoryPieChart({ records, type = 'spend' }: CategoryPieChartProps) {
  // 按分類聚合資料
  const chartData = useMemo((): CategoryData[] => {
    const filtered = records.filter(r => r.type === type);
    
    if (filtered.length === 0) return [];

    const categoryMap = new Map<string, CategoryData>();

    filtered.forEach(record => {
      const category = record.category || '其他';
      const existing = categoryMap.get(category);

      if (existing) {
        existing.value += record.amount;
        existing.hours += record.timeCost;
        existing.count += 1;
      } else {
        categoryMap.set(category, {
          name: category,
          value: record.amount,
          hours: record.timeCost,
          count: 1
        });
      }
    });

    // 排序：金額大的在前
    return Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value);
  }, [records, type]);

  // 找出「生命殺手」- 消耗最多工作時間的分類
  const lifeKiller = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, curr) => 
      curr.hours > max.hours ? curr : max
    , chartData[0]);
  }, [chartData]);

  // 總計
  const total = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.value, 0);
  }, [chartData]);

  const totalHours = useMemo(() => {
    return chartData.reduce((sum, d) => sum + d.hours, 0);
  }, [chartData]);

  // 空狀態
  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800/40 rounded-2xl p-4 text-center">
        <div className="text-gray-500 text-sm">
          {type === 'spend' ? '還沒有消費記錄' : '還沒有儲蓄記錄'}
        </div>
      </div>
    );
  }

  // 格式化工作時間
  const formatHours = (hours: number): string => {
    if (hours < 8) return `${Math.round(hours * 10) / 10} 小時`;
    const days = hours / 8;
    if (days < 30) return `${Math.round(days * 10) / 10} 天`;
    const months = days / 22;
    return `${Math.round(months * 10) / 10} 個月`;
  };

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as CategoryData;
      const percent = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="text-white font-medium">{data.name}</div>
          <div className="text-gray-400 text-sm">
            金額: {formatCurrency(data.value)} ({percent}%)
          </div>
          <div className="text-orange-400 text-sm">
            時間成本: {formatHours(data.hours)}
          </div>
          <div className="text-gray-500 text-xs">
            {data.count} 筆記錄
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800/40 rounded-2xl p-4">
      {/* 標題 */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-gray-400 text-sm">
          {type === 'spend' ? '📊 支出分布' : '📊 儲蓄分布'}
        </div>
        <div className={`text-sm font-medium ${type === 'spend' ? 'text-orange-400' : 'text-emerald-400'}`}>
          總計 {formatCurrency(total)}
        </div>
      </div>

      {/* 生命殺手提示 */}
      {type === 'spend' && lifeKiller && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">💀</span>
            <div>
              <div className="text-red-400 text-sm font-medium">最大生命殺手：{lifeKiller.name}</div>
              <div className="text-gray-500 text-xs">
                消耗 {formatHours(lifeKiller.hours)} 的工作時間
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 圓餅圖 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 圖例 */}
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {chartData.slice(0, 6).map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-gray-400 text-xs">{entry.name}</span>
          </div>
        ))}
        {chartData.length > 6 && (
          <span className="text-gray-500 text-xs">+{chartData.length - 6} 更多</span>
        )}
      </div>

      {/* 時間總計 */}
      <div className="mt-3 pt-3 border-t border-gray-700/50 text-center">
        <div className="text-gray-500 text-xs">
          {type === 'spend' ? '總共消耗' : '總共贏回'}
          <span className={`ml-1 font-medium ${type === 'spend' ? 'text-orange-400' : 'text-emerald-400'}`}>
            {formatHours(totalHours)}
          </span>
          的工作時間
        </div>
      </div>
    </div>
  );
}
