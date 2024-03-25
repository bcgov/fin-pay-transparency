import { LocalDate, TemporalAdjusters } from '@js-joda/core';
import { ISubmission } from './file-upload-service';
import { JSON_REPORT_DATE_FORMAT } from './report-service';

const FIELD_DATA_CONSTRAINTS = 'Data Constraints';
const SUBMISSION_ROW_COLUMNS = {
  GENDER_CODE: 'Gender Code',
  HOURS_WORKED: 'Hours Worked',
  ORDINARY_PAY: 'Ordinary Pay',
  SPECIAL_SALARY: 'Special Salary',
  OVERTIME_HOURS: 'Overtime Hours',
  OVERTIME_PAY: 'Overtime Pay',
  BONUS_PAY: 'Bonus Pay',
};
const EXPECTED_COLUMNS: string[] = Object.values(SUBMISSION_ROW_COLUMNS);
// columns which express numbers in units of 'hours'
const HOURS_COLUMNS = [
  SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
  SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS,
];
// columns which express numbers in units of 'dollars'
const DOLLARS_COLUMNS = [
  SUBMISSION_ROW_COLUMNS.ORDINARY_PAY,
  SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY,
  SUBMISSION_ROW_COLUMNS.OVERTIME_PAY,
  SUBMISSION_ROW_COLUMNS.BONUS_PAY,
];
const NUMERIC_COLUMNS = [...HOURS_COLUMNS, ...DOLLARS_COLUMNS];
const INVALID_COLUMN_ERROR = `Invalid CSV format. Please ensure the uploaded file contains the following columns: ${EXPECTED_COLUMNS.join(', ')}`;
const GENDER_CODES = {
  MALE: ['M'],
  FEMALE: ['W', 'F'],
  NON_BINARY: ['X'],
  UNKNOWN: ['U'],
};
const ALL_VALID_GENDER_CODES = [
  ...GENDER_CODES.MALE,
  ...GENDER_CODES.FEMALE,
  ...GENDER_CODES.NON_BINARY,
  ...GENDER_CODES.UNKNOWN,
];
const ZERO_SYNONYMS = ['', null];
const MAX_HOURS = 8760; //equal to 24 hours/day x 365 days
const MAX_DOLLARS = 999999999;
const MAX_LEN_DATA_CONSTRAINTS = 3000;

interface Row {
  record: any;
  raw: string;
}

class ValidationError {
  bodyErrors: string[] | null;
  rowErrors: RowError[] | null;
  generalErrors: string[] | null;
  constructor(bodyErrors, rowErrors, generalErrors) {
    this.bodyErrors = bodyErrors;
    this.rowErrors = rowErrors;
    this.generalErrors = generalErrors;
  }
}

class RowError {
  rowNum: number;
  errorMsgs: string[];
  constructor(rowNum: number, errorMsgs: string[]) {
    this.rowNum = rowNum;
    this.errorMsgs = errorMsgs;
  }
}

const validateService = {
  /**
   * Validates all the properties of the submission except the "rows" property.
   * If any validation problems were found, returns an ValidationError object.
   * If no problems were found, returns null.
   * @param submission
   * @returns If any validation problems were found, returns an ValidationError object.
   * If no problems were found, returns null.*
   */
  validateSubmissionBody(submission: ISubmission): ValidationError | null {
    const bodyErrors = [];
    const minStartTime = LocalDate.now()
      .with(TemporalAdjusters.firstDayOfYear())
      .minusYears(2)
      .with(TemporalAdjusters.firstDayOfMonth());
    if (minStartTime.isAfter(LocalDate.parse(submission.startDate))) {
      bodyErrors.push(
        `Minimum allowed start date is ${minStartTime.format(JSON_REPORT_DATE_FORMAT)}`,
      );
    }

    const maxEndTime = LocalDate.now()
      .minusMonths(1)
      .with(TemporalAdjusters.lastDayOfMonth());
    if (maxEndTime.isBefore(LocalDate.parse(submission.endDate))) {
      bodyErrors.push(
        `Maximum allowed end date is ${maxEndTime.format(JSON_REPORT_DATE_FORMAT)}`,
      );
    }

    if (
      LocalDate.parse(submission.endDate)
        .minusYears(1)
        .isBefore(LocalDate.parse(submission.startDate))
    ) {
      bodyErrors.push(
        `Start date and end date must always be 12 months apart.`,
      );
    }

    if (submission?.dataConstraints?.length > MAX_LEN_DATA_CONSTRAINTS) {
      bodyErrors.push(
        `Text in ${FIELD_DATA_CONSTRAINTS} must not exceed ${MAX_LEN_DATA_CONSTRAINTS} characters.`,
      );
    }
    if (bodyErrors?.length) {
      return new ValidationError(bodyErrors, null, null);
    }
    return null;
  },

  /**
   * A convenience function that performs the work of both
   * validateSubmissionBody(..) and validateSubmissionRowsHeader(..).
   * Performs validation checks on the submission body and on the
   * first row in the "rows" property (i.e. the header row).  All other rows
   * in the "rows" property aren't checked.
   * @param submission
   * @returns If any validation problems were found, returns an ValidationError object.
   * If no problems were found, returns null.
   */
  validateSubmissionBodyAndHeader(
    submission: ISubmission,
  ): ValidationError | null {
    const bodyValidationError =
      validateService.validateSubmissionBody(submission);

    const header = submission?.rows?.length ? submission.rows[0] : [];
    const headerValidationError =
      validateService.validateSubmissionRowsHeader(header);

    //combine all validation errors into one object
    if (bodyValidationError || headerValidationError) {
      return new ValidationError(
        bodyValidationError?.bodyErrors,
        null, //row errors
        headerValidationError ? [headerValidationError] : null, //general errors
      );
    }
    return null;
  },

  /**
   * Checks that the header row is of the expected format
   * @param headerRow an array containing the "column" names that correspond
   * to all subsequent rows (after the header) in the submission.
   * @returns
   */
  validateSubmissionRowsHeader(headerRow: string[]): string | null {
    if (!headerRow?.length) {
      return INVALID_COLUMN_ERROR;
    }
    const expectedFirstLine = Object.values(SUBMISSION_ROW_COLUMNS).join(',');
    const isHeaderValid =
      this.cleanRow(headerRow).join(',') == expectedFirstLine;
    if (!isHeaderValid) {
      return `Invalid header.  Expected the first line of the file to have the following format: ${expectedFirstLine}`;
    }
    return null;
  },

  /**
   * Helper function for validateRow() to decrease complexity
   * @param record - the record to inspect
   * @param columns - the columns in the record to inspect
   * @param max - the max allowed value
   * @returns
   */
  numberValidation(record, columns: string[], max: number): string[] {
    const errorMessages: string[] = [];

    columns.forEach((colName) => {
      const value = record[colName];
      if (!this.isZeroSynonym(value) && !this.isValidNumber(value)) {
        errorMessages.push(`Invalid number '${value}' in ${colName}.`);
      }
      // Range check.  Only do this check if the above check passes
      else if (value < 0 || value > max) {
        errorMessages.push(
          `${colName} must specify a positive number no larger than ${max}. Found '${value}'.`,
        );
      }
    });

    return errorMessages;
  },

  /**
   * Scans the given record. Check that all columns have valid values.
   * Return a RowError if any errors are found, or returns null
   * if no errors are found.
   * @record an object form of a row from ISubmission.rows.  The object form
   * can be derived using reportCalcService.arrayToObject(row, header).
   */
  validateRecord(recordNum: number, record: object): RowError | null {
    const errorMessages: string[] = [];

    const genderCode = this.getObjectProperty(
      record,
      SUBMISSION_ROW_COLUMNS.GENDER_CODE,
    );
    const hoursWorked = this.getObjectProperty(
      record,
      SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
    );
    const specialSalary = this.getObjectProperty(
      record,
      SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY,
    );
    const ordinaryPay = this.getObjectProperty(
      record,
      SUBMISSION_ROW_COLUMNS.ORDINARY_PAY,
    );

    // Validation checks common to all columns with data in units of 'hours'
    errorMessages.push(
      ...this.numberValidation(record, HOURS_COLUMNS, MAX_HOURS),
    );

    // Validation checks common to all columns with data in units of 'dollars'
    errorMessages.push(
      ...this.numberValidation(record, DOLLARS_COLUMNS, MAX_DOLLARS),
    );

    // Other column-specific validation checks
    if (ALL_VALID_GENDER_CODES.indexOf(genderCode) == -1) {
      errorMessages.push(
        `Invalid ${SUBMISSION_ROW_COLUMNS.GENDER_CODE} '${genderCode}' (expected one of: ${ALL_VALID_GENDER_CODES.join(', ')}).`,
      );
    }
    if (
      !this.isZeroSynonym(hoursWorked) &&
      !this.isZeroSynonym(specialSalary)
    ) {
      errorMessages.push(
        `${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} must not contain data when ${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY} contains data.`,
      );
    }
    if (
      !this.isZeroSynonym(ordinaryPay) &&
      !this.isZeroSynonym(specialSalary)
    ) {
      errorMessages.push(
        `${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} must not contain data when ${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY} contains data.`,
      );
    }
    if (
      this.isZeroSynonym(hoursWorked) &&
      this.isZeroSynonym(ordinaryPay) &&
      this.isZeroSynonym(specialSalary)
    ) {
      errorMessages.push(
        `${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY} must contain data when ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} and ${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} do not contain data.`,
      );
    }
    if (this.isZeroSynonym(hoursWorked) && !this.isZeroSynonym(ordinaryPay)) {
      errorMessages.push(
        `${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} must not be blank or 0 when ${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} contains data.`,
      );
    }
    if (this.isZeroSynonym(ordinaryPay) && !this.isZeroSynonym(hoursWorked)) {
      errorMessages.push(
        `${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} must not be blank or 0 when ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} contains data.`,
      );
    }

    if (errorMessages.length) {
      const rowError = new RowError(recordNum, errorMessages);
      return rowError;
    }

    return null;
  },

  /**
   * A helper function to get a property with a given name from an object,
   * and to guard against null values
   * @param obj any object
   * @param columnName a property name from the object
   * @returns the value of the property with the given name. returns null
   * if the property doesn't exist, or if the object itself is null.
   */
  getObjectProperty(obj, propertyName) {
    return obj?.hasOwnProperty(propertyName) ? obj[propertyName] : null;
  },

  /**
   * Removes leading and trailing whitespace from each element in the array
   */
  cleanRow(row: any[]) {
    if (row?.length) {
      return row.map((d) => (typeof d == 'string' ? d.trim() : ''));
    }
    return row;
  },

  /*
  For any gender that can be represented by multiple codes, converts 
  any of the possible options into a common standard format.
  e.g. the Female gender category can be represented by either "F" or 
  "W".  If either of these values is passed into standardizeGenderCode(..)
  the output will be a common value such as "F_W".
  */
  standardizeGenderCode(genderCode: string) {
    let standardizedGenderCode = null;
    for (let key of Object.keys(GENDER_CODES)) {
      const genderCodeSynonyms = GENDER_CODES[key];
      if (genderCodeSynonyms.indexOf(genderCode) >= 0) {
        //the standardized form is a list of all synonym codes separated by underscores.
        standardizedGenderCode = genderCodeSynonyms.join('_');
        //break out of the loop
        break;
      }
    }
    if (!standardizedGenderCode) {
      throw new Error(`Unknown gender code '${genderCode}'`);
    }
    return standardizedGenderCode;
  },

  /*
  Returns true if the given value is one of the accepted synonyms meaning
  zero, otherwise returns false.
  */
  isZeroSynonym(val: any): boolean {
    //Check if the value can be parsed as number, and if it can,
    //check if that number is equal to zero.
    try {
      const num = parseFloat(val);
      if (num == 0) {
        return true;
      }
    } catch (e) {
      //ignore the error
    }

    //If the value wasn't strictly a numeric zero, check whether
    //there it is equal to any of the allowable synonyms for zero.
    if (typeof val == 'string') {
      val = val.toUpperCase();
    }
    return ZERO_SYNONYMS.indexOf(val) >= 0;
  },

  isValidNumber(val: any): boolean {
    if (val === null || isNaN(val)) {
      return false;
    }

    // Check that the value is either a number or a string that parses
    // to a number. Integer and float are both allowed.
    try {
      parseFloat(val);
    } catch (e) {
      console.log(e);
      return false;
    }

    return true;
  },
};

export {
  EXPECTED_COLUMNS,
  FIELD_DATA_CONSTRAINTS,
  GENDER_CODES,
  MAX_LEN_DATA_CONSTRAINTS,
  NUMERIC_COLUMNS,
  Row,
  RowError,
  SUBMISSION_ROW_COLUMNS,
  ValidationError,
  validateService,
};
