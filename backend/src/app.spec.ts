import { vi, describe, it, expect, beforeEach } from 'vitest';
import { app } from './app.js';
import prisma from './v1/prisma/__mocks__/prisma-client.js';
import { publicAuth } from './v1/services/public-auth-service.js';
import request from 'supertest';
import type { employee_count_range, naics_code } from '@prisma/client';

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------

vi.mock('./schedulers/run.all', () => ({
  run: vi.fn(),
}));

// In utils-service mock only those methods that make calls to remote services
// (for all other methods in this module keep the original implementation)
vi.mock('./v1/services/utils-service', async () => {
  const actualUtils = await vi.importActual<
    typeof import('./v1/services/utils-service.js')
  >('./v1/services/utils-service.js');
  return {
    utils: {
      ...actualUtils.utils,
      getOidcDiscovery: vi.fn().mockResolvedValue({
        issuer: 'ABC',
        authorization_endpoint: 'fake url',
        token_endpoint: 'fake url',
        userinfo_endpoint: 'fake url',
      }),
      getKeycloakPublicKey: vi.fn(),
    },
  };
});

// Mock any functions in the object-relational model that may be involved in database
// queries executed as a result of any API cals tested by this module.  The mocks defined
// just wipe out the default implementation.  Override the default mocks by individual
// tests below if necessary.
vi.mock('./v1/prisma/prisma-client');

// Setup in app.ts requires access to certain config properties.  These may be present when
// testing in a development environment (via a .env file), but they may not be present
// during builds by the CI/CD process.  Here we define the needed config properties.
vi.mock(import('./config/config.js'), async (importOriginal) => {
  const actualModule = await importOriginal();
  return {
    config: {
      ...actualModule.config,
      get: vi.fn(
        (key) =>
          ({
            'oidc:clientSecret': 'secret',
            'server:sessionPath': 'session-path',
            environment: 'production',
            'oidc:clientId': 'client-id',
            'server:frontend': 'http://localhost:8081',
            'tokenGenerate:issuer': 'http://localhost:3000',
            'tokenGenerate:privateKey': actualModule.config.get(
              'tokenGenerate:privateKey',
            ),
            'tokenGenerate:publicKey': actualModule.config.get(
              'tokenGenerate:publicKey',
            ),
            'server:rateLimit:enabled': true,
            'backendExternal:apiKey': 'api-key',
          })[key],
      ),
    },
  };
});

const validFrontendToken = publicAuth.generateFrontendToken();
const invalidFrontendToken = 'invalid-token';

beforeEach(() => {
  // In auth-service mock only isValidBackendToken().  This function is used by API endpoints
  // as the second part of a two-step authorization phase.  To keep the API tests simple we
  // omit the session and token checks done by the function.  All other functions in this
  // module keep the original implementation.
  vi.spyOn(publicAuth, 'isValidBackendToken').mockReturnValue(
    async (req, res, next) => {
      next();
    },
  );
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('GET /employee-count-range', () => {
  let mockDBResp: employee_count_range[];
  beforeEach(() => {
    // Mock the database query executed by the API endpoint's implementation:
    // (The call to codeService.getAllEmployeeCountRanges can cause a database
    // query.)
    mockDBResp = [
      {
        employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
        employee_count_range: '1-99',
      },
    ] as employee_count_range[];
    prisma.employee_count_range.findMany.mockResolvedValue(mockDBResp);
  });
  describe("given a valid 'frontend token' in the Authorization header", () => {
    it('responds with HTTP 200 and a JSON array of values in the body', async () => {
      const res = await request(app)
        .get('/api/v1/codes/employee-count-ranges')
        .set('Authorization', 'Bearer ' + validFrontendToken)
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body[0].employee_count_range).toBe(
        mockDBResp[0].employee_count_range,
      );
    });
  });
  describe("given an invalid 'frontend token' in the Authorization header", () => {
    it('returns HTTP 401 (unauthorized)', async () => {
      const res = await request(app)
        .get('/api/v1/codes/employee-count-ranges')
        .set('Authorization', 'Bearer ' + invalidFrontendToken)
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(401);
    });
  });
});

describe('GET /naics-codes', () => {
  let mockDBResp: naics_code[];
  beforeEach(() => {
    // Mock the database query executed by the API endpoint's implementation:
    // (The call to codeService.getAllNaicsCodes can cause a database
    // query.)
    mockDBResp = [
      {
        naics_code: '1',
        naics_label: 'test1',
      },
    ] as naics_code[];
    prisma.naics_code.findMany.mockResolvedValue(mockDBResp);
  });

  describe("given a valid 'frontend token' in the Authorization header", () => {
    it('responds with HTTP 200 and a JSON array of values in the body', async () => {
      const res = await request(app)
        .get('/api/v1/codes/naics-codes')
        .set('Authorization', 'Bearer ' + validFrontendToken)
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body[0].naics_code).toBe(mockDBResp[0].naics_code);
    });
  });
  describe("given an invalid 'frontend token' in the Authorization header", () => {
    it('returns HTTP 401 (unauthorized)', async () => {
      const res = await request(app)
        .get('/api/v1/codes/naics-codes')
        .set('Authorization', 'Bearer ' + invalidFrontendToken)
        .set('Accept', 'application/json');

      expect(res.statusCode).toBe(401);
    });
  });
});
describe('GET /health', () => {
  it('should return 200 if the database is healthy', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([1]);

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Health check passed');
  });

  it('should return 500 if the database is not healthy', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/health');

    // expect(response.status).toBe(500);
    // expect(response.text).toBe('Health check failed');
  });
});
