import { ShopItem } from '@/types';

interface ItemCardProps {
  item: ShopItem;
  currentPoints: number;
  ownedCount: number;
  onPurchase: (item: ShopItem) => void;
}

export function ItemCard({ item, currentPoints, ownedCount, onPurchase }: ItemCardProps) {
  const canAfford = currentPoints >= item.cost;

  return (
    <div className="bg-gray-800/60 rounded-2xl p-4 border border-gray-700/50">
      {/* 道具圖示和名稱 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl">{item.icon}</div>
        <div>
          <div className="text-lg font-bold text-white">{item.name}</div>
          {ownedCount > 0 && (
            <div className="text-emerald-400 text-xs">已擁有 ×{ownedCount}</div>
          )}
        </div>
      </div>

      {/* 描述 */}
      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
        {item.description}
      </p>

      {/* 價格和購買按鈕 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl">⏳</span>
          <span className={`text-xl font-bold ${canAfford ? 'text-amber-400' : 'text-gray-500'}`}>
            {item.cost}
          </span>
        </div>

        <button
          onClick={() => onPurchase(item)}
          disabled={!canAfford}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            canAfford
              ? 'bg-amber-500 hover:bg-amber-400 text-gray-900 active:scale-95'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canAfford ? '兌換' : '積分不足'}
        </button>
      </div>

      {/* 效果說明 */}
      {item.effect && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="text-gray-500 text-xs">
            💡 效果：{item.type === 'consumable' ? '消耗型' : '永久'} - {
              item.effect === 'exclude_from_negative_stats' 
                ? '使用後，該筆消費不計入「生命殺手」統計'
                : item.effect
            }
          </div>
        </div>
      )}
    </div>
  );
}
