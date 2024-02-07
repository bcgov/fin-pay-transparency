import { parse } from 'csv-parse/sync';
import { logger as log } from '../../logger';

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
  Validates the content of the submission body, which includes all form fields, 
  but excludes the uploaded CSV file.  Returns a list of any validation error messages, 
  or an empty list if no errors.
  */
  validateBody(body: any): string[] {
    const errorMessages = [];
    if (body?.dataConstraints?.length > MAX_LEN_DATA_CONSTRAINTS) {
      errorMessages.push(
        `Text in ${FIELD_DATA_CONSTRAINTS} must not exceed ${MAX_LEN_DATA_CONSTRAINTS} characters.`,
      );
    }
    return errorMessages;
  },

  /*
  Validates all fields in the submission, including the form fields and the
  uploaded file.  Returns an array of error messages if any errors
  are found, or returns an empty array if no errors are found (if the 
  submission is valid)
  */
  validateCsv(csvContent: string): FileErrors {
    const fileErrors: FileErrors = {
      generalErrors: null,
      lineErrors: null,
    };

    // Parse the CSV content and check that the column names as
    // expected (and in the expected order)
    let rows: Row[] = [];
    try {
      rows = this.parseCsv(csvContent);
    } catch (e) {
      fileErrors.generalErrors = [e.message];
    }

    // If there were errors during the first stages of validation then
    // return those errors now without doing any further validation.
    if (fileErrors.generalErrors?.length) {
      return fileErrors;
    }

    // Scan each row, checking that they all have valid content in all columns
    const lineErrors: LineErrors[] = this.validateRows(rows);
    if (lineErrors?.length) {
      fileErrors.lineErrors = lineErrors;
    }

    if (fileErrors.generalErrors?.length || fileErrors.lineErrors?.length) {
      return fileErrors;
    }

    return null;
  },

  /*
  Convert the CSV file into an array of objects.  Throw an error if any problems occur.
  If there are no problems with the parsing, each resulting object will include both the
  translated version of the CSV row as a javascript object and also the original (raw) 
  version of the CSV row as a string.
  
  For example, given this CSV row:
    F,1853,85419.00,,7,484.03,,46.10

  The resulting object would be:
    {
      record: {
        'Gender Code': 'F',
        'Hours Worked': '1853',
        'Ordinary Pay': '85419.00',
        'Special Salary': '',
        'Overtime Hours': '7',
        'Overtime Pay': '484.03',
        'Bonus Pay': '',
        'Regular Hourly Wage': '46.10'
      },
      raw: 'F,1853,85419.00,,7,484.03,,46.10\r'
    }

  */
  parseCsv(csvContent: string): Row[] {
    let rows = [];
    try {
      rows = parse(csvContent, {
        columns: true,
        bom: true,
        raw: true,
        trim: true,
        ltrim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      });
    } catch (e) {
      log.debug(e);
      throw new Error('Unable to parse file');
    }

    if (!rows?.length) {
      throw new Error('No content');
    }

    // Confirm that the CSV contains the expected columns in the expected order
    const firstRow = rows[0];
    const colNames = Object.getOwnPropertyNames(firstRow.record);
    if (colNames?.length < EXPECTED_COLUMNS.length) {
      throw new Error(INVALID_COLUMN_ERROR);
    }
    for (let i = 0; i < EXPECTED_COLUMNS.length; i++) {
      if (colNames[i] != EXPECTED_COLUMNS[i]) {
        throw new Error(INVALID_COLUMN_ERROR);
      }
    }

    // Don't throw an error if the CSV contains extra columns
    // that they occur after all the required columns.  The main reason
    // not to throw an error in this case is that extra commas
    // at the end of a line can cause the CSV parser to detect "ghost"
    // columns (i.e. columns with no header and with empty strings
    // as values).  We don't want to complain about "ghost" columns,
    // It may be reasonable to complain about extra
    // non-ghost columns (although we don't do that currently).

    return rows;
  },

  /*
  Scans all rows.  For each row check that all columns have valid values.  
  Return an array of any row errors found
  */
  validateRows(rows: Row[]): LineErrors[] {
    const allRowErrors: LineErrors[] = [];
    for (let rowNum = 0; rowNum < rows.length; rowNum++) {
      //+1 because the line numbers are not zero-indexed, and
      //+1 again because the first data line is actually the second line of the file(after the header line)
      const lineNum = rowNum + 2;

      const row = rows[rowNum];
      const errorsForCurrentLine: LineErrors = this.validateRow(lineNum, row);
      if (errorsForCurrentLine) {
        allRowErrors.push(errorsForCurrentLine);
      }
    }
    return allRowErrors;
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
  Scans the given row. Check that all columns have valid values.  
  Return a LineErrors object if any errors are found, or returns null 
  if no errors are found
  */
  validateRow(lineNum: number, row: Row): LineErrors {
    const record = row.record;
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
        lineNum: lineNum,
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
