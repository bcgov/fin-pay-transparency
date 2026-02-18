import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import router from './admin-auth-routes.js';

const mockAuthenticate = vi.fn();
vi.mock('passport', () => ({
  default: {
    authenticate: (...args) =>
      vi.fn((req, res, next) => mockAuthenticate(req, res, next)),
  },
}));

const mockIsTokenExpired = vi.fn();
const mockIsRenewable = vi.fn();
const mockRenew = vi.fn();
const mockGenerateFrontendToken = vi.fn();
const mockRenewBackendAndFrontendTokens = vi.fn((req, res) => {
  res.status(200).json({});
});
const mockHandleCallBackAzureIdir = vi.fn();
vi.mock(import('../services/admin-auth-service.js'), async (importOriginal) => {
  const actualAdminAuth = await importOriginal();
  return {
    ...actualAdminAuth,
    adminAuth: {
      ...actualAdminAuth.adminAuth,
      handleCallBackAzureIdir: () => mockHandleCallBackAzureIdir(),
      isTokenExpired: () => mockIsTokenExpired(),
      isRenewable: () => mockIsRenewable(),
      renew: () => mockRenew(),
      generateFrontendToken: () => mockGenerateFrontendToken(),
      renewBackendAndFrontendTokens: (req, res) => {
        mockRenewBackendAndFrontendTokens(req, res);
      },
    },
  } as unknown as typeof actualAdminAuth;
});

const mockLogout = vi.fn();
const mockRequest = {
  logout: vi.fn(() => mockLogout()),
  session: {
    destroy: vi.fn(),
  },
  user: {
    idToken: 'ey....',
    jwtFrontend: '567ghi',
  },
};

let app: Application;
describe('admin-auth-routes', () => {
  beforeEach(() => {
    app = express();
    app.use('', router);
    app.use((err, req, res, next) => {
      res.status(400).send({ error: err.message });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('/callback_azureidir', () => {
    describe('401 - unauthorized', () => {
      it('should return unauthorized', () => {
        mockAuthenticate.mockImplementation((req, res) => {
          return res.status(401).json({ message: 'Unauthorized' });
        });

        return request(app).get('/callback_azureidir').expect(401);
      });
    });

    describe('handle login callback', () => {
      describe('when login is successful', () => {
        it('should redirect', () => {
          mockAuthenticate.mockImplementation((req, res, next) => {
            next();
          });
          mockHandleCallBackAzureIdir.mockResolvedValue('login');
          return request(app).get('/callback_azureidir').expect(302);
        });
      });
    });
  });

  describe('/refresh', () => {
    describe('if the given token (in the request body) is expired and is renewable', () => {
      it('should return 200 with current user token', () => {
        mockIsTokenExpired.mockReturnValue(false);
        mockIsRenewable.mockReturnValue(false);
        const mockCorrelationId = 12;
        app.use((req: any, res, next) => {
          req.session = {
            ...mockRequest.session,
            companyDetails: { id: 1 },
            correlationID: mockCorrelationId,
          };
          req.user = {
            ...mockRequest.user,
            jwt: 'jwt',
            refreshToken: 'jwt',
          };
          req.logout = mockRequest.logout;
          req.body = { refreshToken: mockRequest.user.jwtFrontend };
          next();
        });
        app.use('/auth', router);
        return request(app)
          .post('/auth/refresh')
          .set('Accept', 'application/json')
          .expect(200)
          .expect((res) => {
            expect(res.body).toEqual({
              jwtFrontend: mockRequest.user.jwtFrontend,
              correlationID: mockCorrelationId,
            });
          });
      });
    });
  });
});
