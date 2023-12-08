import { reportCalcServicePrivate } from './report-calc-service';
import { CSV_COLUMNS, Row } from './validate-service';
import { createSampleRow } from './validate-service.spec';

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