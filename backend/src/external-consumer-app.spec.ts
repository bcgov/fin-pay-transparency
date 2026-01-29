import request from 'supertest';
import { externalConsumerApp } from './external-consumer-app.js';

const mockExportDataWithPagination = jest.fn();
jest.mock('./v1/services/external-consumer-service', () => ({
  externalConsumerService: {
    exportDataWithPagination: (...args) =>
      mockExportDataWithPagination(...args),
  },
}));

jest.mock('./config/config', () => {
  const actualConfig = jest.requireActual('./config/config').config;
  return {
    config: {
      get: jest.fn().mockImplementation((key) => {
        return {
          'oidc:clientSecret': 'secret',
          'server:sessionPath': 'session-path',
          environment: 'production',
          'oidc:clientId': 'client-id',
          'server:frontend': 'http://localhost:8081',
          'tokenGenerate:issuer': 'http://localhost:3000',
          'tokenGenerate:privateKey': actualConfig.get(
            'tokenGenerate:privateKey',
          ),
          'tokenGenerate:publicKey': actualConfig.get(
            'tokenGenerate:publicKey',
          ),
          'server:rateLimit:enabled': true,
          'backendExternal:apiKey': 'api-key',
        }[key];
      }),
    },
  };
});

describe('external-consumer-app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/v1 GET', () => {
    describe('with API Key', () => {
      it('should get reports when api key is valid', async () => {
        mockExportDataWithPagination.mockReturnValue({ data: [] });
        const response = await request(externalConsumerApp)
          .get('/external-consumer-api/v1/reports')
          .set('x-api-key', 'api-key');
        expect(response.status).toBe(200);
      });
      it('should fail when api key is valid', async () => {
        const response = await request(externalConsumerApp)
          .get('/api/v1/reports')
          .set('x-api-key', 'api-key-invalid');
        expect(response.status).toBe(401);
      });
    });
    describe('without API Key', () => {
      it('should fail when api key is not available', async () => {
        const response =
          await request(externalConsumerApp).get('/api/v1/reports');
        expect(response.status).toBe(400);
      });
    });
  });
});
