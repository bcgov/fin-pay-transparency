import { describe, expect, it, vi } from 'vitest';
import * as configModule from '../../store/modules/config';
import {
  CsvService,
  CsvServicePrivate,
  ParseStatus,
  REQUIRED_HEADER_COLUMNS,
} from '../csvService';

const validCsvHeader = REQUIRED_HEADER_COLUMNS.join(',');
const validCsvDataLine = 'M,1500,100000,,2,70,';
const validCsvString = `${validCsvHeader}\n${validCsvDataLine}`;

const mockValidPapaParseResult = {
  data: [REQUIRED_HEADER_COLUMNS] as any[],
  errors: [] as any[],
  meta: {} as any,
};
const mockInvalidPapaParseResult = {
  data: [['mock,invalid,header']] as any[],
  errors: [] as any[],
  meta: {} as any,
};
const mockErrorPapaParseResult = {
  data: [] as any[],
  errors: [{}] as any[],
  meta: {} as any,
};
const mockAbortedPapaParseResult = {
  data: [] as any[],
  errors: [] as any[],
  meta: {
    aborted: true,
  } as any,
};
const mockTruncatedPapaParseResult = {
  data: [REQUIRED_HEADER_COLUMNS] as any[],
  errors: [] as any[],
  meta: {
    truncated: true,
  } as any,
};

describe('parseCsv', () => {
  describe('when a properly formatted csv file is given', () => {
    it('returns a promise containing the parsed data in json format', async () => {
      vi.spyOn(configModule, 'useConfigStore').mockReturnValue({
        loadConfig: async () => {
          return {
            maxUploadFileSize: 100000, //a large enough limit to avoid size errors
          };
        },
      } as any);
      const result: any = await CsvService.parse(validCsvString);
      console.log(result);
      const expectedNumLines = (validCsvString.match(/\n/g) || []).length + 1;
      expect(result.data.length).toBe(expectedNumLines);
    });
  });
  describe('when a csv with an invalid header is given', () => {
    it('returns a rejected promise', async () => {
      vi.spyOn(configModule, 'useConfigStore').mockReturnValue({
        loadConfig: async () => {
          return {
            maxUploadFileSize: 100000, //a large enough limit to avoid size errors
          };
        },
      } as any);
      const csvStringWithInvalidHeader = 'col1,col2,col3\na,b,c';
      await expect(
        CsvService.parse(csvStringWithInvalidHeader),
      ).rejects.toBeTruthy();
    });
  });
  describe('when a csv with a valid header but invalid second line is given', () => {
    it('returns a promise containing the parsed data in json format', async () => {
      /*
      This test may be counterintuive.  CsvService.parse(...) is designed to 
      perform only a very limited set of validation checks on the data.  
      It is possible that some data submitted to this function would be considered
      invalid by the comprehensive validation on the backend, but to be 
      considered valid by CsvService.parse(...).  This test is only here to make
      it explicit that CsvService.parse(...) is intentionally allowing some 
      invalid data to pass through without error.
      */
      vi.spyOn(configModule, 'useConfigStore').mockReturnValue({
        loadConfig: async () => {
          return {
            maxUploadFileSize: 100000, //a large enough limit to avoid size errors
          };
        },
      } as any);
      const csvStringWithInvalidSecondLine = `${validCsvHeader}\na,b,c`;
      const result: any = await CsvService.parse(
        csvStringWithInvalidSecondLine,
      );
      const expectedNumLines =
        (csvStringWithInvalidSecondLine.match(/\n/g) || []).length + 1;
      expect(result.data.length).toBe(expectedNumLines);
    });
  });
  describe('when a csv is too large', () => {
    it('returns a rejected promise', async () => {
      vi.spyOn(configModule, 'useConfigStore').mockReturnValue({
        loadConfig: async () => {
          return {
            maxUploadFileSize: 1, //1 byte maximum (a very small csv size limit!)
          };
        },
      } as any);
      await expect(CsvService.parse(validCsvString)).rejects.toBeTruthy();
    });
  });
});

describe('validateSize', () => {
  describe('when the csv file is under the max size limit', () => {
    it('returns null', async () => {
      vi.spyOn(configModule, 'useConfigStore').mockReturnValue({
        loadConfig: async () => {
          return {
            maxUploadFileSize: 100000, //a large enough limit to avoid size errors
          };
        },
      } as any);
      const result = await CsvServicePrivate.validateSize(validCsvString);
      expect(result).toBeNull();
    });
  });
  describe('when the csv file is over the max size limit', () => {
    it('returns an error object', async () => {
      vi.spyOn(configModule, 'useConfigStore').mockReturnValue({
        loadConfig: async () => {
          return {
            maxUploadFileSize: 1, //1 byte maximum (a very small csv size limit!)
          };
        },
      } as any);
      const result = await CsvServicePrivate.validateSize(validCsvString);
      expect(result?.status).toBe(ParseStatus.Error);
    });
  });
});

describe('validateHeader', () => {
  describe('when a properly formatted header is given in the first line', () => {
    it('returns null', async () => {
      const result = CsvServicePrivate.validateHeader(mockValidPapaParseResult);
      expect(result).toBeNull();
    });
  });
  describe('when an improperly formatted header is given in the first line', () => {
    it('returns an error object', async () => {
      const result = CsvServicePrivate.validateHeader(
        mockInvalidPapaParseResult,
      );
      expect(result?.status).toBe(ParseStatus.Error);
    });
  });
});

describe('preliminaryValidation', () => {
  describe('when the given ParseResult is valid with respect to preliminary frontend checks', () => {
    it('returns null', async () => {
      const result = CsvServicePrivate.validateHeader(mockValidPapaParseResult);
      expect(result).toBeNull();
    });
  });
  describe('when the given ParseResult is invalid with respect to preliminary frontend checks', () => {
    it('returns an error object', async () => {
      const result = CsvServicePrivate.validateHeader(
        mockInvalidPapaParseResult,
      );
      expect(result?.status).toBe(ParseStatus.Error);
    });
  });
});

describe('onParseComplete', () => {
  describe('when the given ParseResult contains no errors', () => {
    it('calls the resolve callback', async () => {
      const resolve = vi.fn();
      const reject = vi.fn();
      CsvServicePrivate.onParseComplete(
        resolve,
        reject,
        mockValidPapaParseResult,
      );
      expect(resolve).toHaveBeenCalledOnce();
      expect(resolve.mock.calls[0][0]?.status).toBe(ParseStatus.Success);
      expect(reject).toHaveBeenCalledTimes(0);
    });
  });
  describe('when the given ParseResult contains parse errors', () => {
    it('calls the reject callback', async () => {
      const resolve = vi.fn();
      const reject = vi.fn();
      CsvServicePrivate.onParseComplete(
        resolve,
        reject,
        mockErrorPapaParseResult,
      );
      expect(resolve).toHaveBeenCalledTimes(0);
      expect(reject).toHaveBeenCalledOnce();
      expect(reject.mock.calls[0][0]?.status).toBe(ParseStatus.Error);
    });
  });
  describe('when the parse was aborted', () => {
    it('calls the reject callback', async () => {
      const resolve = vi.fn();
      const reject = vi.fn();
      CsvServicePrivate.onParseComplete(
        resolve,
        reject,
        mockAbortedPapaParseResult,
      );
      expect(resolve).toHaveBeenCalledTimes(0);
      expect(reject).toHaveBeenCalledOnce();
      expect(reject.mock.calls[0][0]?.status).toBe(ParseStatus.Error);
    });
  });
  describe('when the parse was truncated', () => {
    it('calls the reject callback', async () => {
      const resolve = vi.fn();
      const reject = vi.fn();
      CsvServicePrivate.onParseComplete(
        resolve,
        reject,
        mockTruncatedPapaParseResult,
      );
      expect(resolve).toHaveBeenCalledTimes(0);
      expect(reject).toHaveBeenCalledOnce();
      expect(reject.mock.calls[0][0]?.status).toBe(ParseStatus.Error);
    });
  });
  describe('when the parse was successful, but there preliminary validation failed', () => {
    it('calls the reject callback', async () => {
      const resolve = vi.fn();
      const reject = vi.fn();
      CsvServicePrivate.onParseComplete(
        resolve,
        reject,
        mockInvalidPapaParseResult,
      );
      expect(resolve).toHaveBeenCalledTimes(0);
      expect(reject).toHaveBeenCalledOnce();
      expect(reject.mock.calls[0][0]?.status).toBe(ParseStatus.Error);
    });
  });
});
