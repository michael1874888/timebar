import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FinanceCalc, Formatters } from '@/utils/financeCalc';
import { UserData, Record as RecordType } from '@/types';

const { formatCurrency } = Formatters;

const COLORS: { [key: string]: string } = {
  '飲食': '#f59e0b',
  '購物': '#ec4899',
  '娛樂': '#8b5cf6',
  '交通': '#06b6d4',
  '訂閱': '#ef4444',
  '主動儲蓄': '#10b981',
  '消費': '#6b7280',
  '其他': '#6b7280'
};

interface SpendingBreakdownProps {
  records: RecordType[];
  userData: UserData;
}

export function SpendingBreakdown({ records, userData }: SpendingBreakdownProps) {
  const spendingRecords = records.filter((r) => r.type === 'spend');

  if (spendingRecords.length === 0) {
    return (
      <div className="bg-gray-800/60 rounded-3xl p-6 border border-gray-700 text-center">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-gray-400">還沒有消費記錄</div>
      </div>
    );
  }

  const { salary, age, retireAge, inflationRate, roiRate } = userData;
  const hourlyRate = FinanceCalc.hourlyRate(salary);
  const realRate = FinanceCalc.realRate(inflationRate, roiRate);
  const yearsToRetire = retireAge - age;

  // 按分類統計
  const categoryData = useMemo(() => {
    const byCategory: { [key: string]: number } = {};

    spendingRecords.forEach((record) => {
      const category = record.category || '其他';
      byCategory[category] = (byCategory[category] || 0) + record.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => {
        // 計算這個分類吃掉了多少生命
        const timeCost = FinanceCalc.calculateTimeCost(
          value,
          false,
          hourlyRate,
          realRate,
          yearsToRetire
        );
        const daysLost = Math.floor(timeCost / 24);

        return {
          name,
          value,
          daysLost,
          percentage: 0 // 後面計算
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [spendingRecords, hourlyRate, realRate, yearsToRetire]);

  // 計算百分比 (防止除以零產生 NaN)
  const totalSpent = categoryData.reduce((sum, item) => sum + item.value, 0);
  categoryData.forEach((item) => {
    item.percentage = totalSpent > 0
      ? Math.round((item.value / totalSpent) * 100)
      : 0;
  });

  // 最大殺手
  const topKiller = categoryData[0];

  return (
    <div className="bg-gray-800/60 backdrop-blur rounded-3xl p-6 border border-gray-700">
      <h3 className="text-white font-bold text-lg mb-4">
        💸 支出分析
      </h3>

      {/* 圖表 */}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.percent}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {categoryData.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] || COLORS['其他']}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <div className="text-white font-bold">{data.name}</div>
                    <div className="text-gray-400 text-sm">
                      {formatCurrency(data.value)}
                    </div>
                    <div className="text-orange-400 text-xs">
                      = {data.daysLost} 天生命
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 列表 */}
      <div className="space-y-2 mt-4">
        {categoryData.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: COLORS[cat.name] || COLORS['其他'] }}
              />
              <span className="text-gray-300">{cat.name}</span>
            </div>
            <div className="text-right">
              <div className="text-orange-400 font-bold">
                {formatCurrency(cat.value)}
              </div>
              <div className="text-gray-500 text-xs">
                {cat.daysLost} 天 • {cat.percentage}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 最大殺手警告 */}
      {topKiller && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-2">
            <div className="text-2xl">💀</div>
            <div className="flex-1">
              <div className="text-red-400 font-bold mb-1">
                生命殺手 #1：{topKiller.name}
              </div>
              <div className="text-gray-300 text-sm">
                如果減少這個分類的支出 50%，你可以提早{' '}
                <span className="text-emerald-400 font-bold">
                  {Math.floor(topKiller.daysLost * 0.5)} 天
                </span>{' '}
                退休
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
