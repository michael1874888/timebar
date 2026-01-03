import { useState, useMemo } from 'react';
import { ChallengeDefinition } from '@/types';
import { Storage } from '@/utils/storage';

const CUSTOM_CHALLENGES_KEY = 'timebar_custom_challenges';
const DELETED_DEFAULTS_KEY = 'timebar_deleted_default_challenges';
const MODIFIED_DEFAULTS_KEY = 'timebar_modified_default_challenges';

// 預設挑戰定義（與 DailyChallenge.tsx 同步）
const DEFAULT_CHALLENGES: ChallengeDefinition[] = [
  {
    id: 'skip_coffee',
    name: '自備飲品',
    description: '帶自己的飲料，守住 $100 ☕',
    defaultAmount: 100,
    energyReward: 10,
    icon: '☕',
    category: 'food'
  },
  {
    id: 'skip_snack',
    name: '健康選擇',
    description: '不買零食或飲料，省 $50 💪',
    defaultAmount: 50,
    energyReward: 10,
    icon: '🍪',
    category: 'food'
  },
  {
    id: 'walk_instead',
    name: '綠色出行',
    description: '走路或騎車，省交通費 $30 🌱',
    defaultAmount: 30,
    energyReward: 10,
    icon: '🚶',
    category: 'transport'
  },
  {
    id: 'cook_home',
    name: '主廚日',
    description: '自己做飯，省下外送費 $150 🍳',
    defaultAmount: 150,
    energyReward: 10,
    icon: '🍳',
    category: 'food'
  }
];

// 預設可選圖示
const EMOJI_OPTIONS = ['☕', '🧋', '🍕', '🎮', '🛍️', '🚗', '📱', '🎬', '🍺', '🎁', '🍪', '🚶', '🍳'];

interface ChallengeEditorProps {
  challenge?: ChallengeDefinition | null;
  onSave: (challenge: ChallengeDefinition) => void;
  onCancel: () => void;
  isDefault?: boolean;
}

export function ChallengeEditor({ challenge, onSave, onCancel, isDefault }: ChallengeEditorProps) {
  const [name, setName] = useState(challenge?.name || '');
  const [description, setDescription] = useState(challenge?.description || '');
  const [amount, setAmount] = useState(challenge?.defaultAmount || 50);
  const [icon, setIcon] = useState(challenge?.icon || '☕');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('請輸入挑戰名稱');
      return;
    }
    if (name.length > 20) {
      setError('名稱最多 20 字');
      return;
    }
    if (amount <= 0) {
      setError('請輸入有效金額');
      return;
    }

    const saved: ChallengeDefinition = {
      id: challenge?.id || `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `完成後省下 $${amount}`,
      defaultAmount: amount,
      energyReward: 10,
      icon,
      category: challenge?.category || 'custom'
    };

    onSave(saved);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md animate-scale-up">
        <h2 className="text-xl font-bold text-white mb-6">
          {challenge ? '✏️ 編輯挑戰' : '➕ 新增挑戰'}
          {isDefault && <span className="text-gray-500 text-sm font-normal ml-2">(預設)</span>}
        </h2>

        {/* 名稱 */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">挑戰名稱 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：不買手搖飲"
            maxLength={20}
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="text-gray-500 text-xs mt-1 text-right">{name.length}/20</div>
        </div>

        {/* 描述 */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">描述 (選填)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例：今天不買飲料，省下 $60"
            maxLength={50}
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 金額 */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">預設金額 *</label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 bg-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 圖示選擇 */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">選擇圖示</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`w-10 h-10 text-xl rounded-lg transition-all ${
                  icon === emoji 
                    ? 'bg-emerald-500 ring-2 ring-emerald-400' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 積分說明 */}
        <div className="bg-amber-500/10 rounded-xl p-3 mb-6">
          <div className="text-amber-400 text-sm">
            ⏳ 完成獲得 10 時間沙（固定）
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-4">{error}</div>
        )}

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
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChallengeSettingsPageProps {
  onClose: () => void;
}

export function ChallengeSettingsPage({ onClose }: ChallengeSettingsPageProps) {
  // 自定義挑戰
  const [customChallenges, setCustomChallenges] = useState<ChallengeDefinition[]>(() => {
    const saved = Storage.load(CUSTOM_CHALLENGES_KEY);
    return Array.isArray(saved) ? saved : [];
  });

  // 已刪除的預設挑戰 ID
  const [deletedDefaults, setDeletedDefaults] = useState<string[]>(() => {
    const saved = Storage.load(DELETED_DEFAULTS_KEY);
    return Array.isArray(saved) ? saved : [];
  });

  // 已修改的預設挑戰（覆蓋層）
  const [modifiedDefaults, setModifiedDefaults] = useState<Record<string, ChallengeDefinition>>(() => {
    const saved = Storage.load(MODIFIED_DEFAULTS_KEY);
    return (saved && typeof saved === 'object') ? saved as Record<string, ChallengeDefinition> : {};
  });

  const [editingChallenge, setEditingChallenge] = useState<ChallengeDefinition | null>(null);
  const [editingIsDefault, setEditingIsDefault] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string; isDefault: boolean } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);

  // 合併的預設挑戰列表（套用修改、排除刪除）
  const effectiveDefaultChallenges = useMemo(() => {
    return DEFAULT_CHALLENGES
      .filter(c => !deletedDefaults.includes(c.id))
      .map(c => modifiedDefaults[c.id] || c);
  }, [deletedDefaults, modifiedDefaults]);

  // 儲存自定義挑戰
  const saveCustomChallenges = (challenges: ChallengeDefinition[]) => {
    setCustomChallenges(challenges);
    Storage.save(CUSTOM_CHALLENGES_KEY, challenges);
  };

  // 儲存已刪除預設
  const saveDeletedDefaults = (ids: string[]) => {
    setDeletedDefaults(ids);
    Storage.save(DELETED_DEFAULTS_KEY, ids);
  };

  // 儲存已修改預設
  const saveModifiedDefaults = (modified: Record<string, ChallengeDefinition>) => {
    setModifiedDefaults(modified);
    Storage.save(MODIFIED_DEFAULTS_KEY, modified);
  };

  const handleSave = (challenge: ChallengeDefinition) => {
    if (editingIsDefault) {
      // 編輯預設挑戰 -> 儲存到覆蓋層
      const updated = { ...modifiedDefaults, [challenge.id]: challenge };
      saveModifiedDefaults(updated);
    } else {
      // 新增或編輯自定義挑戰
      const existingIndex = customChallenges.findIndex(c => c.id === challenge.id);
      let updated: ChallengeDefinition[];
      if (existingIndex >= 0) {
        updated = [...customChallenges];
        updated[existingIndex] = challenge;
      } else {
        updated = [...customChallenges, challenge];
      }
      saveCustomChallenges(updated);
    }
    setShowEditor(false);
    setEditingChallenge(null);
    setEditingIsDefault(false);
  };

  const handleDelete = (id: string, isDefault: boolean) => {
    if (isDefault) {
      // 刪除預設挑戰 -> 加入刪除列表
      saveDeletedDefaults([...deletedDefaults, id]);
      // 同時清除修改（如果有）
      if (modifiedDefaults[id]) {
        const { [id]: _, ...rest } = modifiedDefaults;
        saveModifiedDefaults(rest);
      }
    } else {
      // 刪除自定義挑戰
      saveCustomChallenges(customChallenges.filter(c => c.id !== id));
    }
    setShowDeleteConfirm(null);
  };

  const handleResetDefault = (id: string) => {
    // 重置預設挑戰到原始狀態
    if (modifiedDefaults[id]) {
      const { [id]: _, ...rest } = modifiedDefaults;
      saveModifiedDefaults(rest);
    }
    // 如果在刪除列表中，移除
    if (deletedDefaults.includes(id)) {
      saveDeletedDefaults(deletedDefaults.filter(d => d !== id));
    }
    setShowResetConfirm(null);
  };

  const handleEdit = (challenge: ChallengeDefinition, isDefault: boolean) => {
    setEditingChallenge(challenge);
    setEditingIsDefault(isDefault);
    setShowEditor(true);
  };

  const handleAdd = () => {
    setEditingChallenge(null);
    setEditingIsDefault(false);
    setShowEditor(true);
  };

  // 檢查預設挑戰是否被修改過
  const isModified = (id: string) => !!modifiedDefaults[id];

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
          <h1 className="text-xl font-bold text-white">管理每日挑戰</h1>
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        <div className="max-w-lg mx-auto">
          {/* 預設挑戰區 */}
          <div className="mb-6">
            <h2 className="text-gray-400 text-sm mb-3">📋 預設挑戰</h2>
            <div className="space-y-3">
              {effectiveDefaultChallenges.map((challenge) => (
                <div 
                  key={challenge.id}
                  className="bg-gray-800/60 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center text-2xl">
                    {challenge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate flex items-center gap-2">
                      {challenge.name}
                      {isModified(challenge.id) && (
                        <span className="text-amber-400 text-xs">(已修改)</span>
                      )}
                    </div>
                    <div className="text-gray-500 text-sm">省 ${challenge.defaultAmount}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(challenge, true)}
                      className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                    >
                      <span className="text-sm">✏️</span>
                    </button>
                    {isModified(challenge.id) && (
                      <button
                        onClick={() => setShowResetConfirm(challenge.id)}
                        className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-blue-500/30 flex items-center justify-center"
                        title="重置為預設"
                      >
                        <span className="text-sm">↩️</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm({ id: challenge.id, isDefault: true })}
                      className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-red-500/30 flex items-center justify-center"
                    >
                      <span className="text-sm">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
              {/* 已刪除的預設挑戰（可恢復） */}
              {deletedDefaults.length > 0 && (
                <div className="text-gray-500 text-sm mt-2">
                  已隱藏 {deletedDefaults.length} 個預設挑戰
                  <button
                    onClick={() => {
                      saveDeletedDefaults([]);
                      saveModifiedDefaults({});
                    }}
                    className="text-emerald-400 ml-2 hover:underline"
                  >
                    全部恢復
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 自定義挑戰區 */}
          <div className="mb-6">
            <h2 className="text-gray-400 text-sm mb-3">✨ 自定義挑戰</h2>
            {customChallenges.length > 0 ? (
              <div className="space-y-3">
                {customChallenges.map((challenge) => (
                  <div 
                    key={challenge.id}
                    className="bg-gray-800/60 rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl">
                      {challenge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{challenge.name}</div>
                      <div className="text-gray-500 text-sm">省 ${challenge.defaultAmount}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(challenge, false)}
                        className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                      >
                        <span className="text-sm">✏️</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ id: challenge.id, isDefault: false })}
                        className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-red-500/30 flex items-center justify-center"
                      >
                        <span className="text-sm">🗑️</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/40 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-gray-500 text-sm">還沒有自定義挑戰</div>
              </div>
            )}
          </div>

          {/* 新增按鈕 */}
          <button
            onClick={handleAdd}
            className="w-full py-4 rounded-2xl bg-emerald-500/20 border-2 border-dashed border-emerald-500/50 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-all"
          >
            ➕ 新增自定義挑戰
          </button>

          <div className="mt-6 text-gray-500 text-xs text-center">
            每完成一個挑戰可獲得 10 ⏳ 時間沙
          </div>
        </div>
      </div>

      {/* 編輯器 Modal */}
      {showEditor && (
        <ChallengeEditor
          challenge={editingChallenge}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingChallenge(null);
            setEditingIsDefault(false);
          }}
          isDefault={editingIsDefault}
        />
      )}

      {/* 刪除確認 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-white text-lg font-medium mb-2 text-center">
              {showDeleteConfirm.isDefault ? '隱藏這個預設挑戰？' : '刪除這個挑戰？'}
            </div>
            {showDeleteConfirm.isDefault && (
              <div className="text-gray-400 text-sm mb-4 text-center">
                預設挑戰可以隨時恢復
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.isDefault)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold"
              >
                {showDeleteConfirm.isDefault ? '隱藏' : '刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重置確認 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="text-white text-lg font-medium mb-4 text-center">
              重置為預設值？
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-300"
              >
                取消
              </button>
              <button
                onClick={() => handleResetDefault(showResetConfirm)}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
