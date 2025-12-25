/**
 * TimeBar - Google Apps Script Backend v2.1
 * 
 * ⚠️ 重要：請先設定下方的 SPREADSHEET_ID！
 * 
 * 設定步驟：
 * 1. 開啟你的 Google Sheets
 * 2. 從網址複製試算表 ID（網址中 /d/ 和 /edit 之間的那串字）
 *    例如：https://docs.google.com/spreadsheets/d/【這裡是ID】/edit
 * 3. 將 ID 貼到下方 SPREADSHEET_ID 變數中
 * 4. 儲存後重新部署（部署 → 管理部署作業 → 編輯 → 版本選「新版本」→ 部署）
 */

// ⚠️ 請在這裡填入你的試算表 ID
const SPREADSHEET_ID = '1bJ-plKk3locg4fRWtEcdL5rIgT2KQvEz5Xer1h7--MU';

// 試算表設定
const SHEET_NAMES = {
  RECORDS: '消費紀錄',
  USER_DATA: '使用者資料'
};

// 取得試算表（使用明確的 ID）
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 取得或建立工作表
function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
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
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(7, 200);
      sheet.setColumnWidth(8, 180);
    } else if (name === SHEET_NAMES.USER_DATA) {
      sheet.getRange(1, 1, 1, 7).setValues([[
        '年齡', '月薪', '退休年齡', '目前存款', '通膨率(%)', '投資報酬率(%)', '更新時間'
      ]]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
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
    } else if (action === 'ping') {
      result = { message: 'pong', timestamp: new Date().toISOString() };
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
    } else if (action === 'clearAllData') {
      result = clearAllData();
    } else if (action === 'clearRecords') {
      result = clearRecords();
    } else if (action === 'test') {
      result = { message: 'POST is working!', receivedData: data };
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
  
  const rowData = [
    record.id || Utilities.getUuid(),
    record.type === 'save' ? '儲蓄' : '花費',
    record.amount,
    record.isRecurring ? '是' : '否',
    Math.round(record.timeCost * 100) / 100,
    record.category || '',
    record.note || '',
    dateStr,
    dateOnly
  ];
  
  sheet.appendRow(rowData);
  
  // 格式化金額欄位
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 3).setNumberFormat('#,##0');
  
  // 根據類型設定顏色
  if (record.type === 'save') {
    sheet.getRange(lastRow, 2).setBackground('#d1fae5').setFontColor('#065f46');
  } else {
    sheet.getRange(lastRow, 2).setBackground('#fee2e2').setFontColor('#991b1b');
  }
  
  return { message: 'Record added successfully', id: rowData[0] };
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
      type: data[i][1] === '儲蓄' ? 'save' : 'spend',
      amount: Number(data[i][2]),
      isRecurring: data[i][3] === '是',
      timeCost: Number(data[i][4]),
      category: data[i][5],
      note: data[i][6],
      timestamp: data[i][7],
      date: data[i][8]
    });
  }
  
  return { records };
}

// 儲存使用者資料（含通膨率和投資報酬率）
function saveUserData(userData) {
  const sheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  
  // 確保標題列有新欄位
  const headers = sheet.getRange(1, 1, 1, 7).getValues()[0];
  if (headers[4] !== '通膨率(%)') {
    sheet.getRange(1, 1, 1, 7).setValues([[
      '年齡', '月薪', '退休年齡', '目前存款', '通膨率(%)', '投資報酬率(%)', '更新時間'
    ]]);
  }
  
  // 清除舊資料（保留標題）
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // 預設值
  const inflationRate = userData.inflationRate !== undefined ? userData.inflationRate : 2.5;
  const roiRate = userData.roiRate !== undefined ? userData.roiRate : 6;
  
  sheet.appendRow([
    userData.age,
    userData.salary,
    userData.retireAge,
    userData.currentSavings || 0,
    inflationRate,
    roiRate,
    timestamp
  ]);
  
  // 格式化
  sheet.getRange(2, 2).setNumberFormat('#,##0');
  sheet.getRange(2, 4).setNumberFormat('#,##0');
  sheet.getRange(2, 5).setNumberFormat('0.0');
  sheet.getRange(2, 6).setNumberFormat('0.0');
  
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
      age: Number(lastRow[0]),
      salary: Number(lastRow[1]),
      retireAge: Number(lastRow[2]),
      currentSavings: Number(lastRow[3]),
      inflationRate: lastRow[4] !== undefined && lastRow[4] !== '' ? Number(lastRow[4]) : 2.5,
      roiRate: lastRow[5] !== undefined && lastRow[5] !== '' ? Number(lastRow[5]) : 6,
      updatedAt: lastRow[6] || lastRow[4] // 相容舊版
    }
  };
}

// 刪除單筆紀錄
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

// 清除所有消費紀錄（保留標題）
function clearRecords() {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  return { message: 'All records cleared successfully' };
}

// 清除所有資料（消費紀錄 + 使用者資料）
function clearAllData() {
  // 清除消費紀錄
  const recordsSheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const recordsLastRow = recordsSheet.getLastRow();
  if (recordsLastRow > 1) {
    recordsSheet.deleteRows(2, recordsLastRow - 1);
  }
  
  // 清除使用者資料
  const userSheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const userLastRow = userSheet.getLastRow();
  if (userLastRow > 1) {
    userSheet.deleteRows(2, userLastRow - 1);
  }
  
  return { message: 'All data cleared successfully' };
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

// ========== 測試函數 ==========

// 測試試算表連接
function testConnection() {
  try {
    const ss = getSpreadsheet();
    Logger.log('✅ 連接成功！試算表名稱：' + ss.getName());
    return true;
  } catch (error) {
    Logger.log('❌ 連接失敗：' + error.toString());
    Logger.log('請確認 SPREADSHEET_ID 是否正確設定');
    return false;
  }
}

// 測試新增紀錄
function testAddRecord() {
  if (!testConnection()) return;
  
  const result = addRecord({
    type: 'save',
    amount: 1000,
    isRecurring: false,
    timeCost: 5.5,
    category: '測試',
    note: '這是測試紀錄'
  });
  
  Logger.log('新增結果：' + JSON.stringify(result));
}

// 測試讀取紀錄
function testGetRecords() {
  if (!testConnection()) return;
  
  const result = getRecords();
  Logger.log('紀錄數量：' + result.records.length);
  Logger.log('紀錄內容：' + JSON.stringify(result.records));
}

// 測試清除資料
function testClearAllData() {
  if (!testConnection()) return;
  
  const result = clearAllData();
  Logger.log('清除結果：' + JSON.stringify(result));
}
