/**
 * TimeBar - 財務計算模組 單元測試
 * 
 * 執行方式：npm test
 */

const { CONSTANTS, FinanceCalc, Formatters, GPSCalc } = require('./financeCalc');

// ==================== 測試工具 ====================
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
    testsFailed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      const threshold = Math.pow(10, -precision) / 2;
      if (diff > threshold) {
        throw new Error(`Expected ${expected} (±${threshold}), but got ${actual}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
  };
}

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

// ==================== 測試案例 ====================

describe('CONSTANTS', () => {
  test('應該有正確的預設通膨率', () => {
    expect(CONSTANTS.DEFAULT_INFLATION_RATE).toBe(2.5);
  });

  test('應該有正確的預設投資報酬率', () => {
    expect(CONSTANTS.DEFAULT_ROI_RATE).toBe(6);
  });

  test('每年工作小時應該是 2112', () => {
    expect(CONSTANTS.WORKING_HOURS_PER_YEAR).toBe(2112);
  });

  test('每年工作小時計算應該正確 (22天 × 8小時 × 12月)', () => {
    const calculated = CONSTANTS.WORKING_DAYS_PER_MONTH * 
                       CONSTANTS.WORKING_HOURS_PER_DAY * 12;
    expect(calculated).toBe(2112);
  });
});

describe('FinanceCalc.realRate', () => {
  test('通膨2.5%、報酬6%，實質報酬率應約3.41%', () => {
    const rate = FinanceCalc.realRate(2.5, 6);
    expect(rate).toBeCloseTo(0.0341, 3);
  });

  test('通膨0%、報酬6%，實質報酬率應等於6%', () => {
    const rate = FinanceCalc.realRate(0, 6);
    expect(rate).toBeCloseTo(0.06, 4);
  });

  test('通膨等於報酬時，實質報酬率應約0%', () => {
    const rate = FinanceCalc.realRate(5, 5);
    expect(rate).toBeCloseTo(0, 4);
  });

  test('通膨高於報酬時，實質報酬率應為負', () => {
    const rate = FinanceCalc.realRate(8, 5);
    expect(rate).toBeLessThan(0);
  });
});

describe('FinanceCalc.futureValue', () => {
  test('100元、10%利率、2年，終值應為121', () => {
    const fv = FinanceCalc.futureValue(100, 0.1, 2);
    expect(fv).toBeCloseTo(121, 2);
  });

  test('1000元、5%利率、10年，終值應約1628.89', () => {
    const fv = FinanceCalc.futureValue(1000, 0.05, 10);
    expect(fv).toBeCloseTo(1628.89, 1);
  });

  test('0利率時，終值應等於本金', () => {
    const fv = FinanceCalc.futureValue(1000, 0, 10);
    expect(fv).toBe(1000);
  });

  test('0年時，終值應等於本金', () => {
    const fv = FinanceCalc.futureValue(1000, 0.1, 0);
    expect(fv).toBe(1000);
  });
});

describe('FinanceCalc.annuityFV', () => {
  test('每月存1000元、0利率、1年，應累積12000', () => {
    const fv = FinanceCalc.annuityFV(1000, 0, 1);
    expect(fv).toBe(12000);
  });

  test('每月存1000元、6%年利率、10年，應有正確複利效果', () => {
    const fv = FinanceCalc.annuityFV(1000, 0.06, 10);
    // 每月1000，10年後約163,879
    expect(fv).toBeGreaterThan(120000); // 至少比單純加總多
    expect(fv).toBeCloseTo(163879, -2); // 約等於16萬
  });

  test('0年時，應回傳0', () => {
    const fv = FinanceCalc.annuityFV(1000, 0.06, 0);
    expect(fv).toBe(0);
  });
});

describe('FinanceCalc.yearsToTarget', () => {
  test('已達標時，應回傳0年', () => {
    const years = FinanceCalc.yearsToTarget(1000000, 10000, 500000, 0.05);
    expect(years).toBe(0);
  });

  test('計算結果應該合理', () => {
    // 目前0存款，每月存1萬，目標100萬，5%報酬
    const years = FinanceCalc.yearsToTarget(0, 10000, 1000000, 0.05);
    expect(years).toBeGreaterThan(5);  // 至少5年
    expect(years).toBeLessThan(10);    // 不超過10年
  });

  test('有初始存款時，應該更快達標', () => {
    const yearsWithoutSavings = FinanceCalc.yearsToTarget(0, 10000, 1000000, 0.05);
    const yearsWithSavings = FinanceCalc.yearsToTarget(500000, 10000, 1000000, 0.05);
    expect(yearsWithSavings).toBeLessThan(yearsWithoutSavings);
  });
});

describe('FinanceCalc.targetFundByAge', () => {
  test('應該等於複利終值加年金終值', () => {
    const currentSavings = 100000;
    const monthlySavings = 10000;
    const years = 20;
    const rate = 0.05;

    const expected = FinanceCalc.futureValue(currentSavings, rate, years) + 
                     FinanceCalc.annuityFV(monthlySavings, rate, years);
    const actual = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, years, rate);
    
    expect(actual).toBeCloseTo(expected, 0);
  });
});

describe('FinanceCalc.monthlyToFund (4%法則)', () => {
  test('月領5萬，需要1500萬退休金', () => {
    const fund = FinanceCalc.monthlyToFund(50000);
    expect(fund).toBe(15000000);
  });

  test('月領10萬，需要3000萬退休金', () => {
    const fund = FinanceCalc.monthlyToFund(100000);
    expect(fund).toBe(30000000);
  });
});

describe('FinanceCalc.fundToMonthly (4%法則)', () => {
  test('1500萬退休金，可月領5萬', () => {
    const monthly = FinanceCalc.fundToMonthly(15000000);
    expect(monthly).toBe(50000);
  });

  test('monthlyToFund 和 fundToMonthly 應該互為反函數', () => {
    const monthly = 50000;
    const fund = FinanceCalc.monthlyToFund(monthly);
    const backToMonthly = FinanceCalc.fundToMonthly(fund);
    expect(backToMonthly).toBe(monthly);
  });
});

describe('FinanceCalc.calculateTimeCost', () => {
  const hourlyRate = 284; // 月薪5萬的時薪
  const realRate = 0.0341;
  const yearsToRetire = 35;

  test('一次性消費應使用複利計算', () => {
    const timeCost = FinanceCalc.calculateTimeCost(1000, false, hourlyRate, realRate, yearsToRetire);
    // 1000元複利35年後的未來價值 / 時薪
    const expectedFV = 1000 * Math.pow(1 + realRate, yearsToRetire);
    expect(timeCost).toBeCloseTo(expectedFV / hourlyRate, 1);
  });

  test('每月固定消費應使用年金公式計算', () => {
    const timeCost = FinanceCalc.calculateTimeCost(1000, true, hourlyRate, realRate, yearsToRetire);
    // 每月1000的年金終值 / 時薪
    expect(timeCost).toBeGreaterThan(1000 * 12 * 35 / hourlyRate); // 應該比單純累加大（有複利）
  });

  test('每月固定消費的時間成本應該遠大於一次性', () => {
    const oneTime = FinanceCalc.calculateTimeCost(1000, false, hourlyRate, realRate, yearsToRetire);
    const recurring = FinanceCalc.calculateTimeCost(1000, true, hourlyRate, realRate, yearsToRetire);
    expect(recurring).toBeGreaterThan(oneTime * 100); // 每月消費影響至少是一次性的100倍
  });
});

describe('FinanceCalc.hourlyRate', () => {
  test('月薪5萬，時薪應約284', () => {
    const rate = FinanceCalc.hourlyRate(50000);
    expect(rate).toBeCloseTo(284.09, 1);
  });

  test('月薪10萬，時薪應約568', () => {
    const rate = FinanceCalc.hourlyRate(100000);
    expect(rate).toBeCloseTo(568.18, 1);
  });
});

describe('Formatters.formatTime', () => {
  test('0.5小時應顯示為30分鐘', () => {
    const result = Formatters.formatTime(0.5);
    expect(result.value).toBe(30);
    expect(result.unit).toBe('分鐘');
  });

  test('4小時應顯示為4小時', () => {
    const result = Formatters.formatTime(4);
    expect(result.value).toBe(4);
    expect(result.unit).toBe('小時');
  });

  test('16小時(2工作天)應顯示為2天', () => {
    const result = Formatters.formatTime(16);
    expect(result.value).toBe(2);
    expect(result.unit).toBe('天');
  });

  test('352小時(2工作月)應顯示為2個月', () => {
    const result = Formatters.formatTime(352);
    expect(result.value).toBe(2);
    expect(result.unit).toBe('個月');
  });

  test('2112小時(1工作年)應顯示為1年', () => {
    const result = Formatters.formatTime(2112);
    expect(result.value).toBe(1);
    expect(result.unit).toBe('年');
  });

  test('4224小時(2工作年)應顯示為2年', () => {
    const result = Formatters.formatTime(4224);
    expect(result.value).toBe(2);
    expect(result.unit).toBe('年');
  });
});

describe('Formatters.formatCurrency', () => {
  test('1000應顯示為1,000', () => {
    expect(Formatters.formatCurrency(1000)).toBe('1,000');
  });

  test('10000應顯示為1萬', () => {
    expect(Formatters.formatCurrency(10000)).toBe('1萬');
  });

  test('15000應顯示為1.5萬', () => {
    expect(Formatters.formatCurrency(15000)).toBe('1.5萬');
  });

  test('100000000應顯示為1億', () => {
    expect(Formatters.formatCurrency(100000000)).toBe('1.00億');
  });
});

describe('Formatters.formatAgeDiff', () => {
  test('0.001年應顯示為0天', () => {
    const result = Formatters.formatAgeDiff(0.001);
    expect(result.value).toBe('0');
    expect(result.unit).toBe('天');
  });

  test('0.05年(約18天)應顯示為天', () => {
    const result = Formatters.formatAgeDiff(0.05);
    expect(result.unit).toBe('天');
  });

  test('0.5年(約6個月)應顯示為月', () => {
    const result = Formatters.formatAgeDiff(0.5);
    expect(result.unit).toBe('個月');
  });

  test('2.5年應顯示為年', () => {
    const result = Formatters.formatAgeDiff(2.5);
    expect(result.value).toBe('2.5');
    expect(result.unit).toBe('年');
  });
});

describe('GPSCalc.calculateEstimatedAge', () => {
  test('無記錄時，預估年齡應等於目標年齡', () => {
    const result = GPSCalc.calculateEstimatedAge(65, []);
    expect(result.estimatedAge).toBe(65);
    expect(result.isOnTrack).toBe(true);
  });

  test('只有儲蓄時，預估年齡應提早', () => {
    const records = [
      { type: 'save', amount: 10000, timeCost: 2112 }, // 1年的工作時間
    ];
    const result = GPSCalc.calculateEstimatedAge(65, records);
    expect(result.estimatedAge).toBeCloseTo(64, 0); // 提早約1年
    expect(result.isAhead).toBe(true);
  });

  test('只有消費時，預估年齡應延後', () => {
    const records = [
      { type: 'spend', amount: 10000, timeCost: 2112 }, // 1年的工作時間
    ];
    const result = GPSCalc.calculateEstimatedAge(65, records);
    expect(result.estimatedAge).toBeCloseTo(66, 0); // 延後約1年
    expect(result.isBehind).toBe(true);
  });

  test('儲蓄大於消費時，應領先', () => {
    const records = [
      { type: 'save', amount: 20000, timeCost: 4224 },  // 2年
      { type: 'spend', amount: 10000, timeCost: 2112 }, // 1年
    ];
    const result = GPSCalc.calculateEstimatedAge(65, records);
    expect(result.isAhead).toBe(true);
    expect(result.estimatedAge).toBeCloseTo(64, 0); // 淨效果是提早1年
  });
});

describe('GPSCalc.calculateTotals', () => {
  test('應正確計算累積金額', () => {
    const records = [
      { type: 'save', amount: 10000 },
      { type: 'save', amount: 5000 },
      { type: 'spend', amount: 3000 },
    ];
    const result = GPSCalc.calculateTotals(records);
    expect(result.totalSaved).toBe(15000);
    expect(result.totalSpent).toBe(3000);
  });

  test('空記錄應回傳0', () => {
    const result = GPSCalc.calculateTotals([]);
    expect(result.totalSaved).toBe(0);
    expect(result.totalSpent).toBe(0);
  });
});

// ==================== 整合測試 ====================

describe('整合測試：完整退休計算情境', () => {
  test('情境：30歲、月薪5萬、每月存1萬、想65歲退休', () => {
    const age = 30;
    const salary = 50000;
    const monthlySavings = 10000;
    const retireAge = 65;
    const yearsToRetire = retireAge - age;
    const currentSavings = 100000;

    const realRate = FinanceCalc.realRate(2.5, 6);
    
    // 計算時薪
    const hourlyRate = FinanceCalc.hourlyRate(salary);
    expect(hourlyRate).toBeCloseTo(284.09, 1);

    // 計算退休金 (3.41% 報酬，35年，約800萬)
    const targetFund = FinanceCalc.targetFundByAge(currentSavings, monthlySavings, yearsToRetire, realRate);
    expect(targetFund).toBeGreaterThan(5000000); // 至少500萬
    expect(targetFund).toBeLessThan(15000000);   // 不超過1500萬

    // 計算每月可領 (4% 法則)
    const monthlyRetirement = FinanceCalc.fundToMonthly(targetFund);
    expect(monthlyRetirement).toBeGreaterThan(20000); // 至少2萬/月

    // 消費1000元的時間成本
    const timeCost = FinanceCalc.calculateTimeCost(1000, false, hourlyRate, realRate, yearsToRetire);
    const formatted = Formatters.formatTime(timeCost);
    
    // 應該在合理範圍內
    expect(timeCost).toBeGreaterThan(0);
    expect(timeCost).toBeLessThan(100); // 不超過100小時
  });

  test('情境：每月訂閱Netflix (330元) vs 一次性買遊戲 (1800元)', () => {
    const hourlyRate = FinanceCalc.hourlyRate(50000);
    const realRate = FinanceCalc.realRate(2.5, 6);
    const yearsToRetire = 35;

    const netflixCost = FinanceCalc.calculateTimeCost(330, true, hourlyRate, realRate, yearsToRetire);
    const gameCost = FinanceCalc.calculateTimeCost(1800, false, hourlyRate, realRate, yearsToRetire);

    // Netflix 每月330，長期來看影響更大
    expect(netflixCost).toBeGreaterThan(gameCost);
    
    // 驗證：Netflix 35年的複利影響約0.4年（約5個月）的工作時間
    const netflixYears = netflixCost / CONSTANTS.WORKING_HOURS_PER_YEAR;
    expect(netflixYears).toBeGreaterThan(0.3); // 至少0.3年以上的工作時間
    expect(netflixYears).toBeLessThan(1);      // 不超過1年
    
    // 一次性買遊戲影響很小（約20小時）
    expect(gameCost).toBeLessThan(50); // 不超過50小時
  });
});

// ==================== 執行測試 ====================

console.log('\n🧪 TimeBar 財務計算模組測試\n');
console.log('='.repeat(50));

// 測試已經在 describe 中執行了

console.log('\n' + '='.repeat(50));
console.log(`\n📊 測試結果: ${testsPassed} 通過, ${testsFailed} 失敗`);

if (testsFailed > 0) {
  process.exit(1);
}
