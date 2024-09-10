import { LocalDate, TemporalAdjusters, convert } from '@js-joda/core';
import { config } from '../../config';
import { JSON_REPORT_DATE_FORMAT } from '../../constants';
import {
  FIELD_DATA_CONSTRAINTS,
  GENDER_CODES,
  MAX_LEN_DATA_CONSTRAINTS,
  RowError,
  SUBMISSION_ROW_COLUMNS,
  ValidationError,
  validateService,
  validateServicePrivate,
} from './validate-service';

// ----------------------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------------------

/**
 * Creates a sample record object populated by default with valid values in all columns.
 * Include a object with key-value pairs to override any of the defaults
 */
const createSampleRecord = (override: any = {}): object => {
  const defaults = {};
  defaults[SUBMISSION_ROW_COLUMNS.GENDER_CODE] = 'F';
  defaults[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = '';
  defaults[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = '';
  defaults[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = '';
  defaults[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = '5';
  defaults[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = '100.00';
  defaults[SUBMISSION_ROW_COLUMNS.BONUS_PAY] = '';

  const record = Object.assign({}, defaults, override);

  return record;
};

/**
 * Returns true if at least one string in 'stringsToLookIn' contains
 * all the strings in 'stringsToLookFor'.  Returns false otherwise.
 * This is useful for testing whether specific keywords are mentioned
 * in upload "body" error messages
 */
const doesAnyStringContainAll = (
  stringsToLookIn: string[],
  stringsToLookFor: string[],
): boolean => {
  if (!stringsToLookIn) {
    return false;
  }
  for (
    let stringsToLookInIndex = 0;
    stringsToLookInIndex < stringsToLookIn.length;
    stringsToLookInIndex++
  ) {
    const stringToLookIn = stringsToLookIn[stringsToLookInIndex];
    let containsAll = true;
    for (
      let stringsToLookForIndex = 0;
      stringsToLookForIndex < stringsToLookFor.length;
      stringsToLookForIndex++
    ) {
      const stringToLookFor = stringsToLookFor[stringsToLookForIndex];
      const containsThis = stringToLookIn.indexOf(stringToLookFor) >= 0;
      containsAll = containsAll && containsThis;
      if (!containsThis) {
        break;
      }
    }
    if (containsAll) {
      return true;
    }
  }
  //all strings in 'stringsToLookIn' have been scanned, and none of them contains all the required
  //values
  return false;
};

/**
 * Scans all error messages in the given LineErrors object, and
 * returns True if at least one of the error messages contains
 * the given text.  Returns false otherwise.
 */
const doesAnyRowErrorContain = (rowError: RowError, text: string): boolean => {
  return doesAnyRowErrorContainAll(rowError, [text]);
};

/**
 * Scans all error messages in the given LineErrors object, and
 * returns True if at least one of the error messages contains
 * all of the given values.  Returns false otherwise
 */
const doesAnyRowErrorContainAll = (
  rowError: RowError,
  values: string[],
): boolean => {
  if (!rowError) {
    return false;
  }
  for (
    let lineIndex = 0;
    lineIndex < rowError?.errorMsgs?.length;
    lineIndex++
  ) {
    const errorMsg: string = rowError.errorMsgs[lineIndex];
    let lineContainsAll = true;
    for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
      const value = values[valueIndex];
      const lineContainsValue = errorMsg?.indexOf(value) >= 0;
      lineContainsAll = lineContainsAll && lineContainsValue;
      if (!lineContainsValue) {
        //at least one require value no found on this line, so stop analyzing this line
        break;
      }
    }
    if (lineContainsAll) {
      //the current line contains all the required values.
      return true;
    }
  }
  //all lines have been scanned, and none of them contains all the required
  //values
  return false;
};

// ----------------------------------------------------------------------------
//  Mock data
// ----------------------------------------------------------------------------

const NO_DATA_VALUES = ['', '0', '0.0', '0.00'];
const VALID_DOLLAR_AMOUNTS = [
  '999999999',
  '1919',
  '2029.20',
  '150.4',
  '',
  '0',
  '0.0',
  '0.00',
];
const INVALID_DOLLAR_AMOUNTS = [
  'N/A',
  'NA',
  '$399,929.90',
  '1373385000.50',
  '-362566.20',
  '14b',
  'a',
  '$14',
  '-2',
  '-1',
  '1000000000',
  '1000000000.01',
];
const VALID_HOUR_AMOUNTS = ['8760', '75', '100.50', '', '0', '0.0', '0.00'];
const INVALID_HOUR_AMOUNTS = [
  '1779C',
  '-1',
  '8761',
  'N/A',
  'NA',
  '14b',
  'a',
  '$14',
  '-2',
];
const VALID_GENDER_CODES = ['M', 'F', 'W', 'X', 'U'];
const INVALID_GENDER_CODES = ['H', 'N/A', ''];

const mockRecordOverrides = {};
mockRecordOverrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = '10';
mockRecordOverrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = '20';
const mockRecord = createSampleRecord(mockRecordOverrides);
const mockValidSubmission = {
  companyName: '',
  companyAddress: '',
  naicsCode: '',
  employeeCountRangeId: '',
  startDate: '2022-01-01',
  endDate: '2022-12-31',
  reportingYear: 2022,
  dataConstraints: null,
  comments: null,
  rows: [Object.keys(mockRecord), Object.values(mockRecord)],
};

// ----------------------------------------------------------------------------
// Other test init
// ----------------------------------------------------------------------------

beforeEach(() => {
  jest.useRealTimers();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------
describe('validate-service', () => {
  describe('getValidReportingYears', () => {
    describe('when current year < server:firstYearWithPrevReportingYearOption', () => {
      it('returns an array of [currentYear]', () => {
        jest.useFakeTimers();
        const firstYearWithPrevReportingYearOption = 2025;
        const currentYear = 2024;
        jest.setSystemTime(convert(LocalDate.of(currentYear, 12, 31)).toDate());
        const configSpy = jest
          .spyOn(config, 'get')
          .mockReturnValueOnce(firstYearWithPrevReportingYearOption);
        const validReportingYears = validateService.getValidReportingYears();
        expect(validReportingYears).toStrictEqual([currentYear]);
      });
    });
    describe('when current year >= server:firstYearWithPrevReportingYearOption', () => {
      it('returns an array of [previousYear, currentYear]', () => {
        jest.useFakeTimers();
        const firstYearWithPrevReportingYearOption = 2024;
        const currentYear = 2024;
        jest.setSystemTime(convert(LocalDate.of(currentYear, 12, 31)).toDate());
        const configSpy = jest
          .spyOn(config, 'get')
          .mockReturnValueOnce(firstYearWithPrevReportingYearOption);
        const validReportingYears = validateService.getValidReportingYears();
        expect(validReportingYears).toStrictEqual([
          currentYear - 1,
          currentYear,
        ]);
      });
    });
  });

  describe('cleanRow', () => {
    describe('given an array of strings', () => {
      it('removes leading and trailing whitespace for each element', () => {
        const row = [' A ', 'B ', ' C', 'D'];
        const result = validateService.cleanRow(row);
        expect(result).toStrictEqual(row.map((d) => (d ? d.trim() : '')));
      });
    });
  });

  describe('standardizeGenderCode', () => {
    it('converts the given gender code into its standardized form', () => {
      const standardized1 = validateService.standardizeGenderCode(
        GENDER_CODES.FEMALE[0],
      );
      const standardized2 = validateService.standardizeGenderCode(
        GENDER_CODES.FEMALE[GENDER_CODES.FEMALE.length - 1],
      );
      expect(standardized1).not.toBeNull();
      expect(standardized1).toBe(standardized2);
    });
  });

  describe('unstandardizeGenderCode', () => {
    it('converts the given standardized gender code into a primary (unstandardized) gender code', () => {
      const primaryGenderCode = GENDER_CODES.FEMALE[0];
      const secondaryGenderCode = GENDER_CODES.FEMALE[1];
      const standardized =
        validateService.standardizeGenderCode(secondaryGenderCode);
      const unstandardizedGenderCode =
        validateService.unstandardizeGenderCode(standardized);
      expect(unstandardizedGenderCode).toBe(primaryGenderCode);
    });
  });

  describe('isZeroSynonym', () => {
    NO_DATA_VALUES.forEach((value) => {
      describe(`given a value ('${value}') that should be treated as zero`, () => {
        it('returns true', () => {
          expect(validateService.isZeroSynonym(value)).toBeTruthy();
        });
      });
    });

    const nonZeroValues = ['999999999', '1919', '2029.20', '150.4', 'F', 'N/A'];
    nonZeroValues.forEach((value) => {
      describe(`given a value ('${value}') that should not be treated as zero`, () => {
        it('returns false', () => {
          expect(validateService.isZeroSynonym(value)).toBeFalsy();
        });
      });
    });
  });

  describe('validateSubmissionBody', () => {
    const validSubmission = {
      companyName: 'Fake Company Name',
      companyAddress: '1200 Fake St.',
      naicsCode: '11',
      employeeCountRangeId: 'enmployeeRangeCountId',
      startDate: '2022-12-01',
      endDate: '2023-11-01',
      reportingYear: 2023,
      dataConstraints: 'data constraints',
      comments: 'other comments',
      rows: [] as any[],
    };

    describe(`given data constraints that exceed the maximum length`, () => {
      it('returns an error message', () => {
        const dataConstraintsTooLong = 'a'.repeat(MAX_LEN_DATA_CONSTRAINTS + 1);
        const invalidSubmission = Object.assign({}, validSubmission, {
          dataConstraints: dataConstraintsTooLong,
        });
        const result: ValidationError | null =
          validateService.validateSubmissionBody(invalidSubmission);
        expect(
          doesAnyStringContainAll(result.bodyErrors, [
            FIELD_DATA_CONSTRAINTS,
            MAX_LEN_DATA_CONSTRAINTS + '',
          ]),
        ).toBeTruthy();
      });
    });

    describe(`given valid data constraints`, () => {
      it('returns no error messages related to data constraints', () => {
        const dataConstraintsTooLong = 'a'.repeat(MAX_LEN_DATA_CONSTRAINTS);
        const invalidSubmission = Object.assign({}, validSubmission, {
          dataConstraints: dataConstraintsTooLong,
        });
        const result: ValidationError | null =
          validateService.validateSubmissionBody(invalidSubmission);
        expect(
          doesAnyStringContainAll(result?.bodyErrors, [
            FIELD_DATA_CONSTRAINTS,
            MAX_LEN_DATA_CONSTRAINTS + '',
          ]),
        ).toBeFalsy();
      });
    });

    describe('given a startDate before minimum start date', () => {
      it('should return error', () => {
        const startDate = LocalDate.now()
          .minusYears(3)
          .format(JSON_REPORT_DATE_FORMAT);
        const errors = validateService.validateSubmissionBody({
          ...(validSubmission as any),
          startDate,
        });

        const minStartTime = LocalDate.now()
          .with(TemporalAdjusters.firstDayOfYear())
          .minusYears(2)
          .with(TemporalAdjusters.firstDayOfMonth())
          .format(JSON_REPORT_DATE_FORMAT);

        expect(errors.bodyErrors).toContain(
          `Minimum allowed start date is ${minStartTime}`,
        );
      });
    });
    describe('given an endDate is after maximum end date', () => {
      it('should return error', () => {
        const startDate = LocalDate.now()
          .minusYears(1)
          .format(JSON_REPORT_DATE_FORMAT);
        const endDate = LocalDate.now()
          .plusYears(1)
          .format(JSON_REPORT_DATE_FORMAT);
        const errors = validateService.validateSubmissionBody({
          ...(validSubmission as any),
          startDate,
          endDate,
        });

        const maxEndTime = LocalDate.now()
          .minusMonths(1)
          .with(TemporalAdjusters.lastDayOfMonth())
          .format(JSON_REPORT_DATE_FORMAT);

        expect(errors.bodyErrors).toContain(
          `Maximum allowed end date is ${maxEndTime}`,
        );
      });
    });
    describe('if the reporting year is outside the allowable range', () => {
      it('should return error', () => {
        jest
          .spyOn(validateService, 'getValidReportingYears')
          .mockReturnValueOnce([2024]);
        const reportingYear = 2023;
        const invalidSubmission = Object.assign({}, validSubmission, {
          reportingYear: reportingYear,
          startDate: `${reportingYear}-01-01`,
          endDate: `${reportingYear}-12-31`,
        });
        const errors =
          validateService.validateSubmissionBody(invalidSubmission);

        expect(
          doesAnyStringContainAll(errors.bodyErrors, [
            `Reporting year must be`,
          ]),
        ).toBeTruthy();
      });
    });
    describe('if the reporting year is within the allowable range', () => {
      it('returns no error messages related to reporting year', () => {
        jest
          .spyOn(validateService, 'getValidReportingYears')
          .mockReturnValueOnce([2023, 2024]);
        const reportingYear = 2023;
        const invalidSubmission = Object.assign({}, validSubmission, {
          reportingYear: reportingYear,
          startDate: `${reportingYear}-01-01`,
          endDate: `${reportingYear}-12-31`,
        });
        const errors =
          validateService.validateSubmissionBody(invalidSubmission);

        expect(
          doesAnyStringContainAll(errors?.bodyErrors, [
            `Reporting year must be`,
          ]),
        ).toBeFalsy();
      });
    });
  });

  describe('validateSubmissionRowsHeader', () => {
    describe(`given a valid header row`, () => {
      it('returns null', () => {
        const result: string | null =
          validateService.validateSubmissionRowsHeader(
            mockValidSubmission.rows[0],
          );
        expect(result).toBeNull();
      });
    });
    describe(`given a header row that has extra whitespace before and after column names, but is otherwise valid`, () => {
      it('returns null', () => {
        const headerWithExtraWhitespace = mockValidSubmission.rows[0].map(
          (d) => ` ${d} `,
        );
        headerWithExtraWhitespace;
        const result: string | null =
          validateService.validateSubmissionRowsHeader(
            headerWithExtraWhitespace,
          );
        expect(result).toBeNull();
      });
    });
    describe(`given a null header row`, () => {
      it('returns an error object', () => {
        const result: string | null =
          validateService.validateSubmissionRowsHeader(null);
        expect(result).not.toBeNull();
      });
    });
    describe(`given an invalid header row`, () => {
      it('returns an error object', () => {
        const result: string | null =
          validateService.validateSubmissionRowsHeader(['col1', 'col2']);
        expect(result).not.toBeNull();
      });
    });
  });

  describe('validateRecord', () => {
    describe(`given an record that is fully valid`, () => {
      it('returns null', () => {
        const overrides = {};
        //Valid records must either have values for both (Hours Worked and )
        //or a value for Special Salary.
        overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = 10;
        overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = 20;
        const validRecord = createSampleRecord(overrides);

        const recordNum = 1;
        const result: RowError | null = validateService.validateRecord(
          recordNum,
          validRecord,
        );
        expect(result).toBeNull();
      });
    });

    describe(`given a valid record with 0.00 in one of the columns`, () => {
      it('the 0.00 is interpreted the same as 0', () => {
        const overrides = {};
        //Valid records must either have values for both (Hours Worked and Ordinary Pay)
        //or a value for Special Salary.
        overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = 10;
        overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = 20;
        overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = '0.00';
        const validRecord = createSampleRecord(overrides);

        const recordNum = 1;
        const result: RowError | null = validateService.validateRecord(
          recordNum,
          validRecord,
        );
        expect(result).toBeNull();
      });
    });

    describe(`given an record that specifies both ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} and ${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY}`, () => {
      it('returns a RowError', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = VALID_HOUR_AMOUNTS[0];
        overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] =
          VALID_DOLLAR_AMOUNTS[0];
        const invalidRecord = createSampleRecord(overrides);

        const recordNum = 1;
        const result: RowError | null = validateService.validateRecord(
          recordNum,
          invalidRecord,
        );

        //expect one line error that mentions both SUBMISSION_ROW_COLUMNS.HOURS_WORKED and SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY
        expect(result).not.toBeNull();
        expect(
          doesAnyRowErrorContainAll(result, [
            SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
            SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY,
          ]),
        ).toBeTruthy();
      });
    });

    describe(`given an record that specifies ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} but not ${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY}`, () => {
      it('returns a RowError', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = 20;
        overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = NO_DATA_VALUES[0];
        overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = NO_DATA_VALUES[0];
        const invalidRecord = createSampleRecord(overrides);

        const recordNum = 1;
        const result: RowError | null = validateService.validateRecord(
          recordNum,
          invalidRecord,
        );

        //expect one line error that mentions both SUBMISSION_ROW_COLUMNS.HOURS_WORKED and SUBMISSION_ROW_COLUMNS.ORDINARY_PAY
        expect(
          doesAnyRowErrorContainAll(result, [
            SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
            SUBMISSION_ROW_COLUMNS.ORDINARY_PAY,
          ]),
        ).toBeTruthy();
      });
    });

    describe(`given an record that specifies ${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} but not ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED}`, () => {
      it('returns a RowError', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = NO_DATA_VALUES[0];
        overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = 35;
        overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = NO_DATA_VALUES[0];
        const invalidRecord = createSampleRecord(overrides);

        const recordNum = 1;
        const result: RowError | null = validateService.validateRecord(
          recordNum,
          invalidRecord,
        );

        //expect one line error that mentions both SUBMISSION_ROW_COLUMNS.HOURS_WORKED and SUBMISSION_ROW_COLUMNS.ORDINARY_PAY
        expect(
          doesAnyRowErrorContainAll(result, [
            SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
            SUBMISSION_ROW_COLUMNS.ORDINARY_PAY,
          ]),
        ).toBeTruthy();
      });
    });

    describe(`given a record that specifies no data in any of the following columns: ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED}, ${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} and ${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY}`, () => {
      it('returns a RowError', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = NO_DATA_VALUES[0];
        overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = NO_DATA_VALUES[0];
        overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = NO_DATA_VALUES[0];
        const invalidRecord = createSampleRecord(overrides);

        const recordNum = 1;
        const result: RowError | null = validateService.validateRecord(
          recordNum,
          invalidRecord,
        );

        //expect one line error that mentions SUBMISSION_ROW_COLUMNS.HOURS_WORKED, SUBMISSION_ROW_COLUMNS.ORDINARY_PAY and SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY
        expect(result).not.toBeNull();
        expect(result?.errorMsgs?.length).toBe(1);
        expect(
          doesAnyRowErrorContainAll(result, [
            SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
            SUBMISSION_ROW_COLUMNS.ORDINARY_PAY,
            SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY,
          ]),
        ).toBeTruthy();
      });
    });

    describe(`given a record with invalid '${SUBMISSION_ROW_COLUMNS.GENDER_CODE}'`, () => {
      //Check that validation fails for each of several different
      //invalid gender codes
      INVALID_GENDER_CODES.forEach((genderCode) => {
        describe(`${SUBMISSION_ROW_COLUMNS.GENDER_CODE} = ${genderCode}`, () => {
          it('returns a RowError', () => {
            // Create a sample row that is valid except for the value of the
            // Gender Code
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.GENDER_CODE] = genderCode;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(result).not.toBeNull();
            expect(result.rowNum).toBe(recordNum);
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.GENDER_CODE,
              ),
            ).toBeTruthy();
          });
        });
      });
    });

    describe(`given a record with valid '${SUBMISSION_ROW_COLUMNS.GENDER_CODE}'`, () => {
      // Check that validation passes for each given gender code
      VALID_GENDER_CODES.forEach((genderCode) => {
        describe(`${SUBMISSION_ROW_COLUMNS.GENDER_CODE} = ${genderCode}`, () => {
          it('returns no errors for this column', () => {
            // Create a sample row and uses a specific Gender Code value
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.GENDER_CODE] = genderCode;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.GENDER_CODE,
              ),
            ).toBeFalsy();
          });
        });
      });
    });

    describe("given a record with invalid '${SUBMISSION_ROW_COLUMNS.HOURS_WORKED}'", () => {
      const invalidHoursWorked = INVALID_HOUR_AMOUNTS;

      //Check that validation fails for each of several different
      //invalid values for SUBMISSION_ROW_COLUMNS.HOURS_WORKED
      invalidHoursWorked.forEach((hoursWorked) => {
        describe(`${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} = ${hoursWorked}`, () => {
          it('returns a RowError', () => {
            // Create a sample row that is valid except for the value of the
            // Hours worked
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = hoursWorked;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(result).not.toBeNull();
            expect(result.rowNum).toBe(recordNum);
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
              ),
            ).toBeTruthy();
          });
        });
      });
    });

    describe(`given a record with valid '${SUBMISSION_ROW_COLUMNS.HOURS_WORKED}'`, () => {
      const validHoursWorked = VALID_HOUR_AMOUNTS;

      // Check that validation passes for each given value of Hours Worked
      validHoursWorked.forEach((hoursWorked) => {
        describe(`${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} = ${hoursWorked}`, () => {
          it('returns no errors for this column', () => {
            // Create a sample row and uses a specific Hours Worked value
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = hoursWorked;

            //Hours Worked is semi-optional (it, along with Ordinary Pay, are mutually
            //exclusive with Special Salary).  Make sure the related columns have
            //appropriate values for the record to be fully valid.
            if (!validateService.isZeroSynonym(hoursWorked)) {
              overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = 10;
              overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] =
                NO_DATA_VALUES[0];
            } else {
              overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] =
                NO_DATA_VALUES[0];
              overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = 100;
            }
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );

            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
              ),
            ).toBeFalsy();
          });
        });
      });
    });

    describe(`given a record with invalid '${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY}'`, () => {
      const invalidOrdinaryPay = INVALID_DOLLAR_AMOUNTS;

      //Check that validation fails for each of several different
      //invalid values for 'Ordinary Pay'
      invalidOrdinaryPay.forEach((ordinaryPay) => {
        describe(`${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} = ${ordinaryPay}`, () => {
          it('returns a RowError', () => {
            // Create a sample row that is valid except for the value of the
            // Ordinary Pay
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = ordinaryPay;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(result).not.toBeNull();
            expect(result.rowNum).toBe(recordNum);
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.ORDINARY_PAY,
              ),
            ).toBeTruthy();
          });
        });
      });
    });

    describe(`given a record with valid '${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY}'`, () => {
      const validOrdinaryPay = VALID_DOLLAR_AMOUNTS;

      // Check that validation passes for each given value of Ordinary Pay
      validOrdinaryPay.forEach((ordinaryPay) => {
        describe(`${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} = '${ordinaryPay}'`, () => {
          it('returns no errors for this column', () => {
            // Create a sample row and uses a specific Ordinary Pay value
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = ordinaryPay;

            //Ordinary Pay is semi-optional (it, along with Hours Worked, are mutually
            //exclusive with Special Salary).  Make sure the related columns have
            //appropriate values for the record to be fully valid.
            if (!validateService.isZeroSynonym(ordinaryPay)) {
              overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = 10;
              overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] =
                NO_DATA_VALUES[0];
            } else {
              overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] =
                NO_DATA_VALUES[0];
              overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = 100;
            }
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );

            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.ORDINARY_PAY,
              ),
            ).toBeFalsy();
          });
        });
      });
    });

    describe(`given a record with invalid '${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY}'`, () => {
      const invalidSpecialSalary = INVALID_DOLLAR_AMOUNTS;

      //Check that validation fails for each of several different
      //invalid values for SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY
      invalidSpecialSalary.forEach((specialSalary) => {
        describe(`${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY} = ${specialSalary}`, () => {
          it('returns a RowError', () => {
            // Create a sample row that is valid except for the value of the
            // Special Salary
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = specialSalary;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(result).not.toBeNull();
            expect(result.rowNum).toBe(recordNum);
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY,
              ),
            ).toBeTruthy();
          });
        });
      });
    });

    describe(`given a record with valid '${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY}'`, () => {
      const validSpecialSalary = VALID_DOLLAR_AMOUNTS;

      // Check that validation passes for each given value of Special Salary
      validSpecialSalary.forEach((specialSalary) => {
        describe(`${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY} = '${specialSalary}'`, () => {
          it('returns no errors for this column', () => {
            // Create a sample row and uses a specific Special Salary value
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = specialSalary;

            //Special Salary is semi-optional (mutually exclusive with Hours Worked and
            //Ordinary Pay).  If a blank value for Special Salary is given, be sure
            //to include non-blank values for the mutually exclusive cols.
            if (validateService.isZeroSynonym(specialSalary)) {
              overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = 10;
              overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = 20;
            } else {
              overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] =
                NO_DATA_VALUES[0];
              overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] =
                NO_DATA_VALUES[0];
            }
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY,
              ),
            ).toBeFalsy();
          });
        });
      });
    });

    describe(`given a record with invalid '${SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS}'`, () => {
      const invalidOvertimeHours = INVALID_HOUR_AMOUNTS;

      //Check that validation fails for each of several different
      //invalid values for SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS
      invalidOvertimeHours.forEach((overtimeHours) => {
        describe(`${SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS} = ${overtimeHours}`, () => {
          it('returns a RowEerror', () => {
            // Create a sample row that is valid except for the value of the
            // Overtime Hours
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = overtimeHours;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(result).not.toBeNull();
            expect(result.rowNum).toBe(recordNum);
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS,
              ),
            ).toBeTruthy();
          });
        });
      });
    });

    describe(`given a record with valid '${SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS}'`, () => {
      const validOvertimeHours = VALID_HOUR_AMOUNTS;

      // Check that validation passes for each given value of Overtime Hours
      validOvertimeHours.forEach((overtimeHours) => {
        describe(`${SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS} = ${overtimeHours}`, () => {
          it('returns no errors for this column', () => {
            // Create a sample row and uses a specific Overtime Hours value
            const overrides = {};
            const overtimePay = validateService.isZeroSynonym(overtimeHours)
              ? 0
              : 10;
            overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = overtimeHours;
            overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = overtimePay;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS,
              ),
            ).toBeFalsy();
          });
        });
      });
    });

    describe(`given a record with invalid '${SUBMISSION_ROW_COLUMNS.OVERTIME_PAY}'`, () => {
      const invalidOvertimePay = INVALID_DOLLAR_AMOUNTS;

      //Check that validation fails for each of several different
      //invalid values for SUBMISSION_ROW_COLUMNS.OVERTIME_PAY
      invalidOvertimePay.forEach((overtimePay) => {
        describe(`${SUBMISSION_ROW_COLUMNS.OVERTIME_PAY} = ${overtimePay}`, () => {
          it('returns a RowError', () => {
            // Create a sample row that is valid except for the value of the
            // Overtime Pay
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = overtimePay;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(result).not.toBeNull();
            expect(result.rowNum).toBe(recordNum);
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.OVERTIME_PAY,
              ),
            ).toBeTruthy();
          });
        });
      });
    });

    describe(`given a record with valid '${SUBMISSION_ROW_COLUMNS.OVERTIME_PAY}'`, () => {
      const validOvertimePay = VALID_DOLLAR_AMOUNTS;

      // Check that validation passes for each given value of Overtime Pay
      validOvertimePay.forEach((overtimePay) => {
        describe(`${SUBMISSION_ROW_COLUMNS.OVERTIME_PAY} = ${overtimePay}`, () => {
          it('returns no errors for this column', () => {
            // Create a sample row and uses a specific Overtime Pay value
            const overrides = {};
            const overtimeHours = validateService.isZeroSynonym(overtimePay)
              ? 0
              : 10;
            overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = overtimePay;
            overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = overtimeHours;

            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(
              doesAnyRowErrorContain(
                result,
                SUBMISSION_ROW_COLUMNS.OVERTIME_PAY,
              ),
            ).toBeFalsy();
          });
        });
      });
    });

    describe(`given an row with invalid '${SUBMISSION_ROW_COLUMNS.BONUS_PAY}'`, () => {
      const invalidBonusPay = [
        'NA',
        '3,000',
        '$7,000',
        '$7000',
        '-1',
        '1000000000',
      ];
      invalidBonusPay.forEach((bonusPay) => {
        describe(`${SUBMISSION_ROW_COLUMNS.BONUS_PAY} = ${bonusPay}`, () => {
          it('returns a RowError', () => {
            // Create a sample row that is valid except for the value of the
            // Bonus Pay
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.BONUS_PAY] = bonusPay;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(result).not.toBeNull();
            expect(result.rowNum).toBe(recordNum);
            expect(
              doesAnyRowErrorContain(result, SUBMISSION_ROW_COLUMNS.BONUS_PAY),
            ).toBeTruthy();
          });
        });
      });
    });

    describe(`given a row with valid '${SUBMISSION_ROW_COLUMNS.BONUS_PAY}'`, () => {
      const validBonusPay = VALID_DOLLAR_AMOUNTS;

      // Check that validation passes for each given value of Overtime Pay
      validBonusPay.forEach((bonusPay) => {
        describe(`${SUBMISSION_ROW_COLUMNS.BONUS_PAY} = ${bonusPay}`, () => {
          it('returns no errors for this column', () => {
            // Create a sample row and uses a specific Overtime Pay value
            const overrides = {};
            overrides[SUBMISSION_ROW_COLUMNS.BONUS_PAY] = bonusPay;
            const record = createSampleRecord(overrides);

            const recordNum = 1;
            const result: RowError | null = validateService.validateRecord(
              recordNum,
              record,
            );
            expect(
              doesAnyRowErrorContain(result, SUBMISSION_ROW_COLUMNS.BONUS_PAY),
            ).toBeFalsy();
          });
        });
      });
    });
  });
});

describe('validate-service-private', () => {
  describe('validateOvertimePayAndHours', () => {
    describe("if Overtime Pay is specified, but Overtime Hours isn't", () => {
      it('returns an error', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = 10;
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = 0;
        const record = createSampleRecord(overrides);

        const rowError = new RowError(
          1,
          validateServicePrivate.validateOvertimePayAndHours(record),
        );
        expect(
          doesAnyRowErrorContain(rowError, SUBMISSION_ROW_COLUMNS.OVERTIME_PAY),
        ).toBeTruthy();
      });
    });
    describe("if Overtime Hours is specified, but Overtime Pay isn't", () => {
      it('returns an error', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = 0;
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = 10;
        const record = createSampleRecord(overrides);

        const rowError = new RowError(
          1,
          validateServicePrivate.validateOvertimePayAndHours(record),
        );
        expect(
          doesAnyRowErrorContain(rowError, SUBMISSION_ROW_COLUMNS.OVERTIME_PAY),
        ).toBeTruthy();
      });
    });
    describe('if both Overtime Hours and Overtime Pay are non-zero', () => {
      it('returns no errors', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = 20;
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = 10;
        const record = createSampleRecord(overrides);

        const rowError = new RowError(
          1,
          validateServicePrivate.validateOvertimePayAndHours(record),
        );
        expect(
          doesAnyRowErrorContain(rowError, SUBMISSION_ROW_COLUMNS.OVERTIME_PAY),
        ).toBeFalsy();
      });
    });
    describe('if neither Overtime Hours nor Overtime Pay are specified', () => {
      it('returns no errors', () => {
        const overrides = {};
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY] = 0;
        overrides[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS] = 0;
        const record = createSampleRecord(overrides);

        const rowError = new RowError(
          1,
          validateServicePrivate.validateOvertimePayAndHours(record),
        );
        expect(
          doesAnyRowErrorContain(rowError, SUBMISSION_ROW_COLUMNS.OVERTIME_PAY),
        ).toBeFalsy();
      });
    });
  });
});

export { createSampleRecord };
