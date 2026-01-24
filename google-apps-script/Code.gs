/**
 * TimeBar - Google Apps Script Backend v4.1 (Clean)
 *
 * ⚠️ 重要：請先設定下方的 SPREADSHEET_ID！
 * v4.1 清理：移除已棄用功能（遊戲化、快速記帳、挑戰系統）
 * v4.0 更新：新增 trajectoryStartDate 和 historicalDeviationHours 欄位
 */

// ⚠️ 請在這裡填入你的試算表 ID
const SPREADSHEET_ID = '1bJ-plKk3locg4fRWtEcdL5rIgT2KQvEz5Xer1h7--MU';

// 試算表設定
const SHEET_NAMES = {
  RECORDS: '消費紀錄',
  USER_DATA: '使用者資料'
};

// 取得試算表
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 取得或建立工作表
function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    
    if (name === SHEET_NAMES.RECORDS) {
      // 消費紀錄：v4.1 精簡為 13 欄（移除 guiltFree）
      sheet.getRange(1, 1, 1, 13).setValues([[
        'ID', '類型', '金額', '是否每月', '時間成本(小時)', '分類', '備註', '時間戳記', '日期',
        '訂閱狀態', '終止日期', '創建時間', '更新時間'
      ]]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(7, 200);
      sheet.setColumnWidth(8, 180);
    } else if (name === SHEET_NAMES.USER_DATA) {
      // 使用者資料：v4.1 精簡為 14 欄（移除遊戲化、挑戰、預算欄位）
      sheet.getRange(1, 1, 1, 14).setValues([[
        '年齡', '月薪', '目標退休年齡', '目前存款', '每月儲蓄', '目標退休金', '通膨率(%)', '投資報酬率(%)', '更新時間',
        '自訂分類(JSON)', '隱藏分類(JSON)', '建立時間', '軌跡起點', '歷史偏差(時)'
      ]]);
      sheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
      sheet.setFrozenRows(1);
    }
  }
  
  return sheet;
}

// 處理 GET 請求
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

// 處理 POST 請求
function doPost(e) {
  let result = {};
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addRecord') {
      result = addRecord(data.data);
    } else if (action === 'updateRecord') {
      result = updateRecord(data.data);
    } else if (action === 'saveUserData') {
      result = saveUserData(data.data);
    } else if (action === 'deleteRecord') {
      result = deleteRecord(data.id);
    } else if (action === 'clearAllData') {
      result = clearAllData();
    } else if (action === 'clearRecords') {
      result = clearRecords();
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
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  
  const rowData = [
    record.id || Utilities.getUuid(),
    record.type === 'save' ? '儲蓄' : '花費',
    record.amount,
    record.isRecurring ? '是' : '否',
    Math.round(record.timeCost * 100) / 100,
    record.category || '',
    record.note || '',
    dateStr,
    dateOnly,
    record.recurringStatus || '',  // 訂閱狀態
    record.recurringEndDate || '', // 終止日期
    nowStr,                        // 創建時間
    ''                             // 更新時間
  ];
  
  sheet.appendRow(rowData);
  
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 3).setNumberFormat('#,##0');
  
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
      date: data[i][8],
      recurringStatus: data[i][9] || undefined,
      recurringEndDate: data[i][10] || undefined,
      createdAt: data[i][11] || undefined,
      updatedAt: data[i][12] || undefined
    });
  }
  
  return { records };
}

// 儲存使用者資料
function saveUserData(userData) {
  const sheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');

  // 確保標題列是 v4.1 格式（14 欄）
  const headers = sheet.getRange(1, 1, 1, 14).getValues()[0];
  if (headers[12] !== '軌跡起點') {
    sheet.getRange(1, 1, 1, 14).setValues([[
      '年齡', '月薪', '目標退休年齡', '目前存款', '每月儲蓄', '目標退休金', '通膨率(%)', '投資報酬率(%)', '更新時間',
      '自訂分類(JSON)', '隱藏分類(JSON)', '建立時間', '軌跡起點', '歷史偏差(時)'
    ]]);
    sheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
  }

  // 清除舊資料
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  // 基本欄位
  const inflationRate = userData.inflationRate !== undefined ? userData.inflationRate : 2.5;
  const roiRate = userData.roiRate !== undefined ? userData.roiRate : 6;
  const monthlySavings = userData.monthlySavings !== undefined ? userData.monthlySavings : Math.round(userData.salary * 0.2);
  const targetRetirementFund = userData.targetRetirementFund !== undefined ? userData.targetRetirementFund : 0;

  // 分類設定
  const customCategories = userData.customCategories ? JSON.stringify(userData.customCategories) : '[]';
  const hiddenCategories = userData.hiddenCategories ? JSON.stringify(userData.hiddenCategories) : '[]';

  // v3.2: createdAt 欄位
  const createdAt = userData.createdAt || new Date().toISOString();

  // v4.0: GPS 軌跡追蹤欄位
  const trajectoryStartDate = userData.trajectoryStartDate || '';
  const historicalDeviationHours = userData.historicalDeviationHours !== undefined ? userData.historicalDeviationHours : 0;

  sheet.appendRow([
    userData.age,
    userData.salary,
    userData.retireAge,
    userData.currentSavings || 0,
    monthlySavings,
    targetRetirementFund,
    inflationRate,
    roiRate,
    timestamp,
    customCategories,
    hiddenCategories,
    createdAt,
    trajectoryStartDate,
    historicalDeviationHours
  ]);

  // 格式化
  sheet.getRange(2, 2).setNumberFormat('#,##0');
  sheet.getRange(2, 4).setNumberFormat('#,##0');
  sheet.getRange(2, 5).setNumberFormat('#,##0');
  sheet.getRange(2, 6).setNumberFormat('#,##0');
  sheet.getRange(2, 14).setNumberFormat('#,##0.00');

  return { message: 'User data saved successfully' };
}

// 安全解析 JSON
function parseJSON(str, defaultValue) {
  if (!str || str === '') return defaultValue;
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
}

// 取得使用者資料
function getUserData() {
  const sheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { userData: null };
  }

  const row = data[data.length - 1];
  return {
    userData: {
      age: Number(row[0]),
      salary: Number(row[1]),
      retireAge: Number(row[2]),
      currentSavings: Number(row[3]),
      monthlySavings: row[4] !== undefined && row[4] !== '' ? Number(row[4]) : Math.round(Number(row[1]) * 0.2),
      targetRetirementFund: row[5] !== undefined && row[5] !== '' ? Number(row[5]) : 0,
      inflationRate: row[6] !== undefined && row[6] !== '' ? Number(row[6]) : 2.5,
      roiRate: row[7] !== undefined && row[7] !== '' ? Number(row[7]) : 6,
      updatedAt: row[8],
      customCategories: parseJSON(row[9], []),
      hiddenCategories: parseJSON(row[10], []),
      createdAt: row[11] || undefined,
      trajectoryStartDate: row[12] || undefined,
      historicalDeviationHours: row[13] !== undefined && row[13] !== '' ? Number(row[13]) : 0
    }
  };
}

// 更新記錄
function updateRecord(record) {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const data = sheet.getDataRange().getValues();
  const targetId = String(record.id);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {
      const row = i + 1;
      
      // 只更新允許的欄位
      if (record.amount !== undefined) {
        sheet.getRange(row, 3).setValue(record.amount);
        sheet.getRange(row, 3).setNumberFormat('#,##0');
      }
      if (record.category !== undefined) {
        sheet.getRange(row, 6).setValue(record.category);
      }
      if (record.note !== undefined) {
        sheet.getRange(row, 7).setValue(record.note);
      }
      if (record.recurringStatus !== undefined) {
        sheet.getRange(row, 10).setValue(record.recurringStatus);
      }
      if (record.recurringEndDate !== undefined) {
        sheet.getRange(row, 11).setValue(record.recurringEndDate);
      }
      
      // 更新修改時間
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(row, 13).setValue(nowStr);
      
      return { message: 'Record updated successfully', id: record.id };
    }
  }
  
  return { message: 'Record not found', id: record.id };
}

// 刪除單筆紀錄
function deleteRecord(recordId) {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const data = sheet.getDataRange().getValues();
  const targetId = String(recordId);
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {
      sheet.deleteRow(i + 1);
      return { message: 'Record deleted successfully' };
    }
  }
  
  return { message: 'Record not found' };
}

// 清除所有消費紀錄
function clearRecords() {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  return { message: 'All records cleared successfully' };
}

// 清除所有資料
function clearAllData() {
  const recordsSheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const recordsLastRow = recordsSheet.getLastRow();
  if (recordsLastRow > 1) {
    recordsSheet.deleteRows(2, recordsLastRow - 1);
  }

  const userSheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const userLastRow = userSheet.getLastRow();
  if (userLastRow > 1) {
    userSheet.deleteRows(2, userLastRow - 1);
  }

  return { message: 'All data cleared successfully' };
}

// ========== 測試函數 ==========

function testConnection() {
  try {
    const ss = getSpreadsheet();
    Logger.log('✅ 連接成功！試算表名稱：' + ss.getName());
    return true;
  } catch (error) {
    Logger.log('❌ 連接失敗：' + error.toString());
    return false;
  }
}

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

/**
 * 檢查版本狀態
 */
function checkVersion() {
  try {
    const ss = getSpreadsheet();
    const recordsSheet = ss.getSheetByName(SHEET_NAMES.RECORDS);
    const userSheet = ss.getSheetByName(SHEET_NAMES.USER_DATA);

    Logger.log('=== 版本檢查 (v4.1) ===');

    // 檢查消費紀錄工作表
    if (!recordsSheet) {
      Logger.log('❌ 消費紀錄工作表不存在');
    } else {
      const recordsHeaders = recordsSheet.getRange(1, 1, 1, 13).getValues()[0];
      const recordsColumnCount = recordsHeaders.filter(h => h !== '').length;
      Logger.log('消費紀錄標題列欄位數：' + recordsColumnCount);

      if (recordsColumnCount >= 13 && recordsHeaders[9] === '訂閱狀態') {
        Logger.log('✅ 消費紀錄：v4.1（精簡版）');
      } else if (recordsColumnCount >= 14) {
        Logger.log('⚠️ 消費紀錄：舊版本（需要重建工作表）');
      } else {
        Logger.log('❌ 消費紀錄：版本未知');
      }
    }

    // 檢查使用者資料工作表
    if (!userSheet) {
      Logger.log('❌ 使用者資料工作表不存在');
    } else {
      const userHeaders = userSheet.getRange(1, 1, 1, 14).getValues()[0];
      const userColumnCount = userHeaders.filter(h => h !== '').length;
      Logger.log('使用者資料標題列欄位數：' + userColumnCount);

      if (userColumnCount >= 14 && userHeaders[12] === '軌跡起點') {
        Logger.log('✅ 使用者資料：v4.1（精簡版）');
      } else if (userColumnCount >= 19) {
        Logger.log('⚠️ 使用者資料：舊版本（需要重建工作表）');
      } else {
        Logger.log('❌ 使用者資料：版本未知');
      }
    }
  } catch (error) {
    Logger.log('❌ 檢查失敗：' + error.toString());
  }
}

/**
 * 從舊版本遷移到 v4.1
 * ⚠️ 這會重建工作表結構，請先備份資料！
 */
function migrateToV41() {
  try {
    const ss = getSpreadsheet();
    
    Logger.log('=== 開始遷移到 v4.1 ===');
    
    // 備份並重建使用者資料
    const userSheet = ss.getSheetByName(SHEET_NAMES.USER_DATA);
    if (userSheet) {
      const userData = getUserDataFromOldFormat(userSheet);
      if (userData) {
        // 刪除舊工作表
        ss.deleteSheet(userSheet);
        // 重新建立並儲存
        saveUserData(userData);
        Logger.log('✅ 使用者資料已遷移');
      }
    }
    
    Logger.log('=== 遷移完成 ===');
    Logger.log('⚠️ 請注意：消費紀錄需要手動檢查，已豁免(guiltFree)欄位已移除');
    
    return { success: true, message: '遷移完成' };
  } catch (error) {
    Logger.log('❌ 遷移失敗：' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// 從舊格式讀取使用者資料
function getUserDataFromOldFormat(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  
  const row = data[data.length - 1];
  return {
    age: Number(row[0]),
    salary: Number(row[1]),
    retireAge: Number(row[2]),
    currentSavings: Number(row[3]) || 0,
    monthlySavings: Number(row[4]) || Math.round(Number(row[1]) * 0.2),
    targetRetirementFund: Number(row[5]) || 0,
    inflationRate: Number(row[6]) || 2.5,
    roiRate: Number(row[7]) || 6,
    // 跳過舊版的遊戲化欄位 (9-12)
    customCategories: parseJSON(row[12], []),
    hiddenCategories: parseJSON(row[13], []),
    // 跳過舊版的挑戰和預算欄位 (14-15)
    createdAt: row[16] || new Date().toISOString(),
    trajectoryStartDate: row[17] || '',
    historicalDeviationHours: Number(row[18]) || 0
  };
}
