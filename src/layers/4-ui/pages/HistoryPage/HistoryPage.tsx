/**
 * TimeBar - 新版歷史頁面
 * Layer 4 (UI Layer) - 頁面組件
 */

import { useState, useMemo } from 'react';
import { useGPS } from '@business/hooks';
import { Card, Badge, Button, Modal } from '@ui/design-system';
import { RetirementProgress } from '@ui/features';
import type { RecordDTO } from '@data/api';
import type { RecordItem } from '@domain/types';
import './HistoryPage.css';

export interface HistoryPageProps {
  /** 用戶數據 */
  userData: {
    age: number;
    targetRetireAge: number;
    monthlySalary: number;
  };
  /** 記錄列表 */
  records: RecordDTO[];
  /** 返回回調 */
  onBack: () => void;
  /** 編輯記錄回調 */
  onEditRecord?: (id: string, updates: Partial<RecordDTO>) => void;
  /** 刪除記錄回調 */
  onDeleteRecord?: (id: string) => void;
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天';
  }
  if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天';
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/**
 * 格式化時間
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

/**
 * 格式化金額
 */
function formatAmount(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/**
 * 格式化時間成本
 */
function formatTimeCost(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} 分鐘`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} 小時`;
  }
  return `${(hours / 24).toFixed(1)} 天`;
}

/**
 * 新版歷史頁面
 */
export function HistoryPage({
  userData,
  records,
  onBack,
  onEditRecord,
  onDeleteRecord,
}: HistoryPageProps) {
  const [selectedRecord, setSelectedRecord] = useState<RecordDTO | null>(null);
  const [filter, setFilter] = useState<'all' | 'spend' | 'save'>('all');
  const [showGPSDetail, setShowGPSDetail] = useState(false);

  // 轉換 DTO 為 Domain Type
  const recordItems = useMemo<RecordItem[]>(() => {
    return records.map(r => ({
      type: r.type,
      amount: r.amount,
      timeCost: r.timeCost,
      isRecurring: r.isRecurring,
    }));
  }, [records]);

  // Hook - GPS
  const gps = useGPS({
    targetRetireAge: userData.targetRetireAge,
    records: recordItems,
  });

  // 過濾記錄
  const filteredRecords = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter((r) => r.type === filter);
  }, [records, filter]);

  // 按日期分組
  const groupedRecords = useMemo(() => {
    const groups = new Map<string, RecordDTO[]>();

    // 按時間倒序排列
    const sorted = [...filteredRecords].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sorted.forEach((record) => {
      const existing = groups.get(record.date) || [];
      groups.set(record.date, [...existing, record]);
    });

    return Array.from(groups.entries());
  }, [filteredRecords]);

  // 統計
  const stats = useMemo(() => {
    const saved = records.filter((r) => r.type === 'save');
    const spent = records.filter((r) => r.type === 'spend');

    return {
      totalSaved: saved.reduce((sum, r) => sum + r.amount, 0),
      totalSpent: spent.reduce((sum, r) => sum + r.amount, 0),
      savedCount: saved.length,
      spentCount: spent.length,
    };
  }, [records]);

  return (
    <div className="history-page">
      {/* Header */}
      <header className="history-page__header">
        <button className="history-page__back" onClick={onBack}>
          ← 返回
        </button>
        <h1 className="history-page__title">記錄歷史</h1>
        <div className="history-page__spacer" />
      </header>

      {/* Retirement Progress */}
      <div className="history-page__progress">
        <RetirementProgress
          targetAge={userData.targetRetireAge}
          estimatedAge={gps.estimatedAge}
          currentAge={userData.age}
          totalSavedHours={gps.totalSavedHours}
          totalSpentHours={gps.totalSpentHours}
          showDetail={false} // 歷史頁面不顯示詳細彈窗，避免干擾
          onDetailClick={() => {}} // 可選：跳轉到主頁或顯示詳細
        />
      </div>

      {/* Stats */}
      <div className="history-page__stats">
        <div className="history-page__stat history-page__stat--save">
          <span className="history-page__stat-label">總省下</span>
          <span className="history-page__stat-value">{formatAmount(stats.totalSaved)}</span>
          <span className="history-page__stat-count">{stats.savedCount} 筆</span>
        </div>
        <div className="history-page__stat history-page__stat--spend">
          <span className="history-page__stat-label">總花費</span>
          <span className="history-page__stat-value">{formatAmount(stats.totalSpent)}</span>
          <span className="history-page__stat-count">{stats.spentCount} 筆</span>
        </div>
      </div>

      {/* Filter */}
      <div className="history-page__filter">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          全部
        </Button>
        <Button
          variant={filter === 'save' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('save')}
        >
          💰 省下
        </Button>
        <Button
          variant={filter === 'spend' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('spend')}
        >
          💸 花費
        </Button>
      </div>

      {/* Records List */}
      <div className="history-page__list">
        {groupedRecords.length === 0 ? (
          <div className="history-page__empty">
            <p>📝 還沒有記錄</p>
            <p>開始記帳吧！</p>
          </div>
        ) : (
          groupedRecords.map(([date, dayRecords]) => (
            <div key={date} className="history-page__group">
              <div className="history-page__date">{formatDate(date)}</div>
              {dayRecords.map((record) => (
                <Card
                  key={record.id}
                  className="history-page__record"
                  clickable
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="history-page__record-content">
                    <div className="history-page__record-main">
                      <Badge
                        variant={record.type === 'save' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {record.type === 'save' ? '💰 省下' : '💸 花費'}
                      </Badge>
                      <span className="history-page__record-category">
                        {record.category || '一般'}
                      </span>
                      {record.note && (
                        <span className="history-page__record-note">{record.note}</span>
                      )}
                    </div>
                    <div className="history-page__record-info">
                      <span className="history-page__record-amount">
                        {record.type === 'save' ? '+' : '-'}{formatAmount(record.amount)}
                      </span>
                      <span className="history-page__record-time">
                        {formatTimeCost(record.timeCost)} · {formatTime(record.timestamp)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="記錄詳情"
        size="sm"
        footer={
          selectedRecord && onDeleteRecord && (
            <div className="history-page__modal-actions">
              <Button
                variant="danger"
                onClick={() => {
                  onDeleteRecord(selectedRecord.id);
                  setSelectedRecord(null);
                }}
              >
                刪除
              </Button>
              <Button variant="ghost" onClick={() => setSelectedRecord(null)}>
                關閉
              </Button>
            </div>
          )
        }
      >
        {selectedRecord && (
          <div className="history-page__detail">
            <div className="history-page__detail-row">
              <span>類型</span>
              <Badge variant={selectedRecord.type === 'save' ? 'success' : 'warning'}>
                {selectedRecord.type === 'save' ? '💰 省下' : '💸 花費'}
              </Badge>
            </div>
            <div className="history-page__detail-row">
              <span>金額</span>
              <span className="history-page__detail-value">
                {formatAmount(selectedRecord.amount)}
              </span>
            </div>
            <div className="history-page__detail-row">
              <span>時間成本</span>
              <span className="history-page__detail-value">
                {formatTimeCost(selectedRecord.timeCost)}
              </span>
            </div>
            <div className="history-page__detail-row">
              <span>分類</span>
              <span>{selectedRecord.category || '一般'}</span>
            </div>
            {selectedRecord.note && (
              <div className="history-page__detail-row">
                <span>備註</span>
                <span>{selectedRecord.note}</span>
              </div>
            )}
            <div className="history-page__detail-row">
              <span>時間</span>
              <span>{new Date(selectedRecord.timestamp).toLocaleString('zh-TW')}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default HistoryPage;
