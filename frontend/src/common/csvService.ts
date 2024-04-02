import Papa, { ParseResult } from 'papaparse';
import { useConfigStore } from '../store/modules/config';

export enum ParseStatus {
  Success = 'success',
  Error = 'error',
}

export interface IParseErrorResponse {
  status: ParseStatus.Error;
  message: string;
}

export interface IParseSuccessResponse {
  status: ParseStatus.Success;
  data: any[];
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
const FILE_TOO_LARGE_ERROR_MSG =
  'File size too large. File cannot be larger than';
const PARSE_INVALID_HEADER_ERROR_MSG =
  'The first line of the .csv file does not include the expected column names.';

export const CsvService = {
  /**
   * Parses the given .csv file, converting it into JSON format.
   * Returns a promise.  If parsing is successful, the promise resolves
   * to a IParseSuccessResponse.  If anything goes wrong, the
   * projects is rejected with an IParseErrorResponse.
   * @param file
   */
  async parse(contents: File | string): Promise<IParseSuccessResponse> {
    //Before parsing the file, check that its size is within the allowed limit
    const validateSizeError = await CsvServicePrivate.validateSize(contents);
    if (validateSizeError) {
      throw validateSizeError;
    }

    return new Promise((resolve, reject) => {
      const parserConfig: any = {
        delimiter: ',',
        skipEmptyLines: true,
        complete: (papaParseResult: ParseResult<any>) =>
          CsvServicePrivate.onParseComplete(resolve, reject, papaParseResult),
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
   *
   */
  async validateSize(
    contents: File | string,
  ): Promise<IParseErrorResponse | null> {
    let sizeBytes = 0;
    if (contents instanceof File) {
      sizeBytes = contents.size;
    } else {
      sizeBytes = new Blob([contents]).size;
    }
    const configStore = useConfigStore();
    const config = await configStore.loadConfig();
    const maxUploadSizeBytes = config.maxUploadFileSize;
    if (sizeBytes > maxUploadSizeBytes) {
      const maxUploadSizeMB = maxUploadSizeBytes / (1024 * 1024);
      return {
        status: ParseStatus.Error,
        message: `${FILE_TOO_LARGE_ERROR_MSG} ${Math.floor(maxUploadSizeMB)}MB.`,
      };
    }
    return null;
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
      firstLine.map((d) => (d ? d.trim() : '')).join(',') ==
      REQUIRED_HEADER_COLUMNS.join(',');
    if (!isHeaderValid) {
      return {
        status: ParseStatus.Error,
        message: `${PARSE_INVALID_HEADER_ERROR_MSG} Expected header format: ${REQUIRED_HEADER_COLUMNS.join(',')}`,
      };
    }
    return null;
  },
};
