import { app } from './app';
import request from 'supertest';

const mockGetPayTransparencyData = jest.fn();
jest.mock('./v1/services/pay-transparency-service', () => ({
  payTransparencyService: {
    getPayTransparencyData: (...args) => mockGetPayTransparencyData(...args),
  },
}));

jest.mock('./config', () => {
  const actualConfig = jest.requireActual('./config').config;
  const mockedConfig = (jest.genMockFromModule('./config') as any).config;
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
          'server:apiKey': 'api-key',
        }[key];
      }),
    },
  };
});

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('GET /', () => {
    it('should return 200', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
    });
  });
  describe('GET /health', () => {
    it('should return 200 if the app is healthy', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.text).toBe('Health check passed');
    });
  });

  describe('/api/v1/pay-transparency GET', () => {
    describe('with API Key', () => {
      it('should get reports when api key is valid', async () => {
        mockGetPayTransparencyData.mockReturnValue({
          status: 200,
          data: [{ id: 1 }],
        });
        const response = await request(app)
          .get('/api/v1/pay-transparency')
          .set('x-api-key', 'api-key');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ id: 1 }]);
      });
      it('should fail when api key is valid', async () => {
        const response = await request(app)
          .get('/api/v1/pay-transparency')
          .set('x-api-key', 'api-key-invalid');
        expect(response.status).toBe(401);
      });
    });
    describe('without API Key', () => {
      it('should fail when api key is not available', async () => {
        const response = await request(app)
          .get('/api/v1/pay-transparency')
        expect(response.status).toBe(400);
      });
    });
  });
});
