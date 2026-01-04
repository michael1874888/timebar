/**
 * TimeBar - Google Apps Script Backend v2.3
 * 
 * ⚠️ 重要：請先設定下方的 SPREADSHEET_ID！
 * v2.3 更新：新增積分系統欄位
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
      // 消費紀錄：v2.1 擴充至 14 欄
      sheet.getRange(1, 1, 1, 14).setValues([[
        'ID', '類型', '金額', '是否每月', '時間成本(小時)', '分類', '備註', '時間戳記', '日期', '已豁免',
        '訂閱狀態', '終止日期', '創建時間', '更新時間'
      ]]);
      sheet.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(7, 200);
      sheet.setColumnWidth(8, 180);
    } else if (name === SHEET_NAMES.USER_DATA) {
      // 使用者資料：新增積分、庫存、自定義挑戰欄位
      sheet.getRange(1, 1, 1, 12).setValues([[
        '年齡', '月薪', '目標退休年齡', '目前存款', '每月儲蓄', '目標退休金', '通膨率(%)', '投資報酬率(%)', '更新時間',
        '積分餘額', '道具庫存(JSON)', '自定義挑戰(JSON)'
      ]]);
      sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
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
      result = updateRecord(data.data);  // v2.1: 更新記錄
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
    record.guiltFree ? '是' : '否',
    // v2.1: 訂閱管理欄位
    '',           // Col 11: 訂閱狀態
    '',           // Col 12: 終止日期
    nowStr,       // Col 13: 創建時間
    ''            // Col 14: 更新時間
  ];
  
  sheet.appendRow(rowData);
  
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 3).setNumberFormat('#,##0');
  
  if (record.type === 'save') {
    sheet.getRange(lastRow, 2).setBackground('#d1fae5').setFontColor('#065f46');
  } else if (record.guiltFree) {
    // 免死金牌豁免的消費用灰色顯示
    sheet.getRange(lastRow, 2).setBackground('#e5e7eb').setFontColor('#6b7280');
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
      guiltFree: data[i][9] === '是',
      // v2.1: 訂閱管理欄位
      recurringStatus: data[i][10] || undefined,  // 'active' | 'ended' | undefined
      recurringEndDate: data[i][11] || undefined, // YYYY-MM-DD
      createdAt: data[i][12] ? Number(data[i][12]) : undefined,
      updatedAt: data[i][13] ? Number(data[i][13]) : undefined
    });
  }
  
  return { records };
}

// 儲存使用者資料
function saveUserData(userData) {
  const sheet = getOrCreateSheet(SHEET_NAMES.USER_DATA);
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  
  // 確保標題列是 v2.3 格式（12 欄）
  const headers = sheet.getRange(1, 1, 1, 12).getValues()[0];
  if (headers[9] !== '積分餘額') {
    sheet.getRange(1, 1, 1, 12).setValues([[
      '年齡', '月薪', '目標退休年齡', '目前存款', '每月儲蓄', '目標退休金', '通膨率(%)', '投資報酬率(%)', '更新時間',
      '積分餘額', '道具庫存(JSON)', '自定義挑戰(JSON)'
    ]]);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
  }
  
  // 清除舊資料
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  const inflationRate = userData.inflationRate !== undefined ? userData.inflationRate : 2.5;
  const roiRate = userData.roiRate !== undefined ? userData.roiRate : 6;
  const monthlySavings = userData.monthlySavings !== undefined ? userData.monthlySavings : Math.round(userData.salary * 0.2);
  const targetRetirementFund = userData.targetRetirementFund !== undefined ? userData.targetRetirementFund : 0;
  
  // v2.3 新增欄位
  const pointsBalance = userData.pointsBalance !== undefined ? userData.pointsBalance : 0;
  const inventory = userData.inventory ? JSON.stringify(userData.inventory) : '{"guiltFreePass":0}';
  const customChallenges = userData.customChallenges ? JSON.stringify(userData.customChallenges) : '[]';
  
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
    pointsBalance,
    inventory,
    customChallenges
  ]);
  
  // 格式化
  sheet.getRange(2, 2).setNumberFormat('#,##0');
  sheet.getRange(2, 4).setNumberFormat('#,##0');
  sheet.getRange(2, 5).setNumberFormat('#,##0');
  sheet.getRange(2, 6).setNumberFormat('#,##0');
  sheet.getRange(2, 10).setNumberFormat('#,##0');  // 積分餘額
  
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
      // v2.3 新增欄位
      pointsBalance: row[9] !== undefined && row[9] !== '' ? Number(row[9]) : 0,
      inventory: parseJSON(row[10], { guiltFreePass: 0 }),
      customChallenges: parseJSON(row[11], [])
    }
  };
}

// v2.1: 更新記錄
function updateRecord(record) {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const data = sheet.getDataRange().getValues();
  const targetId = String(record.id);  // 確保是字串
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {  // 都轉成字串比較
      const row = i + 1;
      
      // 只更新允許的欄位：金額、分類、備註
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
      
      // v2.1: 更新訂閱狀態（如果有）
      if (record.recurringStatus !== undefined) {
        sheet.getRange(row, 11).setValue(record.recurringStatus);
      }
      if (record.recurringEndDate !== undefined) {
        sheet.getRange(row, 12).setValue(record.recurringEndDate);
      }
      
      // 更新修改時間（第 14 欄）- 使用日期格式
      const nowStr = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(row, 14).setValue(nowStr);
      
      return { message: 'Record updated successfully', id: record.id };
    }
  }
  
  return { message: 'Record not found', id: record.id };
}

// 刪除單筆紀錄
function deleteRecord(recordId) {
  const sheet = getOrCreateSheet(SHEET_NAMES.RECORDS);
  const data = sheet.getDataRange().getValues();
  const targetId = String(recordId);  // 確保是字串
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === targetId) {  // 都轉成字串比較
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

// ========== v2.1 升級函數 ==========

/**
 * 升級消費紀錄工作表至 v2.1（14 欄）
 * ⚠️ 請手動執行此函數一次以更新現有試算表
 */
function upgradeToV21() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.RECORDS);
    
    if (!sheet) {
      Logger.log('❌ 找不到消費紀錄工作表');
      return { success: false, message: '找不到消費紀錄工作表' };
    }
    
    // 檢查當前標題列
    const currentHeaders = sheet.getRange(1, 1, 1, 14).getValues()[0];
    
    // 如果第 11 欄不是「訂閱狀態」，則添加新標題
    if (currentHeaders[10] !== '訂閱狀態') {
      // 設定新的標題列（擴充到 14 欄）
      sheet.getRange(1, 11, 1, 4).setValues([[
        '訂閱狀態', '終止日期', '創建時間', '更新時間'
      ]]);
      sheet.getRange(1, 11, 1, 4).setFontWeight('bold').setBackground('#10b981').setFontColor('white');
      
      Logger.log('✅ 已升級消費紀錄工作表至 v2.1（新增 4 個欄位）');
      return { success: true, message: '已升級至 v2.1' };
    } else {
      Logger.log('ℹ️ 工作表已是 v2.1 格式，無需升級');
      return { success: true, message: '已是最新版本' };
    }
  } catch (error) {
    Logger.log('❌ 升級失敗：' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * 檢查版本狀態
 */
function checkVersion() {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.RECORDS);
    
    if (!sheet) {
      Logger.log('消費紀錄工作表不存在');
      return;
    }
    
    const headers = sheet.getRange(1, 1, 1, 14).getValues()[0];
    const columnCount = headers.filter(h => h !== '').length;
    
    Logger.log('=== 版本檢查 ===');
    Logger.log('標題列欄位數：' + columnCount);
    Logger.log('標題列內容：' + headers.join(', '));
    
    if (columnCount >= 14 && headers[10] === '訂閱狀態') {
      Logger.log('✅ 版本：v2.1（完整支援訂閱管理）');
    } else if (columnCount >= 10) {
      Logger.log('⚠️ 版本：v2.0（需要執行 upgradeToV21() 來支援訂閱管理）');
    } else {
      Logger.log('❌ 版本：未知（結構不完整）');
    }
  } catch (error) {
    Logger.log('❌ 檢查失敗：' + error.toString());
  }
}
