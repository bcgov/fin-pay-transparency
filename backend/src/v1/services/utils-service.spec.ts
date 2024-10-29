import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { utils } from './utils-service';

jest.mock('axios');

afterEach(() => {
  jest.clearAllMocks();
});

describe('utils-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('postDataToDocGenService (&& postData)', () => {
    describe('when the config parameter is omitted', () => {
      it('creates a new config', async () => {
        const body = 'test';
        const url = 'http://localhost';
        const corr = '1234asdf';

        const configResult = {
          headers: {
            'x-correlation-id': corr,
            'x-api-key': config.get('docGenService:apiKey'),
          },
        };

        const spyPostData = jest.spyOn(axios, 'post').mockResolvedValue({
          data: 'test',
        });

        await utils.postDataToDocGenService(body, url, corr);

        expect(spyPostData).toHaveBeenCalledWith(url, body, configResult);
      });
    });
    describe('when the config parameter is provided', () => {
      it('adds the required headers', async () => {
        const body = 'test';
        const url = 'http://localhost';
        const corr = '1234asdf';

        const configParam = {
          headers: {
            Accept: 'application/pdf',
          },
          responseType: 'stream',
        };

        const configResult = {
          headers: {
            Accept: 'application/pdf',
            'x-correlation-id': corr,
            'x-api-key': config.get('docGenService:apiKey'),
          },
          responseType: 'stream',
        };

        const spyPostData = jest.spyOn(axios, 'post').mockResolvedValue({
          data: 'test',
        });

        await utils.postDataToDocGenService(body, url, corr, configParam);

        expect(spyPostData).toHaveBeenCalledWith(url, body, configResult);
      });
    });
  });

  describe('parseJwt', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('when the JWT is invalid', () => {
      it('throws an error', () => {
        jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
          throw new Error('test');
        });

        expect(utils.parseJwt('test')).toBeNull();
      });
    });

    describe('when the JWT is valid', () => {
      describe('with special characters', () => {
        it('parses a JWT successfully', () => {
          const expectedPayload = {
            sub: '1234567890',
            name: 'John Doe',
            iat: 1516239022,
            display_name: 'Kevin O’Riely',
          };

          const output = utils.parseJwt(
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJkaXNwbGF5X25hbWUiOiJLZXZpbiBP4oCZUmllbHkifQ.ab6ATknTP8_gksT7mnGV9XdEbE8JatEEeAYD4ipPQMg',
          );
          expect(output).toEqual(expectedPayload);
        });
      });

      describe('without special characters', () => {
        it('parses a JWT successfully', () => {
          const expectedPayload = {
            sub: '1234567890',
            name: 'John Doe',
            iat: 1516239022,
            display_name: 'Kevin ORiely',
          };

          const output = utils.parseJwt(
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJkaXNwbGF5X25hbWUiOiJLZXZpbiBPUmllbHkifQ.Q7ZwUBIr5hwFuPKq4twT_nE7J3PVQj6hVukhT0xurrY',
          );
          expect(output).toEqual(expectedPayload);
        });
      });
    });
  });

  describe('updateManyUnsafe', () => {
    describe('when requesting that multiple records in a given table be updated', () => {
      it('creates and executes a bulk update statement against the database', () => {
        const mockTx = {
          $executeRawUnsafe: jest.fn(),
        };
        const updates = [
          { mock_table_id: '1', another_col: 'aaa' },
          { mock_table_id: '2', another_col: 'bbb' },
        ];
        const typeHints = null;
        const mockTableName = 'mock_table';
        const primaryKeyCol = 'mock_table_id';

        utils.updateManyUnsafe(
          mockTx,
          updates,
          typeHints,
          mockTableName,
          primaryKeyCol,
        );

        expect(mockTx.$executeRawUnsafe).toHaveBeenCalledTimes(1);

        // Get the SQL was was submitted to the database
        const executedSql = mockTx.$executeRawUnsafe.mock.calls[0][0];

        // Check that the submitted SQL includes several expected keywords
        // (We stop short of checking the exact format of the SQL and that
        // it is valid according to the database engine.)
        expect(executedSql.toLowerCase()).toContain(`update ${mockTableName}`);
        expect(executedSql.toLowerCase()).toContain('set');
        expect(executedSql.toLowerCase()).toContain('where');
        Object.keys(updates[0]).forEach((k) => {
          expect(executedSql).toContain(k);
        });
      });
    });
    describe('when typeHints are provided', () => {
      it('the executed SQL includes casts to te specified hints', async () => {
        const mockTx = {
          $executeRawUnsafe: jest.fn(),
        };
        const updates = [
          { mock_table_id: '1', second_col: 'aaa', third_col: 'bbb' },
        ];
        const typeHints = { second_col: 'UUID', third_col: 'TIMESTAMP' };
        const mockTableName = 'mock_table';
        const primaryKeyCol = 'mock_table_id';

        await utils.updateManyUnsafe(
          mockTx,
          updates,
          typeHints,
          mockTableName,
          primaryKeyCol,
        );

        expect(mockTx.$executeRawUnsafe).toHaveBeenCalledTimes(1);

        // Get the SQL was was submitted to the database
        const executedSql = mockTx.$executeRawUnsafe.mock.calls[0][0];

        // Check that the submitted SQL includes several expected keywords
        // (We stop short of checking the exact format of the SQL and that
        // it is valid according to the database engine.)
        expect(executedSql.toLowerCase()).toContain(`update ${mockTableName}`);
        expect(executedSql.toLowerCase()).toContain('set');
        expect(executedSql.toLowerCase()).toContain('where');

        //check that values with type hints are cast
        expect(executedSql).toContain(
          `'${updates[0].second_col}'::${typeHints.second_col}`,
        );
        expect(executedSql).toContain(
          `'${updates[0].third_col}'::${typeHints.third_col}`,
        );
      });
    });
  });

  describe('convertIsoDateStringsToUtc', () => {
    describe('given an array of objects with the wrong form', () => {
      it('throws an error', () => {
        const items = [{}];
        expect(() =>
          utils.convertIsoDateStringsToUtc(items, 'some_attribute'),
        ).toThrow(
          "All objects in the given array are expected to have a property called 'some_attribute'",
        );
      });
    });
    describe('given an array of objects, some of which have dates, and some which do not', () => {
      it('returns a copy of the array, with modified copies of those items that have dates, and unmodified copies of the other items', () => {
        const items = [
          { value: '2024-10-02T00:00:00-07:00' },
          { value: 'not a date' },
        ];
        const modifiedCopies = utils.convertIsoDateStringsToUtc(items, 'value');
        const expected = [
          { value: '2024-10-02T07:00:00Z' }, //date string converted to UTC
          { value: 'not a date' }, //not modified
        ];
        expect(modifiedCopies).toStrictEqual(expected);
      });
    });
  });
});
