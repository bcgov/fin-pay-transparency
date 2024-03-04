import { app } from './app';
import prisma from './v1/prisma/prisma-client';
import { auth } from './v1/services/auth-service';
const request = require('supertest');

// ----------------------------------------------------------------------------
// Setup
// ----------------------------------------------------------------------------

const validFrontendToken = auth.generateUiToken();
const invalidFrontendToken = 'invalid-token';

// In utils-service mock only those methods that make calls to remote services
// (for all other methods in this module keep the original implementation)
jest.mock('./v1/services/utils-service', () => {
  const actualUtils = jest.requireActual('./v1/services/utils-service').utils;
  return {
    utils: {
      ...actualUtils,
      getOidcDiscovery: jest.fn().mockResolvedValue({
        issuer: 'ABC',
        authorization_endpoint: 'fake url',
        token_endpoint: 'fake url',
        userinfo_endpoint: 'fake url',
      }),
      getKeycloakPublicKey: jest.fn(),
    },
  };
});

// Mock any functions in the object-relational model that may be involved in database
// queries executed as a result of any API cals tested by this module.  The mocks defined
// just wipe out the default implementation.  Override the default mocks by individual
// tests below if necessary.
jest.mock('./v1/prisma/prisma-client', () => {
  return {
    employee_count_range: {
      findMany: jest.fn(),
    },
    naics_code: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $extends: jest.fn(),
  };
});

// In auth-service mock only isValidBackendToken().  This function is used by API endpoints
// as the second part of a two-step authorization phase.  To keep the API tests simple we
// omit the session and token checks done by the function.  All other functions in this
// module keep the original implementation.
jest.mock('./v1/services/auth-service', () => {
  const actualAuth = jest.requireActual('./v1/services/auth-service').auth;
  const mockedAuth = (
    jest.genMockFromModule('./v1/services/auth-service') as any
  ).auth;
  return {
    auth: {
      ...mockedAuth,
      ...actualAuth,
      isValidBackendToken: jest.fn().mockReturnValue(async (req, res, next) => {
        next();
      }),
    },
  };
});

// Setup in app.ts requires access to certain config properties.  These may be present when
// testing in a development environment (via a .env file), but they may not be present
// during builds by the CI/CD process.  Here we define the needed config properties.
jest.mock('./config', () => {
  const actualConfig = jest.requireActual('./config').config;
  const mockedConfig = (jest.genMockFromModule('./config') as any).config;
  return {
    config: {
      get: jest.fn().mockImplementation((key) => {
        return {
          'oidc:clientSecret': 'secret',
          'server:sessionPath': 'session-path',
          environment: 'dev',
          'oidc:clientId': 'client-id',
          'server:frontend': 'http://localhost:8081',
          'tokenGenerate:issuer': 'http://localhost:3000',
          'tokenGenerate:privateKey': actualConfig.get(
            'tokenGenerate:privateKey',
          ),
          'tokenGenerate:publicKey': actualConfig.get(
            'tokenGenerate:publicKey',
          ),
        }[key];
      }),
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

describe('GET /employee-count-range', () => {
  // Mock the database query executed by the API endpoint's implementation:
  // (The call to codeService.getAllEmployeeCountRanges can cause a database
  // query.)
  const mockDBResp = [
    {
      employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
      employee_count_range: '1-99',
    },
  ];
  (prisma.employee_count_range.findMany as jest.Mock).mockResolvedValue(
    mockDBResp,
  );

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
  // Mock the database query executed by the API endpoint's implementation:
  // (The call to codeService.getAllNaicsCodes can cause a database
  // query.)
  const mockDBResp = [
    {
      naics_code: '1',
      naics_label: 'test1',
    },
  ];
  (prisma.naics_code.findMany as jest.Mock).mockResolvedValue(mockDBResp);

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
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([1]);

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Health check passed');
  });

  it('should return 500 if the database is not healthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(
      new Error('Database error'),
    );

    const response = await request(app).get('/health');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Health check failed');
  });
});
