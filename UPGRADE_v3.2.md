# TimeBar v3.2 升級指南

## 📋 問題說明

**症狀：**
當你連接雲端同步並重新載入頁面後，主頁面會顯示原本應該隱藏的功能（今日挑戰、快速記帳等），破壞了漸進式揭露系統。

**原因：**
Google Apps Script (Code.gs) 未儲存 `createdAt` 欄位，導致雲端同步後系統無法判斷用戶使用天數，錯誤地將所有新用戶視為舊用戶並解鎖所有功能。

---

## 🔧 升級步驟

### 步驟 1: 更新 Code.gs

1. 打開你的 Google Apps Script 專案
2. 將新的 `Code.gs` 內容覆蓋到編輯器中
3. 點擊「儲存」（💾）

**變更內容：**
- 版本：v2.3 → v3.2
- 使用者資料表：16 欄 → 17 欄（新增「建立時間」欄位）

### 步驟 2: 執行升級函數（現有用戶必須）

如果你已經在使用 TimeBar 並有雲端資料，需要執行升級函數：

1. 在 Code.gs 編輯器頂部，選擇函數下拉選單
2. 選擇 `upgradeToV32`
3. 點擊「執行」（▶️）
4. 授權執行（如果需要）

**升級函數會做什麼：**
- ✅ 在使用者資料表新增「建立時間」欄位
- ✅ 為現有資料補上 `createdAt`（使用當前時間）
- ✅ 保留所有現有資料

**執行結果：**
```
✅ 已升級使用者資料工作表至 v3.2（新增 createdAt 欄位）
✅ 為 1 筆使用者資料補上 createdAt
```

### 步驟 3: 檢查版本（可選）

執行 `checkVersion` 函數來確認升級成功：

**預期輸出：**
```
=== 版本檢查 ===
消費紀錄標題列欄位數：14
✅ 消費紀錄：v2.1+（支援訂閱管理）
使用者資料標題列欄位數：17
✅ 使用者資料：v3.2（支援漸進式揭露）
```

### 步驟 4: 部署新版本

1. 點擊「部署」→「管理部署」
2. 點擊「編輯」（鉛筆圖示）
3. 選擇「新版本」
4. 點擊「部署」
5. 複製新的部署 URL（如果有變更）

---

## ✅ 驗證升級

升級完成後，測試漸進式揭露系統是否正常：

### 測試情境

1. **清除本地資料**（在 TimeBar 設定中）
2. **重新完成 Onboarding**
3. **記錄 1 筆消費** → 應該**看不到**快速記帳和挑戰
4. **重新載入頁面** → 依然**看不到**快速記帳和挑戰 ✅
5. **記錄到第 3 筆** → 快速記帳功能解鎖 🎉

### 解鎖時機表

| 功能 | 解鎖條件 |
|------|---------|
| 快速記帳 | 3 筆記錄後 |
| 每日挑戰 | 使用 2 天後 |
| 遊戲化系統 | 使用 7 天 + 10 筆記錄 |

---

## 🆕 新用戶（首次設定）

如果你是首次設定 TimeBar 雲端同步：

1. 直接使用新的 `Code.gs`
2. **不需要執行 `upgradeToV32()`**
3. 系統會自動建立 v3.2 格式的試算表

---

## 📊 資料表結構變更

### 使用者資料表（v2.2 → v3.2）

**新增第 17 欄：建立時間**

| 欄位 | 舊版本 | 新版本 |
|------|--------|--------|
| 總欄數 | 16 | 17 |
| 第 17 欄 | （無） | 建立時間 |

**資料格式：**
- 儲存格式：ISO 8601 字串（例：`2026-01-11T19:30:00.000Z`）
- 用途：計算用戶使用天數，控制功能漸進式解鎖

---

## 🐛 常見問題

### Q: 執行 `upgradeToV32()` 後會影響現有資料嗎？

**A:** 不會！升級函數只會：
- 在標題列新增「建立時間」欄位
- 為現有用戶資料補上 `createdAt`（使用當前時間）
- **不會刪除或修改任何現有資料**

### Q: 我已經有很多記錄，升級後功能會被鎖住嗎？

**A:** 不會！由於 `upgradeToV32()` 會將你的 `createdAt` 設為當前時間，系統會認為你是新用戶。但是：
- **舊資料沒有 `createdAt`** → 系統判斷為舊用戶 → **所有功能解鎖** ✅
- 這是為了保護現有用戶的使用體驗

### Q: 如果忘記執行 `upgradeToV32()` 會怎樣？

**A:** 漸進式揭露系統會失效：
- 重新載入後，所有功能都會被解鎖
- 就像你遇到的原始問題一樣

### Q: 可以手動編輯試算表來升級嗎？

**A:** 可以，但不建議。你需要：
1. 在使用者資料表第 17 欄標題寫 `建立時間`
2. 在第 17 欄資料格填入 ISO 8601 時間字串

**建議：直接使用 `upgradeToV32()` 函數更安全可靠。**

---

## 💡 技術細節

### 為什麼需要 createdAt？

漸進式揭露系統 (`progressiveDisclosure.ts`) 需要計算用戶使用天數：

```typescript
export function calculateDaysSinceOnboarding(userData: UserData): number {
  if (!userData.createdAt) {
    // 沒有 createdAt → 判定為舊用戶 → 解鎖所有功能
    return Infinity;
  }

  const createdDate = new Date(userData.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}
```

### Code.gs 變更摘要

**saveUserData (Line 245-262):**
```javascript
// v3.2: 保留現有 createdAt 或使用當前時間
const createdAt = userData.createdAt || new Date().toISOString();

sheet.appendRow([
  // ... 其他欄位 ...
  createdAt  // 新增第 17 欄
]);
```

**getUserData (Line 294-317):**
```javascript
return {
  userData: {
    // ... 其他欄位 ...
    createdAt: row[16] || undefined  // 讀取第 17 欄
  }
};
```

---

## ✅ 升級檢查清單

完成以下步驟確保升級成功：

- [ ] 更新 Code.gs 至 v3.2
- [ ] 執行 `upgradeToV32()` 函數（現有用戶）
- [ ] 執行 `checkVersion()` 確認版本正確
- [ ] 部署新版本到 Google Apps Script
- [ ] 測試漸進式揭露系統（清除資料 → Onboarding → 記錄 → Reload）
- [ ] 確認重新載入後功能不會異常解鎖

---

## 🎉 升級完成

恭喜！你的 TimeBar 雲端同步現在已經完整支援漸進式揭露系統了。

新用戶將能夠：
- 循序漸進地學習 TimeBar 功能
- 避免一開始就被複雜功能淹沒
- 享受功能解鎖的成就感 🎮

---

**有問題？** 請在 GitHub Issues 回報：https://github.com/yourusername/timebar/issues
