import { Readable } from 'stream';
import { CALCULATION_CODES, CalculatedAmount, ColumnStats, reportCalcService, reportCalcServicePrivate } from './report-calc-service';
import { CSV_COLUMNS, GENDER_CODES, Row } from './validate-service';
import { createSampleRow } from './validate-service.spec';

describe("ColumnStats", () => {
  // Initialize a ColumnStats object with a sample dataset that will
  // be used for most test on this class.
  let columnStats = null;
  // Add enough an equal number of non-binary people and people of
  // unknown gender.  In both cases the number should be at least
  // enough for the gender category to be included in graphs and 
  // to be considered as a candidate for the reference category.
  const numNonBinary = Math.max(
    reportCalcService.MIN_REQUIRED_PEOPLE_COUNT,
    reportCalcService.MIN_REQUIRED_COUNT_FOR_REF_CATEGORY);
  const numUnknown = numNonBinary;
  beforeEach(() => {
    columnStats = new ColumnStats();
    columnStats.push(10, GENDER_CODES.FEMALE[0]);
    columnStats.push(24, GENDER_CODES.FEMALE[GENDER_CODES.FEMALE.length - 1]);
    columnStats.push(20, GENDER_CODES.FEMALE[0]);
    columnStats.push(40, GENDER_CODES.MALE[0]);
    columnStats.push(30, GENDER_CODES.MALE[0]);
    for (var i = 0; i < numNonBinary; i++) {
      columnStats.push(50, GENDER_CODES.NON_BINARY[0]);
    }
    for (var i = 0; i < numUnknown - 1; i++) {
      columnStats.push(60, GENDER_CODES.UNKNOWN[0]);
    }
    columnStats.push(0, GENDER_CODES.UNKNOWN[0]);
  })

  describe("getValues", () => {
    it("returns a array of all values in the given gender category in the same order as input", () => {
      //Just check the lowest value in each gender category
      expect(columnStats.getValues(GENDER_CODES.FEMALE[0])[0]).toBe(10);
      expect(columnStats.getValues(GENDER_CODES.MALE[0])[0]).toBe(40);
      expect(columnStats.getValues(GENDER_CODES.NON_BINARY[0])[0]).toBe(50);
    })
  })

  describe("getCount", () => {
    it("returns the number of values in the given gender category", () => {
      expect(columnStats.getCount(GENDER_CODES.FEMALE[0])).toBe(3);
      expect(columnStats.getCount(GENDER_CODES.MALE[0])).toBe(2);
      expect(columnStats.getCount(GENDER_CODES.NON_BINARY[0])).toBe(numNonBinary);
      expect(columnStats.getCount(GENDER_CODES.UNKNOWN[0])).toBe(numUnknown);
    })
  })

  describe("getCountWithNonZeroData", () => {
    it("returns the number of records in the given gender category with non-zero data values", () => {
      expect(columnStats.getCountWithNonZeroData(GENDER_CODES.FEMALE[0])).toBe(3);
      expect(columnStats.getCountWithNonZeroData(GENDER_CODES.MALE[0])).toBe(2);
      expect(columnStats.getCountWithNonZeroData(GENDER_CODES.NON_BINARY[0])).toBe(numNonBinary);
      expect(columnStats.getCountWithNonZeroData(GENDER_CODES.UNKNOWN[0])).toBe(numUnknown - 1);
    })
  })

  describe("getMean", () => {
    it("returns the mean (average) of values in the given gender catetory", () => {
      expect(columnStats.getMean(GENDER_CODES.FEMALE[0])).toBe(18);
      expect(columnStats.getMean(GENDER_CODES.MALE[0])).toBe(35);
      expect(columnStats.getMean(GENDER_CODES.NON_BINARY[0])).toBe(50);
    })
  })

  describe("getMedian", () => {
    it("returns the median of values in the given gender catetory", () => {
      expect(columnStats.getMedian(GENDER_CODES.FEMALE[0])).toBe(20);
      expect(columnStats.getMedian(GENDER_CODES.MALE[0])).toBe(35);
      expect(columnStats.getMedian(GENDER_CODES.NON_BINARY[0])).toBe(50);
    })
  })

  describe("getReferenceGenderCode", () => {
    it("returns the expected reference category", () => {
      expect(columnStats.getReferenceGenderCode()).toBe(GENDER_CODES.UNKNOWN[0]);
    })
  })

});

describe("meetsPeopleCountThreshold", () => {
  describe(`when a gender group meets the people count threshold for calculations to be performed`, () => {
    it(`returns true`, () => {
      const columnStats = new ColumnStats();
      Array(reportCalcService.MIN_REQUIRED_PEOPLE_COUNT).fill(100).forEach(v => {
        columnStats.push(v, GENDER_CODES.FEMALE[0]);
      })
      const meetsThreshold = reportCalcServicePrivate.meetsPeopleCountThreshold(columnStats, GENDER_CODES.FEMALE[0]);
      expect(meetsThreshold).toBeTruthy();
    })
  })
  describe(`when a gender group doesn't meet the people count threshold for calculations to be performed`, () => {
    it(`returns false`, () => {
      const columnStats = new ColumnStats();
      Array(reportCalcService.MIN_REQUIRED_PEOPLE_COUNT - 1).fill(100).forEach(v => {
        columnStats.push(v, GENDER_CODES.FEMALE[0]);
      })
      const meetsThreshold = reportCalcServicePrivate.meetsPeopleCountThreshold(columnStats, GENDER_CODES.FEMALE[0]);
      expect(meetsThreshold).toBeFalsy();
    })
  })
})

describe("meetsPeopleWithDataCountThreshold", () => {
  describe(`when a gender group meets the threshold for number of people with data for calculations to be performed`, () => {
    it(`returns true`, () => {
      const columnStats = new ColumnStats();
      Array(reportCalcService.MIN_REQUIRED_PEOPLE_WITH_DATA_COUNT).fill(100).forEach(v => {
        columnStats.push(v, GENDER_CODES.NON_BINARY[0]);
      })
      const meetsThreshold = reportCalcServicePrivate.meetsPeopleWithDataCountThreshold(columnStats, GENDER_CODES.NON_BINARY[0]);
      expect(meetsThreshold).toBeTruthy();
    })
  })
  describe(`when a gender group doesn't meet the threshold for number of people with data for calculations to be performed`, () => {
    it(`returns false`, () => {
      const columnStats = new ColumnStats();
      Array(reportCalcService.MIN_REQUIRED_PEOPLE_WITH_DATA_COUNT - 1).fill(100).forEach(v => {
        columnStats.push(v, GENDER_CODES.NON_BINARY[0]);
      })
      columnStats.push(0, GENDER_CODES.NON_BINARY[0]);
      const meetsThreshold = reportCalcServicePrivate.meetsPeopleWithDataCountThreshold(columnStats, GENDER_CODES.NON_BINARY[0]);
      expect(meetsThreshold).toBeFalsy();
    })
  })
})

describe("cleanCsvRecord", () => {
  describe(`when numeric columns have values represented as strings`, () => {
    it(`those values are converted into proper numbers`, () => {
      const overrides = {};
      overrides[CSV_COLUMNS.HOURS_WORKED] = "10";
      overrides[CSV_COLUMNS.ORDINARY_PAY] = "200";
      overrides[CSV_COLUMNS.SPECIAL_SALARY] = "";
      const row: Row = createSampleRow(overrides);
      const cleanedCsvRecord = reportCalcServicePrivate.cleanCsvRecord(row.record);
      expect(cleanedCsvRecord[CSV_COLUMNS.HOURS_WORKED]).toBe(parseFloat(overrides[CSV_COLUMNS.HOURS_WORKED]));
      expect(cleanedCsvRecord[CSV_COLUMNS.ORDINARY_PAY]).toBe(parseFloat(overrides[CSV_COLUMNS.ORDINARY_PAY]));
      expect(cleanedCsvRecord[CSV_COLUMNS.SPECIAL_SALARY]).toBe(0);
    })
  })
})

describe("getHourlyPayDollars", () => {
  describe(`when ${CSV_COLUMNS.HOURS_WORKED} and ${CSV_COLUMNS.ORDINARY_PAY} are specified`, () => {
    it(`hourly rate is ${CSV_COLUMNS.ORDINARY_PAY} divided by ${CSV_COLUMNS.HOURS_WORKED}`, () => {
      const overrides = {};
      overrides[CSV_COLUMNS.HOURS_WORKED] = "10";
      overrides[CSV_COLUMNS.ORDINARY_PAY] = "200";
      overrides[CSV_COLUMNS.SPECIAL_SALARY] = "";
      const row: Row = createSampleRow(overrides);
      // A precondition of getHourlyPayDollars(..) is:
      //  cleanCsvRecord(..) must be been called before it.
      // Do that now.
      const cleanedCsvRecord = reportCalcServicePrivate.cleanCsvRecord(row.record);
      const hourlyPayDollars = reportCalcServicePrivate.getHourlyPayDollars(cleanedCsvRecord);
      const expectedHourlyPayDollars = cleanedCsvRecord[CSV_COLUMNS.ORDINARY_PAY] / cleanedCsvRecord[CSV_COLUMNS.HOURS_WORKED];
      expect(hourlyPayDollars).toBe(expectedHourlyPayDollars);
    })
  })
  describe(`when ${CSV_COLUMNS.SPECIAL_SALARY} is specified`, () => {
    it(`hourly rate ${CSV_COLUMNS.SPECIAL_SALARY}`, () => {
      const overrides = {};
      overrides[CSV_COLUMNS.HOURS_WORKED] = "";
      overrides[CSV_COLUMNS.ORDINARY_PAY] = "";
      overrides[CSV_COLUMNS.SPECIAL_SALARY] = "100";
      const row: Row = createSampleRow(overrides);
      // A precondition of getHourlyPayDollars(..) is:
      //  cleanCsvRecord(..) must be been called before it.
      // Do that now.
      const cleanedCsvRecord = reportCalcServicePrivate.cleanCsvRecord(row.record);
      const hourlyPayDollars = reportCalcServicePrivate.getHourlyPayDollars(cleanedCsvRecord);
      const expectedHourlyPayDollars = cleanedCsvRecord[CSV_COLUMNS.SPECIAL_SALARY];
      expect(hourlyPayDollars).toBe(expectedHourlyPayDollars);
    })
  })
})

describe("calculateMeanHourlyPayGaps", () => {
  describe(`given a simulated list of people with gender codes and hourly pay data`, () => {
    it(`mean gender hourly pay gaps are calculated correctly`, () => {

      // For these mock hourly pay data, assume:
      // - All males earn $100/hr
      // - All females earn $99/hr
      // - All non-binary people earn $98/hr
      // - All people whose gender is unknown earn $97/hr
      // Add 10 fake people in each gender category
      const hourlyPayStats = new ColumnStats();
      Array(10).fill(100).forEach(v => {
        hourlyPayStats.push(v, GENDER_CODES.MALE[0]);
        hourlyPayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
        hourlyPayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
        hourlyPayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
      });
      const means: CalculatedAmount[] = reportCalcServicePrivate.calculateMeanHourlyPayGaps(hourlyPayStats);

      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M)[0].value).toBe(0);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W)[0].value).toBe(1);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X)[0].value).toBe(2);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U)[0].value).toBe(3);
    })
  })
})

describe("calculateMedianHourlyPayGaps", () => {
  describe(`given a simulated list of people with gender codes and hourly pay data`, () => {
    it(`median gender hourly pay gaps are calculated correctly`, () => {

      // For these mock hourly pay data, assume:
      // - All males earn $100/hr
      // - All females earn $99/hr
      // - All non-binary people earn $98/hr
      // - All people whose gender is unknown earn $97/hr
      // Add 10 fake people in each gender category
      const hourlyPayStats = new ColumnStats();
      Array(10).fill(100).forEach(v => {
        hourlyPayStats.push(v, GENDER_CODES.MALE[0]);
        hourlyPayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
        hourlyPayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
        hourlyPayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
      });
      const medians: CalculatedAmount[] = reportCalcServicePrivate.calculateMedianHourlyPayGaps(hourlyPayStats);

      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M)[0].value).toBe(0);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W)[0].value).toBe(1);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X)[0].value).toBe(2);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U)[0].value).toBe(3);
    })
  })
})

describe("calculateMeanOvertimePayGaps", () => {
  describe(`given a simulated list of people with gender codes and overtime pay data`, () => {
    it(`mean gender overtime pay gaps are calculated correctly`, () => {

      // For these mock hourly pay data, assume:
      // - All males earn $100/hr
      // - All females earn $99/hr
      // - All non-binary people earn $98/hr
      // - All people whose gender is unknown earn $97/hr
      // Add 10 fake people in each gender category
      const overtimePayStats = new ColumnStats();
      Array(10).fill(100).forEach(v => {
        overtimePayStats.push(v, GENDER_CODES.MALE[0]);
        overtimePayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
        overtimePayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
        overtimePayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
      });
      const means: CalculatedAmount[] = reportCalcServicePrivate.calculateMeanOvertimePayGaps(overtimePayStats);

      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_M)[0].value).toBe(0);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_W)[0].value).toBe(1);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_X)[0].value).toBe(2);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_U)[0].value).toBe(3);
    })
  })
})

describe("calculateMedianOvertimePayGaps", () => {
  describe(`given a simulated list of people with gender codes and overtime pay data`, () => {
    it(` median gender overtime pay gaps are calculated correctly`, () => {

      // For these mock overtime pay data, assume:
      // - All males earn $100/hr for overtime
      // - All females earn $99/hr for overtime
      // - All non-binary people earn $98/hr for overtime
      // - All people whose gender is unknown earn $97/hr for overtime
      // Add 10 fake people in each gender category
      const overtimePayStats = new ColumnStats();
      Array(10).fill(100).forEach(v => {
        overtimePayStats.push(v, GENDER_CODES.MALE[0]);
        overtimePayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
        overtimePayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
        overtimePayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
      });
      const medians: CalculatedAmount[] = reportCalcServicePrivate.calculateMedianOvertimePayGaps(overtimePayStats);

      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_M)[0].value).toBe(0);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_W)[0].value).toBe(1);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_X)[0].value).toBe(2);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_U)[0].value).toBe(3);
    })
  })
})

describe("calculateMeanOvertimeHoursGaps", () => {
  describe(`given a simulated list of people with gender codes and overtime hours data`, () => {
    it(`mean gender overtime hours gaps are calculated correctly`, () => {

      // For these mock overtime hours data, assume:
      // - All males work 100 OT hours
      // - All females work 99 OT hours
      // - All non-binary people work 102 OT hours
      // - All people whose gender is unknown work 97 OT hours
      // Add 10 fake people in each gender category
      const overtimeHoursStats = new ColumnStats();
      Array(10).fill(100).forEach(v => {
        overtimeHoursStats.push(v, GENDER_CODES.MALE[0]);
        overtimeHoursStats.push(v - 1, GENDER_CODES.FEMALE[0]);
        overtimeHoursStats.push(v + 2, GENDER_CODES.NON_BINARY[0]);
        overtimeHoursStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
      });
      const means: CalculatedAmount[] = reportCalcServicePrivate.calculateMeanOvertimeHoursGaps(overtimeHoursStats);

      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_M)[0].value).toBe(0);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_W)[0].value).toBe(-1);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_X)[0].value).toBe(2);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_U)[0].value).toBe(-3);
    })
  })
})

describe("calculateMedianOvertimeHoursGaps", () => {
  describe(`given a simulated list of people with gender codes and overtime hours data`, () => {
    it(` median gender overtime hours gaps are calculated correctly`, () => {

      // For these mock overtime hours data, assume:
      // - All males work 100 OT hours
      // - All females work 99 OT hours
      // - All non-binary people work 102 OT hours
      // - All people whose gender is unknown work 97 OT hours
      // Add 10 fake people in each gender category
      const overtimeHoursStats = new ColumnStats();
      Array(10).fill(100).forEach(v => {
        overtimeHoursStats.push(v, GENDER_CODES.MALE[0]);
        overtimeHoursStats.push(v - 1, GENDER_CODES.FEMALE[0]);
        overtimeHoursStats.push(v + 2, GENDER_CODES.NON_BINARY[0]);
        overtimeHoursStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
      });
      const medians: CalculatedAmount[] = reportCalcServicePrivate.calculateMedianOvertimeHoursGaps(overtimeHoursStats);

      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M)[0].value).toBe(0);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W)[0].value).toBe(-1);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X)[0].value).toBe(2);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U)[0].value).toBe(-3);
    })
  })
})


describe("calculateMeanBonusPayGaps", () => {
  describe(`given a simulated list of people with gender codes and bonus pay data`, () => {
    it(`mean gender bonus pay gaps are calculated correctly`, () => {

      // For these mock bonus pay data, assume:
      // - All males earn $1000 in annual bonus pay
      // - All females earn $990 in annual bonus pay
      // - All non-binary people earn $980 in annual bonus pay
      // - All people whose gender is unknown earn $970 in annual bonus pay
      // Add 10 fake people in each gender category
      const hourlyPayStats = new ColumnStats();
      Array(10).fill(1000).forEach(v => {
        hourlyPayStats.push(v, GENDER_CODES.MALE[0]);
        hourlyPayStats.push(v - 10, GENDER_CODES.FEMALE[0]);
        hourlyPayStats.push(v - 20, GENDER_CODES.NON_BINARY[0]);
        hourlyPayStats.push(v - 30, GENDER_CODES.UNKNOWN[0]);
      });
      const means: CalculatedAmount[] = reportCalcServicePrivate.calculateMeanBonusPayGaps(hourlyPayStats);

      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_M)[0].value).toBe(0);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_W)[0].value).toBe(1);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_X)[0].value).toBe(2);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_U)[0].value).toBe(3);
    })
  })
})

describe("calculateMedianBonusPayGaps", () => {
  describe(`given a simulated list of people with gender codes and bonus pay data`, () => {
    it(`median gender bonus pay gaps are calculated correctly`, () => {

      // For these mock bonus pay data, assume:
      // - All males earn $1000 in annual bonus pay
      // - All females earn $990 in annual bonus pay
      // - All non-binary people earn $980 in annual bonus pay
      // - All people whose gender is unknown earn $970 in annual bonus pay
      // Add 10 fake people in each gender category
      const hourlyPayStats = new ColumnStats();
      Array(10).fill(1000).forEach(v => {
        hourlyPayStats.push(v, GENDER_CODES.MALE[0]);
        hourlyPayStats.push(v - 10, GENDER_CODES.FEMALE[0]);
        hourlyPayStats.push(v - 20, GENDER_CODES.NON_BINARY[0]);
        hourlyPayStats.push(v - 30, GENDER_CODES.UNKNOWN[0]);
      });
      const medians: CalculatedAmount[] = reportCalcServicePrivate.calculateMedianBonusPayGaps(hourlyPayStats);

      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M)[0].value).toBe(0);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W)[0].value).toBe(1);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X)[0].value).toBe(2);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U)[0].value).toBe(3);
    })
  })
})

describe("calculateAll", () => {
  describe(`given a simulated list of people with gender codes and hourly pay data`, () => {
    it(`all calculations are performed`, async () => {

      // Create a mock pay transparency CSV.
      // For these mock overtime pay data, assume:
      // - All males earn $100/hr for overtime
      // - All females earn $99/hr for overtime
      // - All non-binary people earn $98/hr for overtime
      // - All people whose gender is unknown earn $97/hr for overtime
      // Add 10 fake people in each gender category
      const csvReadable = new Readable();
      csvReadable.push(`Gender Code,Hours Worked,Ordinary Pay,Special Salary,Overtime Hours,Overtime Pay,Bonus Pay\n`);
      Array(10).fill(100).forEach(v => {
        csvReadable.push(`${GENDER_CODES.MALE[0]},1,100,0,0,0,0\n`);
        csvReadable.push(`${GENDER_CODES.FEMALE[0]},1,99,0,0,0,0\n`);
        csvReadable.push(`${GENDER_CODES.NON_BINARY[0]},1,98,0,0,0,0\n`);
        csvReadable.push(`${GENDER_CODES.UNKNOWN[0]},1,97,0,0,0,0\n`);
      });
      csvReadable.push(null);
      const allCalculatedAmounts: CalculatedAmount[] = await reportCalcService.calculateAll(csvReadable);

      // Check that all the required calculations were performed (once each)
      Object.values(CALCULATION_CODES).forEach(calculationCode => {
        expect(allCalculatedAmounts.filter(d => d.calculationCode == calculationCode).length).toBe(1);
      })

      // Confirm the values of some specific calculations
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M)[0].value).toBe(0);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W)[0].value).toBe(1);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X)[0].value).toBe(2);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U)[0].value).toBe(3);

      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M)[0].value).toBe(0);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W)[0].value).toBe(1);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X)[0].value).toBe(2);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U)[0].value).toBe(3);
    })
  })
})