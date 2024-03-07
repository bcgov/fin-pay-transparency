import { describe, expect, it } from 'vitest';
import { CsvService, REQUIRED_HEADER_COLUMNS } from '../csvService';

const validCsvHeader = REQUIRED_HEADER_COLUMNS.join(',');
const validCsvDataLine = 'M,1500,100000,,2,70,';
const validCsvString = `${validCsvHeader}\n${validCsvDataLine}`;

describe('parseCsv', () => {
  describe('when a properly formatted csv file is given', () => {
    it('returns a promise containing the parsed data in json format', async () => {
      const result: any = await CsvService.parse(validCsvString);
      const expectedNumLines = (validCsvString.match(/\n/g) || []).length + 1;
      expect(result.data.length).toBe(expectedNumLines);
    });
  });
  describe('when a csv with an invalid header is given', () => {
    it('returns a rejected promise', async () => {
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
      const csvStringWithInvalidSecondLine = `${validCsvHeader}\na,b,c`;
      const result: any = await CsvService.parse(
        csvStringWithInvalidSecondLine,
      );
      const expectedNumLines =
        (csvStringWithInvalidSecondLine.match(/\n/g) || []).length + 1;
      expect(result.data.length).toBe(expectedNumLines);
    });
  });
});
