# TimeBar 組件 API 文檔

> 此文檔描述所有新版 UI 組件的 API

---

## 目錄

1. [原子組件 (Atoms)](#原子組件-atoms)
2. [分子組件 (Molecules)](#分子組件-molecules)
3. [功能組件 (Features)](#功能組件-features)
4. [頁面組件 (Pages)](#頁面組件-pages)

---

## 原子組件 (Atoms)

### Button

通用按鈕組件。

```tsx
import { Button } from '@ui';

<Button 
  variant="primary"
  size="md"
  loading={false}
  leftIcon={<Icon />}
>
  按鈕文字
</Button>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'success'` | `'primary'` | 按鈕樣式 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 按鈕大小 |
| `fullWidth` | `boolean` | `false` | 是否撐滿寬度 |
| `loading` | `boolean` | `false` | 是否顯示載入狀態 |
| `leftIcon` | `ReactNode` | - | 左側圖標 |
| `rightIcon` | `ReactNode` | - | 右側圖標 |
| `disabled` | `boolean` | `false` | 是否禁用 |

---

### Badge

標籤/徽章組件。

```tsx
import { Badge } from '@ui';

<Badge variant="success" size="sm" icon="✓">
  成功
</Badge>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | 徽章樣式 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 徽章大小 |
| `icon` | `ReactNode` | - | 左側圖標 |
| `removable` | `boolean` | `false` | 是否可移除 |
| `onRemove` | `() => void` | - | 移除回調 |

---

### Input

輸入框組件。

```tsx
import { Input } from '@ui';

<Input 
  label="金額"
  leftAddon="$"
  rightAddon="元"
  error="請輸入有效金額"
  helperText="輸入您的消費金額"
/>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 輸入框大小 |
| `leftAddon` | `ReactNode` | - | 左側裝飾 |
| `rightAddon` | `ReactNode` | - | 右側裝飾 |
| `error` | `string` | - | 錯誤訊息 |
| `label` | `string` | - | 標籤文字 |
| `helperText` | `string` | - | 輔助文字 |
| `fullWidth` | `boolean` | `false` | 是否撐滿寬度 |

---

## 分子組件 (Molecules)

### Card

卡片容器組件。

```tsx
import { Card } from '@ui';

<Card 
  title="標題"
  subtitle="副標題"
  action={<Button size="sm">操作</Button>}
  clickable
  onClick={handleClick}
>
  卡片內容
</Card>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `title` | `ReactNode` | - | 標題 |
| `subtitle` | `ReactNode` | - | 副標題 |
| `action` | `ReactNode` | - | 右側操作區 |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | 內邊距 |
| `clickable` | `boolean` | `false` | 是否可點擊 |
| `variant` | `'default' \| 'outlined' \| 'elevated'` | `'default'` | 卡片樣式 |

---

### Modal

對話框組件。

```tsx
import { Modal } from '@ui';

<Modal 
  isOpen={open}
  onClose={() => setOpen(false)}
  title="確認"
  size="md"
  footer={
    <>
      <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
      <Button onClick={handleConfirm}>確認</Button>
    </>
  }
>
  確定要執行這個操作嗎？
</Modal>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `isOpen` | `boolean` | - | 是否開啟 (必填) |
| `onClose` | `() => void` | - | 關閉回調 (必填) |
| `title` | `ReactNode` | - | 標題 |
| `footer` | `ReactNode` | - | 底部操作區 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | 對話框大小 |
| `closeOnOverlay` | `boolean` | `true` | 點擊遮罩是否關閉 |
| `showCloseButton` | `boolean` | `true` | 是否顯示關閉按鈕 |

---

## 功能組件 (Features)

### RetirementProgress

退休進度條組件，顯示預估退休年齡與目標的對比。

```tsx
import { RetirementProgress } from '@ui';

<RetirementProgress
  estimatedAge={65.2}
  targetAge={65}
  currentAge={30}
  points={150}
  onDetailClick={() => setShowDetail(true)}
/>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `estimatedAge` | `number` | - | 預估退休年齡 (必填) |
| `targetAge` | `number` | - | 目標退休年齡 (必填) |
| `currentAge` | `number` | - | 目前年齡 (必填) |
| `points` | `number` | `0` | 積分 |
| `onDetailClick` | `() => void` | - | 點擊詳情回調 |

---

### AmountInput

金額輸入組件，含快速金額按鈕和訂閱切換。

```tsx
import { AmountInput } from '@ui';

<AmountInput
  value={amount}
  onChange={setAmount}
  isRecurring={isRecurring}
  onRecurringChange={setIsRecurring}
  quickAmounts={[100, 500, 1000, 5000]}
/>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `value` | `number` | - | 金額值 (必填) |
| `onChange` | `(value: number) => void` | - | 變更回調 (必填) |
| `isRecurring` | `boolean` | `false` | 是否為訂閱 |
| `onRecurringChange` | `(value: boolean) => void` | - | 訂閱變更回調 |
| `quickAmounts` | `number[]` | `[100, 500, 1000, 5000]` | 快速金額選項 |

---

### TimeCostDisplay

時間成本顯示組件，含生動比喻。

```tsx
import { TimeCostDisplay } from '@ui';

<TimeCostDisplay
  timeCostHours={8}
  amount={2000}
  isRecurring={false}
/>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `timeCostHours` | `number` | - | 時間成本 (小時) (必填) |
| `amount` | `number` | - | 金額 (必填) |
| `isRecurring` | `boolean` | `false` | 是否為訂閱 |

---

### DecisionButtons

決策按鈕組件（買了/忍住了）。

```tsx
import { DecisionButtons } from '@ui';

<DecisionButtons
  onBought={handleBought}
  onSkipped={handleSkipped}
  disabled={amount === 0}
/>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `onBought` | `() => void` | - | 「我買了」回調 (必填) |
| `onSkipped` | `() => void` | - | 「我忍住了」回調 (必填) |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否載入中 |

---

## 頁面組件 (Pages)

### HomePage

新版首頁，整合所有核心功能。

```tsx
import { HomePage } from '@ui';

<HomePage
  userData={{
    age: 30,
    monthlySalary: 50000,
    targetRetireAge: 65,
  }}
  records={records}
  onAddRecord={handleAddRecord}
  points={150}
  onSettingsClick={handleSettings}
/>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `userData` | `UserData` | - | 用戶數據 (必填) |
| `records` | `RecordItem[]` | - | 記錄列表 (必填) |
| `onAddRecord` | `(record) => void` | - | 添加記錄回調 (必填) |
| `points` | `number` | `0` | 積分 |
| `onSettingsClick` | `() => void` | - | 設定按鈕回調 |

---

### HistoryPage

新版歷史頁面，顯示所有記錄。

```tsx
import { HistoryPage } from '@ui';

<HistoryPage
  records={records}
  onBack={handleBack}
  onEditRecord={handleEdit}
  onDeleteRecord={handleDelete}
/>
```

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `records` | `RecordDTO[]` | - | 記錄列表 (必填) |
| `onBack` | `() => void` | - | 返回回調 (必填) |
| `onEditRecord` | `(id, updates) => void` | - | 編輯記錄回調 |
| `onDeleteRecord` | `(id) => void` | - | 刪除記錄回調 |

---

## Hooks API

### useFinance

財務計算 Hook。

```typescript
import { useFinance } from '@business';

const {
  hourlyRate,      // 時薪
  realRate,        // 真實時薪
  yearsToRetire,   // 距離退休年數
  calculateTimeCost,  // 計算時間成本
  formatTimeCost,     // 格式化時間
} = useFinance(userData);

const cost = calculateTimeCost(5000, false);
const formatted = formatTimeCost(cost);
```

---

### useGPS

GPS 狀態計算 Hook。

```typescript
import { useGPS } from '@business';

const {
  estimatedAge,  // 預估退休年齡
  targetAge,     // 目標退休年齡
  status,        // 'ahead' | 'onTrack' | 'behind'
  config,        // 狀態視覺配置
} = useGPS(userData);
```

---

### useRecords

記錄管理 Hook。

```typescript
import { useRecords } from '@business';

const {
  records,          // 記錄列表
  addRecord,        // 添加記錄
  updateRecord,     // 更新記錄
  deleteRecord,     // 刪除記錄
  recordsByDate,    // 按日期分組
  recordsByCategory,// 按分類分組
  todayRecords,     // 今日記錄
  monthRecords,     // 本月記錄
  totalSaved,       // 總儲蓄
  totalSpent,       // 總消費
} = useRecords(initialRecords);
```

---

### useSync

雲端同步 Hook。

```typescript
import { useSync } from '@business';

const {
  status,         // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
  lastSyncTime,   // 最後同步時間
  isConfigured,   // 是否已配置
  syncAll,        // 同步所有數據
  syncUserData,   // 同步用戶數據
  syncRecord,     // 同步單筆記錄
  setApiUrl,      // 設定 API URL
} = useSync();
```
