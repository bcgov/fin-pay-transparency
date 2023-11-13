import { parse } from 'csv-parse/sync';
import { logger as log } from '../../logger';

const COL_GENDER_CODE = "Gender Code";
const COL_HOURS_WORKED = "Hours Worked";
const COL_REGULAR_SALARY = "Regular Salary";
const COL_SPECIAL_SALARY = "Special Salary";
const COL_OVERTIME_HOURS = "Overtime Hours";
const COL_OVERTIME_PAY = "Overtime Pay";
const COL_BONUS_PAY = "Bonus Pay";
const COL_REGULAR_HOURLY_WAGE = "Regular Hourly Wage";
const EXPECTED_COLUMNS: string[] = [
  COL_GENDER_CODE,
  COL_HOURS_WORKED,
  COL_REGULAR_SALARY,
  COL_SPECIAL_SALARY,
  COL_OVERTIME_HOURS,
  COL_OVERTIME_PAY,
  COL_BONUS_PAY,
  COL_REGULAR_HOURLY_WAGE
];
const NUMERIC_COLUMNS = [
  COL_HOURS_WORKED,
  COL_REGULAR_SALARY,
  COL_SPECIAL_SALARY,
  COL_OVERTIME_HOURS,
  COL_OVERTIME_PAY,
  COL_BONUS_PAY,
  COL_REGULAR_HOURLY_WAGE
];
const INVALID_COLUMN_ERROR = "Invalid CSV format. Please ensure the uploaded file contains the following columns: " + EXPECTED_COLUMNS.join(",")
const GENDER_CODES = ["M", "F", "X", "U", "W"];
const ZERO_SYNONYMS = ["N/A"]

interface Row {
  record: any;
  raw: string
}

interface FileErrors {
  generalErrors: string[],
  lineErrors: LineErrors[]
}

interface LineErrors {
  lineNum: number,
  errors: string[]
}

const validateService = {

  /*
  Validates the content of the submission body, which includes all form fields, 
  but excludes the uploaded CSV file.
  */
  validateBody(body: string): string[] {
    return [];
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
      lineErrors: null
    }

    // Parse the CSV content and check that the column names as
    // expected (and in the expected order)    
    var rows: Row[] = [];
    try {
      rows = this.parseCsv(csvContent)
    }
    catch (e) {
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
      return fileErrors
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
        'Regular Salary': '85419.00',
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
    var rows = [];
    try {
      rows = parse(csvContent, {
        columns: true,
        bom: true,
        raw: true,
        trim: true,
        ltrim: true,
        skip_empty_lines: true,
        relax_column_count: true
      });
    }
    catch (e) {
      log.debug(e);
      throw new Error("Unable to parse file");
    }

    if (!rows?.length) {
      throw new Error("No content");
    }

    // Confirm that the CSV contains the expected columns in the expected order
    const firstRow = rows[0];
    const colNames = Object.getOwnPropertyNames(firstRow.record);
    if (colNames?.length != EXPECTED_COLUMNS.length) {
      throw new Error(INVALID_COLUMN_ERROR);
    }
    for (var i = 0; i < colNames.length; i++) {
      if (colNames[i] != EXPECTED_COLUMNS[i]) {
        throw new Error(INVALID_COLUMN_ERROR);
      }
    }

    return rows;
  },

  /*
  Scans all rows.  For each row check that all columns have valid values.  
  Return an array of any row errors found
  */
  validateRows(rows: Row[]): LineErrors[] {
    const allRowErrors: LineErrors[] = [];
    for (var rowNum = 0; rowNum < rows.length; rowNum++) {

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

  /*
  Scans the given row. Check that all columns have valid values.  
  Return a LineErrors object if any errors are found, or returns null 
  if no errors are found
  */
  validateRow(lineNum: number, row: Row): LineErrors {
    const record = row.record;
    const errorMessages: string[] = [];
    if (GENDER_CODES.indexOf(record[COL_GENDER_CODE]) == -1) {
      errorMessages.push(`Invalid ${COL_GENDER_CODE} '${record[COL_GENDER_CODE]}' (expected one of: ${GENDER_CODES}).`)
    }
    NUMERIC_COLUMNS.forEach(colName => {
      if (!this.isZeroSynonym(record[colName]) && !this.isValidNumber(record[colName], 0)) {
        errorMessages.push(`Invalid number '${record[colName]}' in ${colName}.`)
      }
    })

    if (errorMessages.length) {
      const lineErrors = {
        lineNum: lineNum,
        errors: errorMessages
      }
      return lineErrors;
    }

    return null;
  },

  /*
  Returns true if the given value is one of the accepted synonyms meaning
  zero, otherwise returns false.
  */
  isZeroSynonym(val: any): boolean {
    if (typeof val == "string") {
      val = val.toUpperCase();
    }
    return ZERO_SYNONYMS.indexOf(val) >= 0;
  },

  isValidNumber(val: any, min: number = null, max: number = null): boolean {
    if (val === null || isNaN(val)) {
      return false
    }

    // Check that the value is either a number or a string that parses
    // to a number. Integer and float are both allowed.
    var num: number;
    try {
      num = parseFloat(val);
    }
    catch (e) {
      console.log(e);
      return false;
    }

    // If the minimum or maximum were specified, validate against those
    if (min !== null && num < min) {
      return false;
    }
    if (max !== null && num > max) {
      return false;
    }

    return true;

  }

}

export {
  FileErrors,
  validateService
};

