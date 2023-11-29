import { parse } from 'csv-parse/sync';
import { logger as log } from '../../logger';

const COL_GENDER_CODE = "Gender Code";
const COL_HOURS_WORKED = "Hours Worked";
const COL_REGULAR_SALARY = "Regular Salary";
const COL_SPECIAL_SALARY = "Special Salary";
const COL_OVERTIME_HOURS = "Overtime Hours";
const COL_OVERTIME_PAY = "Overtime Pay";
const COL_BONUS_PAY = "Bonus Pay";
const EXPECTED_COLUMNS: string[] = [
  COL_GENDER_CODE,
  COL_HOURS_WORKED,
  COL_REGULAR_SALARY,
  COL_SPECIAL_SALARY,
  COL_OVERTIME_HOURS,
  COL_OVERTIME_PAY,
  COL_BONUS_PAY
];
// columns which are express numbers in units of 'hours'
const HOURS_COLUMNS = [
  COL_HOURS_WORKED,
  COL_OVERTIME_HOURS,
];
// columns which are express numbers in units of 'dollars'
const DOLLARS_COLUMNS = [
  COL_REGULAR_SALARY,
  COL_SPECIAL_SALARY,
  COL_OVERTIME_PAY,
  COL_BONUS_PAY
];
const INVALID_COLUMN_ERROR = `Invalid CSV format. Please ensure the uploaded file contains the following columns: ${EXPECTED_COLUMNS.join(", ")}`
const GENDER_CODES = ["M", "F", "W", "X", "U"];
const ZERO_SYNONYMS = [""];
const MAX_HOURS = 8760; //equal to 24 hours/day x 365 days
const MAX_DOLLARS = 999999999;


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
    if (colNames?.length < EXPECTED_COLUMNS.length) {
      throw new Error(INVALID_COLUMN_ERROR);

    }
    for (var i = 0; i < EXPECTED_COLUMNS.length; i++) {
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

    // Validation checks common to all columns with data in units of 'hours'
    HOURS_COLUMNS.forEach(colName => {
      const value = record[colName];
      if (!this.isZeroSynonym(value) && !this.isValidNumber(value)) {
        errorMessages.push(`Invalid number '${value}' in ${colName}.`)
      }
      // Range check.  Only do this check if the above check passes
      else if (value < 0 || value > MAX_HOURS) {
        errorMessages.push(`${colName} must specify a positive number no larger than ${MAX_HOURS}. Found '${value}'.`)
      }
    });

    // Validation checks common to all columns with data in units of 'dollars'
    DOLLARS_COLUMNS.forEach(colName => {
      const value = record[colName];
      if (!this.isZeroSynonym(value) && !this.isValidNumber(value)) {
        errorMessages.push(`Invalid number '${value}' in ${colName}.`)
      }
      // Range check.  Only do this check if the above check passes
      else if (value < 0 || value > MAX_DOLLARS) {
        errorMessages.push(`${colName} must specify a positive number no larger than ${MAX_DOLLARS}.  Found '${value}'.`)
      }
    })

    // Other column-specific validation checks
    if (GENDER_CODES.indexOf(record[COL_GENDER_CODE]) == -1) {
      errorMessages.push(`Invalid ${COL_GENDER_CODE} '${record[COL_GENDER_CODE]}' (expected one of: ${GENDER_CODES.join(", ")}).`)
    }
    if (!this.isZeroSynonym(record[COL_HOURS_WORKED]) &&
      !this.isZeroSynonym(record[COL_SPECIAL_SALARY])) {
      errorMessages.push(`${COL_HOURS_WORKED} must not contain data when ${COL_SPECIAL_SALARY} contains data.`)
    }
    if (!this.isZeroSynonym(record[COL_REGULAR_SALARY]) &&
      !this.isZeroSynonym(record[COL_SPECIAL_SALARY])) {
      errorMessages.push(`${COL_REGULAR_SALARY} must not contain data when ${COL_SPECIAL_SALARY} contains data.`)
    }
    if (this.isZeroSynonym(record[COL_HOURS_WORKED]) &&
      this.isZeroSynonym(record[COL_REGULAR_SALARY]) &&
      this.isZeroSynonym(record[COL_SPECIAL_SALARY])) {
      errorMessages.push(`${COL_SPECIAL_SALARY} must contain data when ${COL_HOURS_WORKED} and ${COL_REGULAR_SALARY} do not contain data.`)
    }

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

    //Check if the value can be parsed as number, and if it can,
    //check if that number is equal to zero.
    try {
      const num = parseFloat(val);
      if (num == 0) {
        return true;
      }
    }
    catch (e) {
      //ignore the error
    }

    //If the value wasn't strictly a numeric zero, check whether
    //there it is equal to any of the allowable synonyms for zero.
    if (typeof val == "string") {
      val = val.toUpperCase();
    }
    return ZERO_SYNONYMS.indexOf(val) >= 0;
  },

  isValidNumber(val: any): boolean {
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

    return true;

  }

}

export {
  COL_BONUS_PAY, COL_GENDER_CODE,
  COL_HOURS_WORKED, COL_OVERTIME_HOURS,
  COL_OVERTIME_PAY, COL_REGULAR_SALARY,
  COL_SPECIAL_SALARY, FileErrors,
  LineErrors,
  Row,
  validateService
};

