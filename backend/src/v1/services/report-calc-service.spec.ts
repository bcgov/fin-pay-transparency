import { ColumnStats, reportCalcServicePrivate } from './report-calc-service';
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