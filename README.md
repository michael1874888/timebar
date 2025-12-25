# TimeBar v2.0 ⏱️💰

> 把每一筆消費轉換成「退休時間成本」，讓你更清楚每個財務決策對未來的影響。

![TimeBar Preview](https://img.shields.io/badge/version-2.0-emerald) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 功能特色

### 核心計算
- **時間成本轉換**：將每筆花費/儲蓄轉換為「延後/提早退休」的天數
- **複利計算**：考慮通膨率 (2.5%) 和投資報酬率 (6%)，計算實質報酬率 (≈3.41%)
- **週期性支出**：一次性 vs 每月固定支出，展示訂閱服務的真正代價

### 記錄追蹤
- 💸 **花費記錄**：追蹤你的消費並看到對退休的影響
- 💰 **儲蓄記錄**：記錄每筆儲蓄，看著退休日期提前
- 📊 **歷史統計**：按月分組查看，累積進度一目瞭然
- 🎯 **退休時間軸**：即時顯示你的退休日期變化

### 資料儲存
- 📱 **本地儲存**：使用 localStorage，關閉瀏覽器也不會遺失
- ☁️ **雲端備份**：可選擇連接 Google Sheets，資料永久保存

---

## 🚀 快速開始

### 方法一：直接使用 GitHub Pages

1. **Fork 這個專案**
2. **啟用 GitHub Pages**
   - 進入 `Settings` → `Pages`
   - Source 選擇 `main` branch
   - 點擊 Save
3. **完成！** 訪問 `https://你的帳號.github.io/timebar/`

### 方法二：本地開發

```bash
# Clone 專案
git clone https://github.com/你的帳號/timebar.git
cd timebar

# 直接用瀏覽器開啟
open index.html
# 或使用本地伺服器
npx serve .
```

---

## ☁️ 設定 Google Sheets 雲端備份（選用）

### 步驟 1：建立 Google Sheets

1. 開啟 [Google Sheets](https://sheets.google.com)
2. 建立新的空白試算表
3. 將試算表命名為「TimeBar 資料」

### 步驟 2：建立 Apps Script

1. 在試算表中，點選 **擴充功能** → **Apps Script**
2. 刪除預設的程式碼
3. 複製 `google-apps-script/Code.gs` 的內容並貼上
4. 點擊 **儲存** (Ctrl+S)

### 步驟 3：部署為網頁應用程式

1. 點選 **部署** → **新增部署作業**
2. 點擊齒輪圖示，選擇 **網頁應用程式**
3. 設定：
   - 說明：`TimeBar API`
   - 執行身分：`我`
   - 誰可以存取：`所有人`
4. 點擊 **部署**
5. **授權**：首次部署需要授權，點擊「授權存取」
6. **複製網址**：部署完成後，複製產生的網址

### 步驟 4：連接到 TimeBar

1. 開啟 `index.html`
2. 找到這一行（約第 40 行）：
   ```javascript
   const GAS_WEB_APP_URL = '';
   ```
3. 將你的網址貼上：
   ```javascript
   const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/xxx.../exec';
   ```
4. 儲存並重新部署到 GitHub Pages

### 驗證連接

- 設定頁面會顯示「Google Sheets 已連接」
- 每筆紀錄會自動同步到你的試算表

---

## 📁 專案結構

```
timebar/
├── index.html              # 主應用程式（單一檔案，包含所有功能）
├── google-apps-script/
│   └── Code.gs             # Google Apps Script 後端程式碼
└── README.md               # 說明文件
```

---

## 🧮 計算邏輯說明

### 時間成本計算

**一次性消費：**
```
未來價值 = 金額 × (1 + 實質報酬率)^距離退休年數
時間成本 = 未來價值 ÷ 時薪
```

**每月固定消費：**
```
未來價值 = 月付金額 × ((1 + 月報酬率)^月數 - 1) ÷ 月報酬率
時間成本 = 未來價值 ÷ 時薪
```

### 預設參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| 通膨率 | 2.5% | 長期平均通膨 |
| 投資報酬率 | 6% | 台股/美股長期平均 |
| 實質報酬率 | ≈3.41% | (1+ROI)/(1+通膨)-1 |
| 每月工作天數 | 22 天 | 標準工作月 |
| 每日工作時數 | 8 小時 | 標準工時 |

---

## 🎨 客製化

### 修改主題顏色

在 `index.html` 中搜尋 Tailwind 顏色類別：
- 主色：`emerald` 系列（儲蓄/正面）
- 警示色：`orange` 系列（消費/警告）
- 危險色：`red` 系列（放縱/延後退休）

### 修改計算參數

在 JavaScript 區塊中修改：
```javascript
const INFLATION_RATE = 0.025;  // 通膨率
const ROI_RATE = 0.06;         // 投資報酬率
```

---

## 📱 PWA 支援（進階）

如果需要安裝到手機桌面，可以新增 `manifest.json`：

```json
{
  "name": "TimeBar",
  "short_name": "TimeBar",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#10b981",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發建議
- 新增更多分類選項
- 支援多幣別
- 新增圖表視覺化
- 支援匯出 CSV
- 新增推播提醒功能

---

## 📄 License

MIT License - 自由使用、修改、分享

---

## 💡 靈感來源

> 「每一分錢都是你未來自由的磚塊」

這個 App 的核心理念是：用「時間」而非「金額」來思考消費。當你看到一杯 $150 的咖啡等於「延後退休 2 小時」，你會更認真地考慮這筆消費是否值得。

---

Made with ❤️ for financial freedom
