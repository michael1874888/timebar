# TimeBar v4.0: The Next Generation ⏱️💰🚀

> 把每一筆消費轉換成「退休時間成本」，以極簡主義和現代化設計，30 秒內完成決策。

---

## 🎉 v4.0 重大更新 (Feature/UI-UX-Transform)

### 🎨 全新 UI/UX 設計
- **3 個核心畫面**：精簡為首頁、歷史、設定，導航深度減少 50%。
- **極簡主義首頁**：單一視覺焦點，專注於「這筆花費會影響你的自由多久？」。
- **退休進度條**：取代 Life Battery，更直觀的 GPS 視覺隱喻，即時預覽決策影響。
- **生動比喻**：將時間成本轉換為「一週薪水」、「一杯咖啡的時間」等有感單位。
- **慶祝克制**：選擇「忍住不買」會觸發彩帶動畫，將克制轉化為正向反饋。

### 🏗️ 四層軟體架構
採用嚴謹的四層架構，確保關注點分離與系統可維護性：
1. **Layer 1: Data** - 存儲與 API 抽象 (StorageAdapter, GoogleSheetsAdapter)
2. **Layer 2: Domain** - 純函數領域邏輯與計算引擎 (FinanceCalculator, GPSCalculator)
3. **Layer 3: Business** - 封裝業務狀態的 Custom Hooks (useFinance, useGPS, useRecords)
4. **Layer 4: UI** - 原子化設計系統與功能組件 (RetirementProgress, Celebration)

### 🛠️ 技術升級
- **Feature Flags**：支援漸進式遷移與 A/B 測試。
- **Design System**：基於 Tokens 的完整設計系統 (Colors, Typography, Spacing)。
- **Error Boundary**：優雅的錯誤處理機制。
- **Lazy Loading**：組件級別的效能優化。

---

## ✨ 核心功能 (v4.0)

### 🏠 主畫面 (The Decision Center)
- **即時影響預覽**：輸入金額，退休進度條與時間成本立即連動變化。
- **快速決策按鈕**：大尺寸的「💸 我買了」和「💪 我忍住了」按鈕。
- **退休導航**：清晰顯示目標年齡、預估年齡與當前進度（領先/落後）。

### 📊 歷史頁面 (The Journey)
- **時間帳本**：不僅記錄金額，更記錄每一筆消費的「時間成本」。
- **視覺化統計**：總省下 vs 總花費的直觀對比。
- **完整編輯控制**：輕鬆管理與修正過往記錄。

### ⚙️ 設定 (The Control Room)
- **個人化參數**：設定目標退休年齡、月薪、預期報酬率。
- **Feature Flags**：開發者開關，可隨時切換新舊功能。

---

## 📁 專案結構 (New)

```
src/
├── components/          # 遺留組件 (Legacy) & 通用工具 (ErrorBoundary)
├── config/              # 全局配置 (FeatureFlags)
├── layers/              # ✅ 新版四層架構
│   ├── 1-data/          # 數據層
│   │   ├── storage/
│   │   └── api/
│   ├── 2-domain/        # 領域層
│   │   ├── calculators/
│   │   └── types/
│   ├── 3-business/      # 業務層
│   │   └── hooks/
│   └── 4-ui/            # UI 層
│       ├── design-system/  # Tokens, Atoms, Molecules
│       ├── features/       # RetirementProgress, Celebration...
│       └── pages/          # HomePage, HistoryPage
├── App.tsx              # 應用入口
└── NewUIPreview.tsx     # 新版 UI 預覽入口
```

---

## 🚀 快速開始

### 環境需求
- Node.js 18+
- npm 9+

### 安裝與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 體驗新版
# 點擊畫面上的「✨ 試用新版」按鈕
```

### 文件資源

- **架構文檔**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 詳細架構說明與開發指南
- **組件 API**: [docs/COMPONENTS-API.md](docs/COMPONENTS-API.md) - UI 組件使用手冊
- **重構計劃**: [REFACTORING-PLAN.md](REFACTORING-PLAN.md) - 完整的重構路線圖

---

## 📄 License

MIT License

---

> 「每一分錢都是你未來自由的磚塊」🧱
> v4.0 致力於讓這個磚塊看得見、摸得著。
