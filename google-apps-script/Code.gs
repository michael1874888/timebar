/**
 * TimeBar - Google Apps Script Backend
 * 
 * 設定步驟：
 * 1. 開啟 Google Sheets，建立新試算表
 * 2. 點選「擴充功能」→「Apps Script」
 * 3. 將此檔案內容貼上，取代預設的 Code.gs
 * 4. 點選「部署」→「新增部署作業」
 * 5. 選擇「網頁應用程式」
 * 6. 設定「誰可以存取」為「任何人」
 * 7. 點選「部署」，複製產生的網址
 * 8. 將網址貼到 index.html 的 GAS_WEB_APP_URL 變數中
 */

// 試算表設定
const SHEET_NAMES = {
  RECORDS: '消費紀錄',
  USER_DATA: '使用者資料'
};

// 取得或建立工作表
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    
    // 設定標題列
    if (name === SHEET_NAMES.RECORDS) {
      sheet.getRange(1, 1, 1, 9).setValues([[
        'ID', '類型', '金額', '是否每月', '時間成本(小時)', '分類', '備註', '時間戳記', '日期'
      ]]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
      sheet.setFrozenRows(1);
    } else if (name === SHEET_NAMES.USER_DATA) {
      sheet.getRange(1, 1, 1, 5).setValues([[
        '年齡', '月薪', '退休年齡', '目前存款', '更新時間'
      ]]);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
      sheet.setFrozenRows(1);
    }
  }
  
  return sheet;
}

// 處理 GET 請求（讀取資料）
function doGet(e) {
  const action = e.parameter.action || 'getRecords';
  let result = {};
  
  try {
    if (action === 'getRecords') {
      result = getRecords();
    } else if (action === 'getUserData') {
      result = getUserData();
    } else if (action === 'getAll') {
      result = {
        records: getRecords().records,
        userData: getUserData().userData
      };
    }
    result.success = true;
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// 處理 POST 請求（寫入資料）
function doPost(e) {
  let result = {};
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addRecord') {
      result = addRecord(data.data);
    } else if (action === 'saveUserData') {
      result = saveUserData(data.data);
    } else if (action === 'deleteRecord') {
      result = deleteRecord(data.id);
    }
    
    result.success = true;
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// 新增消費紀錄
function addRecord(record) {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const timestamp = new Date(record.timestamp || new Date());
  const dateStr = Utilities.formatDate(timestamp, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  const dateOnly = Utilities.formatDate(timestamp, 'Asia/Taipei', 'yyyy-MM-dd');
  
  sheet.appendRow([
    record.id || Utilities.getUuid(),
    record.type,           // 'spend' 或 'save'
    record.amount,
    record.isRecurring ? '是' : '否',
    record.timeCost,
    record.category || '',
    record.note || '',
    dateStr,
    dateOnly
  ]);
  
  // 自動調整欄寬
  sheet.autoResizeColumns(1, 9);
  
  return { message: 'Record added successfully' };
}

// 取得所有消費紀錄
function getRecords() {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { records: [] };
  }
  
  const records = [];
  for (let i = 1; i < data.length; i++) {
    records.push({
      id: data[i][0],
      type: data[i][1],
      amount: data[i][2],
      isRecurring: data[i][3] === '是',
      timeCost: data[i][4],
      category: data[i][5],
      note: data[i][6],
      timestamp: data[i][7],
      date: data[i][8]
    });
  }
  
  return { records };
}

// 儲存使用者資料
function saveUserData(userData) {
  const sheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  
  // 清除舊資料（保留標題）
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  sheet.appendRow([
    userData.age,
    userData.salary,
    userData.retireAge,
    userData.currentSavings || 0,
    timestamp
  ]);
  
  return { message: 'User data saved successfully' };
}

// 取得使用者資料
function getUserData() {
  const sheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { userData: null };
  }
  
  const lastRow = data[data.length - 1];
  return {
    userData: {
      age: lastRow[0],
      salary: lastRow[1],
      retireAge: lastRow[2],
      currentSavings: lastRow[3],
      updatedAt: lastRow[4]
    }
  };
}

// 刪除紀錄
function deleteRecord(recordId) {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === recordId) {
      sheet.deleteRow(i + 1);
      return { message: 'Record deleted successfully' };
    }
  }
  
  return { message: 'Record not found' };
}

// 取得統計資料
function getStats() {
  const records = getRecords().records;
  
  const totalSaved = records
    .filter(r => r.type === 'save')
    .reduce((sum, r) => sum + r.amount, 0);
    
  const totalSpent = records
    .filter(r => r.type === 'spend')
    .reduce((sum, r) => sum + r.amount, 0);
    
  const totalSavedHours = records
    .filter(r => r.type === 'save')
    .reduce((sum, r) => sum + r.timeCost, 0);
    
  const totalSpentHours = records
    .filter(r => r.type === 'spend')
    .reduce((sum, r) => sum + r.timeCost, 0);
  
  return {
    totalSaved,
    totalSpent,
    netSaved: totalSaved - totalSpent,
    totalSavedHours,
    totalSpentHours,
    netHours: totalSavedHours - totalSpentHours,
    netDays: Math.round((totalSavedHours - totalSpentHours) / 24),
    recordCount: records.length
  };
}

// 每月摘要（可用於推播通知）
function getMonthlySummary() {
  const records = getRecords().records;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthRecords = records.filter(r => {
    const date = new Date(r.timestamp);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const monthSaved = thisMonthRecords
    .filter(r => r.type === 'save')
    .reduce((sum, r) => sum + r.amount, 0);
    
  const monthSpent = thisMonthRecords
    .filter(r => r.type === 'spend')
    .reduce((sum, r) => sum + r.amount, 0);
  
  return {
    month: `${currentYear}/${currentMonth + 1}`,
    saved: monthSaved,
    spent: monthSpent,
    net: monthSaved - monthSpent,
    count: thisMonthRecords.length
  };
}

// 測試函數
function test() {
  // 測試新增紀錄
  addRecord({
    type: 'save',
    amount: 5000,
    isRecurring: true,
    timeCost: 24,
    category: '薪資儲蓄',
    note: '測試紀錄'
  });
  
  // 測試取得紀錄
  const records = getRecords();
  Logger.log(records);
  
  // 測試統計
  const stats = getStats();
  Logger.log(stats);
}
