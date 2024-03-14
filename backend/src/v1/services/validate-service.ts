import { ISubmission } from './file-upload-service';

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

interface IValidationError {
  bodyErrors: string[] | null;
  rowErrors: RowError[] | null;
  generalErrors: string[] | null;
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
  /*
  Validates all the properties of the submission except the "records" property.  
  Returns an array of error messages, (or an empty array if no errors were found.)
  */
  validateSubmissionBody(submission: ISubmission): IValidationError | null {
    const bodyErrors = [];
    if (submission?.dataConstraints?.length > MAX_LEN_DATA_CONSTRAINTS) {
      bodyErrors.push(
        `Text in ${FIELD_DATA_CONSTRAINTS} must not exceed ${MAX_LEN_DATA_CONSTRAINTS} characters.`,
      );
    }
    if (bodyErrors?.length) {
      return {
        bodyErrors: bodyErrors,
        rowErrors: null,
        generalErrors: null,
      } as IValidationError;
    }
    return null;
  },

  /**
   * Performs validation checks on the submission body and on the
   * first row in the "rows" property (i.e. the header row).
   * @param submission
   * @returns an array of error messages (as string) if any errors are found, or
   * null if no errors are found
   */
  validateSubmissionBodyAndHeader(
    submission: ISubmission,
  ): IValidationError | null {
    const bodyValidationError =
      validateService.validateSubmissionBody(submission);

    const header = submission?.rows?.length ? submission.rows[0] : [];
    const headerValidationError =
      validateService.validateSubmissionRowsHeader(header);

    //combine all validation errors into one object
    if (bodyValidationError || headerValidationError) {
      return {
        bodyErrors: bodyValidationError?.bodyErrors,
        rowErrors: null,
        generalErrors: headerValidationError ? [headerValidationError] : null,
      } as IValidationError;
    }
    return null;
  },

  /**
   * Checks that the header row is of the expected format
   * @param records an array of arrays.  The first inner array represents the
   * header line, and each subsequent record represents one employee pay record
   * @returns
   */
  validateSubmissionRowsHeader(header: string[]): string | null {
    if (!header?.length) {
      return INVALID_COLUMN_ERROR;
    }
    const expectedFirstLine = Object.values(SUBMISSION_ROW_COLUMNS).join(',');
    const isHeaderValid = header.join(',') == expectedFirstLine;
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

  /*Checks if the given object conforms to the IValidationError interface
   */
  isIValidationError(err: any) {
    return (
      err?.hasOwnProperty('bodyErrors') &&
      err?.hasOwnProperty('rowErrors') &&
      err?.hasOwnProperty('generalErrors')
    );
  },

  /*
  Scans the given record. Check that all columns have valid values.  
  Return a RowError object if any errors are found, or returns null 
  if no errors are found
  */
  validateRecord(recordNum: number, record: object): RowError | null {
    const errorMessages: string[] = [];

    const genderCode = this.columnFromRecord(
      record,
      SUBMISSION_ROW_COLUMNS.GENDER_CODE,
    );
    const hoursWorked = this.columnFromRecord(
      record,
      SUBMISSION_ROW_COLUMNS.HOURS_WORKED,
    );
    const specialSalary = this.columnFromRecord(
      record,
      SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY,
    );
    const ordinaryPay = this.columnFromRecord(
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

  columnFromRecord(record, columnName) {
    return record.hasOwnProperty(columnName) ? record[columnName] : null;
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
  IValidationError,
  MAX_LEN_DATA_CONSTRAINTS,
  NUMERIC_COLUMNS,
  Row,
  RowError,
  SUBMISSION_ROW_COLUMNS,
  validateService,
};
