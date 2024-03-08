import Papa, { ParseResult } from 'papaparse';

export enum ParseStatus {
  Success = 'success',
  Error = 'error',
}

export interface IEmployeeRecord {
  genderCode: string;
  hoursWorked: number | null;
  ordinaryPay: number | null;
  specialSalary: number | null;
  overtimeHours: number | null;
  overtimePay: number | null;
  bonusPay: number | null;
}

export interface IParseErrorResponse {
  status: ParseStatus.Error;
  message: string;
}

export interface IParseSuccessResponse {
  status: ParseStatus.Success;
  data: IEmployeeRecord[];
}

export const REQUIRED_HEADER_COLUMNS = [
  'Gender Code',
  'Hours Worked',
  'Ordinary Pay',
  'Special Salary',
  'Overtime Hours',
  'Overtime Pay',
  'Bonus Pay',
];
const GENERIC_PARSE_ERROR_MSG = 'Unable to parse .csv file.';
const PARSE_ABORTED_ERROR_MSG =
  'Parsing was aborted before reaching the end of the input.';
const PARSE_INVALID_HEADER_ERROR_MSG =
  'The first line of the .csv file does not include the expected column names.';

export const CsvService = {
  /**
   * Parses the given .csv file, converting it into JSON format.
   * @param file
   */
  async parse(contents: File | string): Promise<IParseSuccessResponse> {
    return new Promise((resolve, reject) => {
      const parserConfig: any = {
        delimiter: ',',
        complete: (papaParseResult: ParseResult<IEmployeeRecord>) =>
          CsvServicePrivate.onParseComplete(resolve, reject, papaParseResult),
        skipEmptyLines: false,
        transform: undefined,
      };
      Papa.parse(contents, parserConfig);
    });
  },
};

export const CsvServicePrivate = {
  /**
   * Called when PapaParse finishes parsing a csv file.  Receives a ParseResult
   * object, and determines whether that object indicates parsing was successful
   * or not.  If successful, calls the given resolve() callback function with
   * IParseSuccessResponse object.  If any error occurred, calls the reject()
   * callback with IParseErrorResponse response.
   *
   * @param resolve a callback function to call if parsing was successful
   * @param reject a callback function to call if parsing encountered any error(s)
   * @param papaParseResult an object that contains the parsed contents of the
   * csv file, parse errors (if any), and also some metadata about the parsing process.
   */
  onParseComplete(resolve, reject, papaParseResult: ParseResult<any>): void {
    if (papaParseResult?.errors?.length) {
      reject({
        status: ParseStatus.Error,
        message: GENERIC_PARSE_ERROR_MSG,
      });
    } else if (
      papaParseResult?.meta?.truncated ||
      papaParseResult?.meta?.aborted
    ) {
      reject({
        status: ParseStatus.Error,
        message: PARSE_ABORTED_ERROR_MSG,
      });
    } else {
      const validationError: IParseErrorResponse | null =
        this.preliminaryValidation(papaParseResult);
      if (validationError) {
        reject(validationError);
      } else {
        resolve({
          status: ParseStatus.Success,
          data: papaParseResult.data,
        });
      }
    }
  },

  /**
   * Performs a cursory and quick check of the data format before
   * sending the data to the backend for full validation.
   * Returns null if preliminary validation detected no problems.
   * Returns an IParseErrorResponse object if any problems were detected.
   */
  preliminaryValidation(
    papaParseResult: ParseResult<any>,
  ): IParseErrorResponse | null {
    return this.validateHeader(papaParseResult);
  },

  /**
   * Checks that the first line of ParseResult contains
   * the expected set of column names
   * @param papaParseResult
   * @returns
   */
  validateHeader(
    papaParseResult: ParseResult<any>,
  ): IParseErrorResponse | null {
    if (!papaParseResult?.data?.length) {
      return {
        status: ParseStatus.Error,
        message: GENERIC_PARSE_ERROR_MSG,
      };
    }
    const firstLine = papaParseResult?.data[0];
    const isHeaderValid =
      firstLine.join(',') == REQUIRED_HEADER_COLUMNS.join(',');
    if (!isHeaderValid) {
      return {
        status: ParseStatus.Error,
        message: `${PARSE_INVALID_HEADER_ERROR_MSG} Expected header format: ${REQUIRED_HEADER_COLUMNS.join(',')}`,
      };
    }
    return null;
  },
};
