import { useState, useCallback, useEffect } from 'react';
import { ItemCard } from './ItemCard';
import { ShopItem, Inventory } from '@/types';
import { PointsSystem } from '@/utils/pointsSystem';
import { InventorySystem, SHOP_ITEMS } from '@/utils/inventorySystem';
import { Toast } from '../common/Toast';

interface ShopPageProps {
  onClose: () => void;
  onPointsChange?: (newBalance: number) => void;
  onInventoryChange?: (newInventory: Inventory) => void;
}

export function ShopPage({ onClose, onPointsChange, onInventoryChange }: ShopPageProps) {
  const [pointsBalance, setPointsBalance] = useState(PointsSystem.getBalance());
  const [inventory, setInventory] = useState(InventorySystem.getInventory());
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // 確認對話框狀態
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  // 載入最新資料
  useEffect(() => {
    setPointsBalance(PointsSystem.getBalance());
    setInventory(InventorySystem.getInventory());
  }, []);

  // 處理兌換
  const handlePurchase = useCallback((item: ShopItem) => {
    setConfirmItem(item);
  }, []);

  // 確認兌換
  const confirmPurchase = useCallback(() => {
    if (!confirmItem) return;

    // 扣除積分
    const success = PointsSystem.spendPoints(confirmItem.cost, `shop_${confirmItem.id}`);
    if (!success) {
      setToastMessage('積分不足！');
      setToastType('error');
      setShowToast(true);
      setConfirmItem(null);
      return;
    }

    // 增加道具
    InventorySystem.addItem(confirmItem.id);

    // 更新狀態
    const newBalance = PointsSystem.getBalance();
    const newInventory = InventorySystem.getInventory();
    setPointsBalance(newBalance);
    setInventory(newInventory);

    // 通知父組件
    onPointsChange?.(newBalance);
    onInventoryChange?.(newInventory);

    // 顯示成功訊息
    setToastMessage(`兌換成功！獲得 1 張${confirmItem.name} ${confirmItem.icon}`);
    setToastType('success');
    setShowToast(true);
    setConfirmItem(null);
  }, [confirmItem, onPointsChange, onInventoryChange]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* 確認對話框 */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmItem(null)}
          />
          <div className="relative bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-700">
            <div className="text-center">
              <div className="text-5xl mb-3">{confirmItem.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">確認兌換</h3>
              <p className="text-gray-400 text-sm mb-4">
                確定要用 <span className="text-amber-400 font-bold">{confirmItem.cost} ⏳</span> 兌換 
                <span className="text-white font-medium"> {confirmItem.name}</span> 嗎？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmItem(null)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-all"
                >
                  取消
                </button>
                <button
                  onClick={confirmPurchase}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold rounded-xl transition-all"
                >
                  確認兌換
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">商店</h1>
          <div className="flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full">
            <span className="text-amber-400">⏳</span>
            <span className="text-amber-400 font-bold">{pointsBalance}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 說明 */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <div className="text-amber-400 font-medium mb-1">時間沙商店</div>
              <div className="text-gray-400 text-sm">
                用每日挑戰獲得的時間沙 ⏳ 兌換道具！努力是為了更好的生活，偶爾的獎勵是你應得的。
              </div>
            </div>
          </div>
        </div>

        {/* 道具列表 */}
        <div className="space-y-4 mb-6">
          <h2 className="text-gray-400 text-sm font-medium">可兌換道具</h2>
          {SHOP_ITEMS.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              currentPoints={pointsBalance}
              ownedCount={InventorySystem.getItemCount(item.id)}
              onPurchase={handlePurchase}
            />
          ))}
        </div>

        {/* 我的庫存 */}
        <div className="bg-gray-800/40 rounded-2xl p-4">
          <h2 className="text-gray-400 text-sm font-medium mb-3">我的庫存</h2>
          {inventory.guiltFreePass > 0 ? (
            <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
              <span className="text-2xl">🎫</span>
              <div className="flex-1">
                <div className="text-white font-medium">免死金牌</div>
                <div className="text-gray-500 text-xs">記帳時可使用</div>
              </div>
              <div className="text-xl font-bold text-emerald-400">×{inventory.guiltFreePass}</div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              尚未擁有任何道具<br />
              完成每日挑戰來累積時間沙吧！
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
