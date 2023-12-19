import { Readable } from 'stream';
import { CALCULATION_CODES, CalculatedAmount, ColumnStats, reportCalcService, reportCalcServicePrivate } from './report-calc-service';
import { CSV_COLUMNS, GENDER_CODES, Row } from './validate-service';
import { createSampleRow } from './validate-service.spec';

describe("ColumnStats", () => {
  // Initialize a ColumnStats object with a sample dataset that will
  // be used for most test on this class.
  let columnStats = null;
  // Add enough Non-binary for Non-binary to be the reference category 
  //and for Non-binary to be 
  const numNonBinary = Math.max(
    ColumnStats.MIN_REQUIRED_COUNT_FOR_NOT_SUPPRESSED,
    ColumnStats.MIN_REQUIRED_COUNT_FOR_REF_CATEGORY);
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

  describe("isSuppressed", () => {
    it("determines whether the gender category should be 'suppressed' (i.e. excluded from the report)", () => {
      expect(columnStats.isSuppressed(GENDER_CODES.FEMALE[0])).toBe(true);
      expect(columnStats.isSuppressed(GENDER_CODES.MALE[0])).toBe(true);
      expect(columnStats.isSuppressed(GENDER_CODES.NON_BINARY[0])).toBe(false);
      expect(columnStats.isSuppressed(GENDER_CODES.UNKNOWN[0])).toBe(true);
    })
  })
});

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
    it(`hourly rate ${CSV_COLUMNS.ORDINARY_PAY} divided by ${CSV_COLUMNS.HOURS_WORKED}`, () => {
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
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W)[0].value).toBe(0.01);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X)[0].value).toBe(0.02);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U)[0].value).toBe(0.03);
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
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W)[0].value).toBe(0.01);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X)[0].value).toBe(0.02);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U)[0].value).toBe(0.03);
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

      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OVERTIME_PAY_DIFF_M)[0].value).toBe(0);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OVERTIME_PAY_DIFF_W)[0].value).toBe(0.01);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OVERTIME_PAY_DIFF_X)[0].value).toBe(0.02);
      expect(means.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_OVERTIME_PAY_DIFF_U)[0].value).toBe(0.03);
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

      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OVERTIME_PAY_DIFF_M)[0].value).toBe(0);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OVERTIME_PAY_DIFF_W)[0].value).toBe(0.01);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OVERTIME_PAY_DIFF_X)[0].value).toBe(0.02);
      expect(medians.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_OVERTIME_PAY_DIFF_U)[0].value).toBe(0.03);
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
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W)[0].value).toBe(0.01);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X)[0].value).toBe(0.02);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U)[0].value).toBe(0.03);

      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M)[0].value).toBe(0);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W)[0].value).toBe(0.01);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X)[0].value).toBe(0.02);
      expect(allCalculatedAmounts.filter(d => d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U)[0].value).toBe(0.03);
    })
  })
})