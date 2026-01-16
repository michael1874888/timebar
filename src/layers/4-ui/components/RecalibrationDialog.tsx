/**
 * TimeBar - 目標變更校準對話框
 * Layer 4 (UI Layer) - v4.1
 *
 * 當用戶修改退休目標時，詢問是否重新校準進度
 */

import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Formatters } from '@/utils/financeCalc';

export interface RecalibrationDialogProps {
  /** 是否顯示對話框 */
  isOpen: boolean;
  /** 關閉對話框的回調 */
  onClose: () => void;
  /** 舊目標 */
  oldGoal: {
    retireAge: number;
    monthlySavings: number;
  };
  /** 新目標 */
  newGoal: {
    retireAge: number;
    monthlySavings: number;
  };
  /** 當前預估退休年齡（如果保留歷史） */
  currentEstimatedAge: number;
  /** 確認變更的回調 */
  onConfirm: (shouldReset: boolean) => void;
}

/**
 * 目標變更校準對話框
 */
export function RecalibrationDialog({
  isOpen,
  onClose,
  oldGoal,
  newGoal,
  currentEstimatedAge,
  onConfirm,
}: RecalibrationDialogProps) {
  const [selectedOption, setSelectedOption] = useState<'reset' | 'keep'>('reset');

  const handleConfirm = () => {
    onConfirm(selectedOption === 'reset');
    onClose();
  };

  // 計算目標變化
  const ageChange = newGoal.retireAge - oldGoal.retireAge;
  const savingsChange = newGoal.monthlySavings - oldGoal.monthlySavings;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="🎯 退休目標已變更"
      size="sm"
      showClose={false}
      closeOnBackdrop={false}
    >
      <div className="p-6 space-y-6">
        {/* 目標變更摘要 */}
        <div className="bg-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">目標退休年齡</span>
            <span className="text-gray-100">
              {oldGoal.retireAge} 歲 → {newGoal.retireAge} 歲
              {ageChange !== 0 && (
                <span className={`ml-2 text-sm ${ageChange > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                  ({ageChange > 0 ? '+' : ''}{ageChange})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">每月目標儲蓄</span>
            <span className="text-gray-100">
              {Formatters.formatCurrency(oldGoal.monthlySavings)} → {Formatters.formatCurrency(newGoal.monthlySavings)} 元
              {savingsChange !== 0 && (
                <span className={`ml-2 text-sm ${savingsChange > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  ({savingsChange > 0 ? '+' : ''}{Formatters.formatCurrency(savingsChange)})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* 分隔線 */}
        <div className="border-t border-gray-700" />

        {/* 選項標題 */}
        <div className="text-gray-300 font-medium">
          如何處理歷史進度？
        </div>

        {/* 選項列表 */}
        <div className="space-y-3">
          {/* 選項：重新開始 */}
          <label
            className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedOption === 'reset'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="recalibration"
                value="reset"
                checked={selectedOption === 'reset'}
                onChange={() => setSelectedOption('reset')}
                className="mt-1 w-4 h-4 text-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-100 font-medium">重新開始</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                    推薦
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">└</span>
                    清除之前的超前/落後記錄
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">└</span>
                    預估年齡：
                    <span className="text-gray-300">{newGoal.retireAge} 歲（歸零）</span>
                  </div>
                </div>
              </div>
            </div>
          </label>

          {/* 選項：保留歷史 */}
          <label
            className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedOption === 'keep'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="recalibration"
                value="keep"
                checked={selectedOption === 'keep'}
                onChange={() => setSelectedOption('keep')}
                className="mt-1 w-4 h-4 text-blue-500"
              />
              <div className="flex-1">
                <div className="text-gray-100 font-medium">保留歷史</div>
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">└</span>
                    繼續累積之前的進度
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">└</span>
                    預估年齡：
                    <span className={`${
                      currentEstimatedAge < newGoal.retireAge ? 'text-emerald-400' : 'text-orange-400'
                    }`}>
                      {currentEstimatedAge.toFixed(1)} 歲（目前狀態）
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* 分隔線 */}
        <div className="border-t border-gray-700" />

        {/* 操作按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
          >
            確認變更
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RecalibrationDialog;
