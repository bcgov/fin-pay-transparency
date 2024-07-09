import { utils } from './utils-service';
import { config } from '../../config';
import axios from 'axios';
import jwt from 'jsonwebtoken';

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

        expect(utils.parseJwt('test')).toBe(null);
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
  
          const output = utils.parseJwt('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJkaXNwbGF5X25hbWUiOiJLZXZpbiBP4oCZUmllbHkifQ.ab6ATknTP8_gksT7mnGV9XdEbE8JatEEeAYD4ipPQMg');
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

    })
    
  });
});
