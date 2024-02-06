import { utils } from './utils-service';
import { config } from '../../config';
import axios from 'axios';
import { exceptions } from 'winston';

jest.mock('axios');

afterEach(() => {
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
