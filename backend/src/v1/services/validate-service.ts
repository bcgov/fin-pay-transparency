import { ISubmission } from './file-upload-service';

const FIELD_DATA_CONSTRAINTS = 'Data Constraints';
const CSV_COLUMNS = {
  GENDER_CODE: 'Gender Code',
  HOURS_WORKED: 'Hours Worked',
  ORDINARY_PAY: 'Ordinary Pay',
  SPECIAL_SALARY: 'Special Salary',
  OVERTIME_HOURS: 'Overtime Hours',
  OVERTIME_PAY: 'Overtime Pay',
  BONUS_PAY: 'Bonus Pay',
};
const EXPECTED_COLUMNS: string[] = Object.values(CSV_COLUMNS);
// columns which express numbers in units of 'hours'
const HOURS_COLUMNS = [CSV_COLUMNS.HOURS_WORKED, CSV_COLUMNS.OVERTIME_HOURS];
// columns which express numbers in units of 'dollars'
const DOLLARS_COLUMNS = [
  CSV_COLUMNS.ORDINARY_PAY,
  CSV_COLUMNS.SPECIAL_SALARY,
  CSV_COLUMNS.OVERTIME_PAY,
  CSV_COLUMNS.BONUS_PAY,
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
const ZERO_SYNONYMS = [''];
const MAX_HOURS = 8760; //equal to 24 hours/day x 365 days
const MAX_DOLLARS = 999999999;
const MAX_LEN_DATA_CONSTRAINTS = 3000;

interface Row {
  record: any;
  raw: string;
}

interface FileErrors {
  generalErrors: string[];
  lineErrors: LineErrors[];
}

interface LineErrors {
  lineNum: number;
  errors: string[];
}

const validateService = {
  /*
  Validates all the properties of the submission except the "records" property.
  */
  validateBody(body: ISubmission): string[] {
    const errorMessages = [];
    if (body?.dataConstraints?.length > MAX_LEN_DATA_CONSTRAINTS) {
      errorMessages.push(
        `Text in ${FIELD_DATA_CONSTRAINTS} must not exceed ${MAX_LEN_DATA_CONSTRAINTS} characters.`,
      );
    }
    return errorMessages;
  },

  /*
  Validates the given array of employee pay records.  Checks that the
  data meet the Pay Transparency reporting requirements.
  Expects as input an array of arrays.  The first record
  is a header, which gives column names as an array.  Each subsequent 
  record represent one employee's anonymized pay information.
  For example:
  const records = [
    ['col 1 name', 'col 2 name', ...],
    ['value for col 1', 'value for col 2', ...],
    ['value for col 1', 'value for col 2', ...],
    ...
  ]
  If validation passes, returns null.
  If validation fails returns a FileErrors object
  */
  validateEmployeePayRecords(records: any[]): FileErrors | null {
    const fileErrors: FileErrors = {
      generalErrors: null,
      lineErrors: null,
    };

    // Confirm that the records array begins with a valid header record
    const validateHeaderResult = this.validateEmployeePayRecordsHeader(records);
    if (validateHeaderResult) {
      return validateHeaderResult;
    }

    // Scan each record (after the header) checking that each has valid
    // content in all columns
    const lineErrors: LineErrors[] = [];
    for (let recordNum = 1; recordNum < records.length; recordNum++) {
      //+1 because the line numbers are not zero-indexed, and
      //+1 again because the first data line is actually the second line of the file(after the header line)
      const lineNum = recordNum + 2;

      const record = records[recordNum];
      const errorsForCurrentLine: LineErrors = this.validateRow(
        lineNum,
        record,
      );
      if (errorsForCurrentLine) {
        lineErrors.push(errorsForCurrentLine);
      }
    }

    if (lineErrors?.length) {
      fileErrors.lineErrors = lineErrors;
    }

    if (fileErrors.generalErrors?.length || fileErrors.lineErrors?.length) {
      return fileErrors;
    }

    return null;
  },

  /**
   * Checks that the first element of the employee pay records array
   * contains the expected set of column names
   * @param records an array of arrays.  The first inner array represents the
   * header line, and each subsequent record represents one employee pay record
   * @returns
   */
  validateEmployeePayRecordsHeader(records: any[]): FileErrors | null {
    if (!records?.length) {
      return {
        generalErrors: [INVALID_COLUMN_ERROR],
        lineErrors: null,
      } as FileErrors;
    }
    const firstLine = records[0];
    const expectedFirstLine = Object.values(CSV_COLUMNS).join(',');
    const isHeaderValid = firstLine.join(',') == expectedFirstLine;
    if (!isHeaderValid) {
      return {
        generalErrors: [
          `Invalid header.  Expected the first line of the file to have the following format: ${expectedFirstLine}`,
        ],
        lineErrors: null,
      } as FileErrors;
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

  /*
  Scans the given record. Check that all columns have valid values.  
  Return a LineErrors object if any errors are found, or returns null 
  if no errors are found
  */
  validateRecord(recordNum: number, record: any[]): LineErrors | null {
    const errorMessages: string[] = [];

    // Validation checks common to all columns with data in units of 'hours'
    errorMessages.push(
      ...this.numberValidation(record, HOURS_COLUMNS, MAX_HOURS),
    );

    // Validation checks common to all columns with data in units of 'dollars'
    errorMessages.push(
      ...this.numberValidation(record, DOLLARS_COLUMNS, MAX_DOLLARS),
    );

    // Other column-specific validation checks
    if (ALL_VALID_GENDER_CODES.indexOf(record[CSV_COLUMNS.GENDER_CODE]) == -1) {
      errorMessages.push(
        `Invalid ${CSV_COLUMNS.GENDER_CODE} '${record[CSV_COLUMNS.GENDER_CODE]}' (expected one of: ${ALL_VALID_GENDER_CODES.join(', ')}).`,
      );
    }
    if (
      !this.isZeroSynonym(record[CSV_COLUMNS.HOURS_WORKED]) &&
      !this.isZeroSynonym(record[CSV_COLUMNS.SPECIAL_SALARY])
    ) {
      errorMessages.push(
        `${CSV_COLUMNS.HOURS_WORKED} must not contain data when ${CSV_COLUMNS.SPECIAL_SALARY} contains data.`,
      );
    }
    if (
      !this.isZeroSynonym(record[CSV_COLUMNS.ORDINARY_PAY]) &&
      !this.isZeroSynonym(record[CSV_COLUMNS.SPECIAL_SALARY])
    ) {
      errorMessages.push(
        `${CSV_COLUMNS.ORDINARY_PAY} must not contain data when ${CSV_COLUMNS.SPECIAL_SALARY} contains data.`,
      );
    }
    if (
      this.isZeroSynonym(record[CSV_COLUMNS.HOURS_WORKED]) &&
      this.isZeroSynonym(record[CSV_COLUMNS.ORDINARY_PAY]) &&
      this.isZeroSynonym(record[CSV_COLUMNS.SPECIAL_SALARY])
    ) {
      errorMessages.push(
        `${CSV_COLUMNS.SPECIAL_SALARY} must contain data when ${CSV_COLUMNS.HOURS_WORKED} and ${CSV_COLUMNS.ORDINARY_PAY} do not contain data.`,
      );
    }
    if (
      this.isZeroSynonym(record[CSV_COLUMNS.HOURS_WORKED]) &&
      !this.isZeroSynonym(record[CSV_COLUMNS.ORDINARY_PAY])
    ) {
      errorMessages.push(
        `${CSV_COLUMNS.HOURS_WORKED} must not be blank or 0 when ${CSV_COLUMNS.ORDINARY_PAY} contains data.`,
      );
    }
    if (
      this.isZeroSynonym(record[CSV_COLUMNS.ORDINARY_PAY]) &&
      !this.isZeroSynonym(record[CSV_COLUMNS.HOURS_WORKED])
    ) {
      errorMessages.push(
        `${CSV_COLUMNS.ORDINARY_PAY} must not be blank or 0 when ${CSV_COLUMNS.HOURS_WORKED} contains data.`,
      );
    }

    if (errorMessages.length) {
      const lineErrors = {
        lineNum: recordNum,
        errors: errorMessages,
      };

      return lineErrors;
    }

    return null;
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
  CSV_COLUMNS,
  FIELD_DATA_CONSTRAINTS,
  FileErrors,
  GENDER_CODES,
  LineErrors,
  MAX_LEN_DATA_CONSTRAINTS,
  NUMERIC_COLUMNS,
  Row,
  validateService,
};
