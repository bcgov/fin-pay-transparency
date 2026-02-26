import { vi, describe, it, expect } from 'vitest';
import request from 'supertest';
import { externalConsumerApp } from './external-consumer-app.js';

const mockExportDataWithPagination = vi.fn();
vi.mock('./v1/services/external-consumer-service', () => ({
  externalConsumerService: {
    exportDataWithPagination: (...args) =>
      mockExportDataWithPagination(...args),
  },
}));

vi.mock(import('./config/config.js'), async (importOriginal) => {
  const actualModule = await importOriginal();
  const actualConfig = actualModule.config;

  return {
    config: {
      get: vi.fn((key) => {
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
